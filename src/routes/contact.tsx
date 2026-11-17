import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { contactSubjects, validContactMessage, type ContactSubject } from "@/lib/contact";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "اتصل بنا – المستودع الرقمي لكلية اللغة العربية" },
      { name: "description", content: "تواصل مع فريق المستودع الرقمي للاستفسارات وطلبات إضافة المواد." },
      { property: "og:title", content: "اتصل بنا – المستودع الرقمي" },
      { property: "og:description", content: "تواصل مع فريق المستودع." },
    ],
  }),
  component: Contact,
});

const input = "w-full rounded-md border bg-card px-3 py-2";

function Contact() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const { user, loading } = useAuth();
  const [form, setForm] = useState({ name: "", subject: "general" as ContactSubject, message: "" });
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !validContactMessage(form.name, form.message)) return;
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({ user_id: user.id, email: user.email, full_name: form.name.trim(), subject: form.subject, message: form.message.trim() });
    setBusy(false);
    if (error) { toast.error("تعذر إرسال الرسالة. حاول مرة أخرى."); return; }
    setSent(true);
  };
  return (
    <PageShell title="اتصل بنا" subtitle="للاستفسارات وطلبات إضافة المواد أو إزالتها.">
      <div className="max-w-xl">
        {loading ? <p role="status">جارٍ التحميل...</p> : !user ? <Button asChild><Link to="/auth" search={{ redirect: "/contact" }}>تسجيل الدخول لإرسال رسالة</Link></Button> : sent ? (
          <div role="status" className="space-y-3 border-s-4 border-success ps-4"><p>تم إرسال رسالتك إلى إدارة المستودع.</p><Button variant="outline" onClick={() => { setSent(false); setForm({ ...form, message: "" }); }}>رسالة جديدة</Button></div>
        ) : (
          <form className="space-y-3" onSubmit={send}>
            <input aria-label="الاسم" required minLength={2} maxLength={200} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الاسم" className={input} />
            <input aria-label="البريد الإلكتروني" readOnly value={user.email ?? ""} type="email" className={input} dir="ltr" />
            <select aria-label="موضوع الرسالة" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value as ContactSubject })} className={input}>
              {Object.entries(contactSubjects).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <textarea aria-label="الرسالة" required minLength={10} maxLength={5000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} placeholder="الرسالة" className={input} />
            <Button type="submit" disabled={busy}>{busy ? "جارٍ الإرسال..." : "إرسال"}</Button>
          </form>
        )}
      </div>
    </PageShell>
  );
}
