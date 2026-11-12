-- Migration: Add 3rd role ('consignee'), user suspension flag ('active'),
-- self-service name update RPC, and strict RLS isolation for consignees.

-- 1. Support 3rd role ('consignee') and account suspension flag ('active')
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'warehouse', 'consignee'));

ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_role_check;
ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_role_check CHECK (role IN ('admin', 'warehouse', 'consignee'));

-- 2. Only active users keep an effective role in RLS checks
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND active = true;
$$;

-- 3. Safe self-service name update RPC (prevents role/active self-escalation)
CREATE OR REPLACE FUNCTION public.update_own_name(new_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  UPDATE public.profiles
  SET name = COALESCE(NULLIF(trim(new_name), ''), name)
  WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.update_own_name(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_own_name(text) TO authenticated;

-- 4. Isolate warehouse/internal tables away from 'consignee' role
DROP POLICY IF EXISTS "Authenticated can view lots" ON public.inventory_lots;
DROP POLICY IF EXISTS "Authenticated can create lots" ON public.inventory_lots;
DROP POLICY IF EXISTS "Authenticated can update lots" ON public.inventory_lots;

CREATE POLICY "Staff can view lots"
  ON public.inventory_lots FOR SELECT
  USING (public.get_user_role() IN ('admin', 'warehouse'));

CREATE POLICY "Staff can create lots"
  ON public.inventory_lots FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'warehouse'));

CREATE POLICY "Staff can update lots"
  ON public.inventory_lots FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'warehouse'));

DROP POLICY IF EXISTS "Authenticated can view bags" ON public.graded_bags;
DROP POLICY IF EXISTS "Authenticated can create bags" ON public.graded_bags;

CREATE POLICY "Staff can view bags"
  ON public.graded_bags FOR SELECT
  USING (public.get_user_role() IN ('admin', 'warehouse'));

CREATE POLICY "Staff can create bags"
  ON public.graded_bags FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'warehouse'));

DROP POLICY IF EXISTS "Authenticated can view photos" ON public.lot_photos;
DROP POLICY IF EXISTS "Authenticated can add photos" ON public.lot_photos;

CREATE POLICY "Staff can view photos"
  ON public.lot_photos FOR SELECT
  USING (public.get_user_role() IN ('admin', 'warehouse'));

CREATE POLICY "Staff can add photos"
  ON public.lot_photos FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'warehouse'));

DROP POLICY IF EXISTS "Warehouse can add expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;

CREATE POLICY "Staff can add expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'warehouse') AND auth.uid() = created_by);

CREATE POLICY "Staff can view own expenses"
  ON public.expenses FOR SELECT
  USING (public.get_user_role() IN ('admin', 'warehouse') AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Consignees can view own consignments" ON public.consignments;
DROP POLICY IF EXISTS "Consignees can request stock" ON public.consignments;

CREATE POLICY "Consignees can view own consignments"
  ON public.consignments FOR SELECT
  USING (
    public.get_user_role() IN ('admin', 'warehouse', 'consignee')
    AND consignee_id = auth.uid()
  );

CREATE POLICY "Consignees can request stock"
  ON public.consignments FOR INSERT
  WITH CHECK (
    public.get_user_role() IN ('admin', 'warehouse', 'consignee')
    AND consignee_id = auth.uid()
    AND status = 'requested'
    AND agreed_total = 0
    AND paid_amount = 0
  );

DROP POLICY IF EXISTS "Consignees can view own consignment payments" ON public.consignment_payments;
CREATE POLICY "Consignees can view own consignment payments"
  ON public.consignment_payments FOR SELECT
  USING (
    public.get_user_role() IN ('admin', 'warehouse', 'consignee')
    AND EXISTS (
      SELECT 1 FROM public.consignments c
      WHERE c.id = consignment_payments.consignment_id
        AND c.consignee_id = auth.uid()
    )
  );

