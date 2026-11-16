import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { accessLabels, getCollection } from "@/data/repository";
import { AccessBadge, StatusBadge } from "@/components/site/ItemCard";
import { ItemTools } from "@/components/site/ItemTools";
import { itemQuery } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/items/$id")({
  ssr: false,
  loader: async ({ params, context }) => {
    const item = await context.queryClient.ensureQueryData(itemQuery(params.id));
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "مادة غير موجودة" }, { name: "robots", content: "noindex" }] };
    const { item } = loaderData;
    const d = item.abstract.slice(0, 155);
    return { meta: [{ title: `${item.title} – المستودع الرقمي` }, { name: "description", content: d }, { property: "og:title", content: item.title }, { property: "og:description", content: d }, { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" }, { name: "DC.title", content: item.title }, { name: "DC.creator", content: item.author }, { name: "DC.date", content: String(item.date) }] };
  },
  component: ItemPage,
});

function ItemPage() {
  const { id } = Route.useParams();
  const { data: item } = useSuspenseQuery(itemQuery(id));
  useEffect(() => {
    if (!item?.uid || item.status !== "approved") return;
    const key = `viewed:${item.uid}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void supabase.rpc("bump_item", { _id: item.uid, _kind: "view" });
  }, [item?.uid, item?.status]);
  if (!item) throw notFound();
  const col = getCollection(item.collection);

  const rows: [string, string, string][] = [
    ["dc.identifier", "المعرف", item.id],
    ["dc.title", "العنوان", item.title],
    ["dc.creator", "المؤلف", item.author],
    ["dc.identifier.orcid", "ORCID", item.orcid ?? "—"],
    ["dc.identifier.isbn", "ISBN / ISSN", item.isbn ?? "—"],
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
          {item.status && item.status !== "approved" && <div className="mt-2"><StatusBadge status={item.status} />{item.reviewNote && <p className="mt-2 text-sm text-muted-foreground">ملاحظة المراجع: {item.reviewNote}</p>}</div>}
          <h1 className="mt-3 text-3xl font-bold leading-snug text-primary">{item.title}</h1>
          <p className="mt-2 text-muted-foreground">{item.author} • {item.date} • {col?.title}</p>
          <h2 className="mt-6 text-xl font-bold">الملخص</h2>
          <p className="mt-2 leading-8">{item.abstract}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.keywords.map((k) => (
              <Link key={k} to="/search" search={{ q: k, field: "keyword" }} className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">#{k}</Link>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">المشاهدات: {item.views.toLocaleString("ar-EG")} • التحميلات: {(item.downloads ?? 0).toLocaleString("ar-EG")}</p>
          <ItemTools key={item.id} item={item} />
        </div>
      </div>

      <h2 className="mt-10 text-xl font-bold">بيانات الفهرسة (Dublin Core)</h2>
      <div className="mt-3 overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([dc, label, v]) => (
              <tr key={label} className="border-b last:border-0">
                <th className="w-32 bg-muted p-3 text-start font-medium sm:w-40">{label}<div className="break-all text-xs font-normal text-muted-foreground" dir="ltr">{dc}</div></th>
                <td className="break-words p-3">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
