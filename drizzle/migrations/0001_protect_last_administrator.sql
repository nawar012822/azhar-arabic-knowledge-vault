CREATE OR REPLACE FUNCTION public.protect_last_administrator()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.role = 'admin' AND (TG_OP = 'DELETE' OR NEW.role <> 'admin') THEN
    PERFORM pg_advisory_xact_lock(725601);
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin' AND id <> OLD.id) THEN
      RAISE EXCEPTION 'لا يمكن إزالة صلاحية آخر مدير عام. أضف مديرًا آخر أولًا.';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_last_administrator BEFORE DELETE OR UPDATE OF role ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.protect_last_administrator();
REVOKE ALL ON FUNCTION public.protect_last_administrator() FROM PUBLIC;
CREATE OR REPLACE FUNCTION public.bump_item(_id uuid, _kind text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.items SET
    views = views + CASE WHEN _kind = 'view' THEN 1 ELSE 0 END,
    downloads = downloads + CASE WHEN _kind = 'download' THEN 1 ELSE 0 END
  WHERE id = _id AND status = 'approved' AND
    (_kind = 'view' OR (_kind = 'download' AND file_path IS NOT NULL AND
      (access = 'open' OR (access = 'restricted' AND auth.uid() IS NOT NULL))));
$$;
REVOKE ALL ON FUNCTION public.bump_item(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bump_item(uuid,text) TO anon, authenticated;