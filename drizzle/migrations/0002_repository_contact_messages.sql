CREATE TABLE public.contact_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 200),
 email text NOT NULL,
 subject text NOT NULL CHECK (subject IN ('general','deposit','copyright')),
 message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 10 AND 5000),
 status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','closed')),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.contact_messages TO authenticated;
GRANT UPDATE (status) ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members send own messages" ON public.contact_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'new' AND email = (auth.jwt()->>'email'));
CREATE POLICY "sender or admin reads messages" ON public.contact_messages FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin handles messages" ON public.contact_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX contact_messages_created_at_idx ON public.contact_messages (created_at DESC);