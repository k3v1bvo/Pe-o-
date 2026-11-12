-- Migration: Simplify RBAC strictly to 3 roles ('admin', 'warehouse', 'seller')
-- Converts any legacy 'consignee' profiles/invitations into 'seller' (Ventas)
-- and updates constraints & RLS policies accordingly.

-- 1. Convert any legacy 'consignee' rows to 'seller'
UPDATE public.profiles
SET role = 'seller'
WHERE role = 'consignee';

UPDATE public.invitations
SET role = 'seller'
WHERE role = 'consignee';

-- 2. Enforce 3-role CHECK constraints ('admin', 'warehouse', 'seller')
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'warehouse', 'seller'));

ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_role_check;
ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_role_check CHECK (role IN ('admin', 'warehouse', 'seller'));

-- 3. Consignments & Payments RLS for 3 roles ('admin', 'warehouse', 'seller')
DROP POLICY IF EXISTS "Consignees can view own consignments" ON public.consignments;
CREATE POLICY "Consignees can view own consignments"
  ON public.consignments FOR SELECT
  USING (
    public.get_user_role() IN ('admin', 'warehouse', 'seller')
    AND consignee_id = auth.uid()
  );

DROP POLICY IF EXISTS "Consignees can request stock" ON public.consignments;
CREATE POLICY "Consignees can request stock"
  ON public.consignments FOR INSERT
  WITH CHECK (
    public.get_user_role() IN ('admin', 'warehouse', 'seller')
    AND consignee_id = auth.uid()
    AND status = 'requested'
    AND agreed_total = 0
    AND paid_amount = 0
  );

DROP POLICY IF EXISTS "Consignees can view own consignment payments" ON public.consignment_payments;
CREATE POLICY "Consignees can view own consignment payments"
  ON public.consignment_payments FOR SELECT
  USING (
    public.get_user_role() IN ('admin', 'warehouse', 'seller')
    AND EXISTS (
      SELECT 1 FROM public.consignments c
      WHERE c.id = consignment_payments.consignment_id
        AND c.consignee_id = auth.uid()
    )
  );

-- 4. Sales & Pricing RLS for 'seller'
DROP POLICY IF EXISTS "Staff and sellers can view pricing" ON public.pricing_rules;
CREATE POLICY "Staff and sellers can view pricing"
  ON public.pricing_rules FOR SELECT
  USING (
    public.get_user_role() IN ('admin', 'seller')
    OR (public.get_user_role() = 'warehouse' AND rule_type = 'wholesale')
  );

DROP POLICY IF EXISTS "Sellers can create sales" ON public.sales;
CREATE POLICY "Sellers can create sales"
  ON public.sales FOR INSERT
  WITH CHECK (public.get_user_role() = 'seller' AND sold_by = auth.uid());

DROP POLICY IF EXISTS "Sellers can view own sales" ON public.sales;
CREATE POLICY "Sellers can view own sales"
  ON public.sales FOR SELECT
  USING (public.get_user_role() = 'seller' AND sold_by = auth.uid());

-- 5. Tighten update_own_name execute privileges (authenticated users only)
REVOKE ALL ON FUNCTION public.update_own_name(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_own_name(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_own_name(text) TO authenticated;

