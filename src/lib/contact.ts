export const contactSubjects = { general: "استفسار عام", deposit: "طلب إضافة مادة", copyright: "طلب إزالة مادة (حقوق ملكية)" } as const;
export type ContactSubject = keyof typeof contactSubjects;
export function validContactMessage(name: string, message: string) {
  const n = name.trim().length;
  const m = message.trim().length;
  return n >= 2 && n <= 200 && m >= 10 && m <= 5000;
}