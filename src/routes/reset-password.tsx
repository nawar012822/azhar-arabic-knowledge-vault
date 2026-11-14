import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "تعيين كلمة مرور جديدة – المستودع الرقمي" },
      { name: "description", content: "اختر كلمة مرور جديدة لحسابك في المستودع الرقمي." },
      { property: "og:title", content: "تعيين كلمة مرور جديدة" },
      { property: "og:description", content: "اختر كلمة مرور جديدة لحسابك في المستودع الرقمي." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error("تعذر تغيير كلمة المرور. افتح الرابط من بريدك مرة أخرى.");
    toast.success("تم تغيير كلمة المرور.");
    navigate({ to: "/my" });
  };
  return (
    <div className="px-4 py-12">
      <form onSubmit={submit} className="mx-auto max-w-md space-y-4 rounded-xl border bg-card p-6 shadow-card">
        <h1 className="text-2xl font-bold text-primary">كلمة مرور جديدة</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">كلمة المرور الجديدة</Label>
          <Input id="pw" type="password" dir="ltr" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <button disabled={busy} className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">حفظ</button>
      </form>
    </div>
  );
}
