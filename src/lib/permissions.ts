import type { ItemStatus } from "@/data/repository";

export type Role = "admin" | "moderator" | "user";

export const roleLabels: Record<Role, string> = {
  admin: "مدير عام",
  moderator: "مشرف ومراجع",
  user: "عضو مسجل",
};

/** المدير العام والمشرف يراجعان المواد ويعتمدانها. */
export const canReview = (roles: Role[]) => roles.includes("admin") || roles.includes("moderator");
/** المدير العام وحده يدير المستخدمين والصلاحيات ويحذف المواد. */
export const canManageUsers = (roles: Role[]) => roles.includes("admin");
export const canDeleteItems = (roles: Role[]) => roles.includes("admin");
export const canRemoveAdmin = (adminCount: number) => adminCount > 1;
/** أي عضو مسجل يستطيع الإيداع. */
export const canSubmit = (roles: Role[]) => roles.length > 0;

/** مواد الأعضاء تدخل المراجعة أولًا، ومواد المشرفين تُنشر مباشرة. */
export function initialStatus(roles: Role[]): ItemStatus {
  return canReview(roles) ? "approved" : "pending";
}

/** الرسائل الجامعية لا تُتاح للتحميل افتراضيًا (بيانات وصفية فقط). */
export function defaultAccessFor(collection: string) {
  return collection === "theses" ? "metadata" : "restricted";
}
