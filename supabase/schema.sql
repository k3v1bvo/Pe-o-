-- ============================================
-- Calculadora / GreenScale — Supabase Database Schema
-- Copia y pega TODO esto en el SQL Editor de Supabase y dale "Run"
-- ============================================

-- ============================================
-- 1. PROFILES (extiende auth.users de Supabase)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'warehouse')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitaciones (solo Admin crea invitaciones para nuevos usuarios)
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'warehouse' CHECK (role IN ('admin', 'warehouse')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON public.invitations(token);

-- Crear perfil automáticamente al registrar usuario (solo por invitación o admin_created)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  inv RECORD;
  req_token TEXT;
  assigned_role TEXT;
BEGIN
  IF COALESCE(NEW.raw_app_meta_data->>'admin_created', 'false') = 'true' THEN
    assigned_role := COALESCE(NEW.raw_app_meta_data->>'role', NEW.raw_user_meta_data->>'role', 'admin');
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
      assigned_role
    );
    RETURN NEW;
  END IF;

  req_token := NEW.raw_user_meta_data->>'invite_token';
  IF req_token IS NULL OR req_token = '' THEN
    RAISE EXCEPTION 'Registro bloqueado: solo se permiten cuentas por invitación del administrador.';
  END IF;

  SELECT * INTO inv
  FROM public.invitations
  WHERE token = req_token
    AND used_at IS NULL
    AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitación inválida, expirada o ya utilizada.';
  END IF;

  IF inv.email IS NOT NULL AND lower(inv.email) <> lower(NEW.email) THEN
    RAISE EXCEPTION 'Esta invitación pertenece a otro correo electrónico.';
  END IF;

  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    inv.role
  );

  UPDATE public.invitations
  SET used_by = NEW.id, used_at = NOW()
  WHERE id = inv.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. STRAINS (Cepas / Variedades)
-- ============================================
CREATE TABLE public.strains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_per_gram DECIMAL(10, 2) NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. INVENTORY LOTS (Lotes de entrada / almacén)
-- ============================================
CREATE TABLE public.inventory_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strain_id UUID NOT NULL REFERENCES public.strains(id),
  supplier TEXT NOT NULL DEFAULT 'Sin proveedor',
  declared_weight_g DECIMAL(10, 2) NOT NULL,
  actual_weight_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shrinkage_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'grading', 'graded', 'sold_out')),
  received_by UUID REFERENCES public.profiles(id),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- 4. LOT PHOTOS (Fotos de pesaje en báscula)
-- ============================================
CREATE TABLE public.lot_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.inventory_lots(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  description TEXT,
  taken_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. GRADED BAGS (Bolsas grameadas: 50, 30, 100, etc.)
-- ============================================
CREATE TABLE public.graded_bags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.inventory_lots(id) ON DELETE CASCADE,
  bag_type TEXT NOT NULL CHECK (bag_type IN ('50', '30', '100', 'custom')),
  weight_g DECIMAL(10, 2) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  graded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. SALES (Ventas: menudeo / mayoreo)
-- ============================================
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bag_id UUID REFERENCES public.graded_bags(id),
  lot_id UUID REFERENCES public.inventory_lots(id),
  strain_id UUID NOT NULL REFERENCES public.strains(id),
  quantity_g DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  sale_type TEXT NOT NULL DEFAULT 'retail' CHECK (sale_type IN ('retail', 'wholesale')),
  notes TEXT,
  sold_by UUID REFERENCES public.profiles(id),
  sold_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. PRICING RULES (Reglas de precios: menudeo, mayoreo, especiales)
-- ============================================
CREATE TABLE public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strain_id UUID NOT NULL REFERENCES public.strains(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('retail', 'wholesale', 'special')),
  bag_type TEXT NOT NULL CHECK (bag_type IN ('50', '30', '100', '125g', '250g', '500g', '1000g', 'custom')),
  price DECIMAL(10, 2) NOT NULL,
  weight_g DECIMAL(10, 2),
  min_quantity DECIMAL(10, 2),
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. EXPENSES (Gastos e insumos: taxis, comidas, bolsas, trips, etc.)
-- ============================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('taxi', 'food', 'bags', 'supplies', 'trips', 'taxes', 'other')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  receipt_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. APP SETTINGS (Configuración global: moneda, idioma, nombre)
-- ============================================
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

INSERT INTO public.app_settings (key, value, description) VALUES
  ('currency', 'BOB', 'Moneda principal del sistema (BOB, USD, etc.)'),
  ('currency_symbol', 'Bs.', 'Símbolo de la moneda'),
  ('currency_locale', 'es-BO', 'Locale para formato de moneda'),
  ('default_language', 'es', 'Idioma por defecto'),
  ('public_app_name', 'Calculadora', 'Nombre visible en la pantalla disfrazada');

-- ============================================
-- TRIGGERS: Merma automática y marcar bolsa vendida
-- ============================================
CREATE OR REPLACE FUNCTION public.update_lot_shrinkage()
RETURNS TRIGGER AS $$
DECLARE
  target_lot_id UUID;
BEGIN
  target_lot_id := COALESCE(NEW.lot_id, OLD.lot_id);
  UPDATE public.inventory_lots
  SET shrinkage_g = actual_weight_g - (
    SELECT COALESCE(SUM(weight_g), 0)
    FROM public.graded_bags
    WHERE lot_id = target_lot_id
  )
  WHERE id = target_lot_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_graded_bag_change
  AFTER INSERT OR UPDATE OR DELETE ON public.graded_bags
  FOR EACH ROW EXECUTE FUNCTION public.update_lot_shrinkage();

CREATE OR REPLACE FUNCTION public.mark_bag_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bag_id IS NOT NULL THEN
    UPDATE public.graded_bags SET status = 'sold' WHERE id = NEW.bag_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_sale_created
  AFTER INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.mark_bag_sold();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lot_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graded_bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL USING (public.get_user_role() = 'admin');

-- STRAINS (almacenista solo lee nombres si necesita asignar lote; precios se ocultan en UI/API para warehouse)
CREATE POLICY "Authenticated users can view strains" ON public.strains
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage strains" ON public.strains
  FOR ALL USING (public.get_user_role() = 'admin');

-- INVENTORY LOTS
CREATE POLICY "Authenticated can view lots" ON public.inventory_lots
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can create lots" ON public.inventory_lots
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update lots" ON public.inventory_lots
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete lots" ON public.inventory_lots
  FOR DELETE USING (public.get_user_role() = 'admin');

-- LOT PHOTOS
CREATE POLICY "Authenticated can view photos" ON public.lot_photos
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can add photos" ON public.lot_photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete photos" ON public.lot_photos
  FOR DELETE USING (public.get_user_role() = 'admin');

-- GRADED BAGS
CREATE POLICY "Authenticated can view bags" ON public.graded_bags
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can create bags" ON public.graded_bags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage bags" ON public.graded_bags
  FOR UPDATE USING (public.get_user_role() = 'admin');
CREATE POLICY "Admins can delete bags" ON public.graded_bags
  FOR DELETE USING (public.get_user_role() = 'admin');

-- SALES (Admin ve todo; Almacenista solo crea ventas mayoristas y ve las suyas)
CREATE POLICY "Admins can manage sales" ON public.sales
  FOR ALL USING (public.get_user_role() = 'admin');
CREATE POLICY "Warehouse can create wholesale sales" ON public.sales
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'warehouse' AND sale_type = 'wholesale'
  );
CREATE POLICY "Warehouse can view own sales" ON public.sales
  FOR SELECT USING (
    public.get_user_role() = 'warehouse' AND sold_by = auth.uid()
  );

-- PRICING RULES
CREATE POLICY "Authenticated can view pricing" ON public.pricing_rules
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage pricing" ON public.pricing_rules
  FOR ALL USING (public.get_user_role() = 'admin');

-- EXPENSES
CREATE POLICY "Admins can manage expenses" ON public.expenses
  FOR ALL USING (public.get_user_role() = 'admin');
CREATE POLICY "Warehouse can add expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can view own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = created_by);

-- APP SETTINGS
CREATE POLICY "Authenticated can view settings" ON public.app_settings
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage settings" ON public.app_settings
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_inventory_lots_strain ON public.inventory_lots(strain_id);
CREATE INDEX idx_inventory_lots_status ON public.inventory_lots(status);
CREATE INDEX idx_graded_bags_lot ON public.graded_bags(lot_id);
CREATE INDEX idx_graded_bags_status ON public.graded_bags(status);
CREATE INDEX idx_sales_strain ON public.sales(strain_id);
CREATE INDEX idx_sales_sold_at ON public.sales(sold_at);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_expenses_created_at ON public.expenses(created_at);
CREATE INDEX idx_lot_photos_lot ON public.lot_photos(lot_id);

-- ============================================
-- SEED INICIAL (1 producto base para empezar a probar)
-- ============================================
INSERT INTO public.strains (name, description, price_per_gram) VALUES
  ('Producto Principal', 'Variedad base inicial (editable por Admin)', 0.00);
