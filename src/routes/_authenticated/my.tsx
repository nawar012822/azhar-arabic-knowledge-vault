import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { favoritesQuery, myItemsQuery, profileQuery } from "@/lib/db";
import { roleLabels } from "@/lib/permissions";
import { getCollection } from "@/data/repository";
import { ItemCard, AccessBadge, StatusBadge } from "@/components/site/ItemCard";
import { PageShell } from "@/components/site/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { canEditItem } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/my")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "حسابي – المستودع الرقمي" },
      { name: "description", content: "بياناتك الشخصية وموادك المودعة وقائمة المفضلة في المستودع الرقمي." },
      { property: "og:title", content: "حسابي – المستودع الرقمي" },
      { property: "og:description", content: "بياناتك وموادك المودعة ومفضلتك." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyPage,
});

function MyPage() {
  const { user, roles } = useAuth();
  if (!user) return <p className="p-8 text-center text-muted-foreground">جارٍ التحميل...</p>;
  return (
    <PageShell title="حسابي" subtitle={roles.map((r) => roleLabels[r]).join(" • ")}>
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <ProfileCard userId={user.id} email={user.email ?? ""} />
        <div className="space-y-10">
          <MySubmissions userId={user.id} />
          <MyFavorites userId={user.id} />
        </div>
      </div>
    </PageShell>
  );
}

function ProfileCard({ userId, email }: { userId: string; email: string }) {
  const qc = useQueryClient();
  const { data: profile } = useQuery(profileQuery(userId));
  const [name, setName] = useState("");
  const [orcid, setOrcid] = useState("");
  useEffect(() => {
    if (profile) { setName(profile.full_name); setOrcid(profile.orcid ?? ""); }
  }, [profile]);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ full_name: name.trim(), orcid: orcid.trim() || null }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم حفظ بياناتك."); qc.invalidateQueries({ queryKey: ["profile", userId] }); },
    onError: () => toast.error("تعذر الحفظ."),
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="h-fit space-y-4 rounded-xl border bg-card p-5 shadow-card">
      <h2 className="text-lg font-bold text-primary">بياناتي</h2>
      <div className="space-y-1.5"><Label>البريد الإلكتروني</Label><p dir="ltr" className="text-end text-sm text-muted-foreground">{email}</p></div>
      <div className="space-y-1.5"><Label htmlFor="n">الاسم الكامل</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="space-y-1.5">
        <Label htmlFor="o">معرّف ORCID (اختياري)</Label>
        <Input id="o" dir="ltr" placeholder="0000-0000-0000-0000" value={orcid} onChange={(e) => setOrcid(e.target.value)} />
      </div>
      <Button type="submit" disabled={save.isPending} className="w-full">حفظ</Button>
    </form>
  );
}

function MySubmissions({ userId }: { userId: string }) {
  const { roles } = useAuth();
  const { data = [], isLoading } = useQuery(myItemsQuery(userId));
  return (
    <section>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">موادي المودعة ({data.length})</h2>
        <Link to="/submit" className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-primary">+ إيداع مادة جديدة</Link>
      </div>
      {isLoading ? <p className="mt-4 text-sm text-muted-foreground">جارٍ التحميل...</p> : data.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">لم تودع أي مادة بعد.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {data.map((it) => (
            <li key={it.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusBadge status={it.status ?? "pending"} />
                <AccessBadge access={it.access} />
                <span className="text-muted-foreground">{getCollection(it.collection)?.title}</span>
              </div>
              <Link to="/items/$id" params={{ id: it.id }} className="mt-2 block font-display text-lg font-bold text-primary">{it.title}</Link>
              {it.reviewNote && <p className="mt-2 rounded bg-muted p-2 text-sm">ملاحظة المراجع: {it.reviewNote}</p>}
              {canEditItem(roles, userId, it.submittedBy, it.status) && <Button asChild variant="outline" size="sm" className="mt-3"><Link to="/edit/$id" params={{ id: it.id }}>تعديل المادة</Link></Button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MyFavorites({ userId }: { userId: string }) {
  const { data = [] } = useQuery(favoritesQuery(userId));
  return (
    <section>
      <h2 className="text-xl font-bold">المفضلة ({data.length})</h2>
      {data.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">اضغط «إضافة للمفضلة ☆» في صفحة أي مادة لتظهر هنا.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">{data.map((it) => <ItemCard key={it.id} item={it} />)}</div>
      )}
    </section>
  );
}
