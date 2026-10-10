// Сборка «RIVA — концепция функционала.docx» из docs/concept.md (подмножество Markdown: заголовки #…####,
// абзацы, списки «- » и «1. », таблицы с |, жирный **…**). Запуск: node docs/build-concept-docx.cjs [выход.docx]
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, LevelFormat, BorderStyle, Footer, PageNumber, TabStopType,
} = require('docx');

const src = fs.readFileSync(path.join(__dirname, 'concept.md'), 'utf8').replace(/\r/g, '');
const out = process.argv[2] || path.join(__dirname, 'RIVA — концепция функционала.docx');

const FONT = 'Calibri';
const PAGE_W = 11906, MARGIN = 1134, CONTENT_W = PAGE_W - 2 * MARGIN;   // A4, поля 2 см
const GREY = 'D9D9D9', HEAD_FILL = 'F2F2F2', MUTE = '666666';

/* ---------- разбор markdown на блоки ---------- */
const lines = src.split('\n');
const blocks = [];
let i = 0;
const isTable = l => /^\|/.test(l);
const isBullet = l => /^- /.test(l);
const isNum = l => /^\d+\. /.test(l);
const isHead = l => /^#{1,4} /.test(l);
while (i < lines.length) {
  const l = lines[i];
  if (!l.trim()) { i++; continue; }
  if (isHead(l)) { const m = /^(#{1,4}) (.*)$/.exec(l); blocks.push({ t: 'h', level: m[1].length, text: m[2].trim() }); i++; continue; }
  if (isTable(l)) {
    const rows = [];
    while (i < lines.length && isTable(lines[i])) { const cells = lines[i].trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim()); if (!cells.every(c => /^-+$/.test(c))) rows.push(cells); i++; }
    blocks.push({ t: 'table', rows }); continue;
  }
  if (isBullet(l)) { const items = []; while (i < lines.length && isBullet(lines[i])) { items.push(lines[i].replace(/^- /, '').trim()); i++; } blocks.push({ t: 'ul', items }); continue; }
  if (isNum(l)) { const items = []; while (i < lines.length && isNum(lines[i])) { items.push(lines[i].replace(/^\d+\. /, '').trim()); i++; } blocks.push({ t: 'ol', items }); continue; }
  const buf = [];
  while (i < lines.length && lines[i].trim() && !isHead(lines[i]) && !isTable(lines[i]) && !isBullet(lines[i]) && !isNum(lines[i])) { buf.push(lines[i].trim()); i++; }
  blocks.push({ t: 'p', text: buf.join(' ') });
}

/* ---------- строки с жирным ---------- */
const runs = (text, opts = {}) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/).filter(Boolean);
  return parts.map(p => /^\*\*[^*]+\*\*$/.test(p) ? new TextRun({ text: p.slice(2, -2), bold: true, ...opts }) : new TextRun({ text: p, ...opts }));
};

/* ---------- нумерация списков: у каждого нумерованного списка своя ссылка, чтобы счёт начинался с 1 ---------- */
const olCount = blocks.filter(b => b.t === 'ol').length;
const numbering = {
  config: [
    { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 567, hanging: 283 } } } }] },
    ...Array.from({ length: olCount }, (_, k) => ({ reference: 'ol-' + k, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 567, hanging: 283 } } } }] })),
  ],
};

/* ---------- таблица: ширины колонок по длине текста ---------- */
const border = { style: BorderStyle.SINGLE, size: 4, color: GREY };
const borders = { top: border, bottom: border, left: border, right: border };
const table = rows => {
  const n = Math.max(...rows.map(r => r.length));
  const lens = Array.from({ length: n }, (_, c) => Math.max(6, ...rows.map(r => (r[c] || '').length)));
  const weights = lens.map(v => Math.min(v, 50) + 12);
  const sum = weights.reduce((a, b) => a + b, 0);
  let widths = weights.map(w => CONTENT_W * w / sum);
  const MIN = 1300;   // не уже 2,3 см: иначе «Производство» и коды документов переносятся по буквам
  const fixed = widths.map(w => w < MIN), fixedSum = fixed.filter(Boolean).length * MIN, freeSum = widths.filter((w, k) => !fixed[k]).reduce((a, b) => a + b, 0);
  widths = widths.map((w, k) => fixed[k] ? MIN : Math.round(w * (CONTENT_W - fixedSum) / freeSum));
  widths[n - 1] += CONTENT_W - widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((r, ri) => new TableRow({
      tableHeader: ri === 0,
      cantSplit: true,
      children: Array.from({ length: n }, (_, c) => new TableCell({
        width: { size: widths[c], type: WidthType.DXA },
        borders,
        shading: ri === 0 ? { type: ShadingType.CLEAR, fill: HEAD_FILL, color: 'auto' } : undefined,
        margins: { top: 60, bottom: 60, left: 90, right: 90 },
        children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: runs(r[c] || '', { size: 18, bold: ri === 0 }) })],
      })),
    })),
  });
};

/* ---------- документ ---------- */
let olIndex = 0;
const children = [];
blocks.forEach(b => {
  if (b.t === 'h') {
    if (b.level === 1) { children.push(new Paragraph({ children: [new TextRun({ text: b.text, bold: true, size: 44 })], spacing: { before: 0, after: 200 } })); return; }
    const lvl = { 2: HeadingLevel.HEADING_1, 3: HeadingLevel.HEADING_2, 4: HeadingLevel.HEADING_3 }[b.level];
    children.push(new Paragraph({ heading: lvl, children: [new TextRun({ text: b.text })], keepNext: true }));
    return;
  }
  if (b.t === 'p') { children.push(new Paragraph({ children: runs(b.text), spacing: { after: 120 } })); return; }
  if (b.t === 'ul') { b.items.forEach(it => children.push(new Paragraph({ children: runs(it), numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 } }))); children.push(new Paragraph({ spacing: { after: 60 }, children: [] })); return; }
  if (b.t === 'ol') { const ref = 'ol-' + olIndex++; b.items.forEach(it => children.push(new Paragraph({ children: runs(it), numbering: { reference: ref, level: 0 }, spacing: { after: 60 } }))); children.push(new Paragraph({ spacing: { after: 60 }, children: [] })); return; }
  if (b.t === 'table') { children.push(table(b.rows)); children.push(new Paragraph({ spacing: { after: 120 }, children: [] })); }
});
children.push(new Paragraph({ children: [new TextRun({ text: 'Конец документа.', color: MUTE, size: 18 })], spacing: { before: 200 } }));

const doc = new Document({
  creator: 'RIVA',
  title: 'RIVA — концепция функционала',
  numbering,
  styles: {
    default: { document: { run: { font: FONT, size: 22 }, paragraph: { spacing: { line: 276 } } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: FONT, color: '111111' }, paragraph: { spacing: { before: 360, after: 140 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, font: FONT, color: '111111' }, paragraph: { spacing: { before: 260, after: 100 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 22, bold: true, font: FONT, color: '333333' }, paragraph: { spacing: { before: 180, after: 60 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    footers: {
      default: new Footer({ children: [new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }], children: [new TextRun({ text: 'RIVA — концепция функционала · версия 1 · 11.10.2026', color: MUTE, size: 16 }), new TextRun({ text: '\tстр. ', color: MUTE, size: 16 }), new TextRun({ children: [PageNumber.CURRENT], color: MUTE, size: 16 }), new TextRun({ text: ' из ', color: MUTE, size: 16 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], color: MUTE, size: 16 })] })] }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => { fs.writeFileSync(out, buf); console.log('docx', out, buf.length, 'bytes;', blocks.length, 'blocks'); });
