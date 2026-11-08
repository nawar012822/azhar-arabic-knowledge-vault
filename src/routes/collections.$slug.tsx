import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCollection, searchItems } from "@/data/repository";
import { PageShell } from "@/components/site/Layout";
import { ItemCard } from "@/components/site/ItemCard";

export const Route = createFileRoute("/collections/$slug")({
  loader: ({ params }) => {
    const collection = getCollection(params.slug);
    if (!collection) throw notFound();
    return { collection };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.collection.title} – المستودع الرقمي` : "قسم غير موجود";
    const d = loaderData?.collection.description ?? "";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }] };
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { collection } = Route.useLoaderData();
  const list = searchItems({ type: collection.slug, sort: "newest" });
  return (
    <PageShell title={`${collection.icon} ${collection.title}`} subtitle={collection.description}>
      {list.length === 0 ? (
        <p className="text-muted-foreground">لا توجد مواد في هذا القسم بعد.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map((x) => <ItemCard key={x.id} item={x} />)}</div>
      )}
    </PageShell>
  );
}
