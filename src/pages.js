/* ============================================================
   Страницы: Логистика, Сотрудники, заглушки. Маршрутизация и события.
   ============================================================ */

const pct16 = (a, b) => b ? Math.round(16 * a / b) : 0;
const tripStatus = t => t.bad ? ['Проблема', 'bad'] : t.stage === 4 ? ['Доставлено', 'ok'] : t.stage === 3 ? ['В пути', 'solid'] : t.stage === 2 ? ['Погрузка', 'line'] : t.stage === 1 ? ['Сборка', 'line'] : ['Заявка', 'dashed'];
const stageState = (t, i) => t.stage === 4 || i < t.stage ? 'done' : i === t.stage ? (t.bad ? 'bad' : 'cur') : 'pend';
const rmIcon = (st, i) => st === 'done' ? ic('check', 'xs') : st === 'cur' ? ic('loader', 'sm spin') : st === 'bad' ? ic('alert', 'xs') : (i + 1);
const hit = (q, ...fields) => !q || fields.join(' ').toLowerCase().includes(q);
const driverName = id => id ? shortName(BY_ID[id].name) : '—';

const App = {
  state: {
    page: 'logistics', dir: 'all', trip: 'Р-1042', dept: null, q: '',
    theme: localStorage.getItem('riva.theme') || 'light',
  },
  el: {},

  init() {
    this.el = { side: document.getElementById('side'), topbar: document.getElementById('topbar'), grid: document.getElementById('grid'), chatcol: document.getElementById('chatcol') };
    document.documentElement.dataset.theme = this.state.theme;
    XP.init();
    window.addEventListener('hashchange', () => this.route());
    document.addEventListener('click', e => this.onClick(e));
    document.addEventListener('submit', e => this.onSubmit(e));
    document.addEventListener('input', e => this.onInput(e));
    document.addEventListener('keydown', e => {
      if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); document.querySelector('[data-search]')?.focus(); }
    });
    this.route();
  },

  page() { return PAGES.find(p => p.id === this.state.page); },

  route() {
    const id = location.hash.replace('#', '') || 'logistics';
    this.state.page = PAGES.some(p => p.id === id) ? id : 'logistics';
    this.state.q = ''; this.state.dept = null; this.state.all = false;
    XP.closeAll();
    this.renderSide(); this.renderTopbar(); this.renderGrid(); this.renderChat();
    this.el.grid.scrollTop = 0;
  },

  /* ---------- боковая колонка: стеклянные иконки страниц, подписи всплывают ---------- */
  companyPanel() {
    return `<div class="ph"><span class="t">${COMPANY.name}</span><span class="mute small">структура предприятия</span><button class="btn ghost sm icon" data-xp-close style="margin-left:auto">${ic('x', 'sm')}</button></div>
      <div class="pb" style="display:grid;gap:7px;width:310px">
        ${DIRS.map(d => {
          const n = STAFF.filter(p => Array.isArray(p.dirs) && p.dirs.includes(d.id)).length;
          return `<div class="tile"><div class="row between"><span class="t">${d.name}</span><span class="mute xsmall">${n} чел.</span></div>
            <div class="row small mute" style="margin-top:4px;gap:6px">${ic('wh', 'xs')}${DEPTS[2].names[d.id]} <span>·</span> ${ic('factory', 'xs')}${DEPTS[3].names[d.id]} <span>·</span> ${ic('tag', 'xs')}${DEPTS[4].names[d.id].replace('Продажи · ', 'продажи ')}</div></div>`;
        }).join('')}
        <div class="tile" style="background:repeating-linear-gradient(135deg,var(--surface-2) 0 10px,var(--surface-3) 10px 11px)"><div class="t">Общие службы на все направления</div><div class="small mute" style="margin-top:3px">Руководство · Логистика · Финансы · Клиентский сервис · Кадры · ${STAFF.filter(p => p.dirs === 'all').length} чел.</div></div>
      </div>`;
  },

  renderSide() {
    const s = this.state, dark = s.theme === 'dark';
    this.el.side.innerHTML = `
      <a class="logo-tile" href="#logistics" data-tip="RIVA · прототип для ПК">R</a>
      <nav class="dock">${PAGES.map(pg => `<a href="#${pg.id}" class="dk-item ${pg.id === s.page ? 'active' : ''}" data-tip="${pg.name}${pg.ready ? '' : ' · эскиз'}">${glassIcon(pg.icon, pg.id === s.page ? 'n' : 'i')}${pg.unread ? `<span class="n">${pg.unread}</span>` : ''}</a>`).join('')}</nav>
      <div class="side-foot">
        <button class="rail-btn" data-theme-toggle data-tip="${dark ? 'Светлая тема' : 'Тёмная тема'}">${glassIcon(dark ? 'sun' : 'moon', 'i')}</button>
        <div class="rail-me" data-tip="${ME.name} · ${ME.pos}">${glassIcon('user', 'i')}<i class="on"></i></div>
      </div>`;
  },

  /* ---------- верхняя полоса: заголовок, направление, поиск, действия ---------- */
  renderTopbar() {
    const s = this.state, pg = this.page();
    const dirLabel = s.dir === 'all' ? 'Все направления' : DIR[s.dir].name;
    const dirBtn = `<button class="btn" title="Направление деятельности">${s.dir === 'all' ? ic('layers', 'sm') : `<span class="chip dir" style="height:18px;padding:0;border:0;background:none"><span class="dk">${DIR[s.dir].k}</span></span>`}${dirLabel}${ic('down', 'sm')}</button>`;
    const dirPanel = `<div class="menu" style="width:260px">
      <div class="lbl">Направление деятельности</div>
      ${['all', ...DIRS.map(d => d.id)].map(id => `<button class="${id === s.dir ? 'on' : ''}" data-dir="${id}">${id === 'all' ? ic('layers', 'sm') : `<span class="chip dir" style="height:18px;padding:0;border:0;background:none"><span class="dk">${DIR[id].k}</span></span>`}${id === 'all' ? 'Все направления' : DIR[id].name}${id === s.dir ? `<span class="chk">${ic('check', 'sm')}</span>` : ''}</button>`).join('')}
      <div class="sep"></div>
      <div class="mute small" style="padding:4px 9px 6px">Общие службы (логистика, финансы, кадры) видят все направления сразу. Склад, производство и продажи ведут учёт по каждому направлению отдельно.</div>
    </div>`;
    const primary = { logistics: 'Рейс', staff: 'Сотрудник' }[pg.id] || 'Запись';
    const ph = { logistics: 'Рейсы, водители, заявки…', staff: 'Сотрудники, должности…' }[pg.id] || 'Поиск…';
    this.el.topbar.innerHTML = `
      <div class="tb-ic">${ic(pg.icon)}</div>
      <div><div class="tb-title">${pg.name}</div><div class="tb-sub">${pg.sub}</div></div>
      <div style="width:6px"></div>
      ${xp({ id: 'company', head: `<button class="btn ghost" title="Предприятие">${ic('building', 'sm')}${COMPANY.name}${ic('down', 'sm')}</button>`, panel: this.companyPanel(), place: 'below' })}
      ${xp({ id: 'dir', head: dirBtn, panel: dirPanel, place: 'below' })}
      <div class="grow"></div>
      <label class="search">${ic('search', 'sm')}<input placeholder="${ph}" data-search value="${esc(s.q)}"><kbd>/</kbd></label>
      <button class="btn primary">${glassIcon('plus', themeInv(), 'sm')}${primary}</button>
      <button class="btn icon" title="Уведомления">${ic('bell', 'sm')}<i class="dot-n"></i></button>
      <button class="btn" title="Чат страницы: открывается поверх контента справа" data-chat-toggle>${ic('chat', 'sm')}Чат${pg.unread ? `<span class="badge-n">${pg.unread}</span>` : ''}</button>`;
  },

  renderGrid() {
    const pg = this.page();
    this.el.grid.innerHTML = pg.id === 'logistics' ? this.logistics() : pg.id === 'staff' ? this.staff() : this.stub(pg);
  },

  /* чат открывается кнопкой «Чат» в шапке и раскрывается поверх контента справа с блюр-фокусом */
  renderChat() {
    const pg = this.page();
    this.el.chatcol.innerHTML = `<div class="xp-panel chat-pop">${CHAT.render(pg.id)}</div>`;
    const m = document.getElementById('chat-msgs'); if (m) m.scrollTop = m.scrollHeight;
  },

  /* ---------- Логистика ---------- */
  logistics() {
    const s = this.state, q = s.q.trim().toLowerCase();
    const inDir = t => s.dir === 'all' || t.dir === s.dir;
    const trips = TRIPS.filter(t => inDir(t) && hit(q, t.id, t.from, t.to, t.veh, t.cargo, t.driver ? BY_ID[t.driver].name : ''));
    const reqs = REQUESTS.filter(r => inDir(r) && hit(q, r.id, r.what, r.from));
    const all = TRIPS.filter(inDir);
    const cnt = f => all.filter(f).length;

    /* рейсы — строки раскрываются поверх следующих */
    const cols = '72px 96px minmax(0,1.8fr) minmax(0,1.2fr) minmax(0,1fr) 96px 72px';
    const rows = trips.map(t => {
      const [stName, stCls] = tripStatus(t), last = t.times.filter(Boolean).pop() || '';
      const head = `<div class="tr clickable ${t.id === s.trip ? 'sel' : ''}" style="grid-template-columns:${cols}" data-trip="${t.id}">
          <div><div class="t num">${t.id}</div><div class="s">${t.km ? t.km + ' км' : 'внутр.'}</div></div>
          <div>${chipDir(t.dir)}</div>
          <div class="ellip"><span class="t">${t.from}</span> <span class="mute">→</span> ${t.to}</div>
          <div><div class="ellip">${t.veh}</div><div class="s">${driverName(t.driver)}</div></div>
          <div class="ellip">${t.cargo}</div>
          <div><span class="chip ${stCls}">${stName}</span></div>
          <div class="num small">${t.stage === 3 ? `<span class="mute">до</span> ${t.eta}` : last}</div>
        </div>`;
      const req = REQUESTS.find(r => r.trip === t.id);
      const panel = `<div class="ph">${chipDir(t.dir)}<span class="t num">Рейс ${t.id}</span><span class="mute small ellip">${t.from} → ${t.to}</span><span class="chip ${stCls}">${stName}</span><button class="btn ghost sm icon" data-xp-close style="margin-left:auto">${ic('x', 'sm')}</button></div>
        <div class="pb cols-3">
          <div><div class="sec-t">Маршрут</div><dl class="kv"><dt>Откуда</dt><dd>${t.from}</dd><dt>Куда</dt><dd>${t.to}</dd><dt>Расстояние</dt><dd>${t.km ? t.km + ' км' : 'внутреннее'}</dd><dt>Прибытие</dt><dd>${t.eta}</dd><dt>Контакт</dt><dd>${t.contact}</dd></dl></div>
          <div><div class="sec-t">Транспорт и груз</div><dl class="kv"><dt>Машина</dt><dd>${t.veh}</dd><dt>Водитель</dt><dd>${t.driver ? `<span class="row" style="gap:6px">${av(BY_ID[t.driver])}${BY_ID[t.driver].name}</span>` : 'не назначен'}</dd><dt>Груз</dt><dd>${t.cargo}</dd><dt>Заявка</dt><dd>${req ? `${req.id} · ${req.from}` : '—'}</dd><dt>Сейчас</dt><dd>${t.prog}</dd></dl></div>
          <div><div class="sec-t">Документы</div><div class="docs">${t.docs.length ? t.docs.map(d => `<div class="doc">${ic('file', 'xs')}<span class="grow ellip">${d}</span>${ic('right', 'xs')}</div>`).join('') : '<span class="mute small">пока нет</span>'}</div><div class="sec-t" style="margin-top:10px">Примечание</div><div class="small">${t.note}</div></div>
        </div>
        <div class="pf"><button class="btn sm">${ic('pin', 'xs')}На карте</button><button class="btn sm">${ic('chat', 'xs')}Сообщить заказчику</button><button class="btn sm ghost">Изменить этап</button><span class="grow"></span><button class="btn sm ghost">${ic('edit', 'xs')}Редактировать</button></div>`;
      return xp({ id: 'trip-' + t.id, head, panel, place: 'over-wide', cls: 'trw' });
    }).join('');
    const tripsBody = `<div class="tbl"><div class="tr th" style="grid-template-columns:${cols}"><div>Рейс</div><div>Направление</div><div>Маршрут</div><div>Транспорт · водитель</div><div>Груз</div><div>Этап</div><div>Время</div></div>${rows || '<div class="mute small" style="padding:14px 10px">Ничего не найдено</div>'}</div>`;

    /* заявки на доставку от разных направлений */
    const rcols = '48px 88px minmax(0,1fr) 100px';
    const reqRows = reqs.map(r => {
      const t = TRIPS.find(x => x.id === r.trip);
      const assign = xp({ id: 'assign-' + r.id, head: `<button class="btn sm primary">Назначить${icRaw('down', 'xs')}</button>`, place: 'below-r', panel: `<div class="menu" style="width:290px"><div class="lbl">Назначить на рейс</div><button data-assign="${r.id}:new">${ic('plus', 'sm')}Новый рейс</button>${TRIPS.filter(x => x.stage <= 1 && x.dir === r.dir).map(x => `<button data-assign="${r.id}:${x.id}">${ic('truck', 'sm')}<span class="grow ellip">${x.id} · ${x.from} → ${x.to}</span></button>`).join('')}</div>` });
      const prio = r.prio === 'high' ? `<span style="color:var(--bad);font-weight:500">срочно</span>` : r.prio === 'low' ? 'не срочно' : 'обычно';
      return `<div class="tr" style="grid-template-columns:${rcols};min-height:46px">
          <div class="t num">${r.id}</div><div>${chipDir(r.dir)}</div>
          <div><div class="ellip">${r.what}</div><div class="s ellip">${r.from} · ${shortName(BY_ID[r.who].name)} · ${r.due} · ${prio}</div></div>
          <div>${t ? `<span class="chip ${tripStatus(t)[1]}">${glassIcon('truck', tripStatus(t)[1] === 'solid' ? themeInv() : themeVar(), 'xs')}${t.id}</span>` : assign}</div>
        </div>`;
    }).join('');
    const reqBody = `<div class="tbl"><div class="tr th" style="grid-template-columns:${rcols}"><div>№</div><div>Направление</div><div>Что и куда · от кого · срок</div><div>Рейс</div></div>${reqRows || '<div class="mute small" style="padding:14px 10px">Заявок нет</div>'}</div>`;

    /* транспорт */
    const fcols = 'minmax(0,1fr) 80px auto';
    const fleetRows = FLEET.map(f => `<div class="tr" style="grid-template-columns:${fcols};min-height:46px">
        <div><div class="t ellip">${f.name} <span class="mute num" style="font-weight:400">· ${f.plate}</span></div><div class="s ellip">${f.driver ? shortName(BY_ID[f.driver].name) : 'без водителя'}${f.to ? ' · ' + f.to : ''}</div></div>
        <div class="row" style="gap:6px" title="Загрузка">${ticks(f.load, 10, 'fg')}<span class="mute xsmall num">${f.load * 10}%</span></div>
        <div><span class="chip ${f.cls}">${f.state}</span></div>
      </div>`).join('');
    const fleetBody = `<div class="tbl"><div class="tr th" style="grid-template-columns:${fcols}"><div>Машина · водитель · обслуживание</div><div>Загрузка</div><div>Состояние</div></div>${fleetRows}</div>`;

    return mod({ span: 12, title: 'Рейсы сегодня', sub: `${trips.length} из ${TRIPS.length} · строка раскрывается поверх списка, не сдвигая его`, body: tripsBody, tight: true, acts: `<button class="btn ghost sm">${ic('filter', 'sm')}Фильтр</button><button class="btn ghost sm icon">${ic('more', 'sm')}</button>` })
      + mod({ span: 7, title: 'Заявки на доставку', sub: 'от отделов продаж и складов всех направлений', body: reqBody, tight: true, acts: `<button class="btn ghost sm icon">${ic('more', 'sm')}</button>` })
      + mod({ span: 5, title: 'Транспорт', sub: `${FLEET.length} единиц · ${FLEET.filter(f => f.cls === 'solid').length} в рейсе`, body: fleetBody, tight: true, acts: `<button class="btn ghost sm">${ic('wrench', 'sm')}ТО</button>` });
  },

  /* ---------- Сотрудники ---------- */
  staff() {
    const s = this.state, q = s.q.trim().toLowerCase();
    const inDir = p => s.dir === 'all' || p.dirs === 'all' || p.dirs.includes(s.dir);
    const inDept = p => !s.dept || (p.dept === s.dept.id && (!s.dept.dir || p.dirs === 'all' || p.dirs.includes(s.dept.dir)));
    const people = STAFF.filter(p => inDir(p) && inDept(p) && hit(q, p.name, p.pos, DEPTS.find(d => d.id === p.dept).name));
    const deptName = p => { const d = DEPTS.find(x => x.id === p.dept); return d.perDir ? d.names[p.dirs[0]] : d.name; };

    /* карта подразделений: общие службы — на все направления, остальные — по каждому */
    const cells = DEPTS.map(d => {
      const lbl = `<div class="rl">${d.name}</div>`;
      if (d.shared) {
        const ps = STAFF.filter(p => p.dept === d.id), sel = s.dept && s.dept.id === d.id;
        return lbl + `<div class="dcell shared ${sel ? 'sel' : ''}" data-dcell="${d.id}"><div><div class="t">Общая служба · все направления</div><div class="s">${ps.length} чел. · ${ps.filter(p => p.on).length} онлайн</div></div><span class="grow"></span>${avs(ps, 5)}</div>`;
      }
      return lbl + DIRS.map(dir => {
        const ps = STAFF.filter(p => p.dept === d.id && p.dirs.includes(dir.id)), sel = s.dept && s.dept.id === d.id && s.dept.dir === dir.id;
        return `<div class="dcell ${sel ? 'sel' : ''}" data-dcell="${d.id}" data-ddir="${dir.id}"><div class="t">${d.names[dir.id]}</div><div class="s">${ps.length} чел. · ${ps.filter(p => p.on).length} онлайн</div></div>`;
      }).join('');
    }).join('');
    const dmap = `<div class="dmap"><div class="hd">Подразделение</div>${DIRS.map(d => `<div class="hd dir">${chipDir(d.id)}</div>`).join('')}${cells}</div>`;

    /* сегодня */
    const c = st => STAFF.filter(p => p.st === st).length;
    const absent = STAFF.filter(p => p.st === 'vacation' || p.st === 'sick');
    const today = `<div class="kpis" style="grid-template-columns:repeat(4,1fr)">
        <div class="kpi"><b>${c('office')}</b><span>${dot('ok')}в офисе и цехах</span></div>
        <div class="kpi"><b>${c('remote')}</b><span>${dot('')}удалённо</span></div>
        <div class="kpi"><b>${c('trip')}</b><span>${dot('fg')}в рейсе</span></div>
        <div class="kpi"><b>${absent.length}</b><span>${dot('warn')}отсутствуют</span></div>
      </div>
      <div class="dirbar" style="margin-top:10px;grid-template-columns:104px 1fr auto"><span class="small mute">На связи сейчас</span>${ticks(pct16(STAFF.filter(p => p.on).length, STAFF.length), 16)}<span class="n">${STAFF.filter(p => p.on).length} из ${STAFF.length}</span></div>
      <div class="sec-t" style="margin-top:12px">Отсутствуют</div>
      <div class="tbl">${absent.map(p => `<div class="tr" style="grid-template-columns:minmax(0,1fr) auto;min-height:36px;padding:0 4px">
        <div class="row" style="gap:8px">${av(p)}<div class="grow"><div class="ellip small" style="font-weight:500">${p.name}</div><div class="s">${deptName(p)}</div></div></div>
        <span class="chip ${ST[p.st].cls}">${ST[p.st].name}${p.st === 'vacation' ? ' · до 12 окт' : ' · с 1 окт'}</span></div>`).join('')}</div>
      <div class="sec-t" style="margin-top:12px">Ближайшее</div>
      <div class="tbl">${[[26, 'обучение на ТСД', '6 окт'], [18, 'день рождения', '9 окт'], [12, 'выход из отпуска', '13 окт'], [19, 'конец испытательного срока', '20 окт']].map(([id, what, when]) => `<div class="tr" style="grid-template-columns:minmax(0,1fr) auto;min-height:34px;padding:0 4px">
        <div class="row" style="gap:8px">${av(BY_ID[id])}<div class="grow ellip small"><span style="font-weight:500">${shortName(BY_ID[id].name)}</span> <span class="mute">· ${what}</span></div></div><span class="small mute num">${when}</span></div>`).join('')}</div>`;

    /* таблица сотрудников — строки раскрываются поверх списка */
    const cols = 'minmax(0,1.6fr) minmax(0,1fr) 130px 150px 92px';
    const filtered = q || s.dept || s.dir !== 'all';
    const shown = filtered || s.all ? people : people.slice(0, 12);
    const rows = shown.map(p => {
      const head = `<div class="tr clickable" style="grid-template-columns:${cols}">
          <div class="row" style="gap:9px">${av(p)}<div class="grow"><div class="t ellip">${p.name}${p.newbie ? ' <span class="chip dashed" style="height:18px;font-size:10.5px">адаптация</span>' : ''}</div><div class="s ellip">${p.pos}</div></div></div>
          <div class="ellip small">${deptName(p)}</div>
          <div>${chipDirs(p.dirs)}</div>
          <div>${pageIcons(p.role)}</div>
          <div><span class="chip ${ST[p.st].cls}">${ST[p.st].name}</span></div>
        </div>`;
      const role = ROLES[p.role];
      const matrix = `<div class="matrix" style="grid-template-columns:repeat(7,1fr)">${PAGES.map(pg => `<div class="mh" title="${pg.name}">${ic(pg.icon, 'xs')}</div>`).join('')}${PAGES.map(pg => { const a = role.pages[pg.id]; return `<div class="mc ${a === 'full' ? '' : a === 'view' ? 'view' : 'no'}">${a === 'full' ? ic('check', 'xs') : a === 'view' ? 'просм.' : '—'}</div>`; }).join('')}</div>`;
      const ob = ONBOARDING.find(o => o.who === p.id);
      const panel = `<div class="ph">${av(p, 'lg')}<div><div class="t">${p.name}</div><div class="mute small">${p.pos} · ${deptName(p)}</div></div><span class="chip ${ST[p.st].cls}">${ST[p.st].name}</span>${p.on ? `<span class="chip ok">${dot('ok')}онлайн</span>` : ''}<button class="btn ghost sm icon" data-xp-close style="margin-left:auto">${ic('x', 'sm')}</button></div>
        <div class="pb cols-3">
          <div><div class="sec-t">Контакты</div><dl class="kv"><dt>Телефон</dt><dd class="num">${p.tel}</dd><dt>Почта</dt><dd class="ellip">${p.mail || '—'}</dd><dt>График</dt><dd>${p.role === 'driver' ? 'по рейсам' : 'пн–пт · 08:00–17:00'}</dd><dt>Руководитель</dt><dd>${p.dept === 'mgmt' ? '—' : p.dept === 'log' && p.id !== 2 ? 'Савельев А.' : 'Орлов Д.'}</dd></dl></div>
          <div><div class="sec-t">Направления</div><div class="row" style="flex-wrap:wrap;gap:4px;margin-bottom:10px">${chipDirs(p.dirs)}</div><div class="sec-t">Доступ к страницам · роль «${role.name}»</div>${matrix}</div>
          <div><div class="sec-t">${ob ? 'Адаптация' : 'Сегодня'}</div>${ob
            ? `<div class="steps">${ob.steps.map((n, i) => `<div class="st ${i < ob.done ? 'done' : i === ob.cur ? 'cur' : ''}"><span class="ic">${i < ob.done ? ic('check', 'xs') : i + 1}</span><span class="n small">${n}</span></div>`).join('')}</div>`
            : `<dl class="kv"><dt>Статус</dt><dd>${ST[p.st].name}</dd><dt>В RIVA</dt><dd>${p.on ? 'сейчас онлайн' : 'был(а) сегодня 08:4' + (p.id % 10)}</dd><dt>Задач</dt><dd>${(p.id * 7) % 9 + 1} открытых</dd></dl>`}</div>
        </div>
        <div class="pf"><button class="btn sm">${ic('chat', 'xs')}Написать</button><button class="btn sm">${ic('shield', 'xs')}Изменить доступ</button><span class="grow"></span><button class="btn sm ghost">${ic('edit', 'xs')}Карточка</button></div>`;
      return xp({ id: 'emp-' + p.id, head, panel, place: 'over-wide', cls: 'trw' });
    }).join('');
    const filterChip = s.dept ? `<span class="chip line">${DEPTS.find(d => d.id === s.dept.id).name}${s.dept.dir ? ' · ' + DIR[s.dept.dir].short : ''}<button class="btn ghost sm icon" data-clear-dept style="width:18px;height:18px;margin:-2px -6px -2px 0">${ic('x', 'xs')}</button></span>` : '';
    const more = shown.length < people.length ? `<div class="row" style="padding:8px 6px 4px"><button class="btn sm ghost" data-show-all>${ic('down', 'xs')}Показать всех · ${people.length}</button></div>` : '';
    const table = `<div class="tbl"><div class="tr th" style="grid-template-columns:${cols}"><div>Сотрудник</div><div>Подразделение</div><div>Направления</div><div>Доступ к страницам</div><div>Статус</div></div>${rows || '<div class="mute small" style="padding:14px 10px">Никого не найдено</div>'}</div>${more}`;

    /* адаптация — дорожная карта */
    const onb = ONBOARDING.map(o => { const p = BY_ID[o.who]; return `<div class="rm" style="margin-bottom:8px">
        <div class="rm-head">${av(p)}<span class="t">${shortName(p.name)}</span><span class="n ellip">${p.pos}</span><span class="grow"></span><span class="n num">${o.done} / ${o.steps.length}</span></div>
        ${o.steps.map((n, i) => { const st = i < o.done ? 'done' : i === o.cur ? 'cur' : 'pend'; return `<div class="rm-step ${st}" style="padding:5px 0"><span class="rm-ic">${rmIcon(st, i)}</span><span class="rm-name small">${n}</span><span class="rm-time">${i < o.done ? 'готово' : i === o.cur ? 'сейчас' : ''}</span></div>`; }).join('')}
      </div>`; }).join('<div style="height:1px;background:var(--line);margin:4px 0 10px"></div>');

    /* роли и доступ — раскрывается влево поверх таблицы */
    const rolesHead = n => `<div class="row" style="height:36px;padding:0 4px">${ic(n ? 'up' : 'down', 'sm')}<span class="b">Роли и доступ</span><span class="grow"></span><span class="mute small">${Object.keys(ROLES).length} ролей · ${PAGES.length} страниц</span></div>`;
    const rolesPanel = `<div style="padding:4px 8px 8px">${rolesHead(true)}
      <div class="matrix" style="grid-template-columns:150px repeat(7,1fr)"><div></div>${PAGES.map(pg => `<div class="mh">${pg.name}</div>`).join('')}
      ${Object.values(ROLES).map(r => `<div class="mr small">${r.name}</div>${PAGES.map(pg => { const a = r.pages[pg.id]; return `<div class="mc ${a === 'full' ? '' : a === 'view' ? 'view' : 'no'}">${a === 'full' ? ic('check', 'xs') : a === 'view' ? 'просм.' : '—'}</div>`; }).join('')}`).join('')}</div>
      <div class="mute small" style="margin-top:8px">Доступ к странице открывает и её чат. Доступ по направлению ограничивает склад, цех и продажи своим направлением; общие службы видят все.</div></div>`;
    const roles = `${xp({ id: 'roles', head: rolesHead(false), panel: `<div style="width:min(640px, 80vw)">${rolesPanel}</div>`, place: 'over-wide roles-panel', cls: 'roles-xp' })}
      <div class="tiles" style="grid-template-columns:1fr 1fr;padding:6px 4px 0;border-top:1px solid var(--line);margin-top:6px">${Object.values(ROLES).slice(0, 4).map(r => `<div class="tile" style="padding:7px 10px"><div class="t">${r.name}</div><div class="s">${Object.values(r.pages).filter(a => a === 'full').length} страниц · ${STAFF.filter(p => ROLES[p.role] === r).length} чел.</div></div>`).join('')}</div>`;

    return mod({ span: 7, title: 'Карта подразделений', sub: 'общие службы работают на все направления, учёт склада, цеха и продаж — по каждому отдельно', body: dmap, tight: true })
      + mod({ span: 5, title: 'Сегодня', sub: todayStr(), body: today })
      + mod({ span: 12, title: 'Сотрудники', sub: `${shown.length} из ${STAFF.length}${shown.length < people.length ? ' · показаны первые' : ''} · строка раскрывается поверх списка, не сдвигая его`, body: table, tight: true, acts: `${filterChip}<button class="btn ghost sm">${ic('filter', 'sm')}Фильтр</button>` })
      + mod({ span: 6, title: 'Адаптация', sub: 'новые сотрудники · этапы', body: onb })
      + mod({ span: 6, title: 'Роли и доступ', sub: 'раскрывается влево поверх соседнего модуля', body: roles, tight: true });
  },

  /* ---------- страницы, которые ещё не спроектированы ---------- */
  stub(pg) {
    const st = STUBS[pg.id];
    const body = `<div class="stub"><span class="chip dashed">эскиз · проектируется следующей</span><h2>${pg.name}</h2><p>${st.text}</p><div class="sec-t" style="margin-top:8px">Модули страницы</div><ul>${st.mods.map(m => `<li>${m}</li>`).join('')}</ul>
      <div class="row" style="margin-top:8px;gap:6px"><button class="btn sm primary">${ic('plus', 'xs')}Предложить модуль</button><a class="btn sm" href="#logistics">Открыть «Логистика»</a><a class="btn sm" href="#staff">Открыть «Сотрудники»</a></div></div>`;
    return mod({ span: 12, title: pg.name, sub: pg.sub, body });
  },

  /* ---------- события ---------- */
  reopen(id) { const el = document.querySelector(`[data-xp="${id}"]`); if (el) XP.show(el); },

  onClick(e) {
    const t = e.target;
    const themeBtn = t.closest('[data-theme-set],[data-theme-toggle]');
    if (themeBtn) { this.state.theme = themeBtn.dataset.themeSet || (this.state.theme === 'dark' ? 'light' : 'dark'); localStorage.setItem('riva.theme', this.state.theme); document.documentElement.dataset.theme = this.state.theme; XP.closeAll(); this.renderSide(); this.renderTopbar(); this.renderGrid(); this.renderChat(); return; }
    if (t.closest('[data-chat-toggle]')) { XP.toggle(this.el.chatcol); return; }
    if (t.closest('[data-xp-close]')) { XP.close(); return; }
    const dirBtn = t.closest('[data-dir]');
    if (dirBtn) { this.state.dir = dirBtn.dataset.dir; XP.close(); this.renderTopbar(); this.renderGrid(); return; }
    const task = t.closest('[data-task]');
    if (task) { const i = +task.dataset.task; SHIFT_TASKS[i].done = !SHIFT_TASKS[i].done; this.renderGrid(); this.reopen('tasks'); return; }
    const assign = t.closest('[data-assign]');
    if (assign) {
      const [rid, tid] = assign.dataset.assign.split(':'); const r = REQUESTS.find(x => x.id === rid);
      if (tid === 'new') { const id = 'Р-' + (1050 + TRIPS.filter(x => x.id >= 'Р-1050').length); TRIPS.push({ id, dir: r.dir, from: 'Склад ' + { metal: 'А', furn: 'Б', poly: 'В' }[r.dir], to: r.what.split('→')[1]?.trim() || '—', veh: 'не назначен', driver: null, cargo: r.what.split('→')[0].trim(), stage: 0, times: [nowTime(), '', '', '', ''], eta: '—', km: 0, prog: 'создан из заявки ' + r.id, docs: [], contact: '—', note: 'Создан из заявки ' + r.id + '.' }); r.trip = id; }
      else r.trip = tid;
      XP.close(); this.renderGrid(); return;
    }
    const cell = t.closest('[data-dcell]');
    if (cell) { const d = { id: cell.dataset.dcell, dir: cell.dataset.ddir || null }; this.state.dept = this.state.dept && this.state.dept.id === d.id && this.state.dept.dir === d.dir ? null : d; XP.close(); this.renderGrid(); return; }
    if (t.closest('[data-clear-dept]')) { this.state.dept = null; XP.close(); this.renderGrid(); return; }
    if (t.closest('[data-show-all]')) { this.state.all = true; this.renderGrid(); return; }
    const trip = t.closest('[data-trip]');
    if (trip && trip.dataset.trip !== this.state.trip) {
      this.state.trip = trip.dataset.trip;
      document.querySelectorAll('[data-trip]').forEach(el => el.classList.toggle('sel', el.dataset.trip === this.state.trip));
    }
    const tg = t.closest('[data-xp-toggle]');
    if (tg) { if (t.closest('a,button') && !t.closest('.xp-head > .company, .xp-head > .btn, .xp-head > .avs')) return; XP.toggle(tg.closest('.xp')); return; }
    if (!t.closest('.xp-panel')) XP.closeAll();
  },

  onSubmit(e) {
    const f = e.target.closest('[data-chat-form]'); if (!f) return;
    e.preventDefault();
    const inp = f.querySelector('input'), text = inp.value.trim(); if (!text) return;
    CHAT.send(f.dataset.chatForm, text);
    document.querySelector('.chat-in')?.focus();
  },

  onInput(e) {
    if (e.target.matches('[data-search]')) { this.state.q = e.target.value; XP.close(); this.renderGrid(); }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
