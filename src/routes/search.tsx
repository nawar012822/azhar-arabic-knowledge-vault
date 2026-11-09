import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { publishedItemsQuery } from "@/lib/db";
import { collections, departments, searchItems, type SearchQuery } from "@/data/repository";
import { PageShell } from "@/components/site/Layout";
import { ItemCard } from "@/components/site/ItemCard";

type S = SearchQuery;

export const Route = createFileRoute("/search")({
  validateSearch: (raw: Record<string, unknown>): S => { const s = raw as { q?: unknown; field?: unknown; type?: unknown; dept?: unknown; from?: unknown; to?: unknown; sort?: unknown }; return {
    q: typeof s.q === "string" ? s.q : undefined,
    field: (["all", "title", "author", "subject", "keyword"] as const).find((f) => f === s.field),
    type: typeof s.type === "string" && s.type ? s.type : undefined,
    dept: typeof s.dept === "string" && s.dept ? s.dept : undefined,
    from: s.from ? Number(s.from) || undefined : undefined,
    to: s.to ? Number(s.to) || undefined : undefined,
    sort: (["relevance", "newest", "oldest", "views", "title"] as const).find((f) => f === s.sort),
  }; },
  head: () => ({
    meta: [
      { title: "البحث المتقدم – المستودع الرقمي" },
      { name: "description", content: "ابحث في مواد المستودع بالعنوان والمؤلف والموضوع والسنة والقسم." },
      { property: "og:title", content: "البحث المتقدم – المستودع الرقمي" },
      { property: "og:description", content: "بحث عربي مع التصفية والترتيب." },
    ],
  }),
  component: SearchPage,
});

const input = "w-full rounded-md border bg-card px-3 py-2 text-sm";

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const all = useQuery(publishedItemsQuery).data ?? [];
  const results = searchItems(search, all);
  const set = (patch: Partial<S>) => navigate({ search: (p) => ({ ...p, ...patch }) });

  return (
    <PageShell title="البحث المتقدم" subtitle="يتجاهل البحث التشكيل والفروق بين (أ/إ/ا) و(ة/ه) و(ى/ي).">
      <form
        className="grid gap-3 rounded-lg border bg-card p-4 shadow-card md:grid-cols-4"
        onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); set({ q: String(f.get("q") || "") || undefined }); }}
      >
        <input name="q" defaultValue={search.q} placeholder="كلمات البحث" className={`${input} md:col-span-2`} />
        <select value={search.field ?? "all"} onChange={(e) => set({ field: e.target.value as S["field"] })} className={input}>
          <option value="all">كل الحقول</option>
          <option value="title">العنوان</option>
          <option value="author">المؤلف</option>
          <option value="subject">الموضوع</option>
          <option value="keyword">الكلمات المفتاحية</option>
        </select>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">بحث</button>
        <select value={search.type ?? ""} onChange={(e) => set({ type: e.target.value || undefined })} className={input}>
          <option value="">كل أنواع المحتوى</option>
          {collections.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
        </select>
        <select value={search.dept ?? ""} onChange={(e) => set({ dept: e.target.value || undefined })} className={input}>
          <option value="">كل الأقسام العلمية</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="number" placeholder="من سنة" defaultValue={search.from} onBlur={(e) => set({ from: Number(e.target.value) || undefined })} className={input} />
          <input type="number" placeholder="إلى سنة" defaultValue={search.to} onBlur={(e) => set({ to: Number(e.target.value) || undefined })} className={input} />
        </div>
        <select value={search.sort ?? "relevance"} onChange={(e) => set({ sort: e.target.value as S["sort"] })} className={input}>
          <option value="relevance">الأكثر صلة</option>
          <option value="newest">الأحدث</option>
          <option value="oldest">الأقدم</option>
          <option value="views">الأكثر مشاهدة</option>
          <option value="title">العنوان (أبجديًا)</option>
        </select>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">عدد النتائج: {results.length}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{results.map((x) => <ItemCard key={x.id} item={x} />)}</div>
    </PageShell>
  );
}
