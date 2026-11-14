import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { AccessLevel, Item, ItemStatus } from "@/data/repository";

export type ItemRow = Database["public"]["Tables"]["items"]["Row"];

export function rowToItem(r: ItemRow): Item {
  return {
    id: r.identifier,
    uid: r.id,
    title: r.title,
    author: r.author,
    contributors: r.contributors ?? [],
    ...(r.supervisor ? { supervisor: r.supervisor } : {}),
    subjects: r.subjects ?? [],
    keywords: r.keywords ?? [],
    date: r.date_issued,
    publisher: r.publisher,
    collection: r.collection,
    language: r.language,
    abstract: r.abstract,
    pages: r.pages,
    department: r.department,
    format: r.format,
    rights: r.rights,
    access: r.access as AccessLevel,
    views: r.views,
    downloads: r.downloads,
    addedAt: r.created_at.slice(0, 10),
    filePath: r.file_path,
    isbn: r.isbn,
    orcid: r.orcid,
    status: r.status as ItemStatus,
    reviewNote: r.review_note,
    submittedBy: r.submitted_by,
  };
}

/** المواد المنشورة فقط (ما يراه الزائر). */
export const publishedItemsQuery = queryOptions({
  queryKey: ["items", "published"],
  queryFn: async () => {
    const { data, error } = await supabase.from("items").select("*").eq("status", "approved").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToItem);
  },
});

export const itemQuery = (identifier: string) =>
  queryOptions({
    queryKey: ["items", "one", identifier],
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("*").eq("identifier", identifier).maybeSingle();
      if (error) throw error;
      return data ? rowToItem(data) : null;
    },
  });

export const departmentsList = ["النحو والصرف", "البلاغة والنقد", "الأدب والنقد", "أصول اللغة", "التاريخ والحضارة"];

/** كل المواد بكل حالاتها (للمشرفين؛ قواعد قاعدة البيانات تمنع غيرهم). */
export const allItemsQuery = queryOptions({
  queryKey: ["items", "all"],
  queryFn: async () => {
    const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToItem);
  },
});

/** مواد أودعها المستخدم بنفسه. */
export const myItemsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["items", "mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("*").eq("submitted_by", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToItem);
    },
  });

export const favoritesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("item_id, items(*)").eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).flatMap((f) => (f.items ? [rowToItem(f.items as ItemRow)] : []));
    },
  });

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
