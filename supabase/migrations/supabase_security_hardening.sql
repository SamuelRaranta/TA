-- Apply this migration AFTER all schema/setup scripts, and re-apply it after any legacy setup script.
-- It replaces all existing policies on application tables with ownership/participant/admin checks.
-- It does not modify business rows or run automatically; inspect the target project before applying.
BEGIN;

DO $$
DECLARE
  tbl text;
  pol record;
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'public.profiles is required before security hardening';
  END IF;

  FOREACH tbl IN ARRAY ARRAY[
    'profiles', 'commodities', 'buyer_proposals', 'procurement_proposals', 'offers',
    'contracts', 'transactions', 'market_prices', 'market_price_history',
    'chat_requests', 'chat_messages', 'notifications', 'bug_reports', 'bug_report_attachments'
  ] LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, tbl);
      END LOOP;
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Prevent a regular account from promoting itself or approving its own KYC.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND NOT public.is_admin()
     AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.kyc_status IS DISTINCT FROM OLD.kyc_status) THEN
    RAISE EXCEPTION 'Only an administrator may change role or KYC status';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_protect_privileged_fields ON public.profiles;
CREATE TRIGGER profiles_protect_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- Expose only directory fields needed for marketplace/chat; never expose email, phone, or KYC.
CREATE OR REPLACE FUNCTION public.list_public_profiles()
RETURNS TABLE (
  id uuid,
  full_name text,
  role text,
  company_name text,
  group_name text,
  location text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.role, p.company_name, p.group_name, p.location, p.avatar_url
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.list_public_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_profiles() TO authenticated;

-- Profiles: users can read/edit their own profile; admins can manage all profiles.
CREATE POLICY profiles_select_owner_or_admin ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND role IN ('petani', 'pembeli') AND kyc_status = 'pending');
CREATE POLICY profiles_update_owner_or_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_delete_admin_only ON public.profiles
  FOR DELETE TO authenticated USING (public.is_admin());

-- Public catalog reads; only the owning farmer or an admin may write commodities.
CREATE POLICY commodities_read_catalog ON public.commodities
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY commodities_insert_owner ON public.commodities
  FOR INSERT TO authenticated
  WITH CHECK (farmer_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'petani'
  ));
CREATE POLICY commodities_update_owner_or_admin ON public.commodities
  FOR UPDATE TO authenticated
  USING (farmer_id = auth.uid() OR public.is_admin())
  WITH CHECK (farmer_id = auth.uid() OR public.is_admin());
CREATE POLICY commodities_delete_owner_or_admin ON public.commodities
  FOR DELETE TO authenticated USING (farmer_id = auth.uid() OR public.is_admin());

-- Proposals are public only while active; buyers own their proposals, admins moderate them.
DO $$ BEGIN
  IF to_regclass('public.buyer_proposals') IS NOT NULL THEN
    EXECUTE $p$CREATE POLICY buyer_proposals_select_owner_or_admin ON public.buyer_proposals FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY buyer_proposals_insert_owner ON public.buyer_proposals FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY buyer_proposals_update_owner_or_admin ON public.buyer_proposals FOR UPDATE TO authenticated USING (buyer_id = auth.uid() OR public.is_admin()) WITH CHECK (buyer_id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY buyer_proposals_delete_owner_or_admin ON public.buyer_proposals FOR DELETE TO authenticated USING (buyer_id = auth.uid() OR public.is_admin())$p$;
  END IF;
  IF to_regclass('public.procurement_proposals') IS NOT NULL THEN
    EXECUTE $p$CREATE POLICY procurement_proposals_select_public_active ON public.procurement_proposals FOR SELECT TO anon, authenticated USING (status = 'Aktif' OR buyer_id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY procurement_proposals_insert_owner ON public.procurement_proposals FOR INSERT TO authenticated WITH CHECK ((buyer_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'pembeli')) OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY procurement_proposals_update_owner_or_admin ON public.procurement_proposals FOR UPDATE TO authenticated USING (buyer_id = auth.uid() OR public.is_admin()) WITH CHECK (buyer_id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY procurement_proposals_delete_owner_or_admin ON public.procurement_proposals FOR DELETE TO authenticated USING (buyer_id = auth.uid() OR public.is_admin())$p$;
  END IF;
END $$;

CREATE POLICY offers_select_participants ON public.offers
  FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR farmer_id = auth.uid() OR public.is_admin());
CREATE POLICY offers_insert_buyer ON public.offers
  FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid() OR public.is_admin());
CREATE POLICY offers_update_participants ON public.offers
  FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR farmer_id = auth.uid() OR public.is_admin())
  WITH CHECK (buyer_id = auth.uid() OR farmer_id = auth.uid() OR public.is_admin());
CREATE POLICY offers_delete_admin_only ON public.offers
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY contracts_select_participants ON public.contracts
  FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR farmer_id = auth.uid() OR public.is_admin());
CREATE POLICY contracts_insert_participants ON public.contracts
  FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid() OR farmer_id = auth.uid() OR public.is_admin());
CREATE POLICY contracts_update_participants ON public.contracts
  FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR farmer_id = auth.uid() OR public.is_admin())
  WITH CHECK (buyer_id = auth.uid() OR farmer_id = auth.uid() OR public.is_admin());
CREATE POLICY contracts_delete_admin_only ON public.contracts
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY transactions_select_participants ON public.transactions
  FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR farmer_id = auth.uid() OR public.is_admin());
CREATE POLICY transactions_insert_participants ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid() OR farmer_id = auth.uid() OR public.is_admin());
CREATE POLICY transactions_update_admin_only ON public.transactions
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY transactions_delete_admin_only ON public.transactions
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY market_prices_read_public ON public.market_prices
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY market_prices_admin_write ON public.market_prices
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DO $$ BEGIN
  IF to_regclass('public.market_price_history') IS NOT NULL THEN
    EXECUTE $p$CREATE POLICY market_price_history_read_public ON public.market_price_history FOR SELECT TO anon, authenticated USING (true)$p$;
    EXECUTE $p$CREATE POLICY market_price_history_admin_write ON public.market_price_history FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())$p$;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.chat_requests') IS NOT NULL THEN
    EXECUTE $p$CREATE POLICY chat_requests_select_participants ON public.chat_requests FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY chat_requests_insert_sender ON public.chat_requests FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid())$p$;
    EXECUTE $p$CREATE POLICY chat_requests_update_participants ON public.chat_requests FOR UPDATE TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR public.is_admin()) WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY chat_requests_delete_participants ON public.chat_requests FOR DELETE TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR public.is_admin())$p$;
  END IF;
  IF to_regclass('public.chat_messages') IS NOT NULL THEN
    EXECUTE $p$CREATE POLICY chat_messages_select_participants ON public.chat_messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY chat_messages_insert_sender ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid())$p$;
    EXECUTE $p$CREATE POLICY chat_messages_update_receiver ON public.chat_messages FOR UPDATE TO authenticated USING (receiver_id = auth.uid() OR public.is_admin()) WITH CHECK (receiver_id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY chat_messages_delete_admin_only ON public.chat_messages FOR DELETE TO authenticated USING (public.is_admin())$p$;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.notifications') IS NOT NULL THEN
    EXECUTE $p$CREATE POLICY notifications_select_owner_or_admin ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY notifications_insert_owner_or_admin ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY notifications_update_owner_or_admin ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY notifications_delete_owner_or_admin ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin())$p$;
  END IF;
  IF to_regclass('public.bug_reports') IS NOT NULL THEN
    EXECUTE $p$CREATE POLICY bug_reports_insert_owner ON public.bug_reports FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())$p$;
    EXECUTE $p$CREATE POLICY bug_reports_select_owner_or_admin ON public.bug_reports FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY bug_reports_update_admin ON public.bug_reports FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())$p$;
    EXECUTE $p$CREATE POLICY bug_reports_delete_owner_or_admin ON public.bug_reports FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin())$p$;
  END IF;
  IF to_regclass('public.bug_report_attachments') IS NOT NULL THEN
    EXECUTE $p$CREATE POLICY bug_attachments_select_owner_or_admin ON public.bug_report_attachments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.bug_reports r WHERE r.id = bug_report_id AND (r.user_id = auth.uid() OR public.is_admin())))$p$;
    EXECUTE $p$CREATE POLICY bug_attachments_insert_owner_or_admin ON public.bug_report_attachments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.bug_reports r WHERE r.id = bug_report_id AND (r.user_id = auth.uid() OR public.is_admin())))$p$;
    EXECUTE $p$CREATE POLICY bug_attachments_delete_owner_or_admin ON public.bug_report_attachments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.bug_reports r WHERE r.id = bug_report_id AND (r.user_id = auth.uid() OR public.is_admin())))$p$;
  END IF;
END $$;

-- Bug report files are private and stored under <auth.uid()>/<report>/<filename>.
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-reports', 'bug-reports', false)
ON CONFLICT (id) DO UPDATE SET public = false;
DROP POLICY IF EXISTS "Public Read Bug Reports Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Bug Reports Bucket" ON storage.objects;
DROP POLICY IF EXISTS bug_reports_storage_read ON storage.objects;
DROP POLICY IF EXISTS bug_reports_storage_insert ON storage.objects;
DROP POLICY IF EXISTS bug_reports_storage_delete ON storage.objects;
CREATE POLICY bug_reports_storage_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'bug-reports' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
CREATE POLICY bug_reports_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bug-reports' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY bug_reports_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'bug-reports' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

-- New signups receive a database-owned pending profile even when email confirmation
-- means the browser has no authenticated session yet.
CREATE OR REPLACE FUNCTION public.handle_new_auth_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text;
BEGIN
  requested_role := CASE WHEN NEW.raw_user_meta_data->>'role' = 'pembeli' THEN 'pembeli' ELSE 'petani' END;
  INSERT INTO public.profiles (id, role, full_name, email, kyc_status)
  VALUES (NEW.id, requested_role, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, 'pending')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_profile();

COMMIT;