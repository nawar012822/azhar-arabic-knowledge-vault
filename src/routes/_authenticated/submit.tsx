import { createFileRoute } from "@tanstack/react-router";
import { ItemForm } from "@/components/site/ItemForm";

export const Route = createFileRoute("/_authenticated/submit")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "إيداع مادة جديدة – المستودع الرقمي" },
      { name: "description", content: "أودع كتابًا أو بحثًا أو رسالة في المستودع الرقمي لكلية اللغة العربية بشبين الكوم." },
      { property: "og:title", content: "إيداع مادة جديدة – المستودع الرقمي" },
      { property: "og:description", content: "نموذج إيداع بمعيار Dublin Core مع رفع الملف." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ItemForm />,
});

