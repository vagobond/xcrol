// deno-lint-ignore-file no-explicit-any
import PDFDocument from "npm:pdfkit@0.15.0";
import { Buffer } from "node:buffer";
import {
  type ScrollBundle,
  groupChapters,
  formatDate,
} from "./shared.ts";

export async function buildPdf(bundle: ScrollBundle): Promise<Uint8Array> {
  const { meta, items, cover } = bundle;
  const chapters = groupChapters(items);

  const doc = new PDFDocument({
    size: "A5",
    margins: { top: 64, bottom: 64, left: 56, right: 56 },
    info: {
      Title: meta.title,
      Author: "XCROL Scroll",
    },
    autoFirstPage: false,
  });

  const chunks: Uint8Array[] = [];
  doc.on("data", (c: Buffer) => chunks.push(new Uint8Array(c)));
  const done = new Promise<void>((resolve) => doc.on("end", () => resolve()));

  // --- Cover page ---
  doc.addPage();
  if (cover) {
    try {
      const buf = Buffer.from(cover.bytes);
      const pageW = doc.page.width;
      const pageH = doc.page.height;
      doc.image(buf, 0, 0, { fit: [pageW, pageH], align: "center", valign: "center" });
    } catch {
      drawTitleCover(doc, meta);
    }
  } else {
    drawTitleCover(doc, meta);
  }

  // --- Title page (always, even with image cover) ---
  doc.addPage();
  doc.moveDown(6);
  doc.font("Times-Bold").fontSize(22).text(meta.title, { align: "center" });
  if (meta.subtitle) {
    doc.moveDown(0.5);
    doc.font("Times-Italic").fontSize(13).fillColor("#555").text(meta.subtitle, { align: "center" });
  }
  if (meta.blurb) {
    doc.moveDown(2);
    doc.font("Times-Roman").fontSize(11).fillColor("#444").text(meta.blurb, { align: "center" });
  }
  doc.fillColor("#000");

  // Page numbers (start counting after title page)
  let pageNum = 0;
  doc.on("pageAdded", () => {
    pageNum++;
  });

  // --- Chapters ---
  chapters.forEach((ch, ci) => {
    doc.addPage();
    doc.moveDown(4);
    doc.font("Times-Roman").fontSize(10).fillColor("#888")
      .text(`Chapter ${ci + 1}`.toUpperCase(), { align: "center", characterSpacing: 2 });
    doc.moveDown(0.5);
    doc.font("Times-Bold").fontSize(18).fillColor("#000")
      .text(ch.label, { align: "center" });
    doc.moveDown(2);

    ch.items.forEach((it, idx) => {
      if (it.custom_title) {
        doc.moveDown(0.8);
        doc.font("Times-Bold").fontSize(13).fillColor("#000").text(it.custom_title);
      }
      const dateStr = formatDate(it.item_date);
      if (dateStr || it.group_name) {
        const meta2 = [dateStr, it.group_name ? `in ${it.group_name}` : ""].filter(Boolean).join(" — ");
        doc.font("Times-Italic").fontSize(9).fillColor("#777").text(meta2);
        doc.moveDown(0.3);
      }
      if (it.content) {
        doc.font("Times-Roman").fontSize(11).fillColor("#222").text(it.content, {
          align: "justify",
          lineGap: 2,
        });
      }
      if (it.link) {
        doc.moveDown(0.3);
        const href = it.link.startsWith("http") ? it.link : `https://${it.link}`;
        doc.font("Times-Italic").fontSize(9).fillColor("#2a4d8f").text(it.link, {
          link: href,
          underline: true,
        });
        doc.fillColor("#000");
      }
      if (idx < ch.items.length - 1) {
        doc.moveDown(1);
        const y = doc.y;
        const cx = doc.page.width / 2;
        doc.font("Times-Roman").fontSize(10).fillColor("#aaa").text("· · ·", cx - 20, y, { width: 40, align: "center" });
        doc.moveDown(1);
        doc.fillColor("#000");
      }
    });
  });

  // Add page numbers as a final pass
  const range = doc.bufferedPageRange();
  for (let i = 1; i < range.count; i++) {
    // skip cover (page 0) for numbering
    doc.switchToPage(range.start + i);
    const w = doc.page.width;
    const h = doc.page.height;
    doc.font("Times-Roman").fontSize(9).fillColor("#888")
      .text(String(i), 0, h - 40, { width: w, align: "center" });
  }

  doc.end();
  await done;

  // Concatenate chunks
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

function drawTitleCover(doc: any, meta: ScrollBundle["meta"]) {
  doc.moveDown(8);
  doc.font("Times-Bold").fontSize(28).fillColor("#1a1a1a")
    .text(meta.title, { align: "center" });
  if (meta.subtitle) {
    doc.moveDown(1);
    doc.font("Times-Italic").fontSize(14).fillColor("#555")
      .text(meta.subtitle, { align: "center" });
  }
  doc.fillColor("#000");
}
