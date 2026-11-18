import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { accessLabels, collections, departments, type AccessLevel, type Item } from "@/data/repository";
import { canEditItem, defaultAccessFor, editedStatus, initialStatus } from "@/lib/permissions";
import { PageShell } from "@/components/site/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const MAX_MB = 50;
const list = (s: string) => s.split(/[،,]/).map((x) => x.trim()).filter(Boolean);

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export function ItemForm({ item }: { item?: Item }) {
  const { user, roles, isStaff, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [agree, setAgree] = useState(false);
  const [f, setF] = useState({
    title: item?.title ?? "", author: item?.author ?? "", orcid: item?.orcid ?? "", contributors: item?.contributors.join("، ") ?? "", supervisor: item?.supervisor ?? "", collection: item?.collection ?? "books", department: item?.department ?? departments[0] ?? "",
    date_issued: String(item?.date ?? new Date().getFullYear()), publisher: item?.publisher ?? "كلية اللغة العربية بشبين الكوم", language: item?.language ?? "العربية",
    abstract: item?.abstract ?? "", subjects: item?.subjects.join("، ") ?? "", keywords: item?.keywords.join("، ") ?? "", pages: item ? String(item.pages) : "", isbn: item?.isbn ?? "", rights: item?.rights ?? "جميع الحقوق محفوظة للمؤلف", access: item?.access ?? "restricted" as AccessLevel,
  });
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const x = e.target.files?.[0] ?? null;
    if (x && x.size > MAX_MB * 1024 * 1024) { toast.error(`حجم الملف أكبر من ${MAX_MB} ميجابايت.`); e.target.value = ""; return; }
    setFile(x);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || loading || (item && !canEditItem(roles, user.id, item.submittedBy, item.status))) return;
    if (!agree) { toast.error("يجب الإقرار بحقوق الإيداع أولًا."); return; }
    setBusy(true);
    try {
      let file_path: string | null = item?.filePath ?? null;
      let format = item?.format ?? "بدون ملف";
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        file_path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("files").upload(file_path, file, { contentType: file.type || "application/octet-stream" });
        if (error) throw new Error("تعذر رفع الملف: " + error.message);
        format = ext === "pdf" ? "PDF" : ext.toUpperCase();
      }
      const status = item ? editedStatus(roles, item.status) : initialStatus(roles);
      const record = {
        title: f.title.trim(), author: f.author.trim(), orcid: f.orcid.trim() || null, contributors: list(f.contributors),
        supervisor: f.supervisor.trim() || null, collection: f.collection, department: f.department,
        date_issued: Number(f.date_issued) || new Date().getFullYear(), publisher: f.publisher.trim(), language: f.language.trim(),
        abstract: f.abstract.trim(), subjects: list(f.subjects), keywords: list(f.keywords), pages: Number(f.pages) || 0,
        isbn: f.isbn.trim() || null, rights: f.rights.trim(), access: f.access, format, file_path, status,
      };
      const request = item?.uid
        ? supabase.from("items").update(record).eq("id", item.uid)
        : supabase.from("items").insert({ ...record, submitted_by: user.id });
      const { data, error } = await request.select("identifier").single();
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["items"] });
      toast.success(item ? (isStaff ? "تم حفظ التعديلات." : "تم إرسال التعديلات للمراجعة.") : status === "approved" ? "تم نشر المادة مباشرة." : "تم الإيداع! ستظهر للجميع بعد مراجعة المشرف.");
      navigate({ to: "/items/$id", params: { id: data.identifier } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء الإيداع.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p role="status" className="p-8 text-center">جارٍ التحميل...</p>;
  if (item && !canEditItem(roles, user?.id, item.submittedBy, item.status)) return <PageShell title="تعديل المادة"><p>غير مسموح بتعديل هذه المادة.</p></PageShell>;
  return (
    <PageShell title={item ? "تعديل المادة" : "إيداع مادة جديدة"} subtitle={item ? (isStaff ? item.title : "تُعاد المادة للمراجعة بعد حفظ التعديلات.") : isStaff ? "بصفتك مشرفًا، ستُنشر المادة مباشرة." : "تُراجع المادة من المشرفين قبل نشرها للجميع."}>
      <form onSubmit={submit} className="mx-auto max-w-3xl space-y-8">
        <section className="space-y-4 border-b pb-6">
          <h2 className="text-lg font-bold text-primary">١. البيانات الأساسية</h2>
          <Field label="العنوان (dc.title) *"><Input aria-label="العنوان" required value={f.title} onChange={set("title")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="المؤلف (dc.creator) *"><Input aria-label="المؤلف" required value={f.author} onChange={set("author")} /></Field>
            <Field label="ORCID للمؤلف"><Input dir="ltr" placeholder="0000-0000-0000-0000" value={f.orcid} onChange={set("orcid")} /></Field>
            <Field label="نوع المادة (dc.type) *">
              <select aria-label="نوع المادة" className={selectCls} value={f.collection} onChange={(e) => setF({ ...f, collection: e.target.value, access: defaultAccessFor(e.target.value) })}>
                {collections.map((c) => <option key={c.slug} value={c.slug}>{c.icon} {c.title}</option>)}
              </select>
            </Field>
            <Field label="القسم العلمي">
              <select className={selectCls} value={f.department} onChange={set("department")}>
                {departments.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="المشاركون" hint="افصل بين الأسماء بفاصلة"><Input value={f.contributors} onChange={set("contributors")} /></Field>
            <Field label="المشرف الأكاديمي"><Input value={f.supervisor} onChange={set("supervisor")} /></Field>
          </div>
          <Field label="الملخص (dc.description.abstract)"><Textarea rows={5} value={f.abstract} onChange={set("abstract")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الموضوعات (dc.subject)" hint="مثال: النحو، البلاغة"><Input value={f.subjects} onChange={set("subjects")} /></Field>
            <Field label="الكلمات المفتاحية" hint="افصل بفاصلة"><Input value={f.keywords} onChange={set("keywords")} /></Field>
          </div>
        </section>

        <section className="space-y-4 border-b pb-6">
          <h2 className="text-lg font-bold text-primary">٢. بيانات النشر</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="سنة النشر"><Input type="number" dir="ltr" value={f.date_issued} onChange={set("date_issued")} /></Field>
            <Field label="عدد الصفحات"><Input type="number" min={0} dir="ltr" value={f.pages} onChange={set("pages")} /></Field>
            <Field label="ISBN / ISSN"><Input dir="ltr" value={f.isbn} onChange={set("isbn")} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="جهة النشر (dc.publisher)"><Input value={f.publisher} onChange={set("publisher")} /></Field>
            <Field label="اللغة (dc.language)"><Input value={f.language} onChange={set("language")} /></Field>
          </div>
        </section>

        <section className="space-y-4 border-b pb-6">
          <h2 className="text-lg font-bold text-primary">٣. الملف والإتاحة</h2>
          <Field label={`الملف (PDF أو صور، حتى ${MAX_MB} ميجابايت)`}>
            {item?.filePath && <p className="text-sm text-muted-foreground">يوجد ملف مرفق. اترك هذا الحقل فارغًا للاحتفاظ به.</p>}
            <input aria-label="الملف" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.mp3,.mp4" onChange={pickFile} className="block w-full rounded-md border bg-background p-2 text-sm file:me-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground" />
          </Field>
          <Field label="مستوى الإتاحة">
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(accessLabels) as AccessLevel[]).map((a) => (
                <label key={a} className={`cursor-pointer rounded-lg border p-3 text-sm ${f.access === a ? "border-primary bg-accent" : ""}`}>
                  <input type="radio" name="access" className="me-2" checked={f.access === a} onChange={() => setF({ ...f, access: a })} />
                  {accessLabels[a]}
                </label>
              ))}
            </div>
          </Field>
          <Field label="حقوق الاستخدام (dc.rights)"><Input value={f.rights} onChange={set("rights")} /></Field>
          <label className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm leading-6">
            <input type="checkbox" className="mt-1.5" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            أقر بأنني صاحب هذه المادة أو مخوَّل بإيداعها، وأنها لا تنتهك حقوق الآخرين.
          </label>
        </section>

        <Button type="submit" disabled={busy || loading} className="w-full">
          {busy ? "جارٍ الرفع والحفظ..." : item ? (isStaff ? "حفظ التعديلات" : "إرسال التعديلات للمراجعة") : "إرسال الإيداع"}
        </Button>
      </form>
    </PageShell>
  );
}
