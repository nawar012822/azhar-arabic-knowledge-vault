import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "@/components/ui/button";

export function PdfReader({ blob }: { blob: Blob }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    let disposed = false;
    let task: ReturnType<typeof import("pdfjs-dist")["getDocument"]> | undefined;
    void (async () => {
      const [lib, worker] = await Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url")]);
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      const data = new Uint8Array(await blob.arrayBuffer());
      if (disposed) return;
      task = lib.getDocument({ data });
      const doc = await task.promise;
      if (!disposed) setPdf(doc);
    })().catch(() => { if (!disposed) { setError("تعذر عرض PDF. يمكنك تحميل الملف بدلًا من ذلك."); setBusy(false); } });
    return () => { disposed = true; void task?.destroy(); };
  }, [blob]);
  useEffect(() => {
    if (!pdf) return;
    let disposed = false;
    let render: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]> | undefined;
    setBusy(true);
    void (async () => {
      const sheet = await pdf.getPage(page);
      const el = canvas.current;
      const context = el?.getContext("2d");
      if (disposed || !el || !context) return;
      const base = sheet.getViewport({ scale: 1 });
      const width = Math.max(200, (frame.current?.clientWidth ?? 700) - 24);
      const viewport = sheet.getViewport({ scale: width / base.width * zoom });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.floor(viewport.width * ratio);
      el.height = Math.floor(viewport.height * ratio);
      el.style.width = `${viewport.width}px`;
      el.style.height = `${viewport.height}px`;
      render = sheet.render({ canvas: el, canvasContext: context, viewport, transform: [ratio, 0, 0, ratio, 0, 0] });
      await render.promise;
      if (!disposed) setBusy(false);
    })().catch(() => { if (!disposed) { setError("تعذر عرض هذه الصفحة."); setBusy(false); } });
    return () => { disposed = true; render?.cancel(); };
  }, [pdf, page, zoom]);
  return (
    <div className="min-w-0" dir="rtl">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" size="icon" title="الصفحة السابقة" aria-label="الصفحة السابقة" disabled={page <= 1 || busy} onClick={() => setPage(page - 1)}><ChevronRight /></Button>
        <span className="min-w-24 text-center text-sm">{page} / {pdf?.numPages ?? "…"}</span>
        <Button variant="outline" size="icon" title="الصفحة التالية" aria-label="الصفحة التالية" disabled={!pdf || page >= pdf.numPages || busy} onClick={() => setPage(page + 1)}><ChevronLeft /></Button>
        <Button variant="ghost" size="icon" title="تصغير" aria-label="تصغير" disabled={zoom <= 0.5 || busy} onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}><ZoomOut /></Button>
        <Button variant="ghost" size="icon" title="تكبير" aria-label="تكبير" disabled={zoom >= 2 || busy} onClick={() => setZoom(Math.min(2, zoom + 0.25))}><ZoomIn /></Button>
      </div>
      {error && <p role="alert" className="p-3 text-destructive">{error}</p>}
      {busy && <p role="status" className="p-2 text-center text-sm text-muted-foreground">جارٍ عرض الصفحة...</p>}
      <div ref={frame} className="max-h-[65vh] overflow-auto bg-muted p-3" dir="ltr"><canvas ref={canvas} className="mx-auto" aria-label={`صفحة PDF ${page}`} /></div>
    </div>
  );
}