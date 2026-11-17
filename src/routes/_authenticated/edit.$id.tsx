import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { itemQuery } from "@/lib/db";
import { ItemForm } from "@/components/site/ItemForm";

export const Route = createFileRoute("/_authenticated/edit/$id")({
  loader: async ({ params, context }) => {
    const item = await context.queryClient.ensureQueryData(itemQuery(params.id));
    if (!item) throw notFound();
  },
  head: () => ({ meta: [
    { title: "تعديل المادة – المستودع الرقمي لكلية اللغة العربية" },
    { name: "description", content: "تعديل بيانات المادة وملفها وإعادة إرسالها للمراجعة." },
    { property: "og:title", content: "تعديل المادة – المستودع الرقمي" },
    { property: "og:description", content: "تحديث بيانات الفهرسة وملف المادة." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: EditItem,
});

function EditItem() {
  const { id } = Route.useParams();
  const { data: item } = useSuspenseQuery(itemQuery(id));
  if (!item) throw notFound();
  return <ItemForm key={item.id} item={item} />;
}