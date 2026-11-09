// بيانات تجريبية للمرحلة الأولى. الحقول مبنية على معيار Dublin Core (dc.*)
// وستنتقل إلى قاعدة البيانات في المرحلة الثالثة بنفس الأسماء.

export type AccessLevel = "open" | "restricted" | "metadata";

export const accessLabels: Record<AccessLevel, string> = {
  open: "متاح مفتوح",
  restricted: "مقيد للمسجلين",
  metadata: "بيانات وصفية فقط",
};

export interface Collection {
  slug: string;
  title: string;
  description: string;
  icon: string;
}

export const collections: Collection[] = [
  { slug: "books", title: "الكتب والمراجع", description: "الكتب العلمية والمراجع في علوم العربية", icon: "📚" },
  { slug: "theses", title: "الرسائل الجامعية", description: "رسائل الماجستير والدكتوراه", icon: "🎓" },
  { slug: "research", title: "الأبحاث العلمية", description: "الأبحاث المنشورة وغير المنشورة والمقالات", icon: "🔬" },
  { slug: "manuscripts", title: "المخطوطات والتراث", description: "المخطوطات العربية والكتب التراثية", icon: "📜" },
  { slug: "faculty", title: "إنتاج أعضاء هيئة التدريس", description: "الإنتاج العلمي لأساتذة الكلية", icon: "🖋️" },
  { slug: "students", title: "مشروعات الطلاب", description: "أبحاث ومشروعات طلاب الكلية", icon: "📝" },
  { slug: "journals", title: "الدوريات والمجلات", description: "المجلات والدوريات العلمية", icon: "📰" },
  { slug: "lectures", title: "المحاضرات والمواد التعليمية", description: "المحاضرات والمواد التعليمية الرقمية", icon: "🎧" },
];

export const departments = ["النحو والصرف", "البلاغة والنقد", "الأدب والنقد", "أصول اللغة", "التاريخ والحضارة"];

export interface Item {
  id: string; // dc.identifier
  title: string; // dc.title
  author: string; // dc.creator
  contributors: string[]; // dc.contributor
  supervisor?: string; // dc.contributor.advisor
  subjects: string[]; // dc.subject
  keywords: string[];
  date: number; // dc.date.issued (year)
  publisher: string; // dc.publisher
  collection: string; // dc.type
  language: string; // dc.language
  abstract: string; // dc.description.abstract
  pages: number; // dc.format.extent
  department: string;
  format: string; // dc.format
  rights: string; // dc.rights
  access: AccessLevel;
  views: number;
  addedAt: string;
  uid?: string; // معرف قاعدة البيانات
  filePath?: string | null;
  downloads?: number;
  isbn?: string | null;
  orcid?: string | null;
  status?: ItemStatus;
  reviewNote?: string | null;
  submittedBy?: string | null;
}

export type ItemStatus = "pending" | "approved" | "revision" | "rejected";
export const statusLabels: Record<ItemStatus, string> = {
  pending: "قيد المراجعة",
  approved: "معتمد ومنشور",
  revision: "مطلوب تعديل",
  rejected: "مرفوض",
};

const i = (x: Partial<Item> & Pick<Item, "id" | "title" | "author" | "collection">): Item => ({
  contributors: [], subjects: [], keywords: [], date: 2020, publisher: "كلية اللغة العربية بشبين الكوم",
  language: "العربية", abstract: "", pages: 0, department: "النحو والصرف", format: "PDF",
  rights: "جميع الحقوق محفوظة للمؤلف", access: "metadata", views: 0, addedAt: "2026-01-01", ...x,
});

// ملاحظة: هذه سجلات تجريبية مختلقة لغرض العرض فقط.
export const items: Item[] = [
  i({ id: "AZ-SHK-0001", title: "ظاهرة الحذف في الجملة الفعلية: دراسة نحوية تطبيقية", author: "د. أحمد محمود عبد الله", collection: "theses", supervisor: "أ.د. محمد السيد علي", subjects: ["النحو العربي", "الحذف"], keywords: ["الحذف", "الجملة الفعلية", "سيبويه"], date: 2019, department: "النحو والصرف", pages: 412, abstract: "تتناول الرسالة ظاهرة الحذف في الجملة الفعلية عند النحاة الأوائل، وتطبيقها على نصوص قرآنية وشعرية مختارة.", access: "metadata", views: 342, addedAt: "2026-10-28", rights: "حقوق الطبع للباحث والجامعة؛ متاح الوصف فقط" }),
  i({ id: "AZ-SHK-0002", title: "الصورة البيانية في شعر البارودي", author: "د. فاطمة حسن إبراهيم", collection: "research", subjects: ["البلاغة", "الشعر الحديث"], keywords: ["التشبيه", "الاستعارة", "البارودي"], date: 2022, department: "البلاغة والنقد", pages: 48, abstract: "بحث يحلل أنماط الصورة البيانية في ديوان محمود سامي البارودي ودورها في إحياء الشعر العربي.", access: "open", views: 518, addedAt: "2026-11-02", rights: "رخصة المشاع الإبداعي CC BY-NC 4.0" }),
  i({ id: "AZ-SHK-0003", title: "شرح ألفية ابن مالك (نسخة خطية)", author: "مجهول المؤلف", collection: "manuscripts", subjects: ["النحو", "المخطوطات"], keywords: ["ألفية ابن مالك", "مخطوط", "شرح"], date: 1650, department: "أصول اللغة", pages: 186, format: "صور JPG", abstract: "نسخة خطية من شرح على ألفية ابن مالك، مكتوبة بخط نسخ، محفوظة بمكتبة الكلية.", access: "open", views: 905, addedAt: "2026-09-15", rights: "ملك عام (تراث)" }),
  i({ id: "AZ-SHK-0004", title: "مدخل إلى علم الصرف", author: "أ.د. محمد السيد علي", collection: "books", subjects: ["الصرف"], keywords: ["الميزان الصرفي", "الأبنية"], date: 2018, department: "النحو والصرف", pages: 260, publisher: "دار الطباعة المحمدية", abstract: "كتاب تعليمي يعرض مبادئ علم الصرف للفرقة الأولى بأسلوب ميسر مع تدريبات.", access: "restricted", views: 1204, addedAt: "2026-08-20" }),
  i({ id: "AZ-SHK-0005", title: "أثر القراءات القرآنية في التوجيه النحوي", author: "د. محمود عبد الرحمن", collection: "faculty", subjects: ["القراءات", "النحو"], keywords: ["القراءات", "التوجيه النحوي"], date: 2021, department: "النحو والصرف", pages: 72, abstract: "دراسة لأثر اختلاف القراءات في تعدد الأوجه الإعرابية عند المفسرين.", access: "open", views: 276, addedAt: "2026-11-05", rights: "CC BY 4.0" }),
  i({ id: "AZ-SHK-0006", title: "المعجم الشعري عند أمل دنقل", author: "سارة محمد يوسف", contributors: ["آية خالد"], supervisor: "د. فاطمة حسن إبراهيم", collection: "students", subjects: ["الأدب الحديث"], keywords: ["أمل دنقل", "المعجم الشعري"], date: 2025, department: "الأدب والنقد", pages: 35, abstract: "مشروع تخرج يرصد الحقول الدلالية الغالبة في شعر أمل دنقل.", access: "restricted", views: 88, addedAt: "2026-11-06" }),
  i({ id: "AZ-SHK-0007", title: "مجلة كلية اللغة العربية بالمنوفية – العدد 38", author: "هيئة تحرير المجلة", collection: "journals", subjects: ["دوريات"], keywords: ["مجلة", "أبحاث محكمة"], date: 2024, department: "التاريخ والحضارة", pages: 620, abstract: "عدد يضم أبحاثًا محكمة في النحو والبلاغة والأدب والنقد.", access: "metadata", views: 431, addedAt: "2026-10-10" }),
  i({ id: "AZ-SHK-0008", title: "محاضرات في البلاغة: علم المعاني", author: "د. خالد عبد الحميد", collection: "lectures", subjects: ["البلاغة"], keywords: ["علم المعاني", "الخبر والإنشاء"], date: 2026, department: "البلاغة والنقد", pages: 90, abstract: "مذكرة محاضرات للفرقة الثانية في علم المعاني.", access: "open", views: 640, addedAt: "2026-11-07", rights: "للاستخدام التعليمي داخل الكلية" }),
];

export const getCollection = (slug: string) => collections.find((c) => c.slug === slug);
export const getItem = (id: string) => items.find((x) => x.id === id);

/** هل يُسمح بالتحميل؟ المفتوح للجميع، والمقيد للمسجلين فقط، والوصفي لا يُحمَّل أبدًا. */
export function canDownload(access: AccessLevel, signedIn: boolean): boolean {
  if (access === "open") return true;
  if (access === "restricted") return signedIn;
  return false;
}

/** توحيد النص العربي للبحث: حذف التشكيل والتطويل وتوحيد الألف والياء والتاء المربوطة. */
export function normalizeArabic(s: string): string {
  return s
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .toLowerCase()
    .trim();
}

export interface SearchQuery {
  q?: string | undefined;
  field?: "all" | "title" | "author" | "subject" | "keyword" | undefined;
  type?: string | undefined;
  dept?: string | undefined;
  from?: number | undefined;
  to?: number | undefined;
  sort?: "relevance" | "newest" | "oldest" | "views" | "title" | undefined;
}

export function searchItems(query: SearchQuery, list: Item[] = items): Item[] {
  const terms = normalizeArabic(query.q ?? "").split(/\s+/).filter(Boolean);
  const field = query.field ?? "all";
  const scored = list
    .filter((x) => (!query.type || x.collection === query.type) && (!query.dept || x.department === query.dept))
    .filter((x) => (!query.from || x.date >= query.from) && (!query.to || x.date <= query.to))
    .map((x) => {
      const parts: Record<string, string> = {
        title: x.title,
        author: [x.author, ...x.contributors, x.supervisor ?? ""].join(" "),
        subject: x.subjects.join(" "),
        keyword: x.keywords.join(" "),
      };
      const hay = normalizeArabic(field === "all" ? Object.values(parts).join(" ") + " " + x.abstract : (parts[field] ?? ""));
      const title = normalizeArabic(x.title);
      let score = 0;
      for (const t of terms) {
        if (!hay.includes(t)) return { x, score: -1 };
        score += title.includes(t) ? 3 : 1;
      }
      return { x, score };
    })
    .filter((r) => r.score >= 0);
  const sort = query.sort ?? "relevance";
  scored.sort((a, b) => {
    if (sort === "newest") return b.x.date - a.x.date;
    if (sort === "oldest") return a.x.date - b.x.date;
    if (sort === "views") return b.x.views - a.x.views;
    if (sort === "title") return a.x.title.localeCompare(b.x.title, "ar");
    return b.score - a.score || b.x.views - a.x.views;
  });
  return scored.map((r) => r.x);
}
