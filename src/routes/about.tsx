import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/Layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "عن المستودع – المستودع الرقمي لكلية اللغة العربية" },
      { name: "description", content: "أهداف المستودع الرقمي ومراحل تطويره ومعايير الفهرسة المستخدمة." },
      { property: "og:title", content: "عن المستودع الرقمي" },
      { property: "og:description", content: "أهداف المستودع ومراحل تطويره." },
    ],
  }),
  component: About,
});

const phases = [
  ["١", "دراسة المتطلبات وتصميم شكل المستودع", "جارٍ"],
  ["٢", "نموذج تجريبي مجاني يعمل على الإنترنت", "قادم"],
  ["٣", "قاعدة بيانات المواد العلمية", "قادم"],
  ["٤", "نظام البحث والفهرسة", "قادم"],
  ["٥", "لوحة تحكم إدارة المحتوى والصلاحيات", "قادم"],
  ["٦", "التجربة وإصلاح الأخطاء", "قادم"],
  ["٧", "العرض على إدارة الكلية", "قادم"],
  ["٨", "التحول إلى مستودع رسمي (DSpace أو الأنسب)", "قادم"],
];

function About() {
  return (
    <PageShell title="عن المستودع" subtitle="مشروع تجريبي غير رسمي، في انتظار اعتماد إدارة الكلية.">
      <div className="max-w-3xl space-y-4 leading-8">
        <p>المستودع الرقمي منصة لحفظ وتنظيم وإتاحة الإنتاج العلمي لكلية اللغة العربية بجامعة الأزهر – فرع شبين الكوم: الكتب، والرسائل الجامعية، والأبحاث، والمخطوطات، والدوريات، والمحاضرات.</p>
        <p>تُوصف المواد وفق معيار <strong>Dublin Core</strong> للبيانات الوصفية، مع قابلية التطوير لاحقًا إلى MARC 21 وRDA، ونقل البيانات إلى نظام DSpace.</p>
        <h2 className="pt-4 text-2xl font-bold text-primary">مراحل المشروع</h2>
        <ol className="space-y-2">
          {phases.map(([n, t, s]) => (
            <li key={n} className="flex items-center gap-3 rounded-md border bg-card p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">{n}</span>
              <span className="flex-1">{t}</span>
              <span className="text-xs text-muted-foreground">{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </PageShell>
  );
}
