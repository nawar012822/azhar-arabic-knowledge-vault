import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/site/Layout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
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
  return (
    <PageShell title="اتصل بنا" subtitle="للاستفسارات وطلبات إضافة المواد أو إزالتها.">
      <div className="max-w-xl">
        {sent ? (
          <p className="rounded-lg border bg-card p-6">شكرًا لك. (في هذه المرحلة التجريبية لا تُرسل الرسالة فعليًا؛ سيُفعَّل الإرسال في المرحلة الثانية.)</p>
        ) : (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <input required placeholder="الاسم" className={input} />
            <input required type="email" placeholder="البريد الإلكتروني" className={input} dir="ltr" />
            <select className={input}>
              <option>استفسار عام</option>
              <option>طلب إضافة مادة</option>
              <option>طلب إزالة مادة (حقوق ملكية)</option>
            </select>
            <textarea required rows={5} placeholder="الرسالة" className={input} />
            <button className="rounded-md bg-primary px-5 py-2 text-primary-foreground">إرسال</button>
          </form>
        )}
      </div>
    </PageShell>
  );
}
