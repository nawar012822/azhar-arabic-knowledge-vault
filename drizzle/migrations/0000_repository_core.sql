CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  orcid text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  department text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','moderator'))
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "read own roles or admin" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- first account becomes admin; everyone gets 'user'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), COALESCE(NEW.email,''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text UNIQUE NOT NULL DEFAULT ('AZ-SHK-' || upper(substr(md5(random()::text),1,6))),
  title text NOT NULL,
  author text NOT NULL,
  orcid text,
  contributors text[] NOT NULL DEFAULT '{}',
  supervisor text,
  subjects text[] NOT NULL DEFAULT '{}',
  keywords text[] NOT NULL DEFAULT '{}',
  date_issued int NOT NULL DEFAULT 2026,
  publisher text NOT NULL DEFAULT 'كلية اللغة العربية بشبين الكوم',
  collection text NOT NULL,
  language text NOT NULL DEFAULT 'العربية',
  abstract text NOT NULL DEFAULT '',
  pages int NOT NULL DEFAULT 0,
  department text NOT NULL DEFAULT 'النحو والصرف',
  format text NOT NULL DEFAULT 'PDF',
  isbn text,
  rights text NOT NULL DEFAULT 'جميع الحقوق محفوظة للمؤلف',
  access text NOT NULL DEFAULT 'metadata' CHECK (access IN ('open','restricted','metadata')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','revision','rejected')),
  review_note text,
  file_path text,
  submitted_by uuid,
  views int NOT NULL DEFAULT 0,
  downloads int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public reads approved" ON public.items FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "owner reads own" ON public.items FOR SELECT TO authenticated USING (submitted_by = auth.uid());
CREATE POLICY "staff reads all" ON public.items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "members submit" ON public.items FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid() AND (status = 'pending' OR public.is_staff(auth.uid())));
CREATE POLICY "owner edits while pending" ON public.items FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid() AND status IN ('pending','revision'))
  WITH CHECK (submitted_by = auth.uid() AND status = 'pending');
CREATE POLICY "staff edit" ON public.items FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "admin delete" ON public.items FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.bump_item(_id uuid, _kind text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.items SET
    views = views + CASE WHEN _kind = 'view' THEN 1 ELSE 0 END,
    downloads = downloads + CASE WHEN _kind = 'download' THEN 1 ELSE 0 END
  WHERE id = _id AND status = 'approved';
$$;
GRANT EXECUTE ON FUNCTION public.bump_item(uuid, text) TO anon, authenticated;

CREATE TABLE public.favorites (
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own favorites" ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- file access follows the item's access level
CREATE POLICY "upload own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "read files by access" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'files' AND (
    (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
    OR (auth.uid() IS NOT NULL AND public.is_staff(auth.uid()))
    OR EXISTS (SELECT 1 FROM public.items i WHERE i.file_path = storage.objects.name AND i.status = 'approved'
       AND (i.access = 'open' OR (i.access = 'restricted' AND auth.uid() IS NOT NULL)))
  ));
CREATE POLICY "staff delete files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'files' AND public.is_staff(auth.uid()));

INSERT INTO public.items (identifier,title,author,collection,supervisor,subjects,keywords,date_issued,department,pages,abstract,access,views,rights,status,format,publisher,contributors,created_at) VALUES
('AZ-SHK-0001','ظاهرة الحذف في الجملة الفعلية: دراسة نحوية تطبيقية','د. أحمد محمود عبد الله','theses','أ.د. محمد السيد علي','{النحو العربي,الحذف}','{الحذف,الجملة الفعلية,سيبويه}',2019,'النحو والصرف',412,'تتناول الرسالة ظاهرة الحذف في الجملة الفعلية عند النحاة الأوائل، وتطبيقها على نصوص قرآنية وشعرية مختارة.','metadata',342,'حقوق الطبع للباحث والجامعة؛ متاح الوصف فقط','approved','PDF','كلية اللغة العربية بشبين الكوم','{}','2026-10-28'),
('AZ-SHK-0002','الصورة البيانية في شعر البارودي','د. فاطمة حسن إبراهيم','research',NULL,'{البلاغة,الشعر الحديث}','{التشبيه,الاستعارة,البارودي}',2022,'البلاغة والنقد',48,'بحث يحلل أنماط الصورة البيانية في ديوان محمود سامي البارودي ودورها في إحياء الشعر العربي.','open',518,'رخصة المشاع الإبداعي CC BY-NC 4.0','approved','PDF','كلية اللغة العربية بشبين الكوم','{}','2026-11-02'),
('AZ-SHK-0003','شرح ألفية ابن مالك (نسخة خطية)','مجهول المؤلف','manuscripts',NULL,'{النحو,المخطوطات}','{ألفية ابن مالك,مخطوط,شرح}',1650,'أصول اللغة',186,'نسخة خطية من شرح على ألفية ابن مالك، مكتوبة بخط نسخ، محفوظة بمكتبة الكلية.','open',905,'ملك عام (تراث)','approved','صور JPG','كلية اللغة العربية بشبين الكوم','{}','2026-09-15'),
('AZ-SHK-0004','مدخل إلى علم الصرف','أ.د. محمد السيد علي','books',NULL,'{الصرف}','{الميزان الصرفي,الأبنية}',2018,'النحو والصرف',260,'كتاب تعليمي يعرض مبادئ علم الصرف للفرقة الأولى بأسلوب ميسر مع تدريبات.','restricted',1204,'جميع الحقوق محفوظة للمؤلف','approved','PDF','دار الطباعة المحمدية','{}','2026-08-20'),
('AZ-SHK-0005','أثر القراءات القرآنية في التوجيه النحوي','د. محمود عبد الرحمن','faculty',NULL,'{القراءات,النحو}','{القراءات,التوجيه النحوي}',2021,'النحو والصرف',72,'دراسة لأثر اختلاف القراءات في تعدد الأوجه الإعرابية عند المفسرين.','open',276,'CC BY 4.0','approved','PDF','كلية اللغة العربية بشبين الكوم','{}','2026-11-05'),
('AZ-SHK-0006','المعجم الشعري عند أمل دنقل','سارة محمد يوسف','students','د. فاطمة حسن إبراهيم','{الأدب الحديث}','{أمل دنقل,المعجم الشعري}',2025,'الأدب والنقد',35,'مشروع تخرج يرصد الحقول الدلالية الغالبة في شعر أمل دنقل.','restricted',88,'جميع الحقوق محفوظة للمؤلف','approved','PDF','كلية اللغة العربية بشبين الكوم','{آية خالد}','2026-11-06'),
('AZ-SHK-0007','مجلة كلية اللغة العربية بالمنوفية – العدد 38','هيئة تحرير المجلة','journals',NULL,'{دوريات}','{مجلة,أبحاث محكمة}',2024,'التاريخ والحضارة',620,'عدد يضم أبحاثًا محكمة في النحو والبلاغة والأدب والنقد.','metadata',431,'جميع الحقوق محفوظة للمؤلف','approved','PDF','كلية اللغة العربية بشبين الكوم','{}','2026-10-10'),
('AZ-SHK-0008','محاضرات في البلاغة: علم المعاني','د. خالد عبد الحميد','lectures',NULL,'{البلاغة}','{علم المعاني,الخبر والإنشاء}',2026,'البلاغة والنقد',90,'مذكرة محاضرات للفرقة الثانية في علم المعاني.','open',640,'للاستخدام التعليمي داخل الكلية','approved','PDF','كلية اللغة العربية بشبين الكوم','{}','2026-11-07');