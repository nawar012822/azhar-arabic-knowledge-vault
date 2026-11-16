import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { allItemsQuery } from "@/lib/db";
import { canRemoveAdmin, roleLabels, type Role } from "@/lib/permissions";
import { accessLabels, collections, departments, getCollection, statusLabels, type AccessLevel, type Item, type ItemStatus } from "@/data/repository";
import { AccessBadge, StatusBadge } from "@/components/site/ItemCard";
import { PageShell } from "@/components/site/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { downloadText, toDublinCoreXML } from "@/lib/citation";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم – المستودع الرقمي" },
      { name: "description", content: "مراجعة الإيداعات وإدارة المواد والأعضاء والصلاحيات في المستودع الرقمي." },
      { property: "og:title", content: "لوحة التحكم – المستودع الرقمي" },
      { property: "og:description", content: "مراجعة الإيداعات وإدارة الأعضاء والصلاحيات." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "review" | "items" | "users" | "stats";

function AdminPage() {
  const { isStaff, isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("review");
  if (loading) return <p className="p-8 text-center text-muted-foreground">جارٍ التحميل...</p>;
  if (!isStaff)
    return (
      <PageShell title="لوحة التحكم">
        <p className="rounded-lg border bg-card p-6 text-center">هذه الصفحة للمدير والمشرفين فقط.</p>
      </PageShell>
    );
  const tabs: [Tab, string][] = [["review", "صندوق المراجعة"], ["items", "كل المواد"], ...(isAdmin ? ([["users", "الأعضاء والصلاحيات"]] as [Tab, string][]) : []), ["stats", "الإحصائيات"]];
  return (
    <PageShell title="لوحة التحكم" subtitle={isAdmin ? "المدير العام – صلاحيات كاملة" : "مشرف ومراجع"}>
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap rounded-md px-4 py-2 text-sm ${tab === k ? "bg-card font-semibold text-primary shadow-sm" : "text-muted-foreground"}`}>{l}</button>
        ))}
      </div>
      {tab === "review" && <ReviewQueue />}
      {tab === "items" && <AllItems />}
      {tab === "users" && isAdmin && <UsersPanel />}
      {tab === "stats" && <Stats />}
    </PageShell>
  );
}

function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uid, patch }: { uid: string; patch: { status?: ItemStatus; access?: AccessLevel; review_note?: string | null; collection?: string } }) => {
      const { error } = await supabase.from("items").update(patch).eq("id", uid);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["items"] }); toast.success("تم الحفظ."); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذر الحفظ."),
  });
}

function ReviewQueue() {
  const { data = [], isLoading } = useQuery(allItemsQuery);
  const queue = data.filter((x) => x.status === "pending" || x.status === "revision");
  const update = useUpdateItem();
  const [notes, setNotes] = useState<Record<string, string>>({});
  if (isLoading) return <p className="text-muted-foreground">جارٍ التحميل...</p>;
  if (queue.length === 0) return <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">لا توجد إيداعات تنتظر المراجعة ✓</p>;
  return (
    <ul className="space-y-4">
      {queue.map((it) => (
        <li key={it.id} className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2"><StatusBadge status={it.status!} /><AccessBadge access={it.access} /><span className="text-xs text-muted-foreground">{getCollection(it.collection)?.title} • {it.addedAt}</span></div>
          <Link to="/items/$id" params={{ id: it.id }} className="mt-2 block font-display text-lg font-bold text-primary">{it.title}</Link>
          <p className="text-sm text-muted-foreground">{it.author} • {it.department} • {it.filePath ? "📎 مرفق ملف" : "بدون ملف"}</p>
          {it.abstract && <p className="mt-2 line-clamp-3 text-sm leading-7">{it.abstract}</p>}
          <Input className="mt-3" placeholder="ملاحظة للمودِع (اختياري، مطلوبة عند طلب التعديل أو الرفض)" value={notes[it.id] ?? it.reviewNote ?? ""} onChange={(e) => setNotes({ ...notes, [it.id]: e.target.value })} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => update.mutate({ uid: it.uid!, patch: { status: "approved", review_note: notes[it.id] || null } })} className="rounded-md bg-success px-4 py-2 text-sm font-semibold text-primary-foreground">✓ اعتماد ونشر</button>
            <button onClick={() => update.mutate({ uid: it.uid!, patch: { status: "revision", review_note: notes[it.id] || "يرجى مراجعة البيانات" } })} className="rounded-md border border-warning px-4 py-2 text-sm text-warning">طلب تعديل</button>
            <button onClick={() => update.mutate({ uid: it.uid!, patch: { status: "rejected", review_note: notes[it.id] || null } })} className="rounded-md border border-destructive px-4 py-2 text-sm text-destructive">رفض</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AllItems() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery(allItemsQuery);
  const update = useUpdateItem();
  const [q, setQ] = useState("");
  const shown = data.filter((x) => !q || x.title.includes(q) || x.author.includes(q) || x.id.includes(q));
  const remove = async (it: Item) => {
    if (!confirm(`حذف «${it.title}» نهائيًا؟`)) return;
    if (it.filePath) await supabase.storage.from("files").remove([it.filePath]);
    const { error } = await supabase.from("items").delete().eq("id", it.uid!);
    if (error) { toast.error("تعذر الحذف."); return; }
    toast.success("تم الحذف.");
    qc.invalidateQueries({ queryKey: ["items"] });
  };
  return (
    <div>
      <Input placeholder="ابحث بالعنوان أو المؤلف أو المعرف..." value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-md" />
      <div className="space-y-3">
        {shown.map((it) => (
          <div key={it.id} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_auto]">
            <div>
              <Link to="/items/$id" params={{ id: it.id }} className="font-semibold text-primary">{it.title}</Link>
              <p className="text-xs text-muted-foreground">{it.id} • {it.author} • 👁 {it.views} • ⬇ {it.downloads ?? 0}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <select className="h-9 rounded-md border bg-background px-2" value={it.status} onChange={(e) => update.mutate({ uid: it.uid!, patch: { status: e.target.value as ItemStatus } })}>
                {(Object.keys(statusLabels) as ItemStatus[]).map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
              </select>
              <select className="h-9 rounded-md border bg-background px-2" value={it.access} onChange={(e) => update.mutate({ uid: it.uid!, patch: { access: e.target.value as AccessLevel } })}>
                {(Object.keys(accessLabels) as AccessLevel[]).map((a) => <option key={a} value={a}>{accessLabels[a]}</option>)}
              </select>
              <select className="h-9 rounded-md border bg-background px-2" value={it.collection} onChange={(e) => update.mutate({ uid: it.uid!, patch: { collection: e.target.value } })}>
                {collections.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
              </select>
              {isAdmin && <button onClick={() => remove(it)} className="rounded-md border border-destructive px-3 py-1.5 text-destructive">حذف</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Member { id: string; full_name: string; email: string; created_at: string; roles: { role: Role; department: string | null }[] }

function UsersPanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async (): Promise<Member[]> => {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, created_at").order("created_at"),
        supabase.from("user_roles").select("user_id, role, department"),
      ]);
      if (p.error) throw p.error;
      if (r.error) throw r.error;
      return (p.data ?? []).map((m) => ({ ...m, roles: (r.data ?? []).filter((x) => x.user_id === m.id).map((x) => ({ role: x.role as Role, department: x.department })) }));
    },
  });
  const [q, setQ] = useState("");
  const adminCount = members.filter((m) => m.roles.some((r) => r.role === "admin")).length;
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["members"] });
    void qc.invalidateQueries({ queryKey: ["roles"] });
  };

  const toggle = async (m: Member, role: Role, on: boolean, department?: string | null) => {
    if (!on && role === "admin" && !canRemoveAdmin(adminCount)) { toast.error("لا يمكن إزالة صلاحية آخر مدير عام. أضف مديرًا آخر أولًا."); return; }
    if (!on && role === "admin" && m.id === user?.id && !confirm("ستزيل صلاحية المدير العام من حسابك أنت. متأكد؟")) return;
    const res = on
      ? await supabase.from("user_roles").upsert({ user_id: m.id, role, department: department ?? null }, { onConflict: "user_id,role" })
      : await supabase.from("user_roles").delete().eq("user_id", m.id).eq("role", role);
    if (res.error) { toast.error(res.error.message.includes("آخر مدير") ? res.error.message : "تعذر تعديل الصلاحية."); return; }
    toast.success("تم تحديث الصلاحيات.");
    refresh();
  };

  if (isLoading) return <p className="text-muted-foreground">جارٍ التحميل...</p>;
  const shown = members.filter((m) => !q || m.full_name.includes(q) || m.email.includes(q));
  return (
    <div>
      <div className="mb-4 rounded-lg bg-accent p-4 text-sm leading-7 text-accent-foreground">
        <strong>كيف تضيف مشرفًا أو مديرًا؟</strong> اطلب من الشخص إنشاء حساب أولًا، ثم ابحث عن اسمه هنا وفعّل له الصلاحية.
        <br />• <b>مشرف ومراجع</b>: يراجع الإيداعات ويعتمدها ويعدّل المواد. • <b>مدير عام</b>: كل الصلاحيات، ومنها إدارة الأعضاء والحذف.
      </div>
      <Input placeholder="ابحث بالاسم أو البريد..." value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-md" />
      <p className="mb-3 text-sm text-muted-foreground">عدد الأعضاء: {members.length}</p>
      <div className="space-y-3">
        {shown.map((m) => {
          const has = (r: Role) => m.roles.some((x) => x.role === r);
          const dept = m.roles.find((x) => x.role === "moderator")?.department ?? "";
          return (
            <div key={m.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{m.full_name || "بدون اسم"} {m.id === user?.id && <span className="text-xs text-gold">(أنت)</span>}</p>
                  <p dir="ltr" className="text-end text-xs text-muted-foreground">{m.email}</p>
                </div>
                <div className="flex flex-wrap gap-1 text-xs">{m.roles.map((r) => <span key={r.role} className="rounded-full bg-muted px-2 py-0.5">{roleLabels[r.role]}{r.department ? ` – ${r.department}` : ""}</span>)}</div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={has("moderator")} onChange={(e) => toggle(m, "moderator", e.target.checked, dept || null)} /> مشرف ومراجع</label>
                {has("moderator") && (
                  <select className="h-9 rounded-md border bg-background px-2" value={dept} onChange={(e) => toggle(m, "moderator", true, e.target.value || null)}>
                    <option value="">كل الأقسام</option>
                    {departments.map((d) => <option key={d}>{d}</option>)}
                  </select>
                )}
                <label className="flex items-center gap-2"><input type="checkbox" checked={has("admin")} disabled={has("admin") && !canRemoveAdmin(adminCount)} title={has("admin") && !canRemoveAdmin(adminCount) ? "أضف مديرًا آخر قبل إزالة آخر مدير" : "مدير عام"} onChange={(e) => toggle(m, "admin", e.target.checked)} /> مدير عام</label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stats() {
  const { data = [] } = useQuery(allItemsQuery);
  const by = (s: ItemStatus) => data.filter((x) => x.status === s).length;
  const cards = [
    ["كل المواد", data.length], ["منشورة", by("approved")], ["قيد المراجعة", by("pending")], ["مطلوب تعديل", by("revision")],
    ["المشاهدات", data.reduce((s, x) => s + x.views, 0)], ["التحميلات", data.reduce((s, x) => s + (x.downloads ?? 0), 0)],
  ] as const;
  const top = [...data].sort((a, b) => b.views - a.views).slice(0, 5);
  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => {
        const records = data.map((item) => toDublinCoreXML(item).replace(/^<\?xml[^>]*>\s*/, "")).join("\n");
        downloadText("repository-dublin-core.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<repository>\n${records}\n</repository>`, "application/xml");
      }}>تصدير بيانات المستودع (Dublin Core)</Button>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {cards.map(([l, v]) => <div key={l} className="rounded-lg border bg-card p-4 text-center"><div className="text-2xl font-bold text-primary">{v.toLocaleString("ar-EG")}</div><div className="text-xs text-muted-foreground">{l}</div></div>)}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-bold">حسب القسم</h3>
          {collections.map((c) => { const n = data.filter((x) => x.collection === c.slug).length; return (
            <div key={c.slug} className="mb-2 text-sm"><div className="flex justify-between"><span>{c.icon} {c.title}</span><span>{n}</span></div><div className="mt-1 h-2 rounded bg-muted"><div className="h-2 rounded bg-gold" style={{ width: `${data.length ? (n / data.length) * 100 : 0}%` }} /></div></div>
          ); })}
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-bold">الأكثر مشاهدة</h3>
          <ol className="space-y-2 text-sm">{top.map((x, i) => <li key={x.id} className="flex justify-between gap-2"><Link to="/items/$id" params={{ id: x.id }} className="text-primary">{i + 1}. {x.title}</Link><span className="text-muted-foreground">👁 {x.views}</span></li>)}</ol>
        </div>
      </div>
    </div>
  );
}
