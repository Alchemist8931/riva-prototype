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
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

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
const glassIcon = name => {
  const g = GLASS[name]; if (!g) return ic(name);
  return `<svg class="gi" viewBox="0 0 48 48" aria-hidden="true">
    <defs><clipPath id="gc-${name}">${g.front}</clipPath></defs>
    <g fill="url(#gi-back)">${g.back}</g>
    <g fill="var(--ico-shadow)" filter="url(#gi-soft)" transform="translate(0 2.2)">${g.front}</g>
    <g clip-path="url(#gc-${name})">
      <rect width="48" height="48" fill="currentColor"/>
      <g fill="url(#gi-back)" filter="url(#gi-blur)">${g.back}</g>
      <rect width="48" height="48" fill="url(#gi-glass)"/>
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
const ticks = (n, total, cls = '') => `<span class="ticks ${cls}" title="${n} из ${total}">${Array.from({ length: total }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
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
  open: null,
  frame: null, veil: null,
  init() {
    this.frame = document.querySelector('.frame');
    this.veil = document.querySelector('.veil');
    this.veil.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
    document.addEventListener('scroll', () => { if (this.open) this.focus(); }, true);
    window.addEventListener('resize', () => { if (this.open) this.focus(); });
  },
  toggle(el) { this.open === el ? this.close() : this.show(el); },
  show(el) {
    if (this.open && this.open !== el) this.open.classList.remove('open');
    this.open = el; el.classList.add('open');
    el.querySelector('.xp-panel').scrollIntoView({ block: 'nearest' });
    this.focus();
  },
  close() {
    if (!this.open) return;
    this.open.classList.remove('open'); this.open = null;
    this.veil.classList.remove('on');
  },
  /* маска: полный блюр у границ раскрытой панели, затухание с удалением */
  focus() {
    const panel = this.open.querySelector('.xp-panel');
    const fr = this.frame.getBoundingClientRect(), r = panel.getBoundingClientRect();
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
  render(pageId) {
    const page = PAGES.find(p => p.id === pageId);
    const st = this.get(pageId), members = this.members(pageId), online = members.filter(m => m.on);
    const msgs = st.msgs.map(m => {
      const p = BY_ID[m.who], me = p.me;
      return `<div class="msg ${me ? 'me' : ''}">${me ? '' : av(p)}<div class="msg-b"><div class="msg-meta"><span>${me ? 'Вы' : shortName(p.name)}</span><span>${m.t}</span></div><div class="msg-t">${esc(m.text)}</div></div></div>`;
    }).join('');
    const membersPanel = `<div class="ph"><span class="t">Участники чата</span><span class="mute small">${members.length} · доступ к странице «${page.name}»</span><button class="btn ghost sm icon" data-xp-close style="margin-left:auto">${ic('x', 'sm')}</button></div>
      <div class="pb" style="max-height:320px;overflow:auto;display:flex;flex-direction:column;gap:6px">${members.map(m => `<div class="row">${av(m)}<div class="grow"><div class="ellip" style="font-weight:500">${m.name}</div><div class="mute xsmall ellip">${m.pos} · ${ROLES[m.role].pages[pageId] === 'full' ? 'работа' : 'просмотр'}</div></div>${chipDirs(m.dirs === 'all' ? 'all' : m.dirs)}</div>`).join('')}</div>`;
    const body = `<div class="chat">
      <div class="chat-head">
        ${xp({ id: 'members', head: avs(members, 4), panel: membersPanel, place: 'below', cls: '', headCls: '' })}
        <div class="grow"><div class="b small">Чат · ${page.name}</div><div class="mute xsmall">${online.length} онлайн из ${members.length}</div></div>
        <button class="btn ghost sm icon" title="Свернуть чат" data-chat-toggle>${ic('panel', 'sm')}</button>
      </div>
      <div class="chat-msgs" id="chat-msgs">
        <div class="msg sys"><div class="msg-t">Сегодня, ${todayStr()}</div></div>
        ${msgs}
        ${st.typing ? `<div class="typing">${shortName(BY_ID[REPLIES[pageId]?.who || 1].name)} печатает <i></i><i></i><i></i></div>` : ''}
      </div>
      <form class="chat-form" data-chat-form="${pageId}">
        <button type="button" class="btn ghost icon" title="Прикрепить файл">${ic('clip')}</button>
        <input class="chat-in" placeholder="Сообщение участникам…" autocomplete="off">
        <button class="btn primary icon" title="Отправить">${ic('send')}</button>
      </form>
    </div>`;
    return mod({ title: `Чат · ${page.name}`, sub: `${members.length} участников · видят все, кому открыта страница`, body, cls: 'chat-mod' });
  },
  send(pageId, text) {
    const st = this.get(pageId);
    st.msgs.push({ who: ME.id, t: nowTime(), text });
    if (!st.replied && REPLIES[pageId]) {
      st.replied = true; st.typing = true;
      setTimeout(() => { st.typing = false; st.msgs.push({ who: REPLIES[pageId].who, t: nowTime(), text: REPLIES[pageId].text.replace(/^[^:]+:\s*/, '') }); App.renderChat(); }, 2400);
    }
    App.renderChat();
  },
};
