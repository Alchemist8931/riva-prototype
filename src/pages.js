/* ============================================================
   Страницы: Логистика, Сотрудники, заглушки. Маршрутизация и события.
   ============================================================ */

const pct16 = (a, b) => b ? Math.round(16 * a / b) : 0;
const rmIcon = (st, i) => st === 'done' ? ic('check', 'xs') : st === 'cur' ? ic('loader', 'sm spin') : st === 'bad' ? ic('alert', 'xs') : (i + 1);
const hit = (q, ...fields) => !q || fields.join(' ').toLowerCase().includes(q);
const fmtMoney = n => n.toLocaleString('ru-RU');
const fmtSize = b => b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' КБ' : (b / 1024 / 1024).toFixed(1).replace('.', ',') + ' МБ';
const todayShort = () => new Date().toLocaleDateString('ru-RU');

const App = {
  state: {
    page: 'supply', dir: 'all', dept: null, q: '', company: 'bereg',
    theme: localStorage.getItem('riva.theme') || 'light',
  },
  el: {},
  seen: {},     // страницы, уже показанные с каскадом появления
  pending: [],  // файлы, прикреплённые в форме новой заявки до её создания

  init() {
    this.el = { side: document.getElementById('side'), topbar: document.getElementById('topbar'), grid: document.getElementById('grid'), chatcol: document.getElementById('chatcol'), notifcol: document.getElementById('notifcol') };
    document.documentElement.dataset.theme = this.state.theme;
    XP.init(); BG.init();
    window.addEventListener('hashchange', () => this.route());
    document.addEventListener('click', e => this.onClick(e));
    document.addEventListener('submit', e => this.onSubmit(e));
    document.addEventListener('input', e => this.onInput(e));
    document.addEventListener('change', e => this.onChange(e));
    document.addEventListener('keydown', e => {
      if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); document.querySelector('[data-search]')?.focus(); }
    });
    this.route();
  },

  page() { return PAGES.find(p => p.id === this.state.page); },

  route() {
    const id = (location.hash.replace('#', '') || 'supply').replace('logistics', 'supply');
    const next = PAGES.some(p => p.id === id) ? id : 'supply';
    const render = () => {
      this.state.page = next;
      this.state.q = ''; this.state.dept = null; this.state.all = false; this.pending = [];
      // каскад появления — только при первом показе страницы; дальше страницы сменяются перекрёстным затуханием без перерисовки каскадом
      this.renderSide(); this.renderTopbar(); this.renderGrid(!this.seen[next]); this.seen[next] = true; this.renderChat(); this.renderNotifs();
      this.el.grid.scrollTo({ top: 0, behavior: 'instant' });   // у сетки scroll-behavior: smooth, сброс должен быть мгновенным
    };
    XP.closeAll();
    // строго boolean: undefined на первом вызове включал бы значение по умолчанию (true) — переход срабатывал при загрузке
    this.transition('vt-nav', render, !!(this.started && next !== this.state.page));
    this.started = true;
  },

  /* View Transitions, если браузер умеет и анимации не отключены; иначе обычная перерисовка */
  transition(cls, render, enabled = true) {
    const html = document.documentElement;
    if (!enabled || !document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) { render(); return; }
    html.classList.add(cls);
    const done = () => html.classList.remove(cls);
    try { document.startViewTransition(render).finished.finally(done); } catch (e) { render(); done(); return; }
    setTimeout(done, 5000);   // страховка на случай, если finished так и не разрешится; раньше снимать нельзя — на медленной машине снимок ещё не сделан
  },

  /* ---------- боковая колонка: стеклянные иконки страниц, подписи всплывают ---------- */
  renderSide() {
    const s = this.state, dark = s.theme === 'dark';
    this.el.side.innerHTML = `
      <a class="logo-tile" href="#supply" data-tip="RIVA · прототип для ПК">R</a>
      <nav class="dock">${PAGES.map(pg => `<a href="#${pg.id}" class="dk-item ${pg.id === s.page ? 'active' : ''}" data-tip="${pg.name}${pg.ready ? '' : ' · эскиз'}">${glassIcon(pg.icon, pg.id === s.page ? 'n' : 'i')}${pg.unread ? `<span class="n">${pg.unread}</span>` : ''}</a>`).join('')}</nav>
      <div class="side-foot">
        ${xp({ id: 'bg', head: `<button class="rail-btn" data-tip="Фон приложения">${glassIcon('wave', 'i')}</button>`, panel: `<div class="menu" style="width:250px"><div class="lbl">Фон приложения</div>${BG.modes.map(([id, name, sub]) => `<button class="co ${id === BG.mode ? 'on' : ''}" data-bg-set="${id}"><span class="grow" style="text-align:left"><span style="display:block">${name}</span><span class="mute xsmall" style="display:block;font-weight:400">${sub}</span></span>${id === BG.mode ? `<span class="chk">${icRaw('check', 'sm')}</span>` : ''}</button>`).join('')}<div class="sep"></div><div class="mute small" style="padding:4px 9px 6px">Выбор сохраняется в этом браузере. Фон виден вокруг окна и сквозь стекло страницы.</div></div>`, place: 'rail' })}
        <button class="rail-btn" data-theme-toggle data-tip="${dark ? 'Светлая тема' : 'Тёмная тема'}">${glassIcon(dark ? 'sun' : 'moon', 'i')}</button>
        <div class="rail-me" data-tip="${ME.name} · ${ME.pos}">${glassIcon('user', 'i')}<i class="on"></i></div>
      </div>`;
  },

  /* ---------- верхняя полоса: заголовок, два одинаковых переключателя (организация, направление), поиск, действия ---------- */
  renderTopbar() {
    const s = this.state, pg = this.page(), co = COMPANIES.find(c => c.id === s.company) || COMPANIES[0];
    const sw = (icon, label, title) => `<button class="btn sw" title="${title}">${icon}<span class="lbl ellip">${label}</span>${ic('down', 'sm')}</button>`;
    const dirIcon = id => id === 'all' ? ic('layers', 'sm') : `<span class="chip dir" style="height:18px;padding:0;border:0;background:none"><span class="dk">${DIR[id].k}</span></span>`;
    const coPanel = `<div class="menu" style="width:260px">
      <div class="lbl">Организация</div>
      ${COMPANIES.map(c => `<button class="co ${c.id === co.id ? 'on' : ''}" data-company="${c.id}">${ic('building', 'sm')}<span class="grow" style="text-align:left"><span style="display:block">${c.name}</span><span class="mute xsmall" style="display:block;font-weight:400">${c.sub}</span></span>${c.id === co.id ? `<span class="chk">${ic('check', 'sm')}</span>` : ''}</button>`).join('')}
      <div class="sep"></div>
      <div class="mute small" style="padding:4px 9px 6px">У каждой организации свои направления, склады и учёт. Общие службы видят все организации, к которым им открыт доступ.</div>
    </div>`;
    const dirPanel = `<div class="menu" style="width:260px">
      <div class="lbl">Направление деятельности</div>
      ${['all', ...DIRS.map(d => d.id)].map(id => `<button class="${id === s.dir ? 'on' : ''}" data-dir="${id}">${dirIcon(id)}${id === 'all' ? 'Все направления' : DIR[id].name}${id === s.dir ? `<span class="chk">${ic('check', 'sm')}</span>` : ''}</button>`).join('')}
      <div class="sep"></div>
      <div class="mute small" style="padding:4px 9px 6px">Общие службы (снабжение, финансы, кадры) видят все направления сразу. Склад, производство и продажи ведут учёт по каждому направлению отдельно.</div>
    </div>`;
    const primary = { supply: 'Заявка', staff: 'Сотрудник' }[pg.id] || 'Запись';
    const ph = { supply: 'Заказ, заявка, поставщик, ИНН…', staff: 'Сотрудники, должности…' }[pg.id] || 'Поиск…';
    const unread = NOTIFS.filter(n => n.unread).length;
    this.el.topbar.innerHTML = `
      <div class="tb-ic">${glassIcon(pg.icon, themeVar())}</div>
      <div class="tb-title">${pg.name}</div>
      <div style="width:6px"></div>
      ${xp({ id: 'company', head: sw(ic('building', 'sm'), co.name, 'Организация'), panel: coPanel, place: 'below' })}
      ${xp({ id: 'dir', head: sw(dirIcon(s.dir), s.dir === 'all' ? 'Все направления' : DIR[s.dir].name, 'Направление деятельности'), panel: dirPanel, place: 'below' })}
      <div class="grow"></div>
      <label class="search">${ic('search', 'sm')}<input placeholder="${ph}" data-search value="${esc(s.q)}"><kbd>/</kbd></label>
      ${xp({ id: 'new', head: `<button class="btn primary">${glassIcon('plus', themeInv(), 'sm')}${primary}</button>`, panel: this.newForm(pg), place: 'below-r' })}
      <button class="btn icon" title="Уведомления" data-notif-toggle>${ic('bell', 'sm')}${unread ? '<i class="dot-n"></i>' : ''}</button>
      <button class="btn" title="Чат страницы: открывается поверх контента справа" data-chat-toggle>${ic('chat', 'sm')}Чат${pg.unread ? `<span class="badge-n">${pg.unread}</span>` : ''}</button>`;
  },

  /* форма новой записи под кнопкой в шапке: заявка на снабжение, сотрудник; на страницах-эскизах — заглушка */
  newForm(pg) {
    const close = `<button type="button" class="btn ghost sm icon" data-xp-close style="margin-left:auto">${icRaw('x', 'sm')}</button>`;
    if (pg.id === 'supply') {
      const nextId = 'СН-' + (Math.max(...SUPPLY.map(r => +r.id.replace(/\D/g, ''))) + 1), nextOrder = 'З-' + (Math.max(...SUPPLY.map(r => +r.order.replace(/\D/g, ''))) + 1);
      return `<form data-new="supply" style="width:660px">
        <div class="ph"><span class="t">Новая заявка на снабжение</span><span class="mute small">${nextId} · статус «заявка», дата и время — текущие</span>${close}</div>
        <div class="pb frm">
          ${fld('№ заказа клиента', inp('order', `value="${nextOrder}" required`))}
          ${fld('Направление', sel('dir', DIRS.map(d => [d.id, d.name])))}
          ${fld('Поставщик', inp('supplier', 'placeholder="ООО «…»" required'))}
          ${fld('ИНН поставщика', inp('inn', 'placeholder="10 или 12 цифр" inputmode="numeric" pattern="[0-9]{10}|[0-9]{12}"'))}
          ${fld('Контактное лицо', inp('cname', 'placeholder="Фамилия Имя Отчество"'))}
          ${fld('Телефон', inp('ctel', 'type="tel" placeholder="+7 …"'))}
          ${fld('Почта', inp('cmail', 'type="email" placeholder="name@company.ru"'))}
          ${fld('Срок доставки', inp('eta', 'type="date"'))}
          ${fld('Комментарий', '<textarea class="in" name="comment" rows="6" placeholder="Что закупаем и под какой заказ клиента"></textarea>', 'full')}
          <div class="fld full"><span class="fl">Файлы</span><div class="row"><label class="btn sm">${ic('clip', 'xs')}Прикрепить<input type="file" multiple hidden data-attach></label><span class="mute small ellip" data-attach-list>счёт, договор, УПД и прочее — можно добавить и позже в карточке заказа</span></div></div>
        </div>
        <div class="pf"><button type="button" class="btn sm ghost" data-xp-close>Отмена</button><span class="grow"></span><button type="submit" class="btn sm primary">${glassIcon('plus', themeInv(), 'xs')}Создать заявку</button></div>
      </form>`;
    }
    if (pg.id === 'staff') {
      return `<form data-new="staff" style="width:600px">
        <div class="ph"><span class="t">Новый сотрудник</span><span class="mute small">доступ к страницам откроется по роли</span>${close}</div>
        <div class="pb frm">
          ${fld('Фамилия Имя Отчество', inp('name', 'required placeholder="Иванов Иван Иванович"'), 'full')}
          ${fld('Должность', inp('pos', 'required placeholder="Кладовщик"'))}
          ${fld('Подразделение', sel('dept', DEPTS.map(d => [d.id, d.name])))}
          ${fld('Направление', sel('dirs', [['all', 'Все направления'], ...DIRS.map(d => [d.id, d.name])]))}
          ${fld('Роль в RIVA', sel('role', Object.entries(ROLES).map(([k, r]) => [k, r.name])))}
          ${fld('Телефон', inp('tel', 'type="tel" placeholder="+7 …"'))}
          ${fld('Почта', inp('mail', 'type="email" placeholder="name@bereg.ru"'))}
          ${fld('Дата выхода', inp('start', 'type="date"'))}
          ${fld('Статус', sel('st', Object.entries(ST).map(([k, v]) => [k, v.name])))}
        </div>
        <div class="pf"><button type="button" class="btn sm ghost" data-xp-close>Отмена</button><span class="grow"></span><button type="submit" class="btn sm primary">${glassIcon('plus', themeInv(), 'xs')}Добавить сотрудника</button></div>
      </form>`;
    }
    return `<div style="width:320px"><div class="ph"><span class="t">Новая запись</span>${close}</div><div class="pb mute small">Форма появится вместе с проектированием страницы «${pg.name}»: её поля зависят от модулей страницы.</div></div>`;
  },

  /* создание записи из формы: заявка встаёт первой в списке и раскрывается, сотрудник — в конец таблицы и в адаптацию */
  createRecord(form) {
    const fd = new FormData(form), v = k => (fd.get(k) || '').toString().trim();
    if (form.dataset.new === 'supply') {
      const id = 'СН-' + (Math.max(...SUPPLY.map(r => +r.id.replace(/\D/g, ''))) + 1);
      const eta = v('eta') ? v('eta').split('-').reverse().join('.') : '—';
      SUPPLY.unshift({ id, order: v('order'), dir: v('dir'), st: 'req', hist: [['req', nowStamp()]], supplier: v('supplier'), inn: v('inn') || '—', contact: { name: v('cname') || '—', tel: v('ctel') || '—', mail: v('cmail') || '—' }, eta, comment: v('comment'), files: this.pending.splice(0), items: [] });
      XP.closeAll(); this.renderTopbar(); this.renderGrid(); this.reopen('sup-' + id);
      return;
    }
    if (form.dataset.new === 'staff') {
      const id = Math.max(...STAFF.map(p => p.id)) + 1, dirs = v('dirs');
      const p = { id, name: v('name'), pos: v('pos'), dept: v('dept'), dirs: dirs === 'all' ? 'all' : [dirs], role: v('role'), st: v('st') || 'office', on: false, tel: v('tel') || '—', mail: v('mail'), newbie: true };
      STAFF.push(p); BY_ID[id] = p;
      ONBOARDING.push({ who: id, steps: ['Документы и договор', 'Доступы в RIVA', 'Инструктаж по ТБ', 'Наставник и план', 'Испытательный срок'], done: 0, cur: 0 });
      XP.closeAll(); this.state.all = true; this.renderTopbar(); this.renderGrid();
    }
  },

  /* уведомления: панель раскрывается поверх контента справа, как чат */
  renderNotifs() {
    const unread = NOTIFS.filter(n => n.unread).length, dayName = { today: 'Сегодня', yesterday: 'Вчера' };
    const groups = ['today', 'yesterday'].map(d => {
      const items = NOTIFS.filter(n => n.day === d); if (!items.length) return '';
      return `<div class="sec-t" style="margin:6px 4px 4px">${dayName[d]}</div>` + items.map(n => `<div class="ntf ${n.unread ? 'unread' : ''}"><span class="ic">${ic(n.kind, 'sm')}</span><div class="grow"><div class="t">${esc(n.text)}</div><div class="m">${n.t}${n.who ? ' · ' + esc(n.who) : ''} · <a href="#${n.page}">${PAGES.find(p => p.id === n.page).name}</a></div></div>${n.unread ? '<i class="dot fg"></i>' : ''}</div>`).join('');
    }).join('');
    const body = `<div class="chat">
      <div class="chat-head"><div class="grow"><div class="b small">Уведомления</div><div class="mute xsmall">${unread ? unread + ' непрочитанных' : 'все прочитаны'}</div></div>${unread ? `<button class="btn ghost sm" data-notif-read>${ic('check', 'xs')}Прочитать всё</button>` : ''}<button class="btn ghost sm icon" title="Свернуть" data-notif-toggle>${icRaw('x', 'sm')}</button></div>
      <div class="chat-msgs" style="gap:2px">${groups}</div>
      <div class="chat-form" style="align-items:center;justify-content:space-between"><span class="mute small">Дубли на почту и в Telegram — в настройках профиля</span><button type="button" class="btn ghost sm">${ic('gear', 'xs')}Настроить</button></div>
    </div>`;
    this.el.notifcol.innerHTML = `<div class="xp-panel chat-pop">${mod({ title: 'Уведомления', sub: 'события по страницам, к которым у вас есть доступ', body, cls: 'chat-mod' })}</div>`;
  },

  renderGrid(animate = false) {
    const pg = this.page();
    this.el.grid.classList.toggle('single', pg.id === 'supply');
    this.el.grid.innerHTML = pg.id === 'supply' ? this.supply() : pg.id === 'staff' ? this.staff() : this.stub(pg);
    if (animate) this.animateIn();
  },

  /* каскад появления: модули — по порядку, строки внутри — следом */
  animateIn() {
    const g = this.el.grid;
    [...g.querySelectorAll(':scope > .mod, :scope > .span-4 > .mod')].forEach((m, i) => { m.classList.add('ani'); m.style.setProperty('--i', Math.min(i, 8)); });
    g.querySelectorAll('.recs, .tbl').forEach(list => [...list.children].forEach((r, i) => { if (r.classList.contains('th')) return; r.classList.add('ani'); r.style.setProperty('--d', '80ms'); r.style.setProperty('--i', Math.min(i, 14)); }));
  },

  /* чат открывается кнопкой «Чат» в шапке и раскрывается поверх контента справа с блюр-фокусом; при отправке панель не пересобирается (CHAT.refresh) */
  renderChat() {
    const pg = this.page();
    this.el.chatcol.innerHTML = `<div class="xp-panel chat-pop">${CHAT.render(pg.id)}</div>`;
    this.chatToEnd();
  },
  chatToEnd() { const m = document.getElementById('chat-msgs'); if (m) m.scrollTo({ top: m.scrollHeight, behavior: 'instant' }); },

  /* ---------- Снабжение: один список с прокруткой, карточка заказа раскрывается под строкой ---------- */
  supply() {
    const s = this.state, q = s.q.trim().toLowerCase();
    const list = SUPPLY.filter(r => (s.dir === 'all' || r.dir === s.dir) && hit(q, r.id, r.order, r.supplier, r.inn, r.comment, r.contact.name, SUP_ST[r.st][0]));
    /* колонки: номера, статус, дата изменения (вправо), поставщик, контакт, срок (вправо), комментарий — на 100px шире прежнего */
    const cols = '72px 76px 112px 164px minmax(0,1fr) 34px 122px minmax(0,1.78fr)';
    const head = `<div class="sup-head"><div class="tr th" style="grid-template-columns:${cols}"><div>№ заказа</div><div>№ заявки</div><div>статус</div><div class="r">изменён</div><div class="sup"><span class="inn">ИНН</span><span>поставщик</span></div><div></div><div class="r">срок доставки</div><div>комментарий</div></div></div>`;
    const rows = list.map((r, i) => {
      const [stName, stCls] = SUP_ST[r.st], last = r.hist[r.hist.length - 1], up = i >= list.length - 2 && list.length > 3 ? 'up' : '';
      const hist = `<span class="hp r"><span class="num hp-trg">${fmtDT(last[1])}</span><div class="hp-pop ${up}"><div class="sec-t">История статусов</div>${[...r.hist].reverse().map(([st, at]) => `<div class="row" style="gap:8px;min-height:24px"><span class="chip ${SUP_ST[st][1]}">${SUP_ST[st][0]}</span><span class="num mute small">${fmtDT(at)}</span></div>`).join('')}</div></span>`;
      const contact = `<span class="hp"><span class="ic-btn">${ic('user', 'sm')}</span><div class="hp-pop ${up}"><div class="b">${r.contact.name}</div><div class="num" style="margin-top:3px">${r.contact.tel}</div><div class="mute small">${r.contact.mail}</div></div></span>`;
      const headRow = `<div class="tr clickable" style="grid-template-columns:${cols}">
          <div class="no">${r.order}</div>
          <div class="no">${r.id}</div>
          <div><span class="chip ${stCls}">${stName}</span></div>
          <div class="r">${hist}</div>
          <div class="sup"><span class="inn num">${r.inn}</span><span class="t ellip" title="${esc(r.supplier)}">${r.supplier}</span></div>
          <div>${contact}</div>
          <div class="r num">${fmtDate(r.eta)}</div>
          <div class="ellip small" title="${esc(r.comment)}">${r.comment}</div>
        </div>`;
      return xp({ id: 'sup-' + r.id, head: `<div class="rec-card">${headRow}</div>`, panel: this.orderCard(r), place: 'under', cls: 'rec' });
    }).join('');
    const body = `<div class="sup-list">${head}<div class="recs">${rows || '<div class="mute small" style="padding:14px 10px">Ничего не найдено</div>'}</div></div>`;
    return mod({ span: 12, cls: 'fill', title: 'Заявки на снабжение', sub: `${list.length} из ${SUPPLY.length} · каждая запись в своём контейнере, по клику под ней раскрывается карточка заказа`, body, tight: true, acts: `<button class="btn ghost sm">${ic('filter', 'sm')}Фильтр</button><button class="btn ghost sm icon">${icRaw('more', 'sm')}</button>` });
  },

  /* карточка заказа: файлы (счёт, договор, УПД и прочее) и позиции */
  orderCard(r) {
    const [stName, stCls] = SUP_ST[r.st], icols = '104px minmax(0,2fr) minmax(0,1fr) 112px 104px 112px';
    const total = r.items.reduce((a, it) => a + it[4] * it[5], 0);
    const files = r.files.map(([name, kind, size, at]) => `<div class="file"><span class="fi">${ic('file', 'sm')}</span><span class="grow ellip">${esc(name)}</span><span class="chip ${kind === 'прочее' ? 'line' : ''}">${kind}</span><span class="mute small num">${size}</span><span class="mute small num">${fmtDate(at)}</span><button class="btn ghost sm icon" title="Скачать">${icRaw('down', 'xs')}</button></div>`).join('');
    return `<div class="ph">${chipDir(r.dir)}<span class="t num">Заказ клиента ${r.order}</span><span class="mute small ellip">заявка ${r.id} · ${r.supplier}</span><span class="chip ${stCls}">${stName}</span><button class="btn ghost sm icon" data-xp-close style="margin-left:auto">${icRaw('x', 'sm')}</button></div>
      <div class="pb">
        <div class="row between" style="margin-bottom:6px"><div class="sec-t" style="margin:0">Файлы заказа · ${r.files.length}</div><label class="btn sm">${ic('clip', 'xs')}Загрузить файл<input type="file" multiple hidden data-upload="${r.id}"></label></div>
        <div class="files">${files || '<div class="mute small" style="padding:4px 2px">Файлов пока нет: счёт, договор, УПД и прочее появятся здесь списком</div>'}</div>
        <div class="sec-t" style="margin-top:12px">Позиции заказа · ${r.items.length}</div>
        <div class="tbl items">
          <div class="tr th" style="grid-template-columns:${icols}"><div>артикул</div><div>наименование</div><div>категория</div><div>кол-во, ед. изм.</div><div style="text-align:right">цена за ед.</div><div style="text-align:right">сумма</div></div>
          ${r.items.map(([sku, name, cat, unit, qty, price]) => `<div class="tr" style="grid-template-columns:${icols};min-height:30px"><div class="num mute">${sku}</div><div class="ellip">${name}</div><div class="small">${cat}</div><div class="num">${fmtMoney(qty)} ${unit}</div><div class="num" style="text-align:right">${fmtMoney(price)} ₽</div><div class="num b" style="text-align:right">${fmtMoney(qty * price)} ₽</div></div>`).join('')}
          <div class="tr" style="grid-template-columns:${icols};min-height:30px"><div></div><div class="b">Итого</div><div></div><div></div><div></div><div class="num b" style="text-align:right">${fmtMoney(total)} ₽</div></div>
        </div>
      </div>`;
  },

  /* ---------- Сотрудники ---------- */
  staff() {
    const s = this.state, q = s.q.trim().toLowerCase();
    const inDir = p => s.dir === 'all' || p.dirs === 'all' || p.dirs.includes(s.dir);
    const inDept = p => !s.dept || (p.dept === s.dept.id && (!s.dept.dir || p.dirs === 'all' || p.dirs.includes(s.dept.dir)));
    const people = STAFF.filter(p => inDir(p) && inDept(p) && hit(q, p.name, p.pos, DEPTS.find(d => d.id === p.dept).name));
    const deptName = p => { const d = DEPTS.find(x => x.id === p.dept); return d.perDir ? d.names[Array.isArray(p.dirs) ? p.dirs[0] : DIRS[0].id] : d.name; };

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
    const dmap = `<div class="dmap"><div class="hd">подразделение</div>${DIRS.map(d => `<div class="hd dir">${chipDir(d.id)}</div>`).join('')}${cells}</div>`;

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
    const table = `<div class="tbl"><div class="tr th" style="grid-template-columns:${cols}"><div>сотрудник</div><div>подразделение</div><div>направления</div><div>доступ к страницам</div><div>статус</div></div>${rows || '<div class="mute small" style="padding:14px 10px">Никого не найдено</div>'}</div>${more}`;

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
    // открытый выпадающий список закрывается кликом мимо него (даже внутри формы)
    if (XP.open && XP.open.classList.contains('csel') && !XP.open.contains(t)) XP.close();
    const opt = t.closest('[data-opt]');
    if (opt) {
      const x = opt.closest('.csel');
      x.querySelector('input[type=hidden]').value = opt.dataset.opt;
      x.querySelector('.sel-btn .lbl').textContent = opt.querySelector('.grow').textContent;
      x.querySelectorAll('[data-opt]').forEach(b => { b.classList.toggle('on', b === opt); const c = b.querySelector('.chk'); if (c) c.remove(); });
      opt.insertAdjacentHTML('beforeend', `<span class="chk">${icRaw('check', 'sm')}</span>`);
      XP.close(); return;
    }
    const themeBtn = t.closest('[data-theme-set],[data-theme-toggle]');
    if (themeBtn) {
      const r = themeBtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, html = document.documentElement;
      html.style.setProperty('--vt-x', x + 'px'); html.style.setProperty('--vt-y', y + 'px');
      html.style.setProperty('--vt-r', Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 'px');
      XP.closeAll();
      this.transition('vt-theme', () => {
        this.state.theme = themeBtn.dataset.themeSet || (this.state.theme === 'dark' ? 'light' : 'dark');
        localStorage.setItem('riva.theme', this.state.theme); html.dataset.theme = this.state.theme;
        this.renderSide(); this.renderTopbar(); this.renderGrid(); this.renderChat(); this.renderNotifs();
      });
      return;
    }
    if (t.closest('[data-chat-toggle]')) { XP.toggle(this.el.chatcol); if (XP.stack.includes(this.el.chatcol)) this.chatToEnd(); return; }
    if (t.closest('[data-notif-toggle]')) { XP.toggle(this.el.notifcol); return; }
    const bgBtn = t.closest('[data-bg-set]');
    if (bgBtn) { BG.set(bgBtn.dataset.bgSet); XP.close(); this.renderSide(); return; }
    if (t.closest('[data-notif-read]')) { NOTIFS.forEach(n => n.unread = false); this.renderNotifs(); this.renderTopbar(); XP.focus(); return; }
    const coBtn = t.closest('[data-company]');
    if (coBtn) { this.state.company = coBtn.dataset.company; XP.close(); this.renderTopbar(); return; }
    if (t.closest('[data-xp-close]')) { XP.close(); return; }
    const dirBtn = t.closest('[data-dir]');
    if (dirBtn) { this.state.dir = dirBtn.dataset.dir; XP.close(); this.renderTopbar(); this.renderGrid(); return; }
    const cell = t.closest('[data-dcell]');
    if (cell) { const d = { id: cell.dataset.dcell, dir: cell.dataset.ddir || null }; this.state.dept = this.state.dept && this.state.dept.id === d.id && this.state.dept.dir === d.dir ? null : d; XP.close(); this.renderGrid(); return; }
    if (t.closest('[data-clear-dept]')) { this.state.dept = null; XP.close(); this.renderGrid(); return; }
    if (t.closest('[data-show-all]')) { this.state.all = true; this.renderGrid(); return; }
    const tg = t.closest('[data-xp-toggle]');
    if (tg) { if (t.closest('a,button') && !t.closest('.xp-head > .company, .xp-head > .btn, .xp-head > .avs, .xp-head > .sel-btn, .xp-head > .rail-btn')) return; XP.toggle(tg.closest('.xp')); return; }
    if (!t.closest('.xp-panel')) XP.closeAll();
  },

  onSubmit(e) {
    const nf = e.target.closest('[data-new]');
    if (nf) { e.preventDefault(); this.createRecord(nf); return; }
    const f = e.target.closest('[data-chat-form]'); if (!f) return;
    e.preventDefault();
    const inp = f.querySelector('input'), text = inp.value.trim(); if (!text) return;
    inp.value = '';
    CHAT.send(f.dataset.chatForm, text);
    inp.focus();
  },

  /* загрузка файлов в карточку заказа: имена добавляются в список заявки */
  onChange(e) {
    const toRow = f => [f.name.replace(/\.[^.]+$/, ''), fileKind(f.name), fmtSize(f.size), todayShort()];
    const att = e.target.closest('[data-attach]');   // файлы в форме новой заявки: копятся до создания
    if (att && att.files.length) { this.pending.push(...[...att.files].map(toRow)); const l = att.closest('.fld').querySelector('[data-attach-list]'); if (l) l.textContent = this.pending.map(f => f[0]).join(', '); return; }
    const inp = e.target.closest('[data-upload]'); if (!inp || !inp.files.length) return;
    const r = SUPPLY.find(x => x.id === inp.dataset.upload);
    [...inp.files].forEach(f => r.files.push(toRow(f)));
    this.renderGrid(); this.reopen('sup-' + r.id);
  },

  onInput(e) {
    if (e.target.matches('[data-search]')) { this.state.q = e.target.value; XP.close(); this.renderGrid(); }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
