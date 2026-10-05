/* ============================================================
   Иконки, помощники, компоненты, раскрытие с блюр-фокусом, чат.
   ============================================================ */

const ICONS = {
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  wh: '<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/><rect width="12" height="12" x="6" y="10"/>',
  factory: '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  money: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  idcard: '<path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  filter: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
  pkg: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  panel: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>',
  layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  cal: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  clip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  edit: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
};
const icRaw = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const ic = (n, cls = '') => {
  if (typeof GLASS !== 'undefined' && GLASS[n] && !GLYPHS.has(n)) return glassIcon(n, themeVar(), /\bxs\b/.test(cls) ? 'xs' : /\bsm\b/.test(cls) ? 'sm' : 'md', cls.replace(/\b(xs|sm)\b/g, ''));
  return icRaw(n, cls);
};

/* «Стеклянные» иконки (приём из образцов -51/-52/X-2): сзади фигура с тёмным
   градиентом, спереди вторая фигура из матового стекла — под ней задняя фигура
   размыта и подсвечена, по краю тонкий блик, снизу мягкая тень. Сетка 48×48.
   Общие градиенты и фильтр лежат в скрытом svg в теле страницы (#gi-back, #gi-glass, #gi-blur). */
const GLASS = {
  truck: {
    back: '<rect x="3" y="10" width="27" height="22" rx="5"/><circle cx="13" cy="38" r="4.5"/><circle cx="35" cy="38" r="4.5"/>',
    front: '<path d="M25 19h9.5a4 4 0 0 1 3.4 1.9l4.5 7.3a3 3 0 0 1 .4 1.6V35a3 3 0 0 1-3 3H25a3 3 0 0 1-3-3V22a3 3 0 0 1 3-3z"/>',
    extra: '<path d="M28 24h6l3 5h-9z" fill="var(--ico-edge)" opacity=".55"/>',
  },
  wh: {
    back: '<path d="M22.5 5.4a3 3 0 0 1 3 0l16 9.2A3 3 0 0 1 43 17.2V38a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V17.2a3 3 0 0 1 1.5-2.6z"/>',
    front: '<rect x="17" y="30" width="24" height="14" rx="4"/><rect x="21" y="18" width="16" height="12" rx="4"/>',
  },
  factory: {
    back: '<path d="M7 42a3 3 0 0 1-3-3V16a3 3 0 0 1 4.7-2.5L18 19.5V16a3 3 0 0 1 4.7-2.5L32 19.5V9a3 3 0 0 1 3-3h5a3 3 0 0 1 3 3v30a3 3 0 0 1-3 3z"/>',
    front: '<rect x="19" y="24" width="24" height="20" rx="5"/>',
    extra: '<path d="M25 31h5M25 36h9" fill="none" stroke="var(--ico-edge)" stroke-width="1.6" stroke-linecap="round"/>',
  },
  tag: {
    back: '<path d="M9 17h22a3 3 0 0 1 3 3l-1.4 18.3a4 4 0 0 1-4 3.7H11.4a4 4 0 0 1-4-3.7L6 20a3 3 0 0 1 3-3z"/><path d="M14 17v-4.5a6 6 0 0 1 12 0V17" fill="none" stroke="url(#gi-back)" stroke-width="3" stroke-linecap="round"/>',
    front: '<path d="M22 25h17a3 3 0 0 1 3 3l-1 12.3a4 4 0 0 1-4 3.7H24a4 4 0 0 1-4-3.7L19 28a3 3 0 0 1 3-3z"/>',
    extra: '<path d="M26 25v-2.5a4.5 4.5 0 0 1 9 0V25" fill="none" stroke="var(--ico-edge)" stroke-width="2.2" stroke-linecap="round"/>',
  },
  users: {
    back: '<circle cx="18" cy="14" r="8"/><path d="M4 40a14 14 0 0 1 28 0 3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/>',
    front: '<circle cx="33" cy="21" r="6.5"/><path d="M21 43.5a12 12 0 0 1 24 0 2.5 2.5 0 0 1-2.5 2.5h-19a2.5 2.5 0 0 1-2.5-2.5z"/>',
  },
  money: {
    back: '<path fill-rule="evenodd" d="M7 11h25a4 4 0 0 1 4 4v13a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V15a4 4 0 0 1 4-4zm12.5 5.5a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>',
    front: '<circle cx="33" cy="32" r="11"/>',
    extra: '<circle cx="33" cy="32" r="6" fill="none" stroke="var(--ico-edge)" stroke-width="1.6"/>',
  },
  idcard: {
    back: '<path fill-rule="evenodd" d="M8 8h27a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4zm7 6a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm9 2h9.5v3H24zm0 6h9.5v3H24z"/>',
    front: '<rect x="19" y="24" width="24" height="19" rx="5"/>',
    extra: '<circle cx="27" cy="31.5" r="3" fill="none" stroke="var(--ico-edge)" stroke-width="1.6"/><path d="M33 30h6M33 34h5" fill="none" stroke="var(--ico-edge)" stroke-width="1.6" stroke-linecap="round"/><path d="M22 39h18" fill="none" stroke="var(--ico-edge)" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>',
  },
};
/* Два варианта: n — тёмная фигура и белое стекло (на белой плитке), i — светлая фигура и дымчатое стекло (на тёмной рамке) */
/* шестерёнка: многоугольник с зубьями и отверстием */
const gearPath = (cx, cy, ro, ri, n, hole) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, st = Math.PI * 2 / n;
    [[ri, a0 - st * .24], [ro, a0 - st * .13], [ro, a0 + st * .13], [ri, a0 + st * .24]].forEach(([r, t], k) => {
      d += (i === 0 && k === 0 ? 'M' : 'L') + (cx + r * Math.cos(t)).toFixed(2) + ' ' + (cy + r * Math.sin(t)).toFixed(2) + ' ';
    });
  }
  return `<path fill-rule="evenodd" d="${d}Z M${cx + hole} ${cy} a${hole} ${hole} 0 1 0 ${-2 * hole} 0 a${hole} ${hole} 0 1 0 ${2 * hole} 0 Z"/>`;
};
Object.assign(GLASS, {
  box: { back: '<rect x="6" y="15" width="36" height="29" rx="6"/>', front: '<path d="M4 11a4 4 0 0 1 4-4h32a4 4 0 0 1 4 4v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>', extra: '<rect x="21" y="27" width="6" height="17" rx="3" fill="var(--ico-edge)" opacity=".45"/>' },
  search: { back: '<path fill-rule="evenodd" d="M20 5a15 15 0 1 1 0 30 15 15 0 0 1 0-30zm0 6a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"/><rect x="32" y="27" width="8" height="19" rx="4" transform="rotate(-45 36 36.5)"/>', front: '<circle cx="20" cy="20" r="9.5"/>' },
  bell: { back: '<path d="M24 4a13 13 0 0 1 13 13v8l4.2 6.3A2.5 2.5 0 0 1 39 35H9a2.5 2.5 0 0 1-2.2-3.7L11 25v-8A13 13 0 0 1 24 4z"/><circle cx="24" cy="40.5" r="4.5"/>', front: '<rect x="11" y="26" width="26" height="12" rx="6"/>' },
  chat: { back: '<path d="M5 14a8 8 0 0 1 8-8h16a8 8 0 0 1 8 8v7a8 8 0 0 1-8 8H16l-7.3 5.9A1.5 1.5 0 0 1 6.3 33.7L7 29.2A8 8 0 0 1 5 23z"/>', front: '<path d="M18 25a6 6 0 0 1 6-6h13a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6h-2.5v4.3a1.2 1.2 0 0 1-2 .9L27 37h-3a6 6 0 0 1-6-6z"/>' },
  plus: { back: '<rect x="18.5" y="5" width="11" height="38" rx="5.5"/>', front: '<rect x="5" y="18.5" width="38" height="11" rx="5.5"/>' },
  building: { back: '<path fill-rule="evenodd" d="M12 4h18a4 4 0 0 1 4 4v34H8V8a4 4 0 0 1 4-4zm3 7v4h4v-4zm8 0v4h4v-4zm-8 8v4h4v-4zm8 0v4h4v-4z"/>', front: '<rect x="24" y="19" width="19" height="25" rx="4"/>', extra: '<path d="M29 25h3M35 25h3M29 31h3M35 31h3" fill="none" stroke="var(--ico-edge)" stroke-width="1.6" stroke-linecap="round"/>' },
  layers: { back: '<rect x="12" y="16" width="24" height="24" rx="6" transform="rotate(45 24 28)"/>', front: '<rect x="13" y="7" width="22" height="22" rx="6" transform="rotate(45 24 18)"/>' },
  filter: { back: '<rect x="5" y="10" width="38" height="6" rx="3"/><rect x="5" y="21" width="38" height="6" rx="3"/><rect x="5" y="32" width="38" height="6" rx="3"/>', front: '<circle cx="17" cy="13" r="5.5"/><circle cx="31" cy="24" r="5.5"/><circle cx="21" cy="35" r="5.5"/>' },
  cal: { back: '<rect x="5" y="8" width="38" height="36" rx="7"/><rect x="13" y="3" width="5" height="10" rx="2.5"/><rect x="30" y="3" width="5" height="10" rx="2.5"/>', front: '<path d="M5 20h38v17a7 7 0 0 1-7 7H12a7 7 0 0 1-7-7z"/>', extra: '<path d="M14 29h6M24 29h6M34 29h4M14 36h6M24 36h6" fill="none" stroke="var(--ico-edge)" stroke-width="1.6" stroke-linecap="round"/>' },
  gear: { back: gearPath(24, 24, 20, 15, 8, 7), front: '<circle cx="24" cy="24" r="8.5"/>' },
  file: { back: '<path d="M10 4h14l10 10v22a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z"/>', front: '<rect x="19" y="18" width="23" height="26" rx="5"/>', extra: '<path d="M24 27h12M24 33h9" fill="none" stroke="var(--ico-edge)" stroke-width="1.6" stroke-linecap="round"/>' },
  pin: { back: '<path d="M24 3a15 15 0 0 1 15 15c0 9-10 19.6-13.6 23.1a2 2 0 0 1-2.8 0C19 37.6 9 27 9 18A15 15 0 0 1 24 3z"/>', front: '<circle cx="24" cy="18" r="8"/>' },
  phone: { back: '<path fill-rule="evenodd" d="M18 3h12a6 6 0 0 1 6 6v30a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6zm3 4a1.5 1.5 0 1 0 0 3h6a1.5 1.5 0 1 0 0-3z"/>', front: '<rect x="20" y="20" width="22" height="22" rx="6"/>', extra: '<path d="M26 31h10M31 26v10" fill="none" stroke="var(--ico-edge)" stroke-width="1.8" stroke-linecap="round"/>' },
  mail: { back: '<rect x="4" y="9" width="40" height="30" rx="6"/>', front: '<path d="M6 13.5 24 27l18-13.5v5L25.2 31a2 2 0 0 1-2.4 0L6 18.5z"/>' },
  edit: { back: '<path d="M31 5a4 4 0 0 1 5.7 0l6.3 6.3a4 4 0 0 1 0 5.7L21 39l-11 3 3-11z"/>', front: '<rect x="4" y="22" width="22" height="22" rx="6"/>' },
  shield: { back: '<path d="M24 4l16 6v12c0 10-6.5 17.5-16 22C14.5 39.5 8 32 8 22V10z"/>', front: '<rect x="15" y="17" width="18" height="16" rx="5"/>', extra: '<path d="M20 25l3 3 6-6" fill="none" stroke="var(--ico-edge)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' },
  clip: { back: '<rect x="9" y="5" width="26" height="34" rx="6"/>', front: '<rect x="25" y="12" width="12" height="32" rx="6"/>' },
  send: { back: '<path d="M7 20.5 40.5 5.5a2 2 0 0 1 2.7 2.4L33 41a2 2 0 0 1-3.6.6L22 31 7.6 24.2a2 2 0 0 1-.6-3.7z"/>', front: '<path d="M22 31 42 7.5 33 41a2 2 0 0 1-3.6.6z"/>' },
  sun: { back: '<g><rect x="21.5" y="3" width="5" height="9" rx="2.5"/><rect x="21.5" y="36" width="5" height="9" rx="2.5"/><rect x="3" y="21.5" width="9" height="5" rx="2.5"/><rect x="36" y="21.5" width="9" height="5" rx="2.5"/></g><g transform="rotate(45 24 24)"><rect x="21.5" y="3" width="5" height="9" rx="2.5"/><rect x="21.5" y="36" width="5" height="9" rx="2.5"/><rect x="3" y="21.5" width="9" height="5" rx="2.5"/><rect x="36" y="21.5" width="9" height="5" rx="2.5"/></g><circle cx="24" cy="24" r="9"/>', front: '<circle cx="24" cy="24" r="10"/>' },
  moon: { back: '<path fill-rule="evenodd" d="M27 4a20 20 0 1 0 17 30A16 16 0 0 1 27 4z"/>', front: '<circle cx="31" cy="15" r="6.5"/>' },
  clock: { back: '<circle cx="24" cy="24" r="19"/>', front: '<circle cx="24" cy="24" r="11"/>', extra: '<path d="M24 18v6.5l4.5 3" fill="none" stroke="var(--ico-edge)" stroke-width="2" stroke-linecap="round"/>' },
  alert: { back: '<path d="M21.4 6.5a3 3 0 0 1 5.2 0l16.4 28A3 3 0 0 1 40.4 39H7.6A3 3 0 0 1 5 34.5z"/>', front: '<rect x="20.5" y="14" width="7" height="13" rx="3.5"/><circle cx="24" cy="33" r="3.5"/>' },
  user: { back: '<circle cx="24" cy="14" r="9"/><path d="M6 42a18 18 0 0 1 36 0 3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z"/>', front: '<path d="M14 45a10 10 0 0 1 20 0z"/><circle cx="33" cy="20" r="6"/>' },
});
GLASS.wrench = GLASS.gear;
const GLYPHS = new Set(['down', 'up', 'right', 'check', 'x', 'more', 'loader', 'arrow', 'panel']);
const themeVar = () => document.documentElement.dataset.theme === 'dark' ? 'i' : 'n';
const themeInv = () => themeVar() === 'n' ? 'i' : 'n';

const GLASS_VAR = {
  n: { back: 'gi-back', glass: 'gi-glass', edge: 'rgba(255,255,255,.9)', shadow: 'rgba(0,0,0,.22)' },
  i: { back: 'gi-back-i', glass: 'gi-glass-i', edge: 'rgba(255,255,255,.42)', shadow: 'rgba(0,0,0,.6)' },
};
const glassIcon = (name, variant = 'n', size = '', cls = '') => {
  const g = GLASS[name]; if (!g) return ic(name, cls);
  const v = GLASS_VAR[variant] || GLASS_VAR.n, back = g.back.replace(/url\(#gi-back\)/g, `url(#${v.back})`);
  const lite = size === 'xs';   // мелкие — без размытия и тени, иначе сотни фильтров на странице
  return `<svg class="gi ${size} ${cls}" viewBox="0 0 48 48" aria-hidden="true" style="--ico-edge:${v.edge}">
    <defs><clipPath id="gc-${name}-${variant}">${g.front}</clipPath></defs>
    <g fill="url(#${v.back})">${back}</g>
    ${lite ? '' : `<g fill="${v.shadow}" filter="url(#gi-soft)" transform="translate(0 2.2)">${g.front}</g>`}
    <g clip-path="url(#gc-${name}-${variant})">
      <rect width="48" height="48" fill="currentColor"/>
      <g fill="url(#${v.back})" ${lite ? '' : 'filter="url(#gi-blur)"'}>${back}</g>
      <rect width="48" height="48" fill="url(#${v.glass})"/>
      <g fill="none" stroke="var(--ico-edge)" stroke-width="2">${g.front}</g>
    </g>
    ${g.extra || ''}
  </svg>`;
};

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const initials = name => name.split(' ').slice(0, 2).map(w => w[0]).join('');
const shortName = name => { const [f, n] = name.split(' '); return n ? `${f} ${n[0]}.` : f; };
const av = (p, cls = '') => `<span class="av ${cls}" title="${esc(p.name)}">${initials(p.name)}${p.on ? '<i class="on"></i>' : ''}</span>`;
const avs = (list, max = 4) => {
  const shown = list.slice(0, max), rest = list.length - shown.length;
  return `<span class="avs">${shown.map(p => av(p)).join('')}${rest > 0 ? `<span class="av more">+${rest}</span>` : ''}</span>`;
};
const chipDir = (id, cls = '') => id === 'all'
  ? `<span class="chip all ${cls}">${ic('layers', 'xs')}Все направления</span>`
  : `<span class="chip dir ${cls}"><span class="dk">${DIR[id].k}</span>${DIR[id].short}</span>`;
const chipDirs = dirs => dirs === 'all' ? chipDir('all') : dirs.map(d => chipDir(d)).join(' ');
const ticks = (n, total, cls = '') => `<span class="ticks ${cls}" title="${n} из ${total}">${Array.from({ length: total }, (_, i) => `<i class="${i < n ? 'on' : ''}" style="--j:${i}"></i>`).join('')}</span>`;
const dot = cls => `<span class="dot ${cls}"></span>`;
const nowTime = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
const todayStr = () => new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

/* иконки доступа к страницам: full — чётко, view — приглушённо, нет — почти прозрачно */
const pageIcons = role => `<span class="pg-ics">${PAGES.map(p => {
  const a = ROLES[role].pages[p.id];
  const cls = a === 'full' ? '' : a === 'view' ? 'view' : 'no';
  return `<span class="${cls}" title="${p.name}: ${a === 'full' ? 'работа' : a === 'view' ? 'просмотр' : 'нет доступа'}">${ic(p.icon, 'xs')}</span>`;
}).join('')}</span>`;

/* модуль: поверхность сверху, подпись (название + описание) снизу */
const mod = ({ span = 12, cls = '', body, title, sub = '', acts = '', tight = false, id = '' }) =>
  `<section class="mod span-${span} ${cls}" ${id ? `id="${id}"` : ''}>
    <div class="mod-surface ${tight ? 'tight' : ''}">${body}</div>
    <div class="mod-cap"><div><div class="t">${title}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>${acts ? `<div class="acts">${acts}</div>` : ''}</div>
  </section>`;

/* раскрывающийся элемент: заголовок в потоке, панель — поверх соседей */
const xp = ({ id, head, panel, place = 'over', cls = '', headCls = '', data = '' }) =>
  `<div class="xp ${cls}" data-xp="${id}" ${data}><div class="xp-head ${headCls}" data-xp-toggle>${head}</div><div class="xp-panel ${place}">${panel}</div></div>`;

/* ---------- раскрытие поверх соседей и блюр-фокус ---------- */
const XP = {
  stack: [],   // раскрытые элементы, вложенные — выше в стеке (чат → список участников)
  frame: null, veil: null,
  get open() { return this.stack[this.stack.length - 1] || null; },
  init() {
    this.frame = document.querySelector('.frame');
    this.veil = document.querySelector('.veil');
    this.veil.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
    document.addEventListener('scroll', () => { if (this.open) this.focus(); }, true);
    window.addEventListener('resize', () => { if (this.open) this.focus(); });
  },
  toggle(el) { this.stack.includes(el) ? this.closeTo(el) : this.show(el); },
  panelOf(el) { return el.querySelector(':scope > .xp-panel'); },
  show(el) {
    if (this.open && !this.open.contains(el)) this.closeAll();
    el._closeToken = null; el.classList.remove('closing');
    this.stack.push(el); el.classList.add('open');
    this.reveal(this.panelOf(el));
    this.focus();
  },
  /* закрывает верхний раскрытый элемент: панель прячется по завершению анимации ухода, не по таймеру; вуаль переходит к нижележащему или гаснет */
  close() {
    const el = this.stack.pop(); if (!el) return;
    const token = el._closeToken = {};
    const finish = () => { if (el._closeToken === token) el.classList.remove('open', 'closing'); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
    else {
      el.classList.add('closing');
      const anims = this.panelOf(el).getAnimations();
      if (!anims.length) finish(); else { Promise.allSettled(anims.map(a => a.finished)).then(finish); setTimeout(finish, 600); }
    }
    if (this.open) this.focus(); else this.veil.classList.remove('on');
  },
  closeAll() { while (this.stack.length) this.close(); },
  closeTo(el) { while (this.stack.length && this.open !== el) this.close(); this.close(); },
  /* прямоугольник элемента по раскладке, без transform: на первых кадрах анимация появления сдвигает элемент, и getBoundingClientRect врёт */
  layoutRect(el) {
    let x = 0, y = 0;
    for (let n = el; n && n !== this.frame; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; const p = n.offsetParent; if (p && p !== this.frame) { x += p.clientLeft; y += p.clientTop; } }
    for (let n = el.parentElement; n && n !== this.frame; n = n.parentElement) { x -= n.scrollLeft; y -= n.scrollTop; }
    const fr = this.frame.getBoundingClientRect();
    return { left: fr.left + x, top: fr.top + y, width: el.offsetWidth, height: el.offsetHeight };
  },
  /* показать панель в ближайшем прокручиваемом контейнере (overflow auto/scroll); контейнеры с clip/hidden не трогаем —
     scrollIntoView прокручивал бы и их, сдвигая всю страницу */
  reveal(panel) {
    let sc = panel.parentElement;
    while (sc && sc !== document.body && !/auto|scroll/.test(getComputedStyle(sc).overflowY)) sc = sc.parentElement;
    if (!sc || sc === document.body) return;
    const r = this.layoutRect(panel), c = sc.getBoundingClientRect(), pad = 8, h = sc.clientHeight;
    const top = r.top - (c.top + sc.clientTop), bottom = top + r.height;
    let dy = 0;
    if (bottom > h - pad) dy = bottom - (h - pad);
    if (top - dy < pad) dy = top - pad;
    if (Math.abs(dy) > .5) sc.scrollBy({ top: dy, behavior: 'smooth' });
  },
  /* маска: полный блюр у границ раскрытой панели, затухание с удалением; геометрия по раскладке */
  focus() {
    const panel = this.panelOf(this.open);
    const fr = this.frame.getBoundingClientRect(), r = this.layoutRect(panel);
    const cx = r.left + r.width / 2 - fr.left, cy = r.top + r.height / 2 - fr.top;
    const rx = r.width / 2 + 320, ry = r.height / 2 + 260;
    const g = `radial-gradient(ellipse ${rx}px ${ry}px at ${cx}px ${cy}px, #000 34%, rgba(0,0,0,.6) 60%, transparent 100%)`;
    this.veil.style.webkitMaskImage = g; this.veil.style.maskImage = g;
    this.veil.classList.add('on');
  },
};

/* ---------- чат страницы ---------- */
const CHAT = {
  state: {},   // pageId → { msgs, replied, typing }
  get(pageId) {
    if (!this.state[pageId]) this.state[pageId] = { msgs: (CHATS[pageId] || CHATS.generic).map(m => ({ ...m })), replied: false, typing: false };
    return this.state[pageId];
  },
  members(pageId) { return STAFF.filter(s => ROLES[s.role].pages[pageId]); },
  /* список сообщений; from — с какого анимировать появление: при открытии чата каскадом идут все, после отправки — только новое */
  msgsHtml(pageId, from = 0) {
    const st = this.get(pageId);
    const msgs = st.msgs.map((m, i) => {
      const p = BY_ID[m.who], me = p.me;
      return `<div class="msg ${i >= from ? 'ani' : ''} ${me ? 'me' : ''}" style="--i:${Math.min(Math.max(i - from, 0), 12)}">${me ? '' : av(p)}<div class="msg-b"><div class="msg-meta"><span>${me ? 'Вы' : shortName(p.name)}</span><span>${m.t}</span></div><div class="msg-t">${esc(m.text)}</div></div></div>`;
    }).join('');
    return `<div class="msg sys"><div class="msg-t">Сегодня, ${todayStr()}</div></div>${msgs}${st.typing ? `<div class="typing">${shortName(BY_ID[REPLIES[pageId]?.who || 1].name)} печатает <i></i><i></i><i></i></div>` : ''}`;
  },
  /* обновить только список: пересборка всей панели заново проигрывала её появление — чат дёргался при каждой отправке */
  refresh(pageId, from) {
    if (App.state.page !== pageId) return;   // ответ пришёл, когда открыта другая страница: покажется при следующем открытии чата
    const m = document.getElementById('chat-msgs'); if (!m) return;
    m.innerHTML = this.msgsHtml(pageId, from);
    m.scrollTo({ top: m.scrollHeight, behavior: 'smooth' });
  },
  render(pageId) {
    const page = PAGES.find(p => p.id === pageId);
    const st = this.get(pageId), members = this.members(pageId), online = members.filter(m => m.on);
    const membersPanel = `<div class="ph"><span class="t">Участники чата</span><span class="mute small">${members.length} · доступ к странице «${page.name}»</span><button class="btn ghost sm icon" data-xp-close style="margin-left:auto">${ic('x', 'sm')}</button></div>
      <div class="pb" style="max-height:320px;overflow:auto;display:flex;flex-direction:column;gap:6px">${members.map(m => `<div class="row">${av(m)}<div class="grow"><div class="ellip" style="font-weight:500">${m.name}</div><div class="mute xsmall ellip">${m.pos} · ${ROLES[m.role].pages[pageId] === 'full' ? 'работа' : 'просмотр'}</div></div>${chipDirs(m.dirs === 'all' ? 'all' : m.dirs)}</div>`).join('')}</div>`;
    const body = `<div class="chat">
      <div class="chat-head">
        ${xp({ id: 'members', head: avs(members, 4), panel: membersPanel, place: 'below', cls: '', headCls: '' })}
        <div class="grow"><div class="b small">Чат · ${page.name}</div><div class="mute xsmall">${online.length} онлайн из ${members.length}</div></div>
        <button class="btn ghost sm icon" title="Свернуть чат" data-chat-toggle>${ic('x', 'sm')}</button>
      </div>
      <div class="chat-msgs" id="chat-msgs">${this.msgsHtml(pageId)}</div>
      <form class="chat-form" data-chat-form="${pageId}">
        <button type="button" class="btn ghost icon" title="Прикрепить файл">${ic('clip')}</button>
        <input class="chat-in" placeholder="Сообщение участникам…" autocomplete="off">
        <button class="btn primary icon" title="Отправить">${glassIcon('send', themeInv(), 'md')}</button>
      </form>
    </div>`;
    return mod({ title: `Чат · ${page.name}`, sub: `${members.length} участников · видят все, кому открыта страница`, body, cls: 'chat-mod' });
  },
  send(pageId, text) {
    const st = this.get(pageId);
    st.msgs.push({ who: ME.id, t: nowTime(), text });
    if (!st.replied && REPLIES[pageId]) {
      st.replied = true; st.typing = true;
      setTimeout(() => { st.typing = false; st.msgs.push({ who: REPLIES[pageId].who, t: nowTime(), text: REPLIES[pageId].text.replace(/^[^:]+:\s*/, '') }); this.refresh(pageId, st.msgs.length - 1); }, 2400);
    }
    this.refresh(pageId, st.msgs.length - 1);
  },
};
