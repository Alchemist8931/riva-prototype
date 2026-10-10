/* ============================================================
   RIVA · «Обзор» — главная страница предприятия (33-й круг, отдельный файл дизайна).
   Все числа считаются из тестовых данных прототипа (SALES, SUPPLY, PROD_ORDERS, RECIPES, STAFF, NOTIFS).
   День демонстрации зафиксирован: понедельник 05.10.2026, 09:40 — чтобы сроки и просрочки совпадали с данными.
   ============================================================ */

const PROTO = 'https://alchemist8931.github.io/riva-prototype/';   // остальные страницы ведут в живой прототип
const DEMO = { date: '05.10.2026', time: '09:40', wd: 'понедельник' };
const fmtMoney = n => Math.round(n).toLocaleString('ru-RU');
const rub = n => fmtMoney(n) + ' ₽';
const rubK = n => Math.abs(n) >= 1e6 ? (n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' млн ₽' : Math.abs(n) >= 1e4 ? Math.round(n / 1e3).toLocaleString('ru-RU') + ' тыс. ₽' : rub(n);
const fmtQty = n => (Math.round(n * 100) / 100).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
const toDate = s => { const m = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(s || ''); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
const dayDiff = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5);   // b − a в днях
const plural = (n, one, few, many) => { const m = n % 10, h = n % 100; return n + ' ' + (h >= 11 && h <= 14 ? many : m === 1 ? one : m >= 2 && m <= 4 ? few : many); };
const shortDate = s => { const m = /^(\d{2})\.(\d{2})/.exec(s || ''); return m ? `${m[1]}.${m[2]}` : (s || '—'); };

/* страница «Обзор» в меню первой; своя стеклянная иконка — четыре плитки и стекло поверх */
ICONS.home = '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>';
GLASS.home = { back: '<rect x="4" y="4" width="18" height="18" rx="5"/><rect x="26" y="4" width="18" height="18" rx="5"/><rect x="4" y="26" width="18" height="18" rx="5"/><rect x="26" y="26" width="18" height="18" rx="5"/>', front: '<rect x="13" y="13" width="22" height="22" rx="7"/>' };
PAGES.unshift({ id: 'overview', name: 'Обзор', icon: 'home', sub: 'всё предприятие на один экран', ready: true, unread: 0 });
Object.entries(ROLES).forEach(([k, r]) => { r.pages.overview = k === 'director' ? 'full' : 'view'; });   // Обзор открыт всем в объёме их страниц, работа — у директора
CHATS.overview = [
  { who: 1,  t: '08:55', text: 'Коллеги, по «Домострою» аванс до сих пор не пришёл — Денис, к обеду жду ответ Кравцова.' },
  { who: 22, t: '09:02', text: 'Оплата «Офис-Плюс» 248 000 разнесена, ЗК-0004 закрыт по деньгам. Зарплата 10.10 — 412 000, деньги есть.' },
  { who: 2,  t: '09:15', text: 'Лист по СН-1042 придёт завтра, кран на складе А заказал на 10:00.' },
  { who: 16, t: '09:31', text: 'Цех №2: тумбы по ПЗ-0004 идут по плану, к 16.10 успеваем.' },
  { who: 13, t: '09:38', text: 'Склад В: по ПЗ-0005 не хватает красителя и стабилизатора, Марина, что по СН-1047?' },
];
REPLIES.overview = { who: 3, text: 'Кузнецова: пигменты по СН-1047 отгружены вчера, срок 11.10; краситель зелёный добавлю в заявку сегодня.' };

/* ---------- расчёты из данных прототипа (те же формулы, что на страницах) ---------- */
const CALC = {
  area(dir) { return DEPTS.find(d => d.id === 'prod').names[dir]; },
  wh(dir) { return DEPTS.find(d => d.id === 'wh').names[dir]; },
  recCost(id) { const r = REC[id]; let mat = 0, semi = 0, work = 0; r.comps.forEach(([k, x, q]) => { if (k === 'm') mat += (MATERIALS[x] ? MATERIALS[x].price : 0) * q; else semi += this.recCost(x).unit * q; }); r.works.forEach(([, h, rate]) => { work += h * rate; }); const total = mat + semi + work; return { mat, semi, work, total, unit: total / r.out }; },
  semiReady() { const s = {}; PROD_ORDERS.forEach(o => { if (o.st === 'done') s[o.rec] = (s[o.rec] || 0) + o.qty; }); return s; },
  stockRows() {
    return SUPPLY.filter(r => r.st === 'done').flatMap(r => r.items.map(([sku, name, cat, unit, qty, price]) => ({ sku, name, cat, unit, qty, price, left: Math.max(0, qty - (STOCK_ISSUED[sku] || 0)), dir: r.dir, req: r.id })));
  },
  stockBySku() { const s = {}; this.stockRows().forEach(x => { s[x.sku] = (s[x.sku] || 0) + x.left; }); return s; },
  explode(recId, qty) {
    const need = {}, semi = {}, works = {}, ready = this.semiReady();
    const go = (id, units) => {
      const r = REC[id], f = units / r.out, area = this.area(r.dir);
      r.works.forEach(([op, h, rate]) => { const k = op + '|' + area, w = works[k] || (works[k] = { op, area, h: 0, sum: 0 }); w.h += h * f; w.sum += h * f * rate; });
      r.comps.forEach(([k, x, q]) => {
        const n = q * f;
        if (k === 'm') { need[x] = (need[x] || 0) + n; return; }
        const sm = semi[x] || (semi[x] = { need: 0, ready: ready[x] || 0, used: 0, make: 0 });
        const use = Math.min(Math.max(0, sm.ready - sm.used), n);
        sm.need += n; sm.used += use; sm.make += n - use;
        if (n - use > 0) go(x, n - use);
      });
    };
    go(recId, qty);
    const stock = this.stockBySku();
    return { mats: Object.entries(need).map(([sku, n]) => { const have = stock[sku] || 0; return { sku, m: MATERIALS[sku], need: n, have, short: Math.max(0, n - have) }; }), semi, works: Object.values(works) };
  },
  saleTotal(r) { return r.items.reduce((a, it) => a + it[3] * it[4], 0); },
  supTotal(r) { return r.items.reduce((a, it) => a + it[4] * it[5], 0); },
  /* активные документы по этапам */
  sales() { return SALES.filter(r => r.st !== 'done'); },
  supply() { return SUPPLY.filter(r => r.st !== 'done'); },
  prod() { return PROD_ORDERS.filter(o => o.st !== 'done'); },
  ships() { return SALES.filter(r => r.st === 'ok' || r.st === 'ship'); },
  unpaidSales() { return SALES.filter(r => this.saleTotal(r) - r.paid > .5); },
  unpaidSupply() { return SUPPLY.filter(r => !r.paid && r.st !== 'done'); },
  overdueSales() { return this.unpaidSales().filter(r => r.due !== '—' && dayDiff(r.due, DEMO.date) > 0); },
  lateSupply() { return this.supply().filter(r => r.st === 'tr' && dayDiff(r.eta, DEMO.date) > 0); },
  noInvoice() { return this.supply().filter(r => r.st === 'req' && !r.files.some(f => f[1] === 'счёт')); },
  /* чем закрыт недостающий материал: transit — заказан у поставщика (заказ создан / груз в пути), req:СН-… — есть заявка без заказа, none — ничего */
  cover(sku) {
    if (SUPPLY.some(r => (r.st === 'tr' || r.st === 'ord') && r.items.some(it => it[0] === sku))) return 'transit';
    const req = SUPPLY.find(r => r.st === 'req' && r.items.some(it => it[0] === sku));
    return req ? 'req:' + req.id : 'none';
  },
  /* нехватка по активным заказам на производство: только то, чего нет на складе и что не заказано (в пути — не дефицит) */
  shortages() { const out = {}; this.prod().forEach(o => { const ex = this.explode(o.rec, o.qty); const sh = ex.mats.filter(m => m.short > 1e-9).map(m => ({ ...m, cover: this.cover(m.sku) })).filter(m => m.cover !== 'transit'); if (sh.length) out[o.id] = sh; }); return out; },
  inTransit(sku) { return this.cover(sku) === 'transit'; },
  /* загрузка цехов: нормо-часы активных заказов по уровням против мощности недели */
  load() {
    const cap = { metal: 80, furn: 80, poly: 40 }, h = { metal: 0, furn: 0, poly: 0 }, next = {};
    this.prod().forEach(o => { const r = REC[o.rec], ex = this.explode(o.rec, o.qty); ex.works.forEach(w => { const d = DIRS.find(x => this.area(x.id) === w.area); if (d) h[d.id] += w.h; }); if (!next[r.dir] || dayDiff(next[r.dir].due, o.due) < 0) next[r.dir] = o; });
    return DIRS.map(d => ({ dir: d.id, h: h[d.id], cap: cap[d.id], pct: Math.round(100 * h[d.id] / cap[d.id]), next: next[d.id] }));
  },
};

/* ---------- приложение «Обзор» ---------- */
const OV = {
  state: { dir: 'all', company: 'bereg', theme: localStorage.getItem('riva.theme') || 'light', stage: null },
  el: {},
  init() {
    this.el = { side: document.getElementById('side'), topbar: document.getElementById('topbar'), grid: document.getElementById('grid'), chatcol: document.getElementById('chatcol'), notifcol: document.getElementById('notifcol') };
    document.documentElement.dataset.theme = this.state.theme;
    XP.init(); BG.init();
    document.addEventListener('click', e => this.onClick(e));
    document.addEventListener('submit', e => this.onSubmit(e));
    document.addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); document.querySelector('[data-search]')?.focus(); } });
    this.renderAll(true);
  },
  renderAll(animate = false) { this.renderSide(); this.renderTopbar(); this.renderGrid(animate); this.renderChat(); this.renderNotifs(); },
  inDir(d) { return this.state.dir === 'all' || d === this.state.dir; },
  dirs() { return DIRS.filter(d => this.inDir(d.id)); },

  /* колонка иконок: «Обзор» активен, остальные страницы ведут в прототип */
  renderSide() {
    const dark = this.state.theme === 'dark';
    this.el.side.innerHTML = `
      <a class="logo-tile" href="#" data-tip="RIVA · Обзор предприятия">R</a>
      <nav class="dock">${PAGES.map(pg => `<a href="${pg.id === 'overview' ? '#' : PROTO + '#' + pg.id}" class="dk-item ${pg.id === 'overview' ? 'active' : ''}" data-tip="${pg.name}${pg.id === 'overview' ? '' : ' · в прототипе'}">${glassIcon(pg.icon, pg.id === 'overview' ? 'n' : 'i')}${pg.unread ? `<span class="n">${pg.unread}</span>` : ''}</a>`).join('')}</nav>
      <div class="side-foot">
        ${xp({ id: 'bg', head: `<button class="rail-btn" data-tip="Фон приложения">${glassIcon('wave', 'i')}</button>`, panel: `<div class="menu" style="width:250px"><div class="lbl">Фон приложения</div>${BG.modes.map(([id, name, sub]) => `<button class="co ${id === BG.mode ? 'on' : ''}" data-bg-set="${id}"><span class="grow" style="text-align:left"><span style="display:block">${name}</span><span class="mute xsmall" style="display:block;font-weight:400">${sub}</span></span>${id === BG.mode ? `<span class="chk">${icRaw('check', 'sm')}</span>` : ''}</button>`).join('')}</div>`, place: 'rail' })}
        <button class="rail-btn" data-theme-toggle data-tip="${dark ? 'Светлая тема' : 'Тёмная тема'}">${glassIcon(dark ? 'sun' : 'moon', 'i')}</button>
        <div class="rail-me" data-tip="${ME.name} · ${ME.pos}">${glassIcon('user', 'i')}<i class="on"></i></div>
      </div>`;
  },

  /* шапка: те же переключатели, дата данных, быстрые действия */
  renderTopbar() {
    const s = this.state, co = COMPANIES.find(c => c.id === s.company) || COMPANIES[0];
    const sw = (icon, label, title) => `<button class="btn sw" title="${title}">${icon}<span class="lbl ellip">${label}</span>${ic('down', 'sm')}</button>`;
    const dirIcon = id => id === 'all' ? ic('layers', 'sm') : `<span class="chip dir" style="height:18px;padding:0;border:0;background:none"><span class="dk">${DIR[id].k}</span></span>`;
    const coPanel = `<div class="menu" style="width:260px"><div class="lbl">Организация</div>${COMPANIES.map(c => `<button class="co ${c.id === co.id ? 'on' : ''}" data-company="${c.id}">${ic('building', 'sm')}<span class="grow" style="text-align:left"><span style="display:block">${c.name}</span><span class="mute xsmall" style="display:block;font-weight:400">${c.sub}</span></span>${c.id === co.id ? `<span class="chk">${ic('check', 'sm')}</span>` : ''}</button>`).join('')}</div>`;
    const dirPanel = `<div class="menu" style="width:260px"><div class="lbl">Направление деятельности</div>${['all', ...DIRS.map(d => d.id)].map(id => `<button class="${id === s.dir ? 'on' : ''}" data-dir="${id}">${dirIcon(id)}${id === 'all' ? 'Все направления' : DIR[id].name}${id === s.dir ? `<span class="chk">${ic('check', 'sm')}</span>` : ''}</button>`).join('')}<div class="sep"></div><div class="mute small" style="padding:4px 9px 6px">Обзор показывает все направления сразу; при выборе одного — только его цех, склад и продажи.</div></div>`;
    const qa = `<div class="menu qa"><div class="lbl">Создать</div>
      ${[['sales', 'Реализация', 'tag'], ['supply', 'Заявка на снабжение', 'box'], ['production', 'Заказ на производство', 'factory'], ['staff', 'Сотрудник', 'idcard']].map(([pg, name, icon]) => `<a class="btn ghost" style="justify-content:flex-start;border:0;height:30px" href="${PROTO}#${pg}">${ic(icon, 'sm')}${name}</a>`).join('')}
      <div class="sep"></div><div class="mute small" style="padding:4px 9px 6px">Формы живут на своих страницах — кнопка открывает нужную страницу прототипа.</div></div>`;
    const unread = NOTIFS.filter(n => n.unread).length, pg = PAGES[0];
    this.el.topbar.innerHTML = `
      <div class="tb-ic">${glassIcon('home', themeVar())}</div>
      <div class="tb-title">Обзор</div>
      <div style="width:6px"></div>
      ${xp({ id: 'company', head: sw(ic('building', 'sm'), co.name, 'Организация'), panel: coPanel, place: 'below' })}
      ${xp({ id: 'dir', head: sw(dirIcon(s.dir), s.dir === 'all' ? 'Все направления' : DIR[s.dir].name, 'Направление деятельности'), panel: dirPanel, place: 'below' })}
      <span class="tb-date" title="Данные страницы пересчитываются при каждом изменении документов"><i class="live"></i>${DEMO.wd}, <span class="num">${fmtDate(DEMO.date)}</span> · <span class="num">${DEMO.time}</span></span>
      <div class="grow"></div>
      <label class="search">${ic('search', 'sm')}<input placeholder="Документ, клиент, артикул, телефон…" data-search><kbd>/</kbd></label>
      ${xp({ id: 'new', head: `<button class="btn primary">${glassIcon('plus', themeInv(), 'sm')}Создать</button>`, panel: qa, place: 'below-r' })}
      <button class="btn icon" title="Уведомления" data-notif-toggle>${ic('bell', 'sm')}${unread ? '<i class="dot-n"></i>' : ''}</button>
      <button class="btn" title="Чат страницы" data-chat-toggle>${ic('chat', 'sm')}Чат${pg.unread ? `<span class="badge-n">${pg.unread}</span>` : ''}</button>`;
  },

  renderGrid(animate = false) {
    this.el.grid.classList.add('ov');
    this.el.grid.innerHTML = this.flow() + this.attention() + this.money() + this.dirsMod() + this.todayWeek() + this.team();
    if (animate) [...this.el.grid.querySelectorAll(':scope > .mod')].forEach((m, i) => { m.classList.add('ani'); m.style.setProperty('--i', i); });
  },

  /* ---------- стеклянная плитка этапа: та же конструкция, что у чипов, крупнее — задняя фигура 30×30, метка 12×16 под стеклом, плашка 148×76 ---------- */
  tile(key, label, n, unit, sub, cls) {
    const mark = c => `<path class="cl${c}" d="M40 10H52V26A6 6 0 0 1 40 26Z"/>`;   // метка 12×16 под плашкой, верх срезан по её краю
    return `<div class="tile t-${key} ${cls}" data-stage="${key}" title="Раскрыть документы этапа">
      <svg class="stg" viewBox="0 0 176 88" aria-hidden="true"><rect class="bk" width="34" height="34" rx="10"/><rect class="sh" x="10" y="12" width="166" height="78" rx="13"/><g clip-path="url(#tl-clip)"><rect class="base" width="176" height="88"/><rect class="bk bl2" width="34" height="34" rx="10"/>${mark(' bl2')}<rect class="tint" x="10" y="10" width="166" height="78"/>${mark(' glow bl2')}<rect class="edge" x="10" y="10" width="166" height="78" rx="13"/></g></svg>
      <div class="tx"><span class="k">${label}</span><span class="n">${n}${unit ? `<small>${unit}</small>` : ''}</span></div><span class="s">${sub}</span>
    </div>`;
  },
  conn(n) {
    return `<div class="conn"><svg viewBox="0 0 100 84" preserveAspectRatio="none"><path class="ln" d="M0 46H100"/><path class="fl" d="M0 46H100"/></svg><svg viewBox="0 0 10 10" style="left:auto;right:0;width:8px;height:84px;top:0" preserveAspectRatio="xMaxYMid meet"><path class="ar" d="M2 1 9 5 2 9Z"/></svg>${n ? `<svg viewBox="0 0 100 84" preserveAspectRatio="xMidYMid meet"><text class="nn" x="50" y="40" text-anchor="middle">${n}</text></svg>` : ''}</div>`;
  },

  /* ---------- поток предприятия ---------- */
  stages() {
    const d = this.state.dir, inD = x => this.inDir(x), sales = CALC.sales().filter(r => inD(r.dir)), sup = CALC.supply().filter(r => inD(r.dir)), stock = CALC.stockRows().filter(x => inD(x.dir) && x.left > 0), prod = CALC.prod().filter(o => inD(REC[o.rec].dir)), ships = CALC.ships().filter(r => inD(r.dir));
    const unpaidS = CALC.unpaidSales().filter(r => inD(r.dir)), unpaidP = CALC.unpaidSupply().filter(r => inD(r.dir)), overdue = CALC.overdueSales().filter(r => inD(r.dir)), late = CALC.lateSupply().filter(r => inD(r.dir)), noInv = CALC.noInvoice().filter(r => inD(r.dir));
    const shortages = CALC.shortages(), shortOrders = prod.filter(o => shortages[o.id]);
    const shortSkus = new Set(Object.entries(shortages).flatMap(([id, sh]) => inD(REC[PROD_ORDERS.find(o => o.id === id).rec].dir) ? sh.map(m => m.sku) : []));   // дефицитные артикулы по заказам выбранных направлений
    const stockVal = stock.reduce((a, x) => a + x.left * x.price, 0);
    const toGet = unpaidS.reduce((a, r) => a + CALC.saleTotal(r) - r.paid, 0), toPay = unpaidP.reduce((a, r) => a + CALC.supTotal(r), 0);
    const load = CALC.load().filter(l => inD(l.dir)), over = load.filter(l => l.pct > 100);
    const nextShip = ships.filter(r => r.st === 'ok' && r.ship !== '—').sort((a, b) => dayDiff(b.ship, a.ship)).find(r => dayDiff(DEMO.date, r.ship) >= 0);
    const dot = (bad, warn) => bad ? '<i class="dot bad"></i>' : warn ? '<i class="dot warn"></i>' : '<i class="dot ok"></i>';
    const byDir = (list, f) => Object.fromEntries(DIRS.map(x => [x.id, list.filter(r => f(r) === x.id)]));
    const sub = (d, t) => `${d}<span>${t}</span>`;
    const m = v => (v / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' млн';
    return [
      { key: 'sales', label: 'Реализации', n: sales.length, sub: sub(dot(overdue.length, sales.some(r => r.st === 'new')), `${overdue.length ? plural(overdue.length, 'просрочена', 'просрочены', 'просрочено') + ' · ' : ''}${plural(sales.filter(r => r.st === 'new').length, 'оформляется', 'оформляются', 'оформляются')}`), docs: sales, lanes: byDir(sales, r => r.dir), attn: r => overdue.includes(r) },
      { key: 'supply', label: 'Снабжение', n: sup.length, sub: sub(dot(late.length, noInv.length), `${late.length ? plural(late.length, 'опаздывает', 'опаздывают', 'опаздывают') + ' · ' : ''}${noInv.length} без счёта`), docs: sup, lanes: byDir(sup, r => r.dir), attn: r => late.includes(r) || noInv.includes(r) },
      { key: 'stock', label: 'Склад', n: stock.length, unit: 'поз.', sub: sub(dot(shortSkus.size), `остаток ${rubK(stockVal)} · нет ${plural(shortSkus.size, 'позиции', 'позиций', 'позиций')}`), docs: stock, lanes: byDir(stock, x => x.dir), attn: x => shortSkus.has(x.sku) },
      { key: 'prod', label: 'Производство', n: prod.length, sub: sub(dot(shortOrders.length || over.length), `${shortOrders.length} ждут материалы${over.length ? ' · ' + over.map(l => CALC.area(l.dir).toLowerCase()).join(', ') + ' перегружен' : ''}`), docs: prod, lanes: byDir(prod, o => REC[o.rec].dir), attn: o => !!shortages[o.id] },
      { key: 'ship', label: 'Отгрузки', n: ships.length, sub: sub(dot(false, false), nextShip ? 'ближайшая ' + shortDate(nextShip.ship) + ' · ' + nextShip.id : 'в ожидании нет'), docs: ships, lanes: byDir(ships, r => r.dir), attn: () => false },
      { key: 'pay', label: 'Оплаты', n: unpaidS.length + unpaidP.length, sub: sub(dot(overdue.length), `ждём ${m(toGet)} · платим ${m(toPay)}`), docs: [...unpaidS, ...unpaidP], lanes: byDir([...unpaidS, ...unpaidP], r => r.dir), attn: r => overdue.includes(r) },
    ];
  },
  flow() {
    const st = this.stages(), s = this.state;
    const tiles = `<div class="lbl"><b>Этапы</b><span class="txt">активных документов</span></div>` + st.map((x, i) => (i ? this.conn('') : '') + this.tile(x.key, x.label, x.n, x.unit, x.sub, s.stage === x.key ? 'on' : '')).join('');
    const lanes = this.dirs().map(d => `<div class="lbl"><span class="chip dir" title="${DIR[d.id].name}"><span class="dk">${d.k}</span><span class="nm">${d.short}</span></span></div>` + st.map((x, i) => {
      const list = x.lanes[d.id] || [], bad = list.filter(x.attn).length;
      const pop = list.length ? `<div class="hp-pop"><div class="sec-t">${x.label} · ${DIR[d.id].name}</div>${list.slice(0, 8).map(r => this.docRow(x.key, r)).join('')}${list.length > 8 ? `<div class="mute small" style="padding-top:4px">и ещё ${list.length - 8}</div>` : ''}</div>` : '';
      return (i ? '<div class="lane-x"></div>' : '') + `<div class="lane-c hp ${list.length ? '' : 'z'}">${list.length || '—'}${bad ? '<i class="dot bad"></i>' : ''}${pop}</div>`;
    }).join('')).join('');
    const cur = st.find(x => x.key === s.stage);
    const panel = cur ? `<div class="stage-panel">${this.stageTable(cur)}</div>` : '';
    const body = `<div class="ov-flow">${tiles}${lanes}</div>${panel}`;
    return mod({ span: 12, title: 'Поток предприятия', sub: 'от заказа клиента до денег на счёте: активные документы по этапам и направлениям · по наведению на число — документы, по клику на плитку — список этапа', body });
  },
  /* строка документа во всплывающем списке и в таблице этапа */
  docRow(key, r) {
    const chip = key === 'sales' || key === 'ship' ? slChip(r.st) : key === 'supply' ? stChip(r.st) : key === 'prod' ? pzChip(r.st) : key === 'pay' ? (r.client !== undefined ? payChipOf(CALC.saleTotal(r), r.paid) : payChip(false)) : '';
    const who = key === 'stock' ? `${r.name}` : key === 'prod' ? REC[r.rec].name : (r.client || r.supplier);
    const no = key === 'stock' ? r.sku : r.id;
    return `<div class="row"><span class="no small">${no}</span>${chip}<span class="who small">${esc(who)}</span></div>`;
  },
  stageTable(x) {
    const cols = x.key === 'stock' ? '90px minmax(0,1.6fr) 110px 110px 120px 140px' : '70px 140px minmax(0,1.6fr) 120px 120px 150px';
    const head = x.key === 'stock' ? ['артикул', 'наименование', 'остаток', 'сумма', 'дефицит', 'направление'] : ['номер', 'статус', x.key === 'prod' ? 'рецепт' : 'контрагент', x.key === 'prod' ? 'количество' : 'сумма', x.key === 'supply' ? 'срок доставки' : x.key === 'prod' ? 'срок' : x.key === 'pay' ? 'срок оплаты' : 'отгрузка', 'направление'];
    const rows = x.docs.map(r => {
      if (x.key === 'stock') return [`<span class="num mute">${r.sku}</span>`, esc(r.name), `<span class="num">${fmtQty(r.left)} ${r.unit}</span>`, `<span class="num">${rub(r.left * r.price)}</span>`, x.attn(r) ? '<span class="bad-t small">в потребности заказов</span>' : '<span class="mute">—</span>', chipDir(r.dir)];
      const isSale = r.client !== undefined, isSup = r.supplier !== undefined, isProd = r.rec !== undefined;
      const chip = isProd ? pzChip(r.st) : isSup ? stChip(r.st) : slChip(r.st);
      const who = isProd ? `${REC[r.rec].name} <span class="mute small">${r.rec}</span>` : esc(isSale ? r.client : r.supplier);
      const sum = isProd ? `${fmtQty(r.qty)} ${REC[r.rec].unit}` : isSale ? rub(CALC.saleTotal(r)) + (x.key === 'pay' ? ` <span class="mute small">· не хватает ${rub(CALC.saleTotal(r) - r.paid)}</span>` : '') : rub(CALC.supTotal(r));
      const date = isProd ? fmtDate(r.due) : isSup ? fmtDate(r.eta) : x.key === 'pay' ? (r.due !== '—' ? fmtDate(r.due) : '<span class="mute">по договору</span>') : fmtDate(r.ship);
      const late = x.attn(r) ? ' bad-t' : '';
      return [`<span class="no">${r.id}</span>`, chip, who, `<span class="num">${sum}</span>`, `<span class="num${late}">${date}</span>`, chipDir(isProd ? REC[r.rec].dir : r.dir)];
    });
    return `<div class="tbl items"><div class="tr th" style="grid-template-columns:${cols}">${head.map(h => `<div>${h}</div>`).join('')}</div>${rows.map(r => `<div class="tr" style="grid-template-columns:${cols}">${r.map(c => `<div class="ellip">${c}</div>`).join('')}</div>`).join('')}</div>`;
  },

  /* ---------- требует внимания ---------- */
  attention() {
    const inD = x => this.inDir(x), items = [];
    CALC.overdueSales().filter(r => inD(r.dir)).forEach(r => items.push({ sev: 'bad', icon: 'money', t: `Счёт №${r.doc} просрочен на ${plural(dayDiff(r.due, DEMO.date), 'день', 'дня', 'дней')}`, m: `${r.client} · ${rub(CALC.saleTotal(r) - r.paid)}`, no: r.id, pg: 'sales' }));
    SALES.filter(r => r.type === 'contract' && r.st === 'ok' && r.paid === 0 && inD(r.dir)).forEach(r => items.push({ sev: 'bad', icon: 'money', t: 'Аванс по договору не получен', m: `${r.client} · договор №${r.doc} · ${rub(CALC.saleTotal(r))}`, no: r.id, pg: 'sales' }));
    const cut = n => n.length > 24 ? n.slice(0, 23).replace(/\s\S*$/, '') + '…' : n;
    Object.entries(CALC.shortages()).forEach(([id, sh]) => {
      const o = PROD_ORDERS.find(x => x.id === id); if (!inD(REC[o.rec].dir)) return;
      const none = sh.filter(m => m.cover === 'none'), reqs = [...new Set(sh.filter(m => m.cover !== 'none').map(m => m.cover.slice(4)))];
      const t = none.length ? `Не заказано: ${none.slice(0, 2).map(m => `${cut(m.m.name)} ${fmtQty(m.short)} ${m.m.unit}`).join(', ')}${none.length > 2 ? ` и ещё ${none.length - 2}` : ''}` : `Не хватает ${plural(sh.length, 'позиции', 'позиций', 'позиций')} — ${plural(reqs.length, 'заявка', 'заявки', 'заявок')} ${reqs.join(', ')} без заказа`;
      items.push({ sev: none.length ? 'bad' : 'warn', icon: 'factory', t, m: `${REC[o.rec].name} · ${fmtQty(o.qty)} ${REC[o.rec].unit} · срок ${fmtDate(o.due)}${none.length && reqs.length ? ` · ещё ${plural(sh.length - none.length, 'позиция', 'позиции', 'позиций')} в заявках` : ''}`, no: id, pg: 'production' });
    });
    CALC.lateSupply().filter(r => inD(r.dir)).forEach(r => items.push({ sev: 'warn', icon: 'box', t: `Груз опаздывает на ${plural(dayDiff(r.eta, DEMO.date), 'день', 'дня', 'дней')}`, m: `${r.supplier} · ${r.tc} · ${r.track}`, no: r.id, pg: 'supply' }));
    CALC.noInvoice().filter(r => inD(r.dir)).forEach(r => items.push({ sev: 'warn', icon: 'file', t: `Заявка без счёта ${plural(dayDiff(r.hist[0][1], DEMO.date), 'день', 'дня', 'дней')}`, m: `${r.supplier} · ${rub(CALC.supTotal(r))}`, no: r.id, pg: 'supply' }));
    CALC.load().filter(l => l.pct > 100 && inD(l.dir)).forEach(l => items.push({ sev: 'warn', icon: 'factory', t: `${CALC.area(l.dir)} перегружен: ${l.pct} % мощности недели`, m: `${fmtQty(l.h)} ч работ при ${l.cap} ч · ${l.next ? l.next.id + ' до ' + shortDate(l.next.due) : ''}`, no: l.next ? l.next.id : '', pg: 'production' }));
    STAFF.filter(p => p.st === 'sick' && p.pos === 'Начальник цеха' && inD(p.dirs[0])).forEach(p => items.push({ sev: 'warn', icon: 'idcard', t: `${CALC.area(p.dirs[0])} без начальника`, m: `${p.name} на больничном с 1 октября`, no: '', pg: 'staff' }));
    const order = { bad: 0, warn: 1 }, LIMIT = 7;
    items.sort((a, b) => order[a.sev] - order[b.sev]);
    const shown = items.slice(0, LIMIT), rest = items.length - shown.length;
    const body = `<div class="att">${shown.map(it => `<a href="${PROTO}#${it.pg}" title="Открыть на странице «${PAGES.find(p => p.id === it.pg).name}»"><i class="dot ${it.sev}"></i><span class="ic">${ic(it.icon, 'sm')}</span><span style="min-width:0"><span class="t" style="display:block" title="${esc(it.t)}">${esc(it.t)}</span><span class="m" style="display:block" title="${esc(it.m)}">${esc(it.m)}</span></span><span class="no">${it.no}</span></a>`).join('') || '<div class="mute small" style="padding:8px 4px">Всё в порядке: просрочек, дефицита и пробелов нет</div>'}${rest ? `<div class="more">и ещё ${plural(rest, 'замечание', 'замечания', 'замечаний')} — на страницах документов</div>` : ''}</div>`;
    return mod({ span: 4, title: 'Требует внимания', sub: `${items.length} · ${items.filter(i => i.sev === 'bad').length} срочных · просрочки, нехватка, опоздания и кадровые пробелы — строка ведёт в документ`, body });
  },

  /* ---------- деньги: остатки, к получению и к оплате, план на две недели ---------- */
  money() {
    const inD = x => this.inDir(x);
    const unpaidS = CALC.unpaidSales().filter(r => inD(r.dir)), unpaidP = CALC.unpaidSupply().filter(r => inD(r.dir)), overdue = CALC.overdueSales().filter(r => inD(r.dir));
    const toGet = unpaidS.reduce((a, r) => a + CALC.saleTotal(r) - r.paid, 0), toPay = unpaidP.reduce((a, r) => a + CALC.supTotal(r), 0), over = overdue.reduce((a, r) => a + CALC.saleTotal(r) - r.paid, 0);
    const cash = 2184300;   // остатки по счетам и кассе — пока ввод руками, после запуска из банка
    /* план на 14 дней: поступления по срокам оплаты и отгрузки, выплаты по срокам поставок, зарплата и аренда */
    const days = Array.from({ length: 14 }, (_, i) => { const d = toDate(DEMO.date); d.setDate(d.getDate() + i); return d; });
    const key = d => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    const inflow = {}, outflow = {};
    const add = (map, date, v) => { if (dayDiff(DEMO.date, date) < 0) date = DEMO.date; map[date] = (map[date] || 0) + v; };
    unpaidS.forEach(r => { const d = r.due !== '—' ? r.due : r.ship; if (d !== '—') add(inflow, d, CALC.saleTotal(r) - r.paid); });
    unpaidP.forEach(r => { if (r.eta !== '—') add(outflow, r.eta, CALC.supTotal(r)); });
    if (this.state.dir === 'all') { add(outflow, '10.10.2026', 412000); add(outflow, '15.10.2026', 180000); }
    const max = Math.max(1, ...days.map(d => Math.max(inflow[key(d)] || 0, outflow[key(d)] || 0))), BAR = 30;   // столбец до 30px из 46: подпись суммы помещается над ним
    const short = v => rubK(v).replace(' ₽', '');
    const cols = days.map((d, i) => { const k = key(d), a = inflow[k] || 0, b = outflow[k] || 0, ha = Math.max(a ? 2 : 0, Math.round(a / max * BAR)), hb = Math.max(b ? 2 : 0, Math.round(b / max * BAR));
      return `<div class="col ${i === 0 ? 'td' : ''}" title="${fmtDate(k)}: поступления ${rub(a)}, выплаты ${rub(b)}"><div class="up">${a ? `<i style="height:${ha}px"></i>${a >= max * .3 ? `<b style="bottom:${ha + 2}px">${short(a)}</b>` : ''}` : ''}</div><div class="dn">${b ? `<i style="height:${hb}px"></i>${b >= max * .3 ? `<b style="top:${hb + 2}px">${short(b)}</b>` : ''}` : ''}</div><span class="dl">${String(d.getDate()).padStart(2, '0')}</span></div>`; }).join('');
    const chart = `<div class="cash"><div class="cols">${cols}</div>
      <div class="legend"><span><i style="background:var(--ok)"></i>поступления по срокам счетов и отгрузок</span><span><i style="background:var(--bad)"></i>выплаты поставщикам, зарплата, аренда</span></div></div>`;
    /* крупнейшие должники: остаток к получению по клиентам */
    const debts = {}; unpaidS.forEach(r => { const d = debts[r.client] || (debts[r.client] = { v: 0, n: 0, over: false }); d.v += CALC.saleTotal(r) - r.paid; d.n++; if (overdue.includes(r)) d.over = true; });
    const top = Object.entries(debts).sort((a, b) => b[1].v - a[1].v).slice(0, 4);
    const debt = top.length ? `<div class="debt"><div class="ov-h" style="margin:10px 0 2px"><div class="sec-t">Крупнейшие должники</div><span class="sub">${plural(Object.keys(debts).length, 'клиент', 'клиента', 'клиентов')} · ${rubK(toGet)}</span></div>${top.map(([n, d]) => `<div class="row"><span class="nm">${esc(n)}</span><span class="s">${plural(d.n, 'документ', 'документа', 'документов')}${d.over ? ' · <span class="bad-t">просрочка</span>' : ''}</span><span class="v">${rub(d.v)}</span></div>`).join('')}</div>` : '';
    const body = `<div class="stats3">
        <div class="stat"><span class="k">На счетах и в кассе</span><div class="v">${rub(cash)}</div><div class="s">${this.state.dir === 'all' ? 'ПК «Берег» 1 912 400 · Берег-Мебель 213 500 · касса 58 400' : 'по организациям направления'}</div></div>
        <div class="stat"><span class="k">К получению</span><div class="v">${rub(toGet)}</div><div class="s ${over ? 'bad' : ''}">${over ? `просрочено ${rub(over)} · ${plural(overdue.length, 'счёт', 'счёта', 'счетов')}` : 'просрочек нет'} · ${plural(unpaidS.length, 'реализация', 'реализации', 'реализаций')}</div></div>
        <div class="stat"><span class="k">К оплате</span><div class="v">${rub(toPay)}</div><div class="s">поставщикам по ${plural(unpaidP.length, 'заявке', 'заявкам', 'заявкам')}${this.state.dir === 'all' ? ' · зарплата 10.10 — 412 000' : ''}</div></div>
      </div>${chart}${debt}`;
    return mod({ span: 4, title: 'Деньги', sub: 'остатки — ввод до подключения банка · к получению и к оплате — из документов · план на две недели по срокам', body });
  },

  /* ---------- цеха и склады по направлениям ---------- */
  dirsMod() {
    const load = CALC.load(), stock = CALC.stockRows(), shortages = CALC.shortages();
    const rows = this.dirs().map(d => {
      const l = load.find(x => x.dir === d.id), st = stock.filter(x => x.dir === d.id && x.left > 0), val = st.reduce((a, x) => a + x.left * x.price, 0);
      const transit = SUPPLY.filter(r => r.dir === d.id && (r.st === 'tr' || r.st === 'ord')).reduce((a, r) => a + CALC.supTotal(r), 0);
      const short = [...new Map(Object.entries(shortages).flatMap(([id, sh]) => REC[PROD_ORDERS.find(o => o.id === id).rec].dir === d.id ? sh.map(m => [m.sku, m]) : [])).values()];
      const none = short.filter(m => m.cover === 'none').length, req = short.length - none;
      const pct = Math.min(100, l.pct), cls = l.pct > 100 ? 'bad' : l.pct > 85 ? 'warn' : '';
      return `<div class="dr">
        <div class="dh"><span class="chip dir"><span class="dk">${d.k}</span>${d.short}</span><span class="s">${CALC.area(d.id)} · ${CALC.wh(d.id)}</span></div>
        <div class="cell"><div class="r1">${fmtQty(l.h)} ч <span class="pct ${l.pct > 100 ? 'bad' : ''}">из ${l.cap} ч · ${l.pct} %</span></div><div class="bar"><i class="${cls}" style="width:${pct}%"></i>${l.pct > 100 ? '<i class="over"></i>' : ''}</div><div class="r2">${l.next ? `${l.next.id} · ${REC[l.next.rec].name} · до ${shortDate(l.next.due)}` : 'заказов в работе нет'}</div></div>
        <div class="cell"><div class="r1">${rub(val)} <span class="pct">остаток · ${st.length} поз.</span></div><div class="r2">${transit ? `в пути ${rub(transit)}` : 'в пути ничего'}</div><div class="r2">${short.length ? `<i class="dot ${none ? 'bad' : 'warn'}"></i>нет ${plural(short.length, 'позиции', 'позиций', 'позиций')}${none ? ` · ${none} не заказано` : ''}${req ? ` · ${req} в заявках` : ''}` : '<i class="dot ok"></i>всё для заказов есть'}</div></div>
      </div>`;
    }).join('');
    const totalH = load.filter(l => this.inDir(l.dir)).reduce((a, l) => a + l.h, 0), totalCap = load.filter(l => this.inDir(l.dir)).reduce((a, l) => a + l.cap, 0);
    const totalVal = stock.filter(x => this.inDir(x.dir)).reduce((a, x) => a + x.left * x.price, 0), totalTr = SUPPLY.filter(r => this.inDir(r.dir) && (r.st === 'tr' || r.st === 'ord')).reduce((a, r) => a + CALC.supTotal(r), 0);
    const eta = SUPPLY.filter(r => this.inDir(r.dir) && (r.st === 'tr' || r.st === 'ord') && dayDiff(DEMO.date, r.eta) >= 0 && dayDiff(DEMO.date, r.eta) < 7).length;
    const foot = `<div class="foot"><span>работ в заказах <b>${fmtQty(totalH)} ч</b> из ${totalCap} ч в неделю</span><span>остатки <b>${rub(totalVal)}</b></span><span>в пути <b>${rub(totalTr)}</b></span><span>поставок на неделе <b>${eta}</b></span></div>`;
    return mod({ span: 4, title: 'Цеха и склады', sub: 'по направлениям: нормо-часы активных заказов против мощности недели; остатки, грузы в пути и нехватка по потребности заказов', body: `<div class="dirs">${rows}${foot}</div>` });
  },

  /* ---------- сегодня и неделя ---------- */
  todayWeek() {
    const inD = x => this.inDir(x);
    const evs = NOTIFS.filter(n => n.day === 'today').map(n => ({ t: n.t, icon: n.kind, text: n.text, m: `${n.who} · ${PAGES.find(p => p.id === n.page).name}`, pg: n.page }));
    evs.push({ t: '09:38', icon: 'chat', text: 'Царёв: по ПЗ-0005 не хватает красителя и стабилизатора', m: 'чат Обзора', pg: 'overview' });
    evs.sort((a, b) => b.t.localeCompare(a.t));
    const tl = `<div class="tl">${evs.map(e => `<div class="ev"><span class="tm">${e.t}</span><span class="ic">${ic(e.icon, 'xs')}</span><span style="min-width:0"><span class="t" style="display:block" title="${esc(e.text)}">${esc(e.text)}</span><span class="m" style="display:block">${esc(e.m)}</span></span></div>`).join('')}</div>`;
    /* неделя: поставки, отгрузки, оплаты, производство по датам документов */
    const items = [];
    CALC.supply().forEach(r => { if (inD(r.dir) && r.eta !== '—') items.push({ d: r.eta, kind: 'supply', no: r.id, text: r.supplier.replace(/^(ООО|АО|ИП) /, ''), bad: dayDiff(r.eta, DEMO.date) > 0 && r.st === 'tr' }); });
    CALC.sales().forEach(r => { if (!inD(r.dir)) return; if (r.st === 'ok' && r.ship !== '—') items.push({ d: r.ship, kind: 'ship', no: r.id, text: r.client.replace(/^(ООО|АО|ИП) /, '') }); if (r.due !== '—' && CALC.saleTotal(r) - r.paid > .5) items.push({ d: r.due, kind: 'pay', no: r.id, text: 'оплата · ' + r.client.replace(/^(ООО|АО|ИП) /, ''), bad: dayDiff(r.due, DEMO.date) > 0 }); });
    CALC.prod().forEach(o => { if (inD(REC[o.rec].dir)) items.push({ d: o.due, kind: 'prod', no: o.id, text: REC[o.rec].name }); });
    if (this.state.dir === 'all') items.push({ d: '10.10.2026', kind: 'pay', no: 'ЗП', text: 'зарплата · 412 000 ₽' });
    const kinds = { supply: ['поставка', 'st-tr'], ship: ['отгрузка', 'sl-ship'], pay: ['оплата', 'pay-y'], prod: ['производство', 'rk-semi'] };
    const colors = { supply: '#199948', ship: '#0E9AA7', pay: '#1F9D6B', prod: '#8A63D2' };
    const days = Array.from({ length: 7 }, (_, i) => { const d = toDate(DEMO.date); d.setDate(d.getDate() + i); return d; });
    const wds = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    const key = d => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    const overdueItems = items.filter(it => dayDiff(it.d, DEMO.date) > 0);
    const wk = `<div class="wk">${days.map((d, i) => { const k = key(d), list = [...(i === 0 ? overdueItems : []), ...items.filter(it => it.d === k)]; const we = d.getDay() === 0 || d.getDay() === 6;
      return `<div class="d ${i === 0 ? 'td' : ''} ${we ? 'we' : ''}"><div class="dh"><b>${String(d.getDate()).padStart(2, '0')}</b><span>${i === 0 ? 'сегодня' : wds[d.getDay()]}</span></div>${list.map(it => `<div class="it ${it.bad ? 'bad' : ''}" title="${kinds[it.kind][0]} · ${it.no} · ${esc(it.text)}${it.bad ? ' · просрочено' : ''}"><span class="r"><i class="dot" style="background:${colors[it.kind]}"></i><b>${it.no}</b></span><span class="x">${esc(it.text)}${it.bad ? ' · просрочено' : ''}</span></div>`).join('') || '<div class="none">—</div>'}</div>`; }).join('')}</div>
      <div class="legend" style="margin-top:6px">${Object.entries(kinds).map(([k, v]) => `<span><i style="background:${colors[k]}"></i>${v[0]}</span>`).join('')}<span><i style="background:transparent;border:1px solid var(--bad)"></i>просрочено</span></div>`;
    const body = `<div class="tw"><div><div class="ov-h"><div class="sec-t">Сегодня</div><span class="sub">${evs.length} событий · ${DEMO.time}</span></div>${tl}</div><div><div class="ov-h"><div class="sec-t">Неделя</div><span class="sub">сроки поставок, отгрузок, оплат и заказов</span></div>${wk}</div></div>`;
    return mod({ span: 8, title: 'Сегодня и неделя', sub: 'события дня из документов и чатов · сроки на семь дней вперёд, просроченное переносится на сегодня', body });
  },

  /* ---------- команда ---------- */
  team() {
    const c = st => STAFF.filter(p => p.st === st).length, on = STAFF.filter(p => p.on).length, absent = STAFF.filter(p => p.st === 'vacation' || p.st === 'sick');
    const body = `<div class="team">
      <div class="dirbar" style="grid-template-columns:96px 1fr auto;margin-bottom:8px"><span class="small mute">На связи</span>${ticks(Math.round(16 * on / STAFF.length), 16)}<span class="n">${on} из ${STAFF.length}</span></div>
      <div class="kpis"><div class="kpi"><b>${c('office')}</b><span>${dot('ok')}в офисе</span></div><div class="kpi"><b>${c('remote')}</b><span>${dot('')}удалённо</span></div><div class="kpi"><b>${c('trip')}</b><span>${dot('fg')}в рейсе</span></div><div class="kpi ${absent.length ? 'bad' : ''}"><b>${absent.length}</b><span>${dot('warn')}отсутствуют</span></div></div>
      <div class="sec-t" style="margin-top:10px">Отсутствуют</div>
      ${absent.map(p => `<div class="row p">${av(p)}<span class="nm">${p.name}</span><span class="s">${ST[p.st].name.toLowerCase()} · ${p.st === 'vacation' ? 'до 12.10' : 'с 01.10'}</span></div>`).join('')}
      <div class="sec-t" style="margin-top:10px">Адаптация</div>
      ${ONBOARDING.map(o => { const p = BY_ID[o.who]; return `<div class="adapt">${av(p)}<span class="nm small" style="flex:1;min-width:0;font-weight:500">${shortName(p.name)}</span>${ticks(o.done, o.steps.length, 'fg sm')}<span class="small mute num">${o.done} / ${o.steps.length}</span></div>`; }).join('')}
    </div>`;
    return mod({ span: 4, title: 'Команда', sub: `${STAFF.length} сотрудников · кто на связи, кто отсутствует, кто в адаптации`, body });
  },

  /* ---------- чат и уведомления: те же панели, что в прототипе ---------- */
  renderChat() { this.el.chatcol.innerHTML = `<div class="xp-panel chat-pop">${CHAT.render('overview')}</div>`; },
  renderNotifs() {
    const unread = NOTIFS.filter(n => n.unread).length, dayName = { today: 'Сегодня', yesterday: 'Вчера' };
    const groups = ['today', 'yesterday'].map(d => { const items = NOTIFS.filter(n => n.day === d); if (!items.length) return ''; return `<div class="sec-t" style="margin:6px 4px 4px">${dayName[d]}</div>` + items.map(n => `<div class="ntf ${n.unread ? 'unread' : ''}"><span class="ic">${ic(n.kind, 'sm')}</span><div class="grow"><div class="t">${esc(n.text)}</div><div class="m">${n.t}${n.who ? ' · ' + esc(n.who) : ''} · <a href="${PROTO}#${n.page}">${PAGES.find(p => p.id === n.page).name}</a></div></div>${n.unread ? '<i class="dot fg"></i>' : ''}</div>`).join(''); }).join('');
    const body = `<div class="chat"><div class="chat-head"><div class="grow"><div class="b small">Уведомления</div><div class="mute xsmall">${unread ? unread + ' непрочитанных' : 'все прочитаны'}</div></div>${unread ? `<button class="btn ghost sm" data-notif-read>${ic('check', 'xs')}Прочитать всё</button>` : ''}<button class="btn ghost sm icon" title="Свернуть" data-notif-toggle>${icRaw('x', 'sm')}</button></div><div class="chat-msgs" style="gap:2px">${groups}</div></div>`;
    this.el.notifcol.innerHTML = `<div class="xp-panel chat-pop">${mod({ title: 'Уведомления', sub: 'события по страницам, к которым у вас есть доступ', body, cls: 'chat-mod' })}</div>`;
  },

  /* ---------- события ---------- */
  onClick(e) {
    const t = e.target;
    const tile = t.closest('[data-stage]');
    if (tile) { this.state.stage = this.state.stage === tile.dataset.stage ? null : tile.dataset.stage; XP.closeAll(); this.renderGrid(); return; }
    const themeBtn = t.closest('[data-theme-toggle]');
    if (themeBtn) { this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('riva.theme', this.state.theme); document.documentElement.dataset.theme = this.state.theme; XP.closeAll(); this.renderAll(); return; }
    if (t.closest('[data-chat-toggle]')) { XP.toggle(this.el.chatcol); const m = document.getElementById('chat-msgs'); if (m) m.scrollTo({ top: m.scrollHeight, behavior: 'instant' }); return; }
    if (t.closest('[data-notif-toggle]')) { XP.toggle(this.el.notifcol); return; }
    const bgBtn = t.closest('[data-bg-set]');
    if (bgBtn) { BG.set(bgBtn.dataset.bgSet); XP.close(); this.renderSide(); return; }
    if (t.closest('[data-notif-read]')) { NOTIFS.forEach(n => n.unread = false); this.renderNotifs(); this.renderTopbar(); XP.focus(); return; }
    const coBtn = t.closest('[data-company]');
    if (coBtn) { this.state.company = coBtn.dataset.company; XP.close(); this.renderTopbar(); return; }
    if (t.closest('[data-xp-close]')) { XP.close(); return; }
    const dirBtn = t.closest('[data-dir]');
    if (dirBtn) { this.state.dir = dirBtn.dataset.dir; this.state.stage = null; XP.close(); this.renderTopbar(); this.renderGrid(); return; }
    const tg = t.closest('[data-xp-toggle]');
    if (tg) { if (t.closest('a,button') && !t.closest('.xp-head > .company, .xp-head > .btn, .xp-head > .avs, .xp-head > .sel-btn, .xp-head > .rail-btn')) return; XP.toggle(tg.closest('.xp')); return; }
    if (!t.closest('.xp-panel')) XP.closeAll();
  },
  onSubmit(e) {
    const f = e.target.closest('[data-chat-form]'); if (!f) return;
    e.preventDefault();
    const inp = f.querySelector('input'), text = inp.value.trim(); if (!text) return;
    inp.value = ''; CHAT.send(f.dataset.chatForm, text); inp.focus();
  },
};
/* CHAT.refresh сверяется с App.state.page — подставляем совместимый объект; дата в чате — день демонстрации, а не календарный */
const App = { state: { page: 'overview' } };
const chatMsgs = CHAT.msgsHtml;
CHAT.msgsHtml = function (pageId, from) { return chatMsgs.call(this, pageId, from).replace(/Сегодня, [^<]+/, `Сегодня, ${fmtDate(DEMO.date)}`); };
document.addEventListener('DOMContentLoaded', () => OV.init());
