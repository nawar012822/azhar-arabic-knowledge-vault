import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bookmark, Check, Copy, Download, Eye, Quote, Share2 } from "lucide-react";
import { toast } from "sonner";
import { canDownload, type Item } from "@/data/repository";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cite, citationLabels, downloadText, toBibTeX, toDublinCoreXML, toRIS, type CitationStyle } from "@/lib/citation";
import { deliverFile } from "@/lib/download";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PdfReader } from "@/components/site/PdfReader";

function FilePreview({ blob, filename }: { blob: Blob; filename: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(blob); setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  if (/\.pdf$/i.test(filename)) return <PdfReader blob={blob} />;
  if (/\.(jpg|jpeg|png)$/i.test(filename)) return <img src={url} alt={filename} className="mx-auto max-h-[65vh] max-w-full object-contain" />;
  if (/\.mp3$/i.test(filename)) return <audio src={url} controls className="w-full" />;
  if (/\.mp4$/i.test(filename)) return <video src={url} controls className="max-h-[65vh] w-full" />;
  return <p className="py-8 text-center text-muted-foreground">هذا النوع متاح للتحميل فقط.</p>;
}

export function ItemTools({ item }: { item: Item }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const allowed = canDownload(item.access, Boolean(user));
  const uid = item.uid;
  const [viewer, setViewer] = useState(false);
  const [citation, setCitation] = useState(false);
  const [style, setStyle] = useState<CitationStyle>("apa");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => { setUrl(window.location.href); }, [item.id]);
  const file = useQuery({
    queryKey: ["item-file", uid, item.filePath, item.access, user?.id ?? "public"],
    enabled: allowed && Boolean(item.filePath),
    staleTime: 60_000,
    queryFn: async () => {
      if (!item.filePath || !canDownload(item.access, Boolean(user))) throw new Error("الملف غير متاح.");
      const { data, error } = await supabase.storage.from("files").download(item.filePath);
      if (error) throw error;
      return data;
    },
  });
  const favorite = useQuery({
    queryKey: ["favorite", user?.id, uid],
    enabled: Boolean(user && uid),
    queryFn: async () => {
      if (!user || !uid) return false;
      const { data, error } = await supabase.from("favorites").select("item_id").eq("user_id", user.id).eq("item_id", uid).maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });
  const toggle = useMutation({
    mutationFn: async () => {
      if (!user || !uid) return;
      const result = favorite.data
        ? await supabase.from("favorites").delete().eq("user_id", user.id).eq("item_id", uid)
        : await supabase.from("favorites").insert({ user_id: user.id, item_id: uid });
      if (result.error) throw result.error;
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["favorite", user?.id, uid] }); void qc.invalidateQueries({ queryKey: ["favorites", user?.id] }); },
    onError: () => toast.error("تعذر تحديث المفضلة."),
  });
  const filename = `${item.id}.${item.filePath?.split(".").pop() ?? "pdf"}`;
  const download = async () => {
    if (!allowed || !file.data) return;
    try {
      await deliverFile(file.data, filename);
      if (uid) await supabase.rpc("bump_item", { _id: uid, _kind: "download" });
      void qc.invalidateQueries({ queryKey: ["items"] });
    } catch { toast.error("تعذر تحميل الملف. حاول مرة أخرى."); }
  };
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { toast.error("تعذر النسخ تلقائيًا؛ يمكنك تحديد النص ونسخه."); }
  };
  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        <Button disabled={!allowed || !file.data} onClick={() => setViewer(true)}><Eye />عرض الملف</Button>
        <Button variant="outline" disabled={!allowed || !file.data} onClick={download}><Download />تحميل الملف</Button>
        {user ? <Button variant="outline" disabled={!uid || favorite.isLoading || toggle.isPending} aria-pressed={Boolean(favorite.data)} onClick={() => toggle.mutate()}><Bookmark />{favorite.data ? "إزالة من المفضلة" : "إضافة للمفضلة ☆"}</Button> : <Button asChild variant="outline"><Link to="/auth" search={{ redirect: `/items/${item.id}` }}><Bookmark />إضافة للمفضلة ☆</Link></Button>}
        <Button variant="outline" onClick={() => setCitation(true)}><Quote />الاستشهاد والتصدير</Button>
        <Button variant="ghost" onClick={() => copy(url)}><Share2 />{copied ? "تم النسخ" : "مشاركة الرابط"}</Button>
      </div>
      {!allowed && <p className="mt-3 text-sm text-muted-foreground">{item.access === "metadata" ? "هذه المادة متاحة كبيانات وصفية فقط احترامًا لحقوق المؤلف." : <>العرض والتحميل للمستخدمين المسجلين فقط. <Link to="/auth" search={{ redirect: `/items/${item.id}` }} className="text-primary underline">تسجيل الدخول</Link></>}</p>}
      {allowed && !item.filePath && <p className="mt-3 text-sm text-muted-foreground">لم يُرفق ملف لهذه المادة بعد.</p>}
      {allowed && file.isFetching && <p role="status" className="mt-3 text-sm text-muted-foreground">جارٍ تجهيز الملف...</p>}
      {allowed && file.isError && <div className="mt-3 flex items-center gap-2 text-sm text-destructive">تعذر تجهيز الملف.<Button variant="outline" size="sm" onClick={() => void file.refetch()}>إعادة المحاولة</Button></div>}
      <Dialog open={viewer && allowed} onOpenChange={setViewer}>
        <DialogContent dir="rtl" className="max-h-[90vh] max-w-[min(95vw,900px)] overflow-y-auto">
          <DialogTitle className="pe-6 text-start leading-7">{item.title}</DialogTitle>
          <DialogDescription className="text-start">{item.author}</DialogDescription>
          {file.data && <FilePreview blob={file.data} filename={filename} />}
          <Button variant="outline" disabled={!file.data} onClick={download}><Download />تحميل الملف</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={citation} onOpenChange={setCitation}>
        <DialogContent dir="rtl" className="max-h-[90vh] max-w-[min(95vw,700px)] overflow-y-auto">
          <DialogTitle className="pe-6 text-start">الاستشهاد والتصدير</DialogTitle>
          <DialogDescription className="text-start">{item.title}</DialogDescription>
          <label className="space-y-2 text-sm">نمط الاستشهاد<select aria-label="نمط الاستشهاد" className="mt-2 h-10 w-full rounded-md border bg-background px-3" value={style} onChange={(e) => setStyle(e.target.value as CitationStyle)}>{Object.entries(citationLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <p dir={style === "bibtex" ? "ltr" : "rtl"} className="whitespace-pre-wrap break-words rounded-md bg-muted p-4 text-sm leading-7">{cite(item, style, url)}</p>
          <Button variant="outline" onClick={() => copy(cite(item, style, url))}>{copied ? <Check /> : <Copy />}{copied ? "تم النسخ" : "نسخ الاستشهاد"}</Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => downloadText(`${item.id}.ris`, toRIS(item, url), "application/x-research-info-systems")}><Download />RIS</Button>
            <Button variant="outline" onClick={() => downloadText(`${item.id}.bib`, toBibTeX(item, url), "application/x-bibtex")}><Download />BibTeX</Button>
            <Button variant="outline" onClick={() => downloadText(`${item.id}.xml`, toDublinCoreXML(item), "application/xml")}><Download />Dublin Core XML</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}