/* ============================================================
   Страницы: Логистика, Сотрудники, заглушки. Маршрутизация и события.
   ============================================================ */

const pct16 = (a, b) => b ? Math.round(16 * a / b) : 0;
const rmIcon = (st, i) => st === 'done' ? ic('check', 'xs') : st === 'cur' ? ic('loader', 'sm spin') : st === 'bad' ? ic('alert', 'xs') : (i + 1);
const hit = (q, ...fields) => !q || fields.join(' ').toLowerCase().includes(q);
const fmtMoney = n => n.toLocaleString('ru-RU');
const fmtQty = n => (Math.round(n * 100) / 100).toLocaleString('ru-RU', { maximumFractionDigits: 2 });   // количество до сотых: 0,6 кг, 1 164 кг
const rub = n => fmtMoney(Math.round(n)) + ' ₽';
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
    XP.init(); BG.init(); RULER.init();
    window.addEventListener('hashchange', () => this.route());
    document.addEventListener('click', e => this.onClick(e));
    document.addEventListener('submit', e => this.onSubmit(e));
    document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-ocard] input.in, [data-pcard] input.in, [data-scard] input.in[name^="sf-"]')) e.target.blur(); });   // Enter в поле карточки заказа применяет значение
    document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-scard] input.in[name^="si-"]')) { e.preventDefault(); this.saleItemAdd(e.target.closest('[data-scard]')); } });   // Enter в строке добавления позиции — добавить
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
    const primary = { supply: 'Заявка', production: 'Заказ', sales: 'Реализация', staff: 'Сотрудник' }[pg.id] || 'Запись';
    const ph = { supply: 'Заказ, заявка, поставщик, ИНН…', warehouse: 'Артикул, наименование, поставщик…', production: 'Рецепт, изделие, материал, заказ…', sales: 'Заказ, клиент, счёт, договор, товар…', staff: 'Сотрудники, должности…' }[pg.id] || 'Поиск…';
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
      const nextId = nextNo(SUPPLY.map(r => r.id), 'СН'), nextOrder = nextNo([...SUPPLY.map(r => r.order), ...SALES.map(r => r.id)], 'ЗК');   // номера заказов клиента общие с «Продажами»
      return `<form data-new="supply" style="width:660px">
        <div class="ph"><span class="t">Новая заявка на снабжение</span><span class="mute small">${nextId} · статус «заявка», дата и время — текущие</span>${close}</div>
        <div class="pb frm">
          ${fld('№ заказа клиента', inp('order', `value="${nextOrder}" required pattern="[А-ЯЁ]{2}-[0-9]{4}" title="две буквы, дефис и четыре цифры, например ${nextOrder}"`))}
          ${fld('Направление', sel('dir', DIRS.map(d => [d.id, d.name])))}
          ${fld('Поставщик', inp('supplier', 'placeholder="ООО «…»" required'))}
          ${fld('ИНН поставщика', inp('inn', 'placeholder="10 или 12 цифр" inputmode="numeric" pattern="[0-9]{10}|[0-9]{12}"'))}
          ${fld('Контактное лицо', inp('cname', 'placeholder="Фамилия Имя Отчество"'))}
          ${fld('Телефон', inp('ctel', 'type="tel" placeholder="+7 …"'))}
          ${fld('Почта', inp('cmail', 'type="email" placeholder="name@company.ru"'))}
          ${fld('Срок доставки', dsel('eta'))}
          ${fld('Транспортная компания', sel('tc', CARRIERS.map(c => [c, c === '—' ? 'ещё не выбрана' : c])))}
          ${fld('№ отслеживания', inp('track', 'placeholder="появится после отгрузки"'))}
          ${fld('Комментарий', '<textarea class="in" name="comment" rows="6" placeholder="Что закупаем и под какой заказ клиента"></textarea>', 'full')}
          <div class="fld full"><span class="fl">Файлы</span><div class="row"><label class="btn sm">${ic('clip', 'xs')}Прикрепить<input type="file" multiple hidden data-attach></label><span class="mute small ellip" data-attach-list>счёт, договор, УПД и прочее — можно добавить и позже в карточке заказа</span></div></div>
        </div>
        <div class="pf"><button type="button" class="btn sm ghost" data-xp-close>Отмена</button><span class="grow"></span><button type="submit" class="btn sm primary">${glassIcon('plus', themeInv(), 'xs')}Создать заявку</button></div>
      </form>`;
    }
    if (pg.id === 'production') {
      return `<form data-new="prod" style="width:560px">
        <div class="ph"><span class="t">Новый заказ на производство</span><span class="mute small">${nextNo(PROD_ORDERS.map(o => o.id), 'ПЗ')} · статус «в плане»</span>${close}</div>
        <div class="pb frm">
          ${fld('Рецепт', sel('rec', RECIPES.map(r => [r.id, `${r.id} · ${r.name}`])), 'full')}
          ${fld('Количество', inp('qty', 'type="number" min="0.01" step="any" required placeholder="в единицах выхода рецепта"'))}
          ${fld('Срок', dsel('due'))}
          ${fld('№ заказа клиента', inp('order', 'placeholder="ЗК-0000 — если под заказ" pattern="[А-ЯЁ]{2}-[0-9]{4}"'), 'full')}
        </div>
        <div class="pf"><button type="button" class="btn sm ghost" data-xp-close>Отмена</button><span class="grow"></span><button type="submit" class="btn sm primary">${glassIcon('plus', themeInv(), 'xs')}Создать заказ</button></div>
      </form>`;
    }
    if (pg.id === 'sales') {
      /* форма реализации: общие поля и поля по типу (data-for — для каких типов поле видно; остальные скрыты классом off, при смене типа переключаются) */
      const type = 'inv', nextId = nextNo([...SALES.map(r => r.id), ...SUPPLY.map(r => r.order)], 'ЗК');
      const show = (types, label, inner, cls = '') => fld(label, inner, cls + (types.split(' ').includes(type) ? '' : ' off'), `data-for="${types}"`);
      const sellers = STAFF.filter(p => p.role === 'seller');
      return `<form data-new="sale" style="width:720px">
        <div class="ph"><span class="t">Новая реализация</span><span class="mute small">${nextId} · статус «оформляется», оплата — не оплачено</span>${close}</div>
        <div class="pb frm">
          ${fld('Тип реализации', sel('type', Object.entries(SALE_TYPE).map(([k, v]) => [k, { inv: 'поставка по счёту', contract: 'поставка по договору поставки', retail: 'розничная продажа', web: 'интернет-заказ' }[k]])))}
          ${fld('Направление', sel('dir', DIRS.map(d => [d.id, d.name])))}
          ${fld('Клиент', inp('client', 'required placeholder="ООО «…», ИП или покупатель"'))}
          ${show('inv contract web', 'ИНН клиента', inp('inn', 'placeholder="10 или 12 цифр" inputmode="numeric" pattern="[0-9]{10}|[0-9]{12}"'))}
          ${fld('Контактное лицо', inp('cname', 'placeholder="Фамилия Имя Отчество"'))}
          ${fld('Телефон', inp('ctel', 'type="tel" placeholder="+7 …"'))}
          ${fld('Почта', inp('cmail', 'type="email" placeholder="name@company.ru"'))}
          ${fld('Менеджер', sel('mgr', sellers.map(p => [p.id, `${shortFio(p.name)} · ${DIR[p.dirs[0]].short.toLowerCase()}`]), ME.role === 'seller' ? ME.id : sellers[0].id))}
          ${show('inv', '№ счёта', inp('doc-inv', `value="${this.nextSaleDoc('inv')}" placeholder="номер счёта"`))}
          ${show('inv', 'Срок оплаты', dsel('due-inv'))}
          ${show('inv', 'Дата отгрузки', dsel('ship-inv'))}
          ${show('inv', 'Доставка', sel('dlv-inv', DLV.map(d => [d, d])))}
          ${show('contract', '№ договора поставки', inp('doc-contract', 'placeholder="например 19-2026"'))}
          ${show('contract', '№ спецификации', inp('spec-contract', 'value="1" placeholder="1"'))}
          ${show('contract', 'Срок поставки', dsel('ship-contract'))}
          ${show('contract', 'Доставка', sel('dlv-contract', DLV.map(d => [d, d])))}
          ${show('retail', '№ чека', inp('doc-retail', `value="${this.nextSaleDoc('retail')}" placeholder="номер чека"`))}
          ${show('retail', 'Точка продаж', sel('pos-retail', POS.map(p => [p, p])))}
          ${show('retail', 'Способ оплаты', sel('pay-retail', ['наличные', 'карта', 'СБП'].map(p => [p, p])))}
          ${show('retail', 'Дата продажи', dsel('ship-retail', isoDate(new Date())))}
          ${show('web', '№ заказа на сайте', inp('doc-web', `value="${this.nextSaleDoc('web')}" placeholder="номер с сайта"`))}
          ${show('web', 'Доставка', sel('dlv-web', ['СДЭК', 'Почта России', 'курьер', 'самовывоз'].map(d => [d, d])))}
          ${show('web', 'Оплата', sel('pay-web', ['онлайн на сайте', 'при получении'].map(p => [p, p])))}
          ${show('web', 'Адрес доставки', inp('addr-web', 'placeholder="город, улица, дом, квартира"'))}
          ${fld('Комментарий', '<textarea class="in" name="comment" rows="4" placeholder="Что продаём и условия сделки"></textarea>', 'full')}
          <div class="fld full"><span class="fl">Файлы</span><div class="row"><label class="btn sm">${ic('clip', 'xs')}Прикрепить<input type="file" multiple hidden data-attach></label><span class="mute small ellip" data-attach-list>счёт, договор, спецификация, чек — можно добавить и позже в карточке; позиции добавляются в карточке реализации</span></div></div>
        </div>
        <div class="pf"><button type="button" class="btn sm ghost" data-xp-close>Отмена</button><span class="grow"></span><button type="submit" class="btn sm primary">${glassIcon('plus', themeInv(), 'xs')}Создать реализацию</button></div>
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
          ${fld('Дата выхода', dsel('start'))}
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
      const id = nextNo(SUPPLY.map(r => r.id), 'СН');
      const eta = v('eta') ? v('eta').split('-').reverse().join('.') : '—';
      SUPPLY.unshift({ id, paid: false, order: v('order'), dir: v('dir'), st: 'req', hist: [['req', nowStamp()]], supplier: v('supplier'), inn: v('inn') || '—', co: this.state.company, contact: { name: v('cname') || '—', tel: v('ctel') || '—', mail: v('cmail') || '—' }, tc: v('tc') || '—', track: v('track') || '—', eta, comment: v('comment'), files: this.pending.splice(0), items: [] });
      const nr = SUPPLY[0];
      if (!SUPPLIERS[nr.supplier]) SUPPLIERS[nr.supplier] = { inn: nr.inn, contacts: [{ ...nr.contact }, { name: 'Отдел продаж', tel: nr.contact.tel, mail: '—' }] };
      XP.closeAll(); this.renderTopbar(); this.renderGrid(); this.reopen('sup-' + id);
      return;
    }
    if (form.dataset.new === 'prod') {
      const id = nextNo(PROD_ORDERS.map(o => o.id), 'ПЗ'), rec = v('rec'), qty = parseFloat(v('qty').replace(',', '.'));
      PROD_ORDERS.unshift({ id, rec, qty: qty > 0 ? qty : REC[rec].out, st: 'plan', due: v('due') ? isoToRu(v('due')) : '—', order: v('order') || '—', at: nowStamp() });
      XP.closeAll(); this.state.prodTab = 'orders'; this.renderTopbar(); this.renderGrid(); this.reopen('pz-' + id);
      return;
    }
    if (form.dataset.new === 'sale') {
      const type = v('type') || 'inv', id = nextNo([...SALES.map(r => r.id), ...SUPPLY.map(r => r.order)], 'ЗК'), t = k => v(k + '-' + type);
      const ru = k => t(k) ? isoToRu(t(k)) : '—';
      const client = v('client') || 'Розничный покупатель', c = CLIENTS[client];
      const contact = { name: v('cname') || (c ? c.contacts[0].name : '—'), tel: v('ctel') || '—', mail: v('cmail') || '—' };
      SALES.unshift({ id, type, st: 'new', dir: v('dir'), co: this.state.company, client, inn: v('inn') || (c ? c.inn : '—'), contact, mgr: +v('mgr') || STAFF.find(p => p.role === 'seller').id,
        doc: t('doc') || '—', spec: type === 'contract' ? t('spec') || '1' : '—', due: type === 'inv' ? ru('due') : '—', ship: ru('ship'),
        dlv: type === 'retail' ? 'самовывоз' : t('dlv') || DLV[0], pos: type === 'retail' ? t('pos') || POS[0] : '—', pay: type === 'retail' || type === 'web' ? t('pay') || PAY_WAYS[0] : 'безналичный расчёт',
        track: '—', addr: type === 'web' ? t('addr') || '—' : '—', paid: 0, hist: [['new', nowStamp()]], comment: v('comment'), files: this.pending.splice(0), items: [] });
      const nr = SALES[0];
      if (!CLIENTS[client]) CLIENTS[client] = { inn: nr.inn, kind: clientKind(client), contacts: [{ ...contact }] };
      else if (contact.name !== '—' && !c.contacts.some(x => x.name === contact.name)) c.contacts.push({ ...contact });
      XP.closeAll(); this.state.saleType = 'all'; this.renderTopbar(); this.renderGrid(); this.reopen('sl-' + id);
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
    this.el.grid.classList.toggle('single', ['supply', 'warehouse', 'production', 'sales'].includes(pg.id));
    this.el.grid.innerHTML = pg.id === 'supply' ? this.supply() : pg.id === 'warehouse' ? this.warehouse() : pg.id === 'production' ? this.production() : pg.id === 'sales' ? this.sales() : pg.id === 'staff' ? this.staff() : this.stub(pg);
    if (animate) this.animateIn();
    if (this.pendingOpen) { const id = this.pendingOpen; this.pendingOpen = null; this.reopen(id); }   // переход к связанному документу с другой страницы: карточка раскрывается после перерисовки
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
    const list = SUPPLY.filter(r => (s.dir === 'all' || r.dir === s.dir) && hit(q, r.id, r.order, r.supplier, r.inn, r.tc, r.track, r.comment, r.contact.name, SUP_ST[r.st][0], r.paid ? 'оплачено' : 'не оплачено'));
    /* колонки (26-й круг): номера, статус, дата изменения (вправо), ИНН (вправо), поставщик, контакт, транспортная компания,
       № отслеживания, срок (вправо), комментарий. Постоянные — по ширине содержимого; при сужении окна сжимается сначала комментарий
       (до 100px), затем ИНН: его дорожка minmax(0, 84px) получает место раньше гибкой (алгоритм сетки: «maximize tracks» до «expand flexible»),
       значит и отдаёт позже; поставщик, ТК и № отслеживания не сжимаются */
    /* 27-й круг: между № заявки и статусом, статусом и датой, по обе стороны от контакта и между № отслеживания и сроком — 8px
       (поле 4px у ячейки .gl/.gr плюс общий зазор 4px), поэтому эти столбцы шире на 4px; минимум комментария 84px — при окне 1280 всё помещается */
    const cols = this.supCols;
    const head = `<div class="sup-head"><div class="tr th" style="grid-template-columns:${cols}"><div>№ заказа</div><div>№ заявки</div><div class="gl">статус</div><div class="r gl">изменён</div><div>оплата</div><div class="inn"><span>ИНН</span></div><div class="gl gr"></div><div>поставщик</div><div>транспортная компания</div><div>№ отслеживания</div><div class="r gl">срок доставки</div><div>комментарий</div></div></div>`;
    const rows = list.map((r, i) => xp({ id: 'sup-' + r.id, head: this.supRow(r, i >= list.length - 2 && list.length > 3), panel: this.orderCard(r), place: 'under', cls: 'rec' })).join('');
    const body = `<div class="sup-list">${head}<div class="recs">${rows || '<div class="mute small" style="padding:14px 10px">Ничего не найдено</div>'}</div></div>`;
    return mod({ span: 12, cls: 'fill', title: 'Заявки на снабжение', sub: `${list.length} из ${SUPPLY.length} · каждая запись в своём контейнере, по клику под ней раскрывается карточка заказа`, body, tight: true, acts: `<button class="btn ghost sm">${ic('filter', 'sm')}Фильтр</button><button class="btn ghost sm icon">${icRaw('more', 'sm')}</button>` });
  },

  /* столбцы списка: 27-й круг — 8px между № заявки и статусом, статусом и датой, вокруг контакта, между треком и сроком (поле 4px у .gl/.gr + общий 4px);
     сжимается сначала комментарий (до 84px), затем ИНН: дорожка minmax(0, 84px) получает место раньше гибкой и отдаёт позже */
  supCols: '60px 60px 128px 158px 124px minmax(0,84px) 30px 196px 124px 104px 118px minmax(84px,1fr)',   // 29-й круг: оплата после даты изменения, контакт между ИНН и поставщиком
  /* строка заявки (заголовок раскрытия); up — всплывающие подсказки последних строк открываются вверх */
  supRow(r, up) {
    const last = r.hist[r.hist.length - 1], u = up ? 'up' : '';
    const hist = `<span class="hp r"><span class="num hp-trg">${fmtDT(last[1])}</span><div class="hp-pop ${u}"><div class="sec-t">История статусов</div>${[...r.hist].reverse().map(([st, at]) => `<div class="row" style="gap:8px;min-height:24px">${stChip(st)}<span class="num mute small">${fmtDT(at)}</span></div>`).join('')}</div></span>`;
    const contact = `<span class="hp"><span class="ic-btn">${ic('user', 'sm')}</span><div class="hp-pop ${u}"><div class="b">${r.contact.name}</div><div class="num" style="margin-top:3px">${r.contact.tel}</div><div class="mute small">${r.contact.mail}</div></div></span>`;
    return `<div class="rec-card"><div class="tr clickable" style="grid-template-columns:${this.supCols}">
        <div class="no">${r.order}</div>
        <div class="no">${r.id}</div>
        <div class="gl">${stChip(r.st)}</div>
        <div class="r gl">${hist}</div>
        <div>${payChip(r.paid)}</div>
        <div class="inn num" title="ИНН ${esc(r.inn)}"><span>${r.inn}</span></div>
        <div class="gl gr">${contact}</div>
        <div class="t ellip" title="${esc(r.supplier)}">${r.supplier}</div>
        <div class="ellip ${r.tc === '—' ? 'mute' : ''}" title="${esc(r.tc)}">${r.tc}</div>
        <div class="ellip num ${r.track === '—' ? 'mute' : ''}" title="${esc(r.track)}">${r.track}</div>
        <div class="r num gl">${fmtDate(r.eta)}</div>
        <div class="ellip small" title="${esc(r.comment)}">${r.comment}</div>
      </div></div>`;
  },

  /* карточка заказа (28-й круг): в шапке только чип направления — номера, статус и поставщик видны в строке и не меняются;
     ниже строка полей заказа (свои списки, как в форме; изменения сразу пишутся в запись и в строку — updateOrder),
     под ней два блока поровну: документы и позиции */
  orderCard(r) {
    const icols = '68px minmax(0,2fr) minmax(0,1fr) 72px 72px 84px';
    const total = r.items.reduce((a, it) => a + it[4] * it[5], 0);
    const sp = SUPPLIERS[r.supplier] || { contacts: [r.contact] };
    const files = r.files.map(([name, kind, size, at]) => `<div class="file"><span class="fi">${ic('file', 'sm')}</span><span class="grow ellip">${esc(name)}</span><span class="chip ${kind === 'прочее' ? 'line' : ''}">${kind}</span><span class="mute small num">${size}</span><span class="mute small num">${fmtDate(at)}</span><button class="btn ghost sm icon" title="Скачать">${icRaw('down', 'xs')}</button></div>`).join('');
    const fields = `<div class="of-row">
        ${fld('Компания-заказчик', sel('of-co', COMPANIES.map(c => [c.id, c.name]), r.co))}
        ${fld('Направление', sel('of-dir', DIRS.map(d => [d.id, d.name]), r.dir))}
        ${fld('Транспортная компания', sel('of-tc', CARRIERS.map(c => [c, c === '—' ? 'ещё не выбрана' : c]), r.tc))}
        ${fld('№ отслеживания', inp('of-track', `value="${r.track === '—' ? '' : esc(r.track)}" placeholder="ещё нет"`))}
        ${fld('Контакт поставщика', sel('of-contact', sp.contacts.map(c => [c.name, shortFio(c.name)]), r.contact.name))}
        ${fld('Поставщик', sel('of-supplier', Object.keys(SUPPLIERS).sort((a, b) => a.replace(/^\S+\s«?/, '').localeCompare(b.replace(/^\S+\s«?/, ''), 'ru')).map(n => [n, n]), r.supplier))}
        ${fld('Комментарий', inp('of-comment', `value="${esc(r.comment)}" placeholder="комментарий к заявке"`))}
      </div>`;
    return `<div class="ph">${dirChip(r.dir)}<button class="btn ghost sm icon" data-xp-close style="margin-left:auto">${icRaw('x', 'sm')}</button></div>
      <div class="pb" data-ocard="${r.id}">
        ${fields}
        <div class="oc-blocks">
          <div class="oc-block">
            <div class="oc-h"><div class="sec-t">Документы · ${r.files.length}</div><label class="btn sm">${ic('clip', 'xs')}Загрузить файл<input type="file" multiple hidden data-upload="${r.id}"></label></div>
            <div class="files">${files || '<div class="mute small" style="padding:4px 2px">Документов пока нет: счёт, договор, УПД и прочее появятся здесь списком</div>'}</div>
          </div>
          <div class="oc-block">
            <div class="oc-h"><div class="sec-t">Позиции заказа · ${r.items.length}</div></div>
            <div class="tbl items">
              <div class="tr th" style="grid-template-columns:${icols}"><div>артикул</div><div>наименование</div><div>категория</div><div>кол-во</div><div style="text-align:right">цена</div><div style="text-align:right">сумма</div></div>
              ${r.items.map(([sku, name, cat, unit, qty, price]) => `<div class="tr" style="grid-template-columns:${icols};min-height:30px"><div class="num mute ellip">${sku}</div><div class="ellip" title="${esc(name)}">${name}</div><div class="small ellip">${cat}</div><div class="num">${fmtMoney(qty)} ${unit}</div><div class="num" style="text-align:right">${fmtMoney(price)} ₽</div><div class="num b" style="text-align:right">${fmtMoney(qty * price)} ₽</div></div>`).join('')}
              ${r.items.length ? `<div class="tr" style="grid-template-columns:${icols};min-height:30px"><div></div><div class="b">Итого</div><div></div><div></div><div></div><div class="num b" style="text-align:right">${fmtMoney(total)} ₽</div></div>` : '<div class="mute small" style="padding:4px 6px">Позиции появятся после оформления заказа поставщику</div>'}
            </div>
          </div>
        </div>
      </div>`;
  },

  /* изменение заказа из карточки: запись и строка списка обновляются сразу, карточка остаётся открытой;
     после выбора в списке карточка перерисовывается (контакты зависят от поставщика, чип — от направления), после ввода текста — нет, чтобы не терять фокус */
  updateOrder(id, f, v) {
    const r = SUPPLY.find(x => x.id === id); if (!r) return;
    if (f === 'co') r.co = v;
    else if (f === 'dir') r.dir = v;
    else if (f === 'tc') r.tc = v;
    else if (f === 'track') r.track = v.trim() || '—';
    else if (f === 'comment') r.comment = v.trim();
    else if (f === 'contact') { const c = (SUPPLIERS[r.supplier] || { contacts: [] }).contacts.find(x => x.name === v); if (c) r.contact = { ...c }; }
    else if (f === 'supplier') { const sp = SUPPLIERS[v]; if (!sp) return; r.supplier = v; r.inn = sp.inn; r.contact = { ...sp.contacts[0] }; }
    const el = document.querySelector(`[data-xp="sup-${id}"]`); if (!el) return;
    const head = el.querySelector(':scope > .xp-head');
    head.innerHTML = this.supRow(r, !!head.querySelector('.hp-pop.up'));
    if (f !== 'track' && f !== 'comment') el.querySelector(':scope > .xp-panel').innerHTML = this.orderCard(r);
    if (XP.open) XP.focus();
  },

  /* ---------- Склад (30-й круг): поступления — позиции завершённых заказов «Снабжения» (выводятся из SUPPLY при каждом показе),
     остаток = поступило − выдано (STOCK_ISSUED); строка — две карточки в ряд с отступом 16px: позиция и остаток ---------- */
  whCols: '84px minmax(130px,2fr) 100px 108px minmax(100px,1.2fr) 56px 80px 88px 104px',   // наименование и поставщик не сжимаются до нечитаемого: уже — горизонтальная прокрутка
  whRight: '104px 112px',
  stockRows() {
    const ts = d => d.replace(/^(\d\d)\.(\d\d)\.(\d{4}) ?(.*)$/, '$3$2$1 $4');
    return SUPPLY.filter(r => r.st === 'done').flatMap(r => {
      const at = (r.hist.find(h => h[0] === 'done') || r.hist[r.hist.length - 1])[1];
      return r.items.map(([sku, name, cat, unit, qty, price, sub]) => ({ sku, name, cat, sub: sub || '—', unit, qty, price, left: Math.max(0, qty - (STOCK_ISSUED[sku] || 0)), supplier: r.supplier, req: r.id, order: r.order, dir: r.dir, at }));
    }).sort((a, b) => ts(b.at).localeCompare(ts(a.at)) || a.sku.localeCompare(b.sku, 'ru'));
  },
  warehouse() {
    const s = this.state, q = s.q.trim().toLowerCase(), all = this.stockRows();
    const list = all.filter(x => (s.dir === 'all' || x.dir === s.dir) && hit(q, x.sku, x.name, x.cat, x.sub, x.supplier, x.req, x.order));
    const L = this.whCols, R = this.whRight, money = v => `${fmtMoney(v)} ₽`;
    const head = `<div class="wh-head">
        <div class="sup-head"><div class="tr th" style="grid-template-columns:${L}"><div>артикул</div><div>наименование</div><div>категория</div><div>подкатегория</div><div>поставщик</div><div>ед. изм.</div><div>кол-во</div><div>цена за ед.</div><div>сумма</div></div></div>
        <div class="sup-head"><div class="tr th" style="grid-template-columns:${R}"><div>остаток</div><div>сумма остатка</div></div></div>
      </div>`;
    const rows = list.map(x => `<div class="wh-row" title="Поступление по заявке ${x.req} · заказ клиента ${x.order} · ${fmtDT(x.at)}">
        <div class="rec-card"><div class="tr" style="grid-template-columns:${L}">
          <div class="num mute ellip">${x.sku}</div>
          <div class="t ellip" title="${esc(x.name)}">${x.name}</div>
          <div class="small ellip">${x.cat}</div>
          <div class="small ellip mute">${x.sub}</div>
          <div class="ellip" title="${esc(x.supplier)}">${x.supplier}</div>
          <div class="small" style="text-align:center">${x.unit}</div>
          <div class="num rn">${fmtMoney(x.qty)}</div>
          <div class="num rn">${money(x.price)}</div>
          <div class="num rn b">${money(x.qty * x.price)}</div>
        </div></div>
        <div class="rec-card"><div class="tr" style="grid-template-columns:${R}">
          <div class="num rn ${x.left ? '' : 'mute'}">${fmtMoney(x.left)} <span class="mute small">${x.unit}</span></div>
          <div class="num rn b ${x.left ? '' : 'mute'}">${money(x.left * x.price)}</div>
        </div></div>
      </div>`).join('');
    const where = s.dir === 'all' ? 'склады А, Б, В' : DEPTS.find(d => d.id === 'wh').names[s.dir].toLowerCase();
    const leftSum = list.reduce((a, x) => a + x.left * x.price, 0);
    const body = `<div class="sup-list">${head}<div class="recs">${rows || '<div class="mute small" style="padding:14px 10px">Поступлений нет: позиции появляются здесь, когда заказ на «Снабжении» получает статус «завершён»</div>'}</div></div>`;
    return mod({ span: 12, cls: 'fill', title: 'Поступления и остатки', sub: `${list.length} из ${all.length} позиций · ${where} · поступления из завершённых заказов снабжения · остаток на ${money(leftSum)}`, body, tight: true, acts: `<button class="btn ghost sm">${ic('filter', 'sm')}Фильтр</button><button class="btn ghost sm icon">${icRaw('more', 'sm')}</button>` });
  },

  /* ---------- Производство (31-й круг): рецепты (материалы + работы) и подстраница заказов на производство.
     Принцип матрёшки: полуфабрикат одного рецепта входит в другой как материал — себестоимость и потребность считаются
     рекурсивно по всем уровням; выполненные заказы дают готовые полуфабрикаты, которые расходуются раньше, чем производятся новые ---------- */
  recCols: '72px minmax(172px,1.6fr) 136px 136px 84px 150px 76px 116px minmax(130px,1fr)',
  pzCols: '72px minmax(200px,1.6fr) 124px 84px 104px 170px 112px 72px 120px',
  prodArea(dir) { return DEPTS.find(d => d.id === 'prod').names[dir]; },
  recCost(id) {   // на партию и на единицу выхода: материалы + полуфабрикаты (по их рецептам) + работы
    const r = REC[id]; let mat = 0, semi = 0, work = 0;
    r.comps.forEach(([k, x, q]) => { if (k === 'm') mat += (MATERIALS[x] ? MATERIALS[x].price : 0) * q; else semi += this.recCost(x).unit * q; });
    r.works.forEach(([, h, rate]) => { work += h * rate; });
    const total = mat + semi + work; return { mat, semi, work, total, unit: total / r.out };
  },
  recDepth(id) { const subs = REC[id].comps.filter(c => c[0] === 'r'); return 1 + (subs.length ? Math.max(...subs.map(c => this.recDepth(c[1]))) : 0); },
  recParents(id) { return RECIPES.filter(r => r.comps.some(c => c[0] === 'r' && c[1] === id)); },
  semiReady() { const s = {}; PROD_ORDERS.forEach(o => { if (o.st === 'done') s[o.rec] = (s[o.rec] || 0) + o.qty; }); return s; },
  stockBySku() { const s = {}; this.stockRows().forEach(x => { s[x.sku] = (s[x.sku] || 0) + x.left; }); return s; },
  /* разворот заказа до сырья: по каждому полуфабрикату сначала берутся готовые (из выполненных заказов), недостающее раскладывается по его рецепту */
  explode(recId, qty) {
    const need = {}, semi = {}, works = {}, ready = this.semiReady();
    const go = (id, units) => {
      const r = REC[id], f = units / r.out, area = this.prodArea(r.dir);
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
    const mats = Object.entries(need).map(([sku, n]) => { const have = stock[sku] || 0; return { sku, m: MATERIALS[sku], need: n, have, short: Math.max(0, n - have) }; });
    return { mats, semi, works: Object.values(works) };
  },
  production() {
    const s = this.state, tab = s.prodTab || 'recipes', q = s.q.trim().toLowerCase(), inDir = d => s.dir === 'all' || d === s.dir;
    const recs = RECIPES.filter(r => inDir(r.dir) && hit(q, r.id, r.name, DIR[r.dir].name, REC_KIND[r.kind][0], ...r.comps.map(c => c[0] === 'm' ? (MATERIALS[c[1]] || {}).name : REC[c[1]].name)));
    const ords = PROD_ORDERS.filter(o => inDir(REC[o.rec].dir) && hit(q, o.id, o.rec, REC[o.rec].name, o.order, PROD_ST[o.st][0]));
    const tabs = `<div class="seg-row"><div class="seg"><button type="button" class="${tab === 'recipes' ? 'on' : ''}" data-ptab="recipes">Рецепты <span class="n">${recs.length}</span></button><button type="button" class="${tab === 'orders' ? 'on' : ''}" data-ptab="orders">Заказы на производство <span class="n">${ords.length}</span></button></div>
      <span class="mute small">${tab === 'recipes' ? 'рецепт — материалы и работы на партию; полуфабрикат одного рецепта входит в другой как материал' : 'потребность разворачивается по всем уровням рецептов и сверяется с остатками склада и готовыми полуфабрикатами'}</span></div>`;
    const where = s.dir === 'all' ? 'цеха №1, №2, №3' : this.prodArea(s.dir).toLowerCase();
    let head, rows, sub;
    if (tab === 'recipes') {
      head = `<div class="sup-head"><div class="tr th" style="grid-template-columns:${this.recCols}"><div>код</div><div>наименование</div><div>тип</div><div class="gl">направление</div><div>выход</div><div class="gl">состав</div><div>работы</div><div>себестоимость ед.</div><div class="gl">входит в</div></div></div>`;
      rows = recs.map(r => xp({ id: 'rc-' + r.id, head: this.recRow(r), panel: this.recCard(r), place: 'under', cls: 'rec' })).join('');
      sub = `${recs.length} из ${RECIPES.length} рецептов · ${where} · себестоимость — по ценам последних закупок, полуфабрикаты — по их рецептам`;
    } else {
      head = `<div class="sup-head"><div class="tr th" style="grid-template-columns:${this.pzCols}"><div>№ заказа</div><div>рецепт</div><div>статус</div><div class="gl">цех</div><div>количество</div><div class="gl">материалы</div><div>срок</div><div>заказ клиента</div><div>себестоимость</div></div></div>`;
      rows = ords.map(o => xp({ id: 'pz-' + o.id, head: this.pzRow(o), panel: this.pzCard(o), place: 'under', cls: 'rec' })).join('');
      const cnt = st => ords.filter(o => o.st === st).length;
      sub = `${ords.length} заказов · ${where} · в работе ${cnt('work')} · в плане ${cnt('plan')} · готово ${cnt('done')}`;
    }
    const body = `${tabs}<div class="sup-list">${head}<div class="recs">${rows || '<div class="mute small" style="padding:14px 10px">Ничего не найдено</div>'}</div></div>`;
    return mod({ span: 12, cls: 'fill', title: tab === 'recipes' ? 'Рецепты' : 'Заказы на производство', sub, body, tight: true, acts: `<button class="btn ghost sm">${ic('filter', 'sm')}Фильтр</button><button class="btn ghost sm icon">${icRaw('more', 'sm')}</button>` });
  },
  recRow(r) {
    const c = this.recCost(r.id), parents = this.recParents(r.id), nm = r.comps.filter(x => x[0] === 'm').length, ns = r.comps.length - nm, depth = this.recDepth(r.id), h = r.works.reduce((a, w) => a + w[1], 0);
    return `<div class="rec-card"><div class="tr clickable" style="grid-template-columns:${this.recCols}">
        <div class="no">${r.id}</div>
        <div class="t ellip" title="${esc(r.name)}">${r.name}</div>
        <div>${kindChip(r.kind)}</div>
        <div class="small ellip gl">${DIR[r.dir].name}</div>
        <div class="num" style="text-align:center">${fmtQty(r.out)} <span class="mute small">${r.unit}</span></div>
        <div class="small ellip gl">${nm} мат.${ns ? ` · <b>${ns} п/ф</b> · <span class="nest" title="уровней вложенности: ${depth}">${'<i></i>'.repeat(depth)}</span>` : ''}</div>
        <div class="num rn">${fmtQty(h)} ч</div>
        <div class="num rn b">${rub(c.unit)}</div>
        <div class="small ellip gl">${parents.length ? parents.map(p => p.id).join(', ') : '<span class="mute">—</span>'}</div>
      </div></div>`;
  },
  recTree(id, mult, level) {
    const tc = 'minmax(0,1fr) 76px 92px 92px 100px';
    return REC[id].comps.map(([k, x, q]) => {
      const n = q * mult;
      if (k === 'm') { const m = MATERIALS[x]; return `<div class="tr tnode" style="grid-template-columns:${tc};--lv:${level}"><div class="tname ellip" title="${esc(m.name)}"><i class="tdot"></i>${m.name}</div><div class="num mute small ellip">${x}</div><div class="num rn">${fmtQty(n)} <span class="mute small">${m.unit}</span></div><div class="num rn">${rub(m.price)}</div><div class="num rn">${rub(m.price * n)}</div></div>`; }
      const sr = REC[x], u = this.recCost(x).unit;
      return `<div class="tgroup"><div class="tr tnode semi" style="grid-template-columns:${tc};--lv:${level}"><div class="tname ellip" title="${esc(sr.name)}"><button type="button" class="tg" data-tree-tg title="Свернуть или раскрыть состав полуфабриката">${icRaw('down', 'xs')}</button>${sr.name}</div><div class="num small ellip"><button type="button" class="lnk" data-rec-open="${x}" title="Открыть рецепт">${x}</button></div><div class="num rn">${fmtQty(n)} <span class="mute small">${sr.unit}</span></div><div class="num rn">${rub(u)}</div><div class="num rn b">${rub(u * n)}</div></div><div class="tkids">${this.recTree(x, n / sr.out, level + 1)}</div></div>`;
    }).join('');
  },
  recCard(r) {
    const c = this.recCost(r.id), parents = this.recParents(r.id), area = this.prodArea(r.dir), tc = 'minmax(0,1fr) 76px 92px 92px 100px', wc = 'minmax(0,1fr) 64px 84px 84px 96px';
    const works = r.works.map(([op, h, rate]) => `<div class="tr" style="grid-template-columns:${wc};min-height:30px"><div class="ellip">${op}</div><div class="small mute">${area}</div><div class="num rn">${fmtQty(h)} ч</div><div class="num rn">${rub(rate)}</div><div class="num rn b">${rub(h * rate)}</div></div>`).join('');
    return `<div class="ph">${dirChip(r.dir)}${kindChip(r.kind)}<span class="mute small">партия — ${fmtQty(r.out)} ${r.unit} · ${area} · изменён ${fmtDate(r.upd)}</span><button type="button" class="btn sm primary" data-prod-new="${r.id}" style="margin-left:auto">${glassIcon('plus', themeInv(), 'xs')}Заказ на производство</button><button class="btn ghost sm icon" data-xp-close>${icRaw('x', 'sm')}</button></div>
      <div class="pb"><div class="oc-blocks">
        <div class="oc-block"><div class="oc-h"><div class="sec-t">Состав на партию · материалы и полуфабрикаты</div><span class="mute small">полуфабрикаты раскрываются до сырья</span></div>
          <div class="tbl tree"><div class="tr th" style="grid-template-columns:${tc}"><div>наименование</div><div>код</div><div>кол-во</div><div>цена · себест.</div><div>сумма</div></div>${this.recTree(r.id, 1, 0)}</div></div>
        <div class="oc-block"><div class="oc-h"><div class="sec-t">Работы на партию</div></div>
          <div class="tbl items"><div class="tr th" style="grid-template-columns:${wc}"><div>операция</div><div>цех</div><div>нормо-часы</div><div>ставка</div><div>сумма</div></div>${works}</div>
          <div class="cost-sum"><div><span>материалы</span><b>${rub(c.mat)}</b></div><div><span>полуфабрикаты</span><b>${rub(c.semi)}</b></div><div><span>работы</span><b>${rub(c.work)}</b></div><div class="tot"><span>партия</span><b>${rub(c.total)}</b></div><div class="tot"><span>за ${r.unit}</span><b>${rub(c.unit)}</b></div></div>
          <div class="oc-h" style="margin-top:10px"><div class="sec-t">Входит в рецепты</div></div>
          <div class="row wrap" style="gap:6px">${parents.length ? parents.map(p => `<button type="button" class="chip line" data-rec-open="${p.id}">${p.id} · ${p.name}</button>`).join('') : '<span class="mute small">не входит в другие рецепты — конечное изделие</span>'}</div>
        </div>
      </div></div>`;
  },
  pzRow(o) {
    const r = REC[o.rec], ex = this.explode(o.rec, o.qty), short = ex.mats.filter(m => m.short > 1e-9).length;
    const cover = o.st === 'done' ? '<span class="mute small">выпущено</span>' : short ? `<span class="dot bad"></span><span class="small">не хватает ${short} из ${ex.mats.length}</span>` : '<span class="dot ok"></span><span class="small">обеспечено</span>';
    return `<div class="rec-card"><div class="tr clickable" style="grid-template-columns:${this.pzCols}">
        <div class="no">${o.id}</div>
        <div class="ellip" title="${esc(r.name)}"><span class="t">${r.name}</span> <span class="mute small">${r.id}</span></div>
        <div>${pzChip(o.st)}</div>
        <div class="small ellip gl">${this.prodArea(r.dir)}</div>
        <div class="num rn">${fmtQty(o.qty)} <span class="mute small">${r.unit}</span></div>
        <div class="row gl" style="gap:6px;min-width:0">${cover}</div>
        <div class="num" style="text-align:center">${fmtDate(o.due)}</div>
        <div class="no ${o.order === '—' ? 'mute' : ''}">${o.order}</div>
        <div class="num rn b">${rub(this.recCost(o.rec).unit * o.qty)}</div>
      </div></div>`;
  },
  pzCard(o) {
    const r = REC[o.rec], ex = this.explode(o.rec, o.qty), mc = '70px minmax(0,1fr) 84px 84px 90px', sc = '70px minmax(0,1fr) 84px 84px 84px', wc = 'minmax(0,1fr) 64px 80px 96px';
    const matSum = ex.mats.reduce((a, m) => a + m.need * m.m.price, 0), workSum = ex.works.reduce((a, w) => a + w.sum, 0);
    const mats = ex.mats.map(m => `<div class="tr" style="grid-template-columns:${mc};min-height:30px"><div class="num mute small ellip">${m.sku}</div><div class="ellip" title="${esc(m.m.name)}">${m.m.name}</div><div class="num rn">${fmtQty(m.need)} <span class="mute small">${m.m.unit}</span></div><div class="num rn ${m.have ? '' : 'mute'}">${fmtQty(m.have)}</div><div class="num rn b ${m.short > 1e-9 ? 'bad-t' : 'mute'}">${m.short > 1e-9 ? fmtQty(m.short) : '—'}</div></div>`).join('');
    const semis = Object.entries(ex.semi).map(([id, sm]) => `<div class="tr" style="grid-template-columns:${sc};min-height:30px"><div class="num small"><button type="button" class="lnk" data-rec-open="${id}">${id}</button></div><div class="ellip" title="${esc(REC[id].name)}">${REC[id].name}</div><div class="num rn">${fmtQty(sm.need)} <span class="mute small">${REC[id].unit}</span></div><div class="num rn ${sm.used ? '' : 'mute'}">${fmtQty(sm.used)}</div><div class="num rn b">${fmtQty(sm.make)}</div></div>`).join('');
    const works = ex.works.map(w => `<div class="tr" style="grid-template-columns:${wc};min-height:30px"><div class="ellip">${w.op}</div><div class="small mute">${w.area}</div><div class="num rn">${fmtQty(w.h)} ч</div><div class="num rn b">${rub(w.sum)}</div></div>`).join('');
    const iso = /^\d{2}\.\d{2}\.\d{4}$/.test(o.due) ? o.due.split('.').reverse().join('-') : '';
    return `<div class="ph">${dirChip(r.dir)}<span class="t">${r.name}</span><button type="button" class="lnk small" data-rec-open="${r.id}">рецепт ${r.id}</button><span class="mute small">создан ${fmtDT(o.at)}</span><button class="btn ghost sm icon" data-xp-close style="margin-left:auto">${icRaw('x', 'sm')}</button></div>
      <div class="pb" data-pcard="${o.id}">
        <div class="of-row pz">
          ${fld('Статус', sel('pf-st', Object.entries(PROD_ST).map(([k, v]) => [k, v[0]]), o.st))}
          ${fld('Количество, ' + r.unit, inp('pf-qty', `type="number" min="0.01" step="any" value="${o.qty}"`))}
          ${fld('Срок', dsel('pf-due', iso))}
          ${fld('№ заказа клиента', inp('pf-order', `value="${o.order === '—' ? '' : esc(o.order)}" placeholder="без заказа клиента"`))}
        </div>
        <div class="oc-blocks">
          <div class="oc-block"><div class="oc-h"><div class="sec-t">Потребность в материалах · ${ex.mats.length}</div><span class="mute small">остаток — со склада</span></div>
            <div class="tbl items"><div class="tr th" style="grid-template-columns:${mc}"><div>артикул</div><div>наименование</div><div>нужно</div><div>на складе</div><div>не хватает</div></div>${mats}</div>
            <div class="cost-sum three"><div><span>материалы</span><b>${rub(matSum)}</b></div><div><span>работы</span><b>${rub(workSum)}</b></div><div class="tot"><span>к запуску</span><b>${rub(matSum + workSum)}</b></div></div></div>
          <div class="oc-block">
            <div class="oc-h"><div class="sec-t">Полуфабрикаты · ${Object.keys(ex.semi).length}</div><span class="mute small">сначала берутся готовые из выполненных заказов</span></div>
            ${semis ? `<div class="tbl items"><div class="tr th" style="grid-template-columns:${sc}"><div>рецепт</div><div>наименование</div><div>нужно</div><div>из готовых</div><div>произвести</div></div>${semis}</div>` : '<div class="mute small" style="padding:2px 4px 6px">в рецепте нет полуфабрикатов — только материалы склада</div>'}
            <div class="oc-h" style="margin-top:10px"><div class="sec-t">Работы по всем уровням</div></div>
            <div class="tbl items"><div class="tr th" style="grid-template-columns:${wc}"><div>операция</div><div>цех</div><div>нормо-часы</div><div>сумма</div></div>${works}</div>
          </div>
        </div>
      </div>`;
  },
  /* изменение заказа на производство из карточки: готовые полуфабрикаты меняют обеспеченность всех заказов — строки обновляются все,
     раскрытая карточка перерисовывается (кроме ввода № заказа клиента — там нечего пересчитывать) */
  updateProd(id, f, v) {
    const o = PROD_ORDERS.find(x => x.id === id); if (!o) return;
    if (f === 'st') o.st = v;
    else if (f === 'qty') { const n = parseFloat(String(v).replace(',', '.')); if (n > 0) o.qty = n; }
    else if (f === 'due') o.due = v ? isoToRu(v) : '—';
    else if (f === 'order') o.order = v.trim() || '—';
    document.querySelectorAll('.recs > [data-xp^="pz-"]').forEach(el => { const oo = PROD_ORDERS.find(x => 'pz-' + x.id === el.dataset.xp); if (oo) el.querySelector(':scope > .xp-head').innerHTML = this.pzRow(oo); });
    const el = document.querySelector(`[data-xp="pz-${id}"]`);
    if (el && f !== 'order') el.querySelector(':scope > .xp-panel').innerHTML = this.pzCard(o);
    if (XP.open) XP.focus();
  },

  /* ---------- Продажи (32-й круг): реализации четырёх типов — поставка по счёту, по договору поставки, розничная продажа, интернет-заказ.
     Реализация = заказ клиента ЗК-xxxx: на него ссылаются заявки снабжения и заказы на производство — они показаны в карточке связанными документами.
     Список как на «Снабжении» (сегменты по типу сверху), под строкой карточка: общие поля, поля по типу, документы, позиции с добавлением, оплата ---------- */
  slCols: '60px 140px 128px 158px 124px 196px 30px minmax(0,150px) 96px 118px minmax(84px,1fr)',   // № заказа, тип (136 + 4), статус (124 + 4), изменён, оплата, клиент, контакт, основание (сжимается вторым, как ИНН на «Снабжении»), сумма, отгрузка, комментарий (сжимается первым)
  saleTotal(r) { return r.items.reduce((a, it) => a + it[3] * it[4], 0); },
  saleDoc(r) { return r.doc === '—' ? '—' : `${SALE_DOC[r.type]} №${r.doc}${r.type === 'contract' && r.spec !== '—' ? ` · сп. ${r.spec}` : ''}`; },
  /* следующий номер основания своего вида: счёт — сквозной, чек — шесть цифр, заказ с сайта — W-; договор вводится вручную */
  nextSaleDoc(type) {
    const nums = SALES.filter(r => r.type === type).map(r => parseInt(String(r.doc).replace(/\D/g, ''), 10)).filter(n => n > 0);
    const n = (nums.length ? Math.max(...nums) : 0) + 1;
    return type === 'inv' ? String(n) : type === 'retail' ? String(n).padStart(6, '0') : type === 'web' ? 'W-' + n : '';
  },
  /* что можно продать по направлению: изделия и полуфабрикаты по рецептам (цена — себестоимость с наценкой 40 %, до десятков) и товары с услугами из GOODS_EXTRA */
  goods(dir) {
    const rec = RECIPES.filter(r => r.dir === dir).map(r => ({ code: r.id, name: r.name, unit: r.unit, price: Math.ceil(this.recCost(r.id).unit * 1.4 / 10) * 10 }));
    const extra = GOODS_EXTRA.filter(g => g[4] === dir).map(([code, name, unit, price]) => ({ code, name, unit, price }));
    return [...rec, ...extra];
  },
  sales() {
    const s = this.state, q = s.q.trim().toLowerCase(), tp = s.saleType || 'all';
    const base = SALES.filter(r => (s.dir === 'all' || r.dir === s.dir) && hit(q, r.id, r.client, r.inn, r.doc, r.comment, SALE_TYPE[r.type][0], SALE_ST[r.st][0], BY_ID[r.mgr].name, r.dlv, r.pos, r.addr, ...r.items.map(it => it[1])));
    const list = base.filter(r => tp === 'all' || r.type === tp);
    const segs = [['all', 'Все'], ...Object.entries(SALE_TYPE).map(([k, v]) => [k, v[0]])].map(([k, name]) => `<button type="button" class="${tp === k ? 'on' : ''}" data-stype="${k}">${name} <span class="n">${k === 'all' ? base.length : base.filter(r => r.type === k).length}</span></button>`).join('');
    const tabs = `<div class="seg-row"><div class="seg">${segs}</div><span class="mute small">реализация — заказ клиента ЗК; на её номер ссылаются заявки снабжения и заказы на производство</span></div>`;
    const head = `<div class="sup-head"><div class="tr th" style="grid-template-columns:${this.slCols}"><div>№ заказа</div><div class="gl">тип</div><div class="gl">статус</div><div class="r gl">изменён</div><div>оплата</div><div class="gl">клиент</div><div class="gl gr"></div><div class="shr"><span>основание</span></div><div>сумма</div><div class="r gl">отгрузка</div><div>комментарий</div></div></div>`;
    const rows = list.map((r, i) => xp({ id: 'sl-' + r.id, head: this.saleRow(r, i >= list.length - 2 && list.length > 3), panel: this.saleCard(r), place: 'under', cls: 'rec' })).join('');
    const sum = list.reduce((a, r) => a + this.saleTotal(r), 0), paid = list.reduce((a, r) => a + r.paid, 0);
    const where = s.dir === 'all' ? 'все отделы продаж' : DEPTS.find(d => d.id === 'sales').names[s.dir].toLowerCase();
    const body = `${tabs}<div class="sup-list">${head}<div class="recs">${rows || '<div class="mute small" style="padding:14px 10px">Ничего не найдено</div>'}</div></div>`;
    return mod({ span: 12, cls: 'fill', title: 'Реализации', sub: `${list.length} из ${SALES.length} · ${where} · сумма ${rub(sum)} · получено ${rub(paid)} · к оплате ${rub(Math.max(0, sum - paid))}`, body, tight: true, acts: `<button class="btn ghost sm">${ic('filter', 'sm')}Фильтр</button><button class="btn ghost sm icon">${icRaw('more', 'sm')}</button>` });
  },
  saleRow(r, up) {
    const last = r.hist[r.hist.length - 1], u = up ? 'up' : '', total = this.saleTotal(r);
    const hist = `<span class="hp r"><span class="num hp-trg">${fmtDT(last[1])}</span><div class="hp-pop ${u}"><div class="sec-t">История статусов</div>${[...r.hist].reverse().map(([st, at]) => `<div class="row" style="gap:8px;min-height:24px">${slChip(st)}<span class="num mute small">${fmtDT(at)}</span></div>`).join('')}</div></span>`;
    const c = r.contact, contact = c.name === '—' ? `<span class="ic-btn" style="opacity:.35" title="без контакта">${ic('user', 'sm')}</span>` : `<span class="hp"><span class="ic-btn">${ic('user', 'sm')}</span><div class="hp-pop ${u}"><div class="b">${esc(c.name)}</div><div class="num" style="margin-top:3px">${c.tel}</div><div class="mute small">${c.mail}</div>${r.inn !== '—' ? `<div class="mute small num" style="margin-top:3px">ИНН ${r.inn}</div>` : ''}</div></span>`;
    return `<div class="rec-card"><div class="tr clickable" style="grid-template-columns:${this.slCols}">
        <div class="no">${r.id}</div>
        <div class="gl">${skChip(r.type)}</div>
        <div class="gl">${slChip(r.st)}</div>
        <div class="r gl">${hist}</div>
        <div>${payChipOf(total, r.paid)}</div>
        <div class="t ellip gl" title="${esc(r.client)}">${r.client}</div>
        <div class="gl gr">${contact}</div>
        <div class="shr small ${r.doc === '—' ? 'mute' : ''}" title="${esc(this.saleDoc(r))}"><span>${this.saleDoc(r)}</span></div>
        <div class="num rn b ${total ? '' : 'mute'}">${rub(total)}</div>
        <div class="r num gl">${fmtDate(r.ship)}</div>
        <div class="ellip small" title="${esc(r.comment)}">${r.comment}</div>
      </div></div>`;
  },
  /* связанные документы: заявки снабжения и заказы на производство с этим номером заказа клиента; клик — переход на страницу и раскрытие карточки */
  saleLinks(r) {
    const sup = SUPPLY.filter(x => x.order === r.id).map(x => `<button type="button" class="chip line" data-go="supply::sup-${x.id}" title="Открыть заявку на «Снабжении»">${ic('box', 'xs')}${x.id} · ${SUP_ST[x.st][0].toLowerCase()}</button>`);
    const pz = PROD_ORDERS.filter(o => o.order === r.id).map(o => `<button type="button" class="chip line" data-go="production:orders:pz-${o.id}" title="Открыть заказ на «Производстве»">${ic('factory', 'xs')}${o.id} · ${PROD_ST[o.st][0]}</button>`);
    return [...sup, ...pz].join('') || '<span class="mute small">заявок на снабжение и заказов на производство по этой реализации пока нет</span>';
  },
  saleSum(r) {
    const total = this.saleTotal(r);
    return `<div class="cost-sum three"><div><span>сумма реализации</span><b>${rub(total)}</b></div><div><span>получено</span><b class="${r.paid ? '' : 'mute'}">${rub(r.paid)}</b></div><div class="tot"><span>к оплате</span><b class="${total - r.paid > .5 ? 'bad-t' : ''}">${rub(Math.max(0, total - r.paid))}</b></div></div>`;
  },
  saleCard(r) {
    const mgr = BY_ID[r.mgr], cl = CLIENTS[r.client] || { contacts: [r.contact] }, icols = '76px minmax(0,1fr) 84px 92px 100px 24px';
    const iso = d => /^\d{2}\.\d{2}\.\d{4}$/.test(d) ? d.split('.').reverse().join('-') : '';
    const files = r.files.map(([name, kind, size, at]) => `<div class="file"><span class="fi">${ic('file', 'sm')}</span><span class="grow ellip">${esc(name)}</span><span class="chip ${kind === 'прочее' ? 'line' : ''}">${kind}</span><span class="mute small num">${size}</span><span class="mute small num">${fmtDate(at)}</span><button class="btn ghost sm icon" title="Скачать">${icRaw('down', 'xs')}</button></div>`).join('');
    const common = `<div class="of-row sl">
        ${fld('Статус', sel('sf-st', Object.entries(SALE_ST).map(([k, v]) => [k, v[0]]), r.st))}
        ${fld('Компания-продавец', sel('sf-co', COMPANIES.map(c => [c.id, c.name]), r.co))}
        ${fld('Направление', sel('sf-dir', DIRS.map(d => [d.id, d.name]), r.dir))}
        ${fld('Клиент', sel('sf-client', Object.keys(CLIENTS).sort((a, b) => a.replace(/^\S+\s«?/, '').localeCompare(b.replace(/^\S+\s«?/, ''), 'ru')).map(n => [n, n]), r.client))}
        ${fld('Контакт клиента', sel('sf-contact', cl.contacts.map(c => [c.name, shortFio(c.name)]), r.contact.name))}
        ${fld('Менеджер', sel('sf-mgr', STAFF.filter(p => p.role === 'seller').map(p => [p.id, shortFio(p.name)]), r.mgr))}
        ${fld('Комментарий', inp('sf-comment', `value="${esc(r.comment)}" placeholder="комментарий к реализации"`))}
      </div>`;
    const paidF = fld('Получено, ₽', inp('sf-paid', `type="number" min="0" step="any" value="${r.paid}"`));
    const byType = {
      inv: [fld('№ счёта', inp('sf-doc', `value="${r.doc === '—' ? '' : esc(r.doc)}" placeholder="номер счёта"`)), fld('Срок оплаты', dsel('sf-due', iso(r.due))), fld('Дата отгрузки', dsel('sf-ship', iso(r.ship))), fld('Доставка', sel('sf-dlv', DLV.map(d => [d, d]), r.dlv)), paidF],
      contract: [fld('№ договора поставки', inp('sf-doc', `value="${r.doc === '—' ? '' : esc(r.doc)}" placeholder="номер договора"`)), fld('№ спецификации', inp('sf-spec', `value="${r.spec === '—' ? '' : esc(r.spec)}" placeholder="1"`)), fld('Срок поставки', dsel('sf-ship', iso(r.ship))), fld('Доставка', sel('sf-dlv', DLV.map(d => [d, d]), r.dlv)), paidF],
      retail: [fld('№ чека', inp('sf-doc', `value="${r.doc === '—' ? '' : esc(r.doc)}" placeholder="номер чека"`)), fld('Точка продаж', sel('sf-pos', POS.map(p => [p, p]), r.pos)), fld('Способ оплаты', sel('sf-pay', ['наличные', 'карта', 'СБП'].map(p => [p, p]), r.pay)), fld('Дата продажи', dsel('sf-ship', iso(r.ship))), paidF],
      web: [fld('№ заказа на сайте', inp('sf-doc', `value="${r.doc === '—' ? '' : esc(r.doc)}" placeholder="номер с сайта"`)), fld('Доставка', sel('sf-dlv', ['СДЭК', 'Почта России', 'курьер', 'самовывоз'].map(d => [d, d]), r.dlv)), fld('№ отслеживания', inp('sf-track', `value="${r.track === '—' ? '' : esc(r.track)}" placeholder="после передачи в доставку"`)), fld('Адрес доставки', inp('sf-addr', `value="${r.addr === '—' ? '' : esc(r.addr)}" placeholder="город, улица, дом"`)), fld('Оплата', sel('sf-pay', ['онлайн на сайте', 'при получении'].map(p => [p, p]), r.pay)), paidF],
    }[r.type];
    const typed = `<div class="of-row sl2" style="--n:${byType.length}">${byType.join('')}</div>`;
    const goods = this.goods(r.dir), g0 = goods[0];
    const items = r.items.map(([code, name, unit, qty, price], i) => `<div class="tr" style="grid-template-columns:${icols};min-height:30px"><div class="num mute small ellip">${code}</div><div class="ellip" title="${esc(name)}">${name}</div><div class="num rn">${fmtQty(qty)} <span class="mute small">${unit}</span></div><div class="num rn">${rub(price)}</div><div class="num rn b">${rub(qty * price)}</div><button type="button" class="btn ghost sm icon rm" data-item-rm="${i}" title="Убрать позицию">${icRaw('x', 'xs')}</button></div>`).join('');
    const add = `<div class="item-add">
        ${fld('Добавить позицию', sel('si-code', goods.map(g => [g.code, `${g.name} · ${rub(g.price)}`])))}
        ${fld('Кол-во' + (g0 ? ', ' + g0.unit : ''), inp('si-qty', 'type="number" min="0.01" step="any" value="1"'))}
        ${fld('Цена, ₽', inp('si-price', `type="number" min="0" step="any" value="${g0 ? g0.price : 0}"`))}
        <button type="button" class="btn sm" data-item-add>${ic('plus', 'xs')}Добавить</button>
      </div>`;
    return `<div class="ph">${dirChip(r.dir)}${skChip(r.type)}<span class="mute small">менеджер ${shortFio(mgr.name)} · создана ${fmtDT(r.hist[0][1])}</span><button class="btn ghost sm icon" data-xp-close style="margin-left:auto">${icRaw('x', 'sm')}</button></div>
      <div class="pb" data-scard="${r.id}">
        ${common}${typed}
        <div class="oc-blocks">
          <div class="oc-block">
            <div class="oc-h"><div class="sec-t">Документы · ${r.files.length}</div><label class="btn sm">${ic('clip', 'xs')}Загрузить файл<input type="file" multiple hidden data-upload-sale="${r.id}"></label></div>
            <div class="files">${files || '<div class="mute small" style="padding:4px 2px">Документов пока нет: счёт, договор, спецификация, УПД или чек появятся здесь списком</div>'}</div>
            <div class="oc-h" style="margin-top:10px"><div class="sec-t">Связанные заявки и заказы</div><span class="mute small">по номеру ${r.id}</span></div>
            <div class="lnks">${this.saleLinks(r)}</div>
          </div>
          <div class="oc-block">
            <div class="oc-h"><div class="sec-t">Позиции реализации · ${r.items.length}</div><span class="mute small">изделия по рецептам и товары направления</span></div>
            <div class="tbl items">
              <div class="tr th" style="grid-template-columns:${icols}"><div>код</div><div>наименование</div><div>кол-во</div><div style="text-align:right">цена</div><div style="text-align:right">сумма</div><div></div></div>
              ${items || '<div class="mute small" style="padding:4px 6px">Позиций пока нет — добавьте ниже</div>'}
            </div>
            ${add}
            ${this.saleSum(r)}
          </div>
        </div>
      </div>`;
  },
  /* изменение реализации из карточки: запись и строка обновляются сразу; после выбора в списке или календаре карточка перерисовывается
     (контакты зависят от клиента, поля — от типа), после ввода текста — нет, чтобы не терять фокус; «получено» обновляет только итоги */
  updateSale(id, f, v) {
    const r = SALES.find(x => x.id === id); if (!r) return;
    if (f === 'st') { if (r.st !== v) { r.st = v; r.hist.push([v, nowStamp()]); } }
    else if (f === 'co' || f === 'dir' || f === 'dlv' || f === 'pos' || f === 'pay') r[f] = v;
    else if (f === 'client') { const c = CLIENTS[v]; if (!c) return; r.client = v; r.inn = c.inn; r.contact = { ...c.contacts[0] }; }
    else if (f === 'contact') { const c = (CLIENTS[r.client] || { contacts: [] }).contacts.find(x => x.name === v); if (c) r.contact = { ...c }; }
    else if (f === 'mgr') r.mgr = +v;
    else if (f === 'comment') r.comment = v.trim();
    else if (f === 'doc' || f === 'spec' || f === 'track' || f === 'addr') r[f] = v.trim() || '—';
    else if (f === 'due' || f === 'ship') r[f] = v ? isoToRu(v) : '—';
    else if (f === 'paid') { const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); r.paid = n >= 0 ? n : 0; }
    this.refreshSale(r, ['comment', 'doc', 'spec', 'track', 'addr', 'paid'].includes(f) ? (f === 'paid' ? 'sum' : 'row') : 'card');
  },
  refreshSale(r, what = 'card') {
    const el = document.querySelector(`[data-xp="sl-${r.id}"]`); if (!el) return;
    const head = el.querySelector(':scope > .xp-head'); head.innerHTML = this.saleRow(r, !!head.querySelector('.hp-pop.up'));
    if (what === 'card') el.querySelector(':scope > .xp-panel').innerHTML = this.saleCard(r);
    else if (what === 'sum') { const cs = el.querySelector('.cost-sum'); if (cs) cs.outerHTML = this.saleSum(r); }
    if (XP.open) XP.focus();
  },
  /* позиции: товар из списка направления, количество и цена (подставляется из списка, можно поправить); одинаковые код и цена складываются */
  saleItemAdd(card) {
    const r = SALES.find(x => x.id === card.dataset.scard); if (!r) return;
    const code = card.querySelector('input[name="si-code"]').value, g = this.goods(r.dir).find(x => x.code === code);
    const qty = parseFloat(card.querySelector('input[name="si-qty"]').value.replace(',', '.')), price = parseFloat(card.querySelector('input[name="si-price"]').value.replace(',', '.'));
    if (!g || !(qty > 0)) { card.querySelector('input[name="si-qty"]').focus(); return; }
    const p = price >= 0 ? price : g.price, ex = r.items.find(it => it[0] === code && it[4] === p);
    if (ex) ex[3] += qty; else r.items.push([g.code, g.name, g.unit, qty, p]);
    this.refreshSale(r);
  },
  /* переход к связанному документу: страница, вкладка (для производства) и раскрываемая запись; на той же странице — перерисовка, иначе — смена адреса */
  goTo(spec) {
    const [page, tab, xpId] = spec.split(':');
    if (tab) this.state.prodTab = tab;
    this.pendingOpen = xpId; XP.closeAll();
    if (this.state.page === page) { this.renderTopbar(); this.renderGrid(); } else location.hash = '#' + page;
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
      x.querySelector('.sel-btn').title = opt.querySelector('.grow').textContent;   // полное значение по наведению — в узком поле оно обрезается многоточием
      x.querySelectorAll('[data-opt]').forEach(b => { b.classList.toggle('on', b === opt); const c = b.querySelector('.chk'); if (c) c.remove(); });
      opt.insertAdjacentHTML('beforeend', `<span class="chk">${icRaw('check', 'sm')}</span>`);
      XP.close();
      const nm = x.querySelector('input[type=hidden]').name;
      const oc = x.closest('[data-ocard]'); if (oc) this.updateOrder(oc.dataset.ocard, nm.replace(/^of-/, ''), opt.dataset.opt);
      const pc = x.closest('[data-pcard]'); if (pc) this.updateProd(pc.dataset.pcard, nm.replace(/^pf-/, ''), opt.dataset.opt);
      const sc = x.closest('[data-scard]');
      if (sc) {
        if (nm === 'si-code') {   // выбор товара в строке добавления: подставить цену и единицу
          const r = SALES.find(y => y.id === sc.dataset.scard), g = r && this.goods(r.dir).find(y => y.code === opt.dataset.opt);
          if (g) { sc.querySelector('input[name="si-price"]').value = g.price; sc.querySelector('input[name="si-qty"]').closest('.fld').querySelector('.fl').textContent = 'Кол-во, ' + g.unit; }
        } else this.updateSale(sc.dataset.scard, nm.replace(/^sf-/, ''), opt.dataset.opt);
      }
      const sf = x.closest('form[data-new="sale"]');   // смена типа реализации в форме: показать поля этого типа
      if (sf && nm === 'type') sf.querySelectorAll('.fld[data-for]').forEach(f => f.classList.toggle('off', !f.dataset.for.split(' ').includes(opt.dataset.opt)));
      return;
    }
    // календарь: листание месяцев перерисовывает сетку внутри открытой панели; выбор дня и «очистить» пишут значение и закрывают
    const cNav = t.closest('[data-cal-nav]');
    if (cNav) {
      const [y, m] = cNav.dataset.calNav.split(':').map(Number), d = new Date(y, m, 1), x = cNav.closest('.csel');
      x.querySelector('.cal-p').innerHTML = calHtml(d.getFullYear(), d.getMonth(), x.querySelector('input[type=hidden]').value);
      return;
    }
    const cDay = t.closest('[data-cal-day]'), cClr = t.closest('[data-cal-clear]');
    if (cDay || cClr) {
      const x = (cDay || cClr).closest('.csel'), v = cDay ? cDay.dataset.calDay : '', l = x.querySelector('.sel-btn .lbl'), d = v ? new Date(v + 'T00:00') : new Date();
      x.querySelector('input[type=hidden]').value = v;
      l.textContent = v ? fmtDate(isoToRu(v)) : 'выберите дату'; l.classList.toggle('ph', !v);
      x.querySelector('.cal-p').innerHTML = calHtml(d.getFullYear(), d.getMonth(), v);
      XP.close();
      const pc = x.closest('[data-pcard]'); if (pc) this.updateProd(pc.dataset.pcard, 'due', v);
      const sc = x.closest('[data-scard]'); if (sc) this.updateSale(sc.dataset.scard, x.querySelector('input[type=hidden]').name.replace(/^sf-/, ''), v);
      return;
    }
    const ptab = t.closest('[data-ptab]');
    if (ptab) { this.state.prodTab = ptab.dataset.ptab; XP.closeAll(); this.renderTopbar(); this.renderGrid(); return; }
    const stype = t.closest('[data-stype]');
    if (stype) { this.state.saleType = stype.dataset.stype; XP.closeAll(); this.renderGrid(); return; }
    const iadd = t.closest('[data-item-add]');
    if (iadd) { this.saleItemAdd(iadd.closest('[data-scard]')); return; }
    const irm = t.closest('[data-item-rm]');
    if (irm) { const r = SALES.find(x => x.id === irm.closest('[data-scard]').dataset.scard); if (r) { r.items.splice(+irm.dataset.itemRm, 1); this.refreshSale(r); } return; }
    const go = t.closest('[data-go]');
    if (go) { this.goTo(go.dataset.go); return; }
    const ttg = t.closest('[data-tree-tg]');
    if (ttg) { ttg.closest('.tgroup').classList.toggle('closed'); XP.focus(); return; }
    const recOpen = t.closest('[data-rec-open]');
    if (recOpen) { this.state.prodTab = 'recipes'; this.state.q = ''; XP.closeAll(); this.renderTopbar(); this.renderGrid(); this.reopen('rc-' + recOpen.dataset.recOpen); return; }
    const pnew = t.closest('[data-prod-new]');
    if (pnew) {
      const r = REC[pnew.dataset.prodNew], id = nextNo(PROD_ORDERS.map(o => o.id), 'ПЗ'), due = new Date(Date.now() + 14 * 864e5);
      PROD_ORDERS.unshift({ id, rec: r.id, qty: r.out, st: 'plan', due: isoToRu(isoDate(due)), order: '—', at: nowStamp() });
      this.state.prodTab = 'orders'; XP.closeAll(); this.renderTopbar(); this.renderGrid(); this.reopen('pz-' + id);
      return;
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
    const pf = e.target.closest('[data-pcard] input.in[name^="pf-"]');
    if (pf) { this.updateProd(pf.closest('[data-pcard]').dataset.pcard, pf.name.replace(/^pf-/, ''), pf.value); return; }
    const of = e.target.closest('[data-ocard] input.in[name^="of-"]');
    if (of) { this.updateOrder(of.closest('[data-ocard]').dataset.ocard, of.name.replace(/^of-/, ''), of.value); return; }
    const sf = e.target.closest('[data-scard] input.in[name^="sf-"]');
    if (sf) { this.updateSale(sf.closest('[data-scard]').dataset.scard, sf.name.replace(/^sf-/, ''), sf.value); return; }
    const toRow = f => [f.name.replace(/\.[^.]+$/, ''), fileKind(f.name), fmtSize(f.size), todayShort()];
    const us = e.target.closest('[data-upload-sale]');   // файлы в карточку реализации
    if (us && us.files.length) { const r = SALES.find(x => x.id === us.dataset.uploadSale); [...us.files].forEach(f => r.files.push(toRow(f))); this.refreshSale(r); return; }
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
