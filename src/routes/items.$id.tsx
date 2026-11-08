import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { accessLabels, canDownload, getCollection, getItem } from "@/data/repository";
import { AccessBadge } from "@/components/site/ItemCard";

export const Route = createFileRoute("/items/$id")({
  loader: ({ params }) => {
    const item = getItem(params.id);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "مادة غير موجودة" }, { name: "robots", content: "noindex" }] };
    const { item } = loaderData;
    const d = item.abstract.slice(0, 155);
    return { meta: [{ title: `${item.title} – المستودع الرقمي` }, { name: "description", content: d }, { property: "og:title", content: item.title }, { property: "og:description", content: d }, { name: "DC.title", content: item.title }, { name: "DC.creator", content: item.author }, { name: "DC.date", content: String(item.date) }] };
  },
  component: ItemPage,
});

function ItemPage() {
  const { item } = Route.useLoaderData();
  const col = getCollection(item.collection);
  const [copied, setCopied] = useState(false);
  const allowed = canDownload(item.access, false); // لا يوجد تسجيل دخول بعد (المرحلة الثانية)

  const rows: [string, string, string][] = [
    ["dc.identifier", "المعرف", item.id],
    ["dc.title", "العنوان", item.title],
    ["dc.creator", "المؤلف", item.author],
    ["dc.contributor", "المشاركون", item.contributors.join("، ") || "—"],
    ["dc.contributor.advisor", "المشرف الأكاديمي", item.supervisor ?? "—"],
    ["dc.subject", "الموضوعات", item.subjects.join("، ")],
    ["dc.date.issued", "تاريخ النشر", String(item.date)],
    ["dc.publisher", "جهة النشر", item.publisher],
    ["dc.type", "نوع المادة", col?.title ?? item.collection],
    ["dc.language", "اللغة", item.language],
    ["dc.format.extent", "عدد الصفحات", String(item.pages)],
    ["—", "القسم العلمي", item.department],
    ["dc.format", "نوع الملف", item.format],
    ["dc.rights", "حقوق الاستخدام", item.rights],
    ["—", "مستوى الإتاحة", accessLabels[item.access]],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link to="/">الرئيسية</Link> / {col && <Link to="/collections/$slug" params={{ slug: col.slug }}>{col.title}</Link>}
      </nav>
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <div className="flex aspect-[3/4] flex-col items-center justify-center rounded-lg bg-hero pattern-geo p-4 text-center text-primary-foreground shadow-card">
          <span className="text-5xl">{col?.icon}</span>
          <span className="mt-4 font-display text-lg leading-snug">{item.title}</span>
        </div>
        <div>
          <AccessBadge access={item.access} />
          <h1 className="mt-3 text-3xl font-bold leading-snug text-primary">{item.title}</h1>
          <p className="mt-2 text-muted-foreground">{item.author} • {item.date} • {col?.title}</p>
          <h2 className="mt-6 text-xl font-bold">الملخص</h2>
          <p className="mt-2 leading-8">{item.abstract}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.keywords.map((k) => (
              <Link key={k} to="/search" search={{ q: k, field: "keyword" }} className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">#{k}</Link>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button disabled={item.access === "metadata"} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-40">عرض الملف</button>
            <button disabled={!allowed} className="rounded-md border border-primary px-4 py-2 text-sm text-primary disabled:opacity-40">تحميل الملف</button>
            <button
              onClick={() => { navigator.clipboard?.writeText(window.location.href); setCopied(true); }}
              className="rounded-md border px-4 py-2 text-sm"
            >
              {copied ? "تم نسخ الرابط ✓" : "مشاركة الرابط"}
            </button>
          </div>
          {!allowed && (
            <p className="mt-3 text-sm text-muted-foreground">
              {item.access === "restricted" ? "التحميل متاح للمستخدمين المسجلين فقط." : "هذه المادة متاحة كبيانات وصفية فقط احترامًا لحقوق المؤلف."}
            </p>
          )}
        </div>
      </div>

      <h2 className="mt-10 text-xl font-bold">بيانات الفهرسة (Dublin Core)</h2>
      <div className="mt-3 overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([dc, label, v]) => (
              <tr key={label} className="border-b last:border-0">
                <th className="w-40 bg-muted p-3 text-start font-medium">{label}<div className="text-xs font-normal text-muted-foreground" dir="ltr">{dc}</div></th>
                <td className="p-3">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
