import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { GoogleButton } from "@/components/site/GoogleButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => {
    const r = s["redirect"];
    return typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? { redirect: r } : {};
  },
  head: () => ({
    meta: [
      { title: "تسجيل الدخول وإنشاء حساب – المستودع الرقمي" },
      { name: "description", content: "سجّل الدخول أو أنشئ حسابًا في المستودع الرقمي لكلية اللغة العربية بشبين الكوم لإيداع المواد وتحميلها." },
      { property: "og:title", content: "تسجيل الدخول – المستودع الرقمي" },
      { property: "og:description", content: "حساب واحد لإيداع المواد العلمية وتحميلها وحفظ المفضلة." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    if (!loading && user) navigate({ to: redirect ?? "/my", replace: true });
  }, [loading, user, redirect, navigate]);

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        toast.success("أهلًا بعودتك!");
      } else if (mode === "signup") {
        if (form.name.trim().length < 3) throw new Error("اكتب اسمك الكامل.");
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: form.name.trim() } },
        });
        if (error) throw error;
        if (!data.session) setSent("أرسلنا رسالة تأكيد إلى بريدك. افتحها واضغط الرابط، ثم ارجع وسجّل الدخول.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSent("أرسلنا رابط تغيير كلمة المرور إلى بريدك.");
      }
    } catch (err) {
      toast.error(translate(err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) {
      toast.error("تعذر الدخول بحساب Google. حاول مرة أخرى.");
      setBusy(false);
    }
  };

  const titles: Record<Mode, string> = { signin: "تسجيل الدخول", signup: "إنشاء حساب جديد", forgot: "نسيت كلمة المرور" };

  return (
    <div className="bg-hero pattern-geo px-4 py-12">
      <div className="mx-auto max-w-md rounded-xl border bg-card p-6 shadow-card">
        <h1 className="text-center text-2xl font-bold text-primary">{titles[mode]}</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">المستودع الرقمي لكلية اللغة العربية – شبين الكوم</p>

        {mode !== "forgot" && (
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
            {(["signin", "signup"] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setSent(null); }} className={`rounded-md py-2 ${mode === m ? "bg-card font-semibold text-primary shadow-sm" : "text-muted-foreground"}`}>
                {m === "signin" ? "دخول" : "حساب جديد"}
              </button>
            ))}
          </div>
        )}

        {sent ? (
          <div className="mt-6 rounded-lg bg-success/10 p-4 text-sm leading-7 text-foreground">
            ✉️ {sent}
            <button className="mt-3 block font-semibold text-primary" onClick={() => { setSent(null); setMode("signin"); }}>العودة لتسجيل الدخول</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input id="name" value={form.name} onChange={set("name")} required placeholder="مثال: أحمد محمود نوار" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" dir="ltr" value={form.email} onChange={set("email")} required autoComplete="email" />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input id="password" type="password" dir="ltr" minLength={6} value={form.password} onChange={set("password")} required autoComplete={mode === "signin" ? "current-password" : "new-password"} />
                {mode === "signup" && <p className="text-xs text-muted-foreground">6 أحرف على الأقل.</p>}
              </div>
            )}
            <button disabled={busy} className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {busy ? "جارٍ التنفيذ..." : mode === "signin" ? "دخول" : mode === "signup" ? "إنشاء الحساب" : "أرسل رابط التغيير"}
            </button>
            {mode === "signin" && (
              <button type="button" onClick={() => setMode("forgot")} className="block w-full text-center text-sm text-muted-foreground underline">نسيت كلمة المرور؟</button>
            )}
            {mode === "forgot" && (
              <button type="button" onClick={() => setMode("signin")} className="block w-full text-center text-sm text-muted-foreground underline">رجوع</button>
            )}
          </form>
        )}

        {mode !== "forgot" && !sent && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />أو<span className="h-px flex-1 bg-border" /></div>
            <GoogleButton onClick={google} disabled={busy} />
          </>
        )}
        <p className="mt-6 text-center text-xs text-muted-foreground">بالتسجيل أنت توافق على <Link to="/policy" className="underline">سياسة الاستخدام</Link>.</p>
      </div>
    </div>
  );
}

function translate(msg: string): string {
  if (/invalid login/i.test(msg)) return "البريد أو كلمة المرور غير صحيحة.";
  if (/already registered/i.test(msg)) return "هذا البريد مسجل بالفعل. جرّب تسجيل الدخول.";
  if (/email not confirmed/i.test(msg)) return "لم يتم تأكيد البريد بعد. افتح رسالة التأكيد في بريدك.";
  if (/password/i.test(msg) && /(weak|pwned|short|least)/i.test(msg)) return "كلمة المرور ضعيفة أو مشهورة. اختر كلمة أقوى.";
  if (/rate limit/i.test(msg)) return "محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.";
  return msg;
}
