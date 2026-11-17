import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/Layout";

export const Route = createFileRoute("/policy")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "سياسة الاستخدام وحقوق الملكية الفكرية – المستودع الرقمي" },
      { name: "description", content: "مستويات الإتاحة وحقوق المؤلفين وشروط استخدام مواد المستودع." },
      { property: "og:title", content: "سياسة الاستخدام وحقوق الملكية الفكرية" },
      { property: "og:description", content: "مستويات الإتاحة وحقوق المؤلفين." },
    ],
  }),
  component: Policy,
});

function Policy() {
  return (
    <PageShell title="سياسة الاستخدام وحقوق الملكية الفكرية">
      <div className="max-w-3xl space-y-6 leading-8">
        <section>
          <h2 className="text-2xl font-bold text-primary">مستويات الإتاحة</h2>
          <ul className="mt-2 list-disc space-y-1 ps-6">
            <li><strong>متاح مفتوح:</strong> يمكن للجميع عرض الملف وتحميله.</li>
            <li><strong>مقيد:</strong> العرض والتحميل للمستخدمين المسجلين.</li>
            <li><strong>بيانات وصفية فقط:</strong> يظهر وصف المادة دون إتاحة الملف.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-primary">حقوق المؤلفين</h2>
          <p>لا تُنشر أي مادة محمية بحقوق النشر إلا بإذن مكتوب من صاحب الحق. الرسائل الجامعية والأبحاث لا تُتاح للتحميل تلقائيًا، وتمر كل مادة بمراجعة واعتماد قبل نشرها.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-primary">الاستخدام المسموح</h2>
          <p>يُسمح بالاستخدام لأغراض التعليم والبحث العلمي مع ذكر المصدر. يُمنع إعادة النشر التجاري دون إذن.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-primary">الخصوصية</h2>
          <p>لا تُعرض بيانات المستخدمين الشخصية للعامة، وتُحمى حسابات الإدارة، ويقتصر الاطلاع على رسائل التواصل على مرسلها والمدير العام.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-primary">طلب إزالة مادة</h2>
          <p>إذا رأيت أن مادة منشورة تمس حقًا لك، تواصل معنا من صفحة «اتصل بنا» ليراجع المدير الطلب ويتخذ الإجراء المناسب.</p>
        </section>
      </div>
    </PageShell>
  );
}
