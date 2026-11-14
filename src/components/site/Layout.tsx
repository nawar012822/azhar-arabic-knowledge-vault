import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import logo from "@/assets/college_building.jpg.asset.json";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/", label: "الرئيسية" },
  { to: "/search", label: "البحث المتقدم" },
  { to: "/about", label: "عن المستودع" },
  { to: "/policy", label: "سياسة الاستخدام" },
  { to: "/contact", label: "اتصل بنا" },
] as const;

const linkCls = "block rounded-md px-3 py-3 text-sm hover:bg-muted lg:py-2";

function AccountLinks({ onClick }: { onClick?: () => void }) {
  const { user, isStaff, loading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  if (loading) return null;
  if (!user)
    return (
      <Link to="/auth" onClick={onClick} className="block rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground lg:py-2">
        تسجيل الدخول
      </Link>
    );
  const signOut = async () => {
    onClick?.();
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <>
      <Link to="/submit" onClick={onClick} className={`${linkCls} font-semibold text-gold`}>+ إيداع مادة</Link>
      <Link to="/my" onClick={onClick} className={linkCls}>حسابي</Link>
      {isStaff && <Link to="/admin" onClick={onClick} className={`${linkCls} text-primary`}>لوحة التحكم</Link>}
      <button onClick={signOut} className={`${linkCls} w-full text-start text-destructive lg:w-auto`}>خروج</button>
    </>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo.url} alt="شعار كلية اللغة العربية بالمنوفية" className="h-11 w-11 rounded-full object-contain" />
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold text-primary">المستودع الرقمي</span>
            <span className="block text-xs text-muted-foreground">كلية اللغة العربية – شبين الكوم</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted" activeProps={{ className: "bg-muted font-semibold text-primary" }} activeOptions={{ exact: true }}>
              {n.label}
            </Link>
          ))}
          <AccountLinks />
        </nav>
        <button className="rounded-md border px-3 py-2 text-sm lg:hidden" onClick={() => setOpen(!open)} aria-label="القائمة">
          ☰
        </button>
      </div>
      {open && (
        <nav className="border-t px-4 py-2 lg:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 text-sm hover:bg-muted">
              {n.label}
            </Link>
          ))}
          <AccountLinks onClick={() => setOpen(false)} />
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm">
        <p className="font-display text-lg">المستودع الرقمي لكلية اللغة العربية – جامعة الأزهر – فرع شبين الكوم</p>
        <p className="mt-2 opacity-80">نموذج غير رسمي قيد التطوير. بعض المواد المعروضة تجريبية لأغراض العرض.</p>
        <p className="mt-4 border-t border-primary-foreground/20 pt-4 opacity-90">
          © {new Date().getFullYear()} جميع حقوق النشر محفوظة لـ <strong>أحمد محمود نوار</strong> – طالب بكلية اللغة العربية بالمنوفية، جامعة الأزهر – شعبة المكتبات.
        </p>
      </div>
    </footer>
  );
}

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div>
      <section className="bg-hero pattern-geo text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 opacity-85">{subtitle}</p>}
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
