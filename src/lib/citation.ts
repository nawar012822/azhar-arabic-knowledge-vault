import type { Item } from "@/data/repository";

export type CitationStyle = "apa" | "mla" | "chicago" | "harvard" | "bibtex";
export const citationLabels: Record<CitationStyle, string> = {
  apa: "APA 7", mla: "MLA 9", chicago: "Chicago", harvard: "Harvard", bibtex: "BibTeX",
};

const key = (x: Item) => x.id.replace(/[^A-Za-z0-9]/g, "");

export function cite(x: Item, style: CitationStyle, url = ""): string {
  const link = url ? ` ${url}` : "";
  switch (style) {
    case "apa": return `${x.author}. (${x.date}). ${x.title}. ${x.publisher}.${link}`;
    case "mla": return `${x.author}. ${x.title}. ${x.publisher}، ${x.date}.${link}`;
    case "chicago": return `${x.author}. ${x.title}. ${x.publisher}، ${x.date}.${link}`;
    case "harvard": return `${x.author} (${x.date}) ${x.title}. ${x.publisher}.${link}`;
    case "bibtex": return toBibTeX(x, url);
  }
}

export function toBibTeX(x: Item, url = ""): string {
  const type = x.collection === "theses" ? "phdthesis" : x.collection === "books" ? "book" : "misc";
  const f = [`  title = {${x.title}}`, `  author = {${x.author}}`, `  year = {${x.date}}`, `  publisher = {${x.publisher}}`];
  if (x.isbn) f.push(`  isbn = {${x.isbn}}`);
  if (url) f.push(`  url = {${url}}`);
  return `@${type}{${key(x)},\n${f.join(",\n")}\n}`;
}

export function toRIS(x: Item, url = ""): string {
  const ty = x.collection === "theses" ? "THES" : x.collection === "books" ? "BOOK" : x.collection === "journals" ? "JOUR" : "GEN";
  const l = [`TY  - ${ty}`, `TI  - ${x.title}`, `AU  - ${x.author}`, ...x.contributors.map((c) => `A2  - ${c}`), `PY  - ${x.date}`, `PB  - ${x.publisher}`, `LA  - ${x.language}`, `AB  - ${x.abstract}`, ...x.keywords.map((k) => `KW  - ${k}`)];
  if (x.isbn) l.push(`SN  - ${x.isbn}`);
  if (url) l.push(`UR  - ${url}`);
  l.push("ER  - ");
  return l.join("\n");
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export function toDublinCoreXML(x: Item): string {
  const el = (n: string, v?: string | number | null) => (v === undefined || v === null || v === "" ? "" : `  <dc:${n}>${esc(String(v))}</dc:${n}>\n`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:dc="http://purl.org/dc/elements/1.1/">\n${el("identifier", x.id)}${el("title", x.title)}${el("creator", x.author)}${x.contributors.map((c) => el("contributor", c)).join("")}${el("contributor", x.supervisor)}${x.subjects.map((s) => el("subject", s)).join("")}${el("description", x.abstract)}${el("date", x.date)}${el("publisher", x.publisher)}${el("type", x.collection)}${el("format", x.format)}${el("language", x.language)}${el("rights", x.rights)}</oai_dc:dc>\n`;
}

export function downloadText(filename: string, text: string, mime = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
