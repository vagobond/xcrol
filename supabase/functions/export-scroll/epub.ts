// deno-lint-ignore-file no-explicit-any
import { zipSync, strToU8 } from "npm:fflate@0.8.2";
import {
  type ScrollBundle,
  escapeXml,
  groupChapters,
  formatDate,
} from "./shared.ts";

const STYLE_CSS = `
@namespace epub "http://www.idpf.org/2007/ops";
body { font-family: Georgia, "Times New Roman", serif; line-height: 1.6; margin: 0 5%; }
h1.book-title { text-align: center; font-size: 2em; margin-top: 3em; }
p.subtitle { text-align: center; font-style: italic; color: #555; }
p.blurb { text-align: center; margin: 2em 1em; color: #444; }
h2.chapter { text-align: center; margin: 3em 0 2em; font-variant: small-caps; letter-spacing: 0.1em; font-weight: normal; }
h3.entry-title { font-size: 1.2em; margin-top: 2em; }
p.entry-meta { font-size: 0.85em; font-style: italic; color: #666; margin: 0 0 0.5em; }
p.entry-body { margin: 0 0 1em; white-space: pre-wrap; }
p.entry-body:first-letter { }
.cover-img { display: block; max-width: 100%; height: auto; margin: 0 auto; }
a { color: #2a4d8f; }
hr.sep { border: 0; border-top: 1px solid #ccc; margin: 2em auto; width: 30%; }
`;

function chapterXhtml(title: string, label: string, idx: number, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
<title>${escapeXml(label)}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
<section epub:type="chapter" id="chap${idx}">
<h2 class="chapter">${escapeXml(label)}</h2>
${body}
</section>
</body>
</html>`;
}

function renderItems(items: ScrollBundle["items"]): string {
  return items.map((it) => {
    const parts: string[] = [];
    if (it.custom_title) parts.push(`<h3 class="entry-title">${escapeXml(it.custom_title)}</h3>`);
    const dateStr = formatDate(it.item_date);
    if (dateStr || it.group_name) {
      const meta = [dateStr, it.group_name ? `in ${escapeXml(it.group_name)}` : ""].filter(Boolean).join(" — ");
      parts.push(`<p class="entry-meta">${meta}</p>`);
    }
    if (it.content) {
      parts.push(`<p class="entry-body">${escapeXml(it.content)}</p>`);
    }
    if (it.link) {
      const href = it.link.startsWith("http") ? it.link : `https://${it.link}`;
      parts.push(`<p><a href="${escapeXml(href)}">${escapeXml(it.link)}</a></p>`);
    }
    parts.push(`<hr class="sep"/>`);
    return parts.join("\n");
  }).join("\n");
}

export function buildEpub(bundle: ScrollBundle): Uint8Array {
  const { meta, items, cover } = bundle;
  const uuid = `urn:uuid:${meta.id}`;
  const chapters = groupChapters(items);

  const files: Record<string, [Uint8Array, { level?: 0 | 9 }?]> = {};

  // mimetype (must be first, uncompressed)
  files["mimetype"] = [strToU8("application/epub+zip"), { level: 0 }];

  // container
  files["META-INF/container.xml"] = [strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles>
<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
</rootfiles>
</container>`)];

  // style
  files["OEBPS/style.css"] = [strToU8(STYLE_CSS)];

  // cover image (optional)
  let coverManifest = "";
  let coverSpine = "";
  let coverNav = "";
  let coverMeta = "";
  if (cover) {
    const ext = cover.mime === "image/jpeg" ? "jpg" : "png";
    files[`OEBPS/cover.${ext}`] = [cover.bytes];
    files["OEBPS/cover.xhtml"] = [strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Cover</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><section epub:type="cover"><img class="cover-img" src="cover.${ext}" alt="${escapeXml(meta.title)}"/></section></body>
</html>`)];
    coverManifest = `<item id="cover-image" href="cover.${ext}" media-type="${cover.mime}" properties="cover-image"/>
<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`;
    coverSpine = `<itemref idref="cover"/>`;
    coverNav = `<li><a href="cover.xhtml">Cover</a></li>`;
    coverMeta = `<meta name="cover" content="cover-image"/>`;
  }

  // title page
  files["OEBPS/title.xhtml"] = [strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${escapeXml(meta.title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
<h1 class="book-title">${escapeXml(meta.title)}</h1>
${meta.subtitle ? `<p class="subtitle">${escapeXml(meta.subtitle)}</p>` : ""}
${meta.blurb ? `<p class="blurb">${escapeXml(meta.blurb)}</p>` : ""}
</body>
</html>`)];

  // chapters
  const chapterManifest: string[] = [];
  const chapterSpine: string[] = [];
  const chapterNav: string[] = [];
  chapters.forEach((ch, i) => {
    const filename = `chap${i + 1}.xhtml`;
    files[`OEBPS/${filename}`] = [strToU8(chapterXhtml(meta.title, ch.label, i + 1, renderItems(ch.items)))];
    chapterManifest.push(`<item id="chap${i + 1}" href="${filename}" media-type="application/xhtml+xml"/>`);
    chapterSpine.push(`<itemref idref="chap${i + 1}"/>`);
    chapterNav.push(`<li><a href="${filename}">${escapeXml(ch.label)}</a></li>`);
  });

  // nav
  files["OEBPS/nav.xhtml"] = [strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Contents</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
<nav epub:type="toc" id="toc"><h2>Contents</h2><ol>${coverNav}<li><a href="title.xhtml">Title</a></li>${chapterNav.join("")}</ol></nav>
</body>
</html>`)];

  // OPF
  const modified = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  files["OEBPS/content.opf"] = [strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId" xml:lang="en">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="BookId">${escapeXml(uuid)}</dc:identifier>
<dc:title>${escapeXml(meta.title)}</dc:title>
<dc:language>en</dc:language>
<dc:creator>XCROL Scroll</dc:creator>
<meta property="dcterms:modified">${modified}</meta>
${coverMeta}
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="style" href="style.css" media-type="text/css"/>
<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>
${coverManifest}
${chapterManifest.join("\n")}
</manifest>
<spine>
${coverSpine}
<itemref idref="title"/>
${chapterSpine.join("\n")}
</spine>
</package>`)];

  // Build the zip. fflate respects per-file level overrides.
  const zipInput: Record<string, Uint8Array | [Uint8Array, any]> = {};
  for (const [path, val] of Object.entries(files)) {
    if (val[1]) zipInput[path] = [val[0], val[1]];
    else zipInput[path] = val[0];
  }
  return zipSync(zipInput as any);
}
