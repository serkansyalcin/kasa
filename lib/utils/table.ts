import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const FONT_NAME = "NotoSans";

type FontCache = { regular: string; bold: string };
let fontCache: FontCache | null = null;
let fontLoading: Promise<FontCache> | null = null;

async function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function loadFontCache(): Promise<FontCache> {
  if (fontCache) return fontCache;
  if (!fontLoading) {
    fontLoading = (async () => {
      const [regularBuf, boldBuf] = await Promise.all([
        fetch("/fonts/NotoSans-Regular.ttf").then((r) => {
          if (!r.ok) throw new Error("NotoSans Regular yüklenemedi");
          return r.arrayBuffer();
        }),
        fetch("/fonts/NotoSans-Bold.ttf").then((r) => {
          if (!r.ok) throw new Error("NotoSans Bold yüklenemedi");
          return r.arrayBuffer();
        }),
      ]);

      fontCache = {
        regular: await arrayBufferToBase64(regularBuf),
        bold: await arrayBufferToBase64(boldBuf),
      };
      return fontCache;
    })();
  }
  return fontLoading;
}

async function ensurePdfFonts(doc: jsPDF) {
  const fonts = await loadFontCache();
  doc.addFileToVFS("NotoSans-Regular.ttf", fonts.regular);
  doc.addFileToVFS("NotoSans-Bold.ttf", fonts.bold);
  doc.addFont("NotoSans-Regular.ttf", FONT_NAME, "normal");
  doc.addFont("NotoSans-Bold.ttf", FONT_NAME, "bold");
  doc.setFont(FONT_NAME, "normal");
}

/** Excel TR için UTF-8 BOM + noktalı virgül */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: string[][],
) {
  const escape = (value: string) => {
    const v = value.replace(/"/g, '""');
    return /[";\n,]/.test(v) ? `"${v}"` : v;
  };

  const lines = [
    headers.map(escape).join(";"),
    ...rows.map((row) =>
      row.map((cell) => escape(String(cell ?? ""))).join(";"),
    ),
  ];

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  triggerDownload(
    blob,
    filename.endsWith(".csv") ? filename : `${filename}.csv`,
  );
}

export async function downloadPdf(options: {
  filename: string;
  title: string;
  headers: string[];
  rows: string[][];
}) {
  const { filename, title, headers, rows } = options;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  await ensurePdfFonts(doc);

  doc.setFont(FONT_NAME, "bold");
  doc.setFontSize(14);
  doc.setTextColor(4, 81, 49);
  doc.text(title, 40, 36);

  doc.setFont(FONT_NAME, "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 124, 99);
  doc.text(
    `${new Date().toLocaleString("tr-TR")} · ${rows.length} kayıt`,
    40,
    52,
  );

  autoTable(doc, {
    startY: 64,
    head: [headers],
    body: rows,
    styles: {
      font: FONT_NAME,
      fontStyle: "normal",
      fontSize: 9,
      cellPadding: 6,
      textColor: [4, 81, 49],
    },
    headStyles: {
      font: FONT_NAME,
      fontStyle: "bold",
      fillColor: [4, 81, 49],
      textColor: [255, 246, 229],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 244],
    },
    margin: { left: 40, right: 40 },
  });

  const name = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  doc.save(name);
}

/** Gizli iframe — Türkçe için UTF-8 + Noto Sans */
export function printTable(options: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  const { title, headers, rows } = options;

  const th = headers
    .map(
      (h) =>
        `<th style="text-align:left;padding:8px 10px;border-bottom:1px solid #d4dbc8;font-size:12px;color:#6b7c63;">${escapeHtml(h)}</th>`,
    )
    .join("");

  const tr = rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell) =>
              `<td style="padding:8px 10px;border-bottom:1px solid #e8ebe3;font-size:13px;color:#045131;">${escapeHtml(cell)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @font-face {
      font-family: "NotoSansPrint";
      src: url("/fonts/NotoSans-Regular.ttf") format("truetype");
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: "NotoSansPrint";
      src: url("/fonts/NotoSans-Bold.ttf") format("truetype");
      font-weight: 700;
      font-style: normal;
    }
    body {
      font-family: "NotoSansPrint", "Segoe UI", Tahoma, Arial, sans-serif;
      margin: 24px;
      color: #045131;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    h1 { font-size: 18px; margin: 0 0 4px; font-weight: 700; }
    p { margin: 0 0 16px; color: #6b7c63; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { font-weight: 700; }
    @media print {
      body { margin: 12px; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(new Date().toLocaleString("tr-TR"))} · ${rows.length} kayıt</p>
  <table>
    <thead><tr>${th}</tr></thead>
    <tbody>${tr || `<tr><td colspan="${headers.length}">Kayıt yok</td></tr>`}</tbody>
  </table>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDoc = iframe.contentDocument || frameWindow?.document;
  if (!frameWindow || !frameDoc) {
    iframe.remove();
    return;
  }

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  const cleanup = () => {
    setTimeout(() => iframe.remove(), 1000);
  };

  const triggerPrint = () => {
    try {
      frameWindow.focus();
      frameWindow.print();
    } finally {
      cleanup();
    }
  };

  frameWindow.onafterprint = cleanup;

  const fontsReady = frameDoc.fonts?.ready ?? Promise.resolve();
  void fontsReady.then(() => setTimeout(triggerPrint, 80));
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}
