import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { collections, items } from "@/data/repository";
import { ItemCard } from "@/components/site/ItemCard";
import logo from "@/assets/college_building.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "المستودع الرقمي لكلية اللغة العربية – جامعة الأزهر – شبين الكوم" },
      { name: "description", content: "ابحث في الكتب والرسائل الجامعية والأبحاث والمخطوطات الخاصة بكلية اللغة العربية بشبين الكوم." },
      { property: "og:title", content: "المستودع الرقمي لكلية اللغة العربية – شبين الكوم" },
      { property: "og:description", content: "منصة لحفظ وتنظيم وإتاحة الإنتاج العلمي للكلية." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const latest = [...items].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 4);
  const popular = [...items].sort((a, b) => b.views - a.views).slice(0, 4);
  const count = (c: string) => items.filter((x) => x.collection === c).length;
  const stats = [
    { label: "إجمالي المواد", value: items.length },
    { label: "الكتب", value: count("books") },
    { label: "الرسائل", value: count("theses") },
    { label: "الأبحاث", value: count("research") + count("faculty") },
    { label: "المخطوطات", value: count("manuscripts") },
    { label: "المشاهدات", value: items.reduce((s, x) => s + x.views, 0) },
  ];

  return (
    <div>
      <section className="bg-hero pattern-geo text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center md:py-20">
          <img src={logo.url} alt="شعار كلية اللغة العربية بالمنوفية" className="mx-auto mb-4 h-24 w-24 rounded-full bg-card p-1 shadow-card md:h-28 md:w-28" />
          <p className="text-sm text-gold">جامعة الأزهر – فرع شبين الكوم</p>
          <h1 className="mt-3 text-3xl font-bold leading-snug md:text-5xl">المستودع الرقمي لكلية اللغة العربية</h1>
          <p className="mx-auto mt-4 max-w-2xl opacity-85">حفظ الإنتاج العلمي للكلية وتنظيمه وإتاحته للطلاب والباحثين وأعضاء هيئة التدريس.</p>
          <form
            className="mx-auto mt-8 flex max-w-2xl gap-2 rounded-lg bg-card p-2 shadow-card"
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search", search: { q } }); }}
          >
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالعنوان أو المؤلف أو الموضوع..." className="min-w-0 flex-1 bg-transparent px-3 py-2 text-foreground outline-none" />
            <button className="rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground">بحث</button>
          </form>
        </div>
      </section>

      <section className="mx-auto -mt-8 max-w-6xl px-4">
        <div className="grid grid-cols-3 gap-2 rounded-lg border bg-card p-4 shadow-card md:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-2xl font-bold text-primary">{s.value.toLocaleString("ar-EG")}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="mb-5 text-2xl font-bold text-primary">أقسام المستودع</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {collections.map((c) => (
            <Link key={c.slug} to="/collections/$slug" params={{ slug: c.slug }} className="rounded-lg border bg-card p-4 transition hover:border-primary hover:shadow-card">
              <div className="text-2xl">{c.icon}</div>
              <div className="mt-2 font-semibold">{c.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{count(c.slug)} مادة</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="mb-5 text-2xl font-bold text-primary">أحدث الإضافات</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{latest.map((x) => <ItemCard key={x.id} item={x} />)}</div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="mb-5 text-2xl font-bold text-primary">الأكثر زيارة</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{popular.map((x) => <ItemCard key={x.id} item={x} />)}</div>
      </section>
    </div>
  );
}
