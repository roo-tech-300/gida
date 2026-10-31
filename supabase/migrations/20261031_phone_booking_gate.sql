CREATE OR REPLACE FUNCTION public.require_phone_for_slot_credit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = NEW.user_id AND length(btrim(p.phone_number)) > 0
  ) THEN
    RAISE EXCEPTION 'PHONE_NUMBER_REQUIRED' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.require_phone_for_pod_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND length(btrim(p.phone_number)) > 0
  ) THEN
    RAISE EXCEPTION 'PHONE_NUMBER_REQUIRED' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS require_phone_before_slot_credit ON public.slot_credits;
CREATE TRIGGER require_phone_before_slot_credit
  BEFORE INSERT ON public.slot_credits
  FOR EACH ROW EXECUTE FUNCTION public.require_phone_for_slot_credit();

DROP TRIGGER IF EXISTS require_phone_before_pod_creation ON public.pods;
CREATE TRIGGER require_phone_before_pod_creation
  BEFORE INSERT ON public.pods
  FOR EACH ROW EXECUTE FUNCTION public.require_phone_for_pod_creation();
