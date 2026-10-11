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
/* 34-й круг: даты и числа для обзора, клиентов и финансов; сроки считаются от рабочего дня демонстрации DEMO */
const rubK = n => Math.abs(n) >= 1e6 ? (n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' млн ₽' : Math.abs(n) >= 1e4 ? Math.round(n / 1e3).toLocaleString('ru-RU') + ' тыс. ₽' : rub(n);
const toDate = s => { const m = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(s || ''); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
const dayDiff = (a, b) => { const x = toDate(a), y = toDate(b); return x && y ? Math.round((y - x) / 864e5) : 0; };   // b − a в днях
const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`; };
const plural = (n, one, few, many) => { const m = n % 10, h = n % 100; return n + ' ' + (h >= 11 && h <= 14 ? many : m === 1 ? one : m >= 2 && m <= 4 ? few : many); };
const shortDate = s => { const m = /^(\d{2})\.(\d{2})/.exec(s || ''); return m ? `${m[1]}.${m[2]}` : (s || '—'); };
const dKey = s => (s || '').slice(0, 10).split('.').reverse().join('');
const inMonth = (s, mm) => (s || '').slice(3, 10) === mm;   // 'мм.гггг'

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
    document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-ocard] input.in, [data-pcard] input.in, [data-scard] input.in[name^="sf-"], [data-ccard] input.in, [data-spcard] input.in, [data-icard] input.in, [data-plcard] input.in')) e.target.blur(); });   // Enter в поле карточки применяет значение
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
    const id = (location.hash.replace('#', '') || 'overview').replace('logistics', 'supply');   // главная — Обзор (34-й круг)
    const next = PAGES.some(p => p.id === id) ? id : 'overview';
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
    const clTab = s.clTab || 'clients', finTab = s.finTab || 'flow';
    const primary = { overview: 'Создать', supply: 'Заявка', warehouse: 'Поступление', production: 'Заказ', sales: 'Реализация', clients: { clients: 'Клиент', suppliers: 'Поставщик', carriers: 'Перевозчик', issues: 'Обращение' }[clTab], finance: 'Оплата', staff: 'Сотрудник' }[pg.id] || 'Запись';
    const ph = { overview: 'Документ, клиент, артикул, телефон…', supply: 'Заказ, заявка, поставщик, ИНН…', warehouse: 'Артикул, наименование, поставщик…', production: 'Рецепт, изделие, материал, заказ…', sales: 'Заказ, клиент, счёт, договор, товар…', clients: 'Клиент, ИНН, поставщик, обращение…', finance: 'Оплата, контрагент, документ, категория…', staff: 'Сотрудники, должности…', settings: 'Настройка…' }[pg.id] || 'Поиск…';
    const unread = NOTIFS.filter(n => n.unread).length;
    const dateChip = pg.id === 'overview' || pg.id === 'finance' ? `<span class="tb-date" title="Рабочий день демонстрации: сроки, просрочки и календари считаются от него"><i class="live"></i>${DEMO.wd}, <span class="num">${fmtDate(DEMO.date)}</span> · <span class="num">${DEMO.time}</span></span>` : '';
    const newBtn = pg.id === 'settings' ? '' : xp({ id: 'new', head: `<button class="btn primary">${glassIcon('plus', themeInv(), 'sm')}${primary}</button>`, panel: this.newForm(pg), place: 'below-r' });
    this.el.topbar.innerHTML = `
      <div class="tb-ic">${glassIcon(pg.icon, themeVar())}</div>
      <div class="tb-title">${pg.name}</div>
      <div style="width:6px"></div>
      ${xp({ id: 'company', head: sw(ic('building', 'sm'), co.name, 'Организация'), panel: coPanel, place: 'below' })}
      ${xp({ id: 'dir', head: sw(dirIcon(s.dir), s.dir === 'all' ? 'Все направления' : DIR[s.dir].name, 'Направление деятельности'), panel: dirPanel, place: 'below' })}
      ${dateChip}
      <div class="grow"></div>
      <label class="search">${ic('search', 'sm')}<input placeholder="${ph}" data-search value="${esc(s.q)}"><kbd>/</kbd></label>
      ${newBtn}
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
    if (pg.id === 'overview') {
      /* на обзоре кнопка «Создать» — меню: форма живёт на своей странице, переход открывает её */
      return `<div class="menu qa"><div class="lbl">Создать</div>
        ${[['sales', 'Реализация', 'tag'], ['supply', 'Заявка на снабжение', 'box'], ['warehouse', 'Поступление на склад', 'wh'], ['production', 'Заказ на производство', 'factory'], ['clients', 'Клиент или обращение', 'users'], ['finance', 'Оплата', 'money'], ['staff', 'Сотрудник', 'idcard']].map(([p, name, icon]) => `<button type="button" data-go="${p}::new">${ic(icon, 'sm')}${name}</button>`).join('')}
        <div class="sep"></div><div class="mute small" style="padding:4px 9px 6px">Форма откроется на странице документа.</div></div>`;
    }
    if (pg.id === 'warehouse') {
      const cats = [...new Set(Object.values(MATERIALS).map(m => m.cat))];
      return `<form data-new="receipt" style="width:620px">
        <div class="ph"><span class="t">Поступление на склад вручную</span><span class="mute small">${nextNo(STOCK_MANUAL.map(r => r.id), 'ПС')} · по накладной, без заявки на снабжение</span>${close}</div>
        <div class="pb frm">
          ${fld('Склад', sel('dir', DIRS.map(d => [d.id, `${DEPTS.find(x => x.id === 'wh').names[d.id]} · ${d.short}`])))}
          ${fld('Основание', inp('note', 'placeholder="накладная №, от кого" required'))}
          ${fld('Артикул', inp('sku', 'placeholder="например ЛД-16-ДС" required'))}
          ${fld('Наименование', inp('name', 'placeholder="как в накладной" required'))}
          ${fld('Категория', sel('cat', cats.map(c => [c, c])))}
          ${fld('Подкатегория', inp('sub', 'placeholder="например ЛДСП"'))}
          ${fld('Единица', sel('unit', ['шт', 'кг', 'м', 'лист', 'компл', 'рул', 'л'].map(u => [u, u])))}
          ${fld('Количество', inp('qty', 'type="number" min="0.01" step="any" required'))}
          ${fld('Цена за единицу, ₽', inp('price', 'type="number" min="0" step="any" required'))}
          ${fld('Поставщик', inp('supplier', 'placeholder="кто передал"'))}
        </div>
        <div class="pf"><button type="button" class="btn sm ghost" data-xp-close>Отмена</button><span class="grow"></span><button type="submit" class="btn sm primary">${glassIcon('plus', themeInv(), 'xs')}Принять на склад</button></div>
      </form>`;
    }
    if (pg.id === 'clients') {
      const tab = this.state.clTab || 'clients', sellers = STAFF.filter(p => p.role === 'seller'), cs = STAFF.filter(p => p.role === 'cs' || p.role === 'seller');
      if (tab === 'issues') return `<form data-new="issue" style="width:600px">
        <div class="ph"><span class="t">Новое обращение</span><span class="mute small">${nextNo(ISSUES.map(i => i.id), 'ОБ')} · статус «новое»</span>${close}</div>
        <div class="pb frm">
          ${fld('Клиент', sel('client', Object.keys(CLIENTS).sort((a, b) => a.localeCompare(b, 'ru')).map(n => [n, n])), 'full')}
          ${fld('Вид', sel('kind', ISSUE_KINDS.map(k => [k, k])))}
          ${fld('Источник', sel('src', Object.keys(ISSUE_SRC).map(k => [k, k])))}
          ${fld('По документу', inp('doc', 'placeholder="ЗК-0000" pattern="[А-ЯЁ]{2}-[0-9]{4}"'))}
          ${fld('Ответственный', sel('who', cs.map(p => [p.id, shortFio(p.name)]), 24))}
          ${fld('Срок ответа', dsel('due', isoDate(new Date(toDate(DEMO.date).getTime() + 2 * 864e5))))}
          ${fld('Суть обращения', '<textarea class="in" name="text" rows="4" required placeholder="Что просит клиент"></textarea>', 'full')}
        </div>
        <div class="pf"><button type="button" class="btn sm ghost" data-xp-close>Отмена</button><span class="grow"></span><button type="submit" class="btn sm primary">${glassIcon('plus', themeInv(), 'xs')}Создать обращение</button></div>
      </form>`;
      if (tab === 'suppliers') return `<form data-new="supplier" style="width:620px">
        <div class="ph"><span class="t">Новый поставщик</span><span class="mute small">появится в выборе поставщика на «Снабжении»</span>${close}</div>
        <div class="pb frm">
          ${fld('Наименование', inp('name', 'required placeholder="ООО «…» или ИП"'))}
          ${fld('ИНН', inp('inn', 'placeholder="10 или 12 цифр" inputmode="numeric" pattern="[0-9]{10}|[0-9]{12}"'))}
          ${fld('Категория', inp('cat', 'placeholder="Металлопрокат, крепёж, сырьё…" required'))}
          ${fld('Условия оплаты', inp('terms', 'placeholder="по счёту, отсрочка 14 дней…"'))}
          ${fld('Контактное лицо', inp('cname', 'placeholder="Фамилия Имя Отчество"'))}
          ${fld('Телефон', inp('ctel', 'type="tel" placeholder="+7 …"'))}
          ${fld('Почта', inp('cmail', 'type="email" placeholder="sales@company.ru"'))}
          ${fld('Адрес', inp('addr', 'placeholder="город, улица"'))}
        </div>
        <div class="pf"><button type="button" class="btn sm ghost" data-xp-close>Отмена</button><span class="grow"></span><button type="submit" class="btn sm primary">${glassIcon('plus', themeInv(), 'xs')}Добавить поставщика</button></div>
      </form>`;
      if (tab === 'carriers') return `<form data-new="carrier" style="width:560px">
        <div class="ph"><span class="t">Новый перевозчик</span><span class="mute small">появится в выборе доставки</span>${close}</div>
        <div class="pb frm">
          ${fld('Название', inp('name', 'required placeholder="Транспортная компания"'))}
          ${fld('Вид', sel('kind', [['ТК', 'транспортная компания'], ['курьер', 'курьерская служба'], ['свой', 'свой транспорт']]))}
          ${fld('Контакт', inp('contact', 'placeholder="терминал, менеджер"'))}
          ${fld('Телефон', inp('tel', 'type="tel" placeholder="+7 …"'))}
          ${fld('Сайт отслеживания', inp('site', 'placeholder="example.ru"'))}
          ${fld('Заметка', inp('note', 'placeholder="что возим"'))}
        </div>
        <div class="pf"><button type="button" class="btn sm ghost" data-xp-close>Отмена</button><span class="grow"></span><button type="submit" class="btn sm primary">${glassIcon('plus', themeInv(), 'xs')}Добавить перевозчика</button></div>
      </form>`;
      return `<form data-new="client" style="width:640px">
        <div class="ph"><span class="t">Новый клиент</span><span class="mute small">статус «новый» · появится в выборе клиента на «Продажах»</span>${close}</div>
        <div class="pb frm">
          ${fld('Вид', sel('kind', [['юрлицо', 'юридическое лицо'], ['ИП', 'индивидуальный предприниматель'], ['физлицо', 'физическое лицо']]))}
          ${fld('Наименование', inp('name', 'required placeholder="ООО «…», ИП или ФИО"'))}
          ${fld('ИНН', inp('inn', 'placeholder="10 или 12 цифр" inputmode="numeric" pattern="[0-9]{10}|[0-9]{12}"'))}
          ${fld('КПП', inp('kpp', 'placeholder="для юрлица" inputmode="numeric"'))}
          ${fld('Контактное лицо', inp('cname', 'placeholder="Фамилия Имя Отчество"'))}
          ${fld('Телефон', inp('ctel', 'type="tel" placeholder="+7 …"'))}
          ${fld('Почта', inp('cmail', 'type="email" placeholder="name@company.ru"'))}
          ${fld('Менеджер', sel('mgr', sellers.map(p => [p.id, `${shortFio(p.name)} · ${DIR[p.dirs[0]].short.toLowerCase()}`])))}
          ${fld('Адрес', inp('addr', 'placeholder="город, улица, дом"'), 'full')}
          ${fld('Заметка', inp('note', 'placeholder="откуда пришёл, что важно"'), 'full')}
        </div>
        <div class="pf"><button type="button" class="btn sm ghost" data-xp-close>Отмена</button><span class="grow"></span><button type="submit" class="btn sm primary">${glassIcon('plus', themeInv(), 'xs')}Добавить клиента</button></div>
      </form>`;
    }
    if (pg.id === 'finance') {
      return `<form data-new="payment" style="width:640px">
        <div class="ph"><span class="t">Новая оплата</span><span class="mute small">${nextNo(PAYMENTS.map(p => p.id), 'ПЛ')} · поступление или выплата, план или факт</span>${close}</div>
        <div class="pb frm">
          ${fld('Вид', sel('kind', [['in', 'поступление'], ['out', 'выплата']]))}
          ${fld('Статус', sel('st', Object.entries(PAY_ST).map(([k, v]) => [k, v[0]]), 'fact'))}
          ${fld('Контрагент', inp('who', 'required placeholder="клиент, поставщик, служба"'))}
          ${fld('Документ', inp('doc', 'placeholder="ЗК-0000 или СН-0000" pattern="[А-ЯЁ]{2}-[0-9]{4}"'))}
          ${fld('Сумма, ₽', inp('sum', 'type="number" min="0.01" step="any" required'))}
          ${fld('Дата', dsel('at', isoDate(toDate(DEMO.date))))}
          ${fld('Счёт или касса', sel('acc', ACCOUNTS.map(a => [a.id, a.name])))}
          ${fld('Категория', sel('cat', PAY_CATS.map(c => [c, c])))}
          ${fld('Направление', sel('dir', [['—', 'общие службы'], ...DIRS.map(d => [d.id, d.name])]))}
          ${fld('Комментарий', inp('note', 'placeholder="основание"'))}
        </div>
        <div class="pf"><button type="button" class="btn sm ghost" data-xp-close>Отмена</button><span class="grow"></span><button type="submit" class="btn sm primary">${glassIcon('plus', themeInv(), 'xs')}Провести</button></div>
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
    if (form.dataset.new === 'receipt') {
      const id = nextNo(STOCK_MANUAL.map(r => r.id), 'ПС');
      STOCK_MANUAL.unshift({ id, dir: v('dir'), sku: v('sku'), name: v('name'), cat: v('cat'), sub: v('sub') || '—', unit: v('unit') || 'шт', qty: parseFloat(v('qty').replace(',', '.')) || 0, price: parseFloat(v('price').replace(',', '.')) || 0, supplier: v('supplier') || 'по накладной', note: v('note'), at: nowStamp() });
      XP.closeAll(); this.renderTopbar(); this.renderGrid();
      return;
    }
    if (form.dataset.new === 'client') {
      const name = v('name'), contact = { name: v('cname') || '—', tel: v('ctel') || '—', mail: v('cmail') || '—' };
      if (!CLIENTS[name]) CLIENTS[name] = { inn: v('inn') || '—', kind: v('kind') === 'юрлицо' ? 'юрлицо' : v('kind'), contacts: [contact] };
      CLIENT_INFO[name] = { inn: v('inn') || '—', kpp: v('kpp') || '—', addr: v('addr') || '—', mgr: +v('mgr') || 18, since: DEMO.date, st: 'new', note: v('note'), last: '—', total: 0, dirs: [], contact };
      XP.closeAll(); this.state.clTab = 'clients'; this.state.q = name; this.renderTopbar(); this.renderGrid(); this.reopen('cl-' + name);
      return;
    }
    if (form.dataset.new === 'supplier') {
      const name = v('name'), contact = { name: v('cname') || '—', tel: v('ctel') || '—', mail: v('cmail') || '—' };
      SUPPLIERS[name] = { inn: v('inn') || '—', contacts: [contact, { name: 'Отдел продаж', tel: contact.tel, mail: '—' }] };
      SUP_INFO[name] = { cat: v('cat'), terms: v('terms') || 'оплата по счёту', addr: v('addr') || '—', since: '2026', isNew: true };
      XP.closeAll(); this.state.clTab = 'suppliers'; this.state.q = name; this.renderTopbar(); this.renderGrid(); this.reopen('sp-' + name);
      return;
    }
    if (form.dataset.new === 'carrier') {
      CARRIER_INFO.push({ name: v('name'), kind: v('kind'), contact: v('contact') || '—', tel: v('tel') || '—', site: v('site') || '—', note: v('note') });
      if (!CARRIERS.includes(v('name'))) CARRIERS.push(v('name'));
      XP.closeAll(); this.state.clTab = 'carriers'; this.renderTopbar(); this.renderGrid();
      return;
    }
    if (form.dataset.new === 'issue') {
      const id = nextNo(ISSUES.map(i => i.id), 'ОБ');
      ISSUES.unshift({ id, client: v('client'), kind: v('kind'), src: v('src'), st: 'new', doc: v('doc') || '—', who: +v('who') || 24, at: nowStamp(), due: v('due') ? isoToRu(v('due')) : '—', text: v('text'), result: '', hist: [['new', nowStamp()]] });
      XP.closeAll(); this.state.clTab = 'issues'; this.renderTopbar(); this.renderGrid(); this.reopen('ob-' + id);
      return;
    }
    if (form.dataset.new === 'payment') {
      const id = nextNo(PAYMENTS.map(p => p.id), 'ПЛ'), acc = ACCOUNTS.find(a => a.id === v('acc')) || ACCOUNTS[0];
      PAYMENTS.unshift({ id, kind: v('kind') || 'in', sum: parseFloat(v('sum').replace(',', '.')) || 0, cat: v('cat') || 'прочее', who: v('who'), doc: v('doc') || '—', dir: v('dir') || '—', co: acc.co, st: v('st') || 'fact', acc: acc.id, at: v('at') ? isoToRu(v('at')) : DEMO.date, note: v('note') });
      XP.closeAll(); this.state.finTab = 'flow'; this.renderTopbar(); this.renderGrid(); this.reopen('pl-' + id);
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
    this.el.grid.classList.toggle('single', ['supply', 'warehouse', 'production', 'sales', 'clients', 'finance'].includes(pg.id));
    this.el.grid.classList.toggle('ov', pg.id === 'overview');
    this.el.grid.innerHTML = { overview: () => this.overview(), supply: () => this.supply(), warehouse: () => this.warehouse(), production: () => this.production(), sales: () => this.sales(), clients: () => this.clients(), finance: () => this.finance(), staff: () => this.staff(), settings: () => this.settings() }[pg.id]();
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

  /* ---------- Обзор (34-й круг, перенос из design/overview): главная страница предприятия. Все числа считаются из документов;
     сроки и просрочки — от рабочего дня демонстрации DEMO. Поток — шесть стеклянных плиток этапов (приём чипа крупнее) и дорожки направлений ---------- */
  supTotal(r) { return r.items.reduce((a, it) => a + it[4] * it[5], 0); },
  whName(dir) { return DEPTS.find(d => d.id === 'wh').names[dir]; },
  activeSales() { return SALES.filter(r => r.st !== 'done'); },
  activeSupply() { return SUPPLY.filter(r => r.st !== 'done'); },
  activeProd() { return PROD_ORDERS.filter(o => o.st !== 'done'); },
  unpaidSales() { return SALES.filter(r => this.saleTotal(r) - r.paid > .5); },
  unpaidSupply() { return SUPPLY.filter(r => !r.paid && r.st !== 'done'); },
  overdueSales() { return this.unpaidSales().filter(r => r.due !== '—' && dayDiff(r.due, DEMO.date) > 0); },
  lateSupply() { return this.activeSupply().filter(r => r.st === 'tr' && dayDiff(r.eta, DEMO.date) > 0); },
  noInvoice() { return this.activeSupply().filter(r => r.st === 'req' && !r.files.some(f => f[1] === 'счёт')); },
  /* чем закрыт недостающий материал: transit — заказан (заказ создан / груз в пути), req:СН-… — есть заявка без заказа, none — ничего */
  cover(sku) {
    if (SUPPLY.some(r => (r.st === 'tr' || r.st === 'ord') && r.items.some(it => it[0] === sku))) return 'transit';
    const req = SUPPLY.find(r => r.st === 'req' && r.items.some(it => it[0] === sku));
    return req ? 'req:' + req.id : 'none';
  },
  /* нехватка по активным заказам на производство: нет на складе и не заказано (груз в пути — не дефицит) */
  shortages() { const out = {}; this.activeProd().forEach(o => { const sh = this.explode(o.rec, o.qty).mats.filter(m => m.short > 1e-9).map(m => ({ ...m, cover: this.cover(m.sku) })).filter(m => m.cover !== 'transit'); if (sh.length) out[o.id] = sh; }); return out; },
  /* загрузка цехов: нормо-часы активных заказов по уровням против мощности недели */
  loadByDir() {
    const cap = { metal: 80, furn: 80, poly: 40 }, h = { metal: 0, furn: 0, poly: 0 }, next = {};
    this.activeProd().forEach(o => { const r = REC[o.rec]; this.explode(o.rec, o.qty).works.forEach(w => { const d = DIRS.find(x => this.prodArea(x.id) === w.area); if (d) h[d.id] += w.h; }); if (!next[r.dir] || dayDiff(next[r.dir].due, o.due) < 0) next[r.dir] = o; });
    return DIRS.map(d => ({ dir: d.id, h: h[d.id], cap: cap[d.id], pct: Math.round(100 * h[d.id] / cap[d.id]), next: next[d.id] }));
  },
  stile(key, label, n, unit, sub, cls) {
    const mark = c => `<path class="cl${c}" d="M40 10H52V26A6 6 0 0 1 40 26Z"/>`;
    return `<div class="stile t-${key} ${cls}" data-stage="${key}" title="Раскрыть документы этапа">
      <svg class="stg" viewBox="0 0 176 88" aria-hidden="true"><rect class="bk" width="34" height="34" rx="10"/><rect class="sh" x="10" y="12" width="166" height="78" rx="13"/><g clip-path="url(#tl-clip)"><rect class="base" width="176" height="88"/><rect class="bk bl2" width="34" height="34" rx="10"/>${mark(' bl2')}<rect class="tint" x="10" y="10" width="166" height="78"/>${mark(' glow bl2')}<rect class="edge" x="10" y="10" width="166" height="78" rx="13"/></g></svg>
      <div class="tx"><span class="k">${label}</span><span class="n">${n}${unit ? `<small>${unit}</small>` : ''}</span></div><span class="s">${sub}</span>
    </div>`;
  },
  conn() { return `<div class="conn"><svg viewBox="0 0 100 84" preserveAspectRatio="none"><path class="ln" d="M0 46H100"/><path class="fl" d="M0 46H100"/></svg><svg viewBox="0 0 10 10" style="left:auto;right:0;width:8px;height:84px;top:0" preserveAspectRatio="xMaxYMid meet"><path class="ar" d="M2 1 9 5 2 9Z"/></svg></div>`; },
  stages() {
    const inD = x => this.state.dir === 'all' || x === this.state.dir;
    const sales = this.activeSales().filter(r => inD(r.dir)), sup = this.activeSupply().filter(r => inD(r.dir)), stock = this.stockRows().filter(x => inD(x.dir) && x.left > 0), prod = this.activeProd().filter(o => inD(REC[o.rec].dir)), ships = SALES.filter(r => (r.st === 'ok' || r.st === 'ship') && inD(r.dir));
    const unpaidS = this.unpaidSales().filter(r => inD(r.dir)), unpaidP = this.unpaidSupply().filter(r => inD(r.dir)), overdue = this.overdueSales().filter(r => inD(r.dir)), late = this.lateSupply().filter(r => inD(r.dir)), noInv = this.noInvoice().filter(r => inD(r.dir));
    const shortages = this.shortages(), shortOrders = prod.filter(o => shortages[o.id]);
    const shortSkus = new Set(Object.entries(shortages).flatMap(([id, sh]) => inD(REC[PROD_ORDERS.find(o => o.id === id).rec].dir) ? sh.map(m => m.sku) : []));
    const stockVal = stock.reduce((a, x) => a + x.left * x.price, 0);
    const toGet = unpaidS.reduce((a, r) => a + this.saleTotal(r) - r.paid, 0), toPay = unpaidP.reduce((a, r) => a + this.supTotal(r), 0);
    const over = this.loadByDir().filter(l => inD(l.dir) && l.pct > 100);
    const nextShip = ships.filter(r => r.st === 'ok' && r.ship !== '—').sort((a, b) => dayDiff(b.ship, a.ship)).find(r => dayDiff(DEMO.date, r.ship) >= 0);
    const dot = (bad, warn) => bad ? '<i class="dot bad"></i>' : warn ? '<i class="dot warn"></i>' : '<i class="dot ok"></i>';
    const byDir = (list, f) => Object.fromEntries(DIRS.map(x => [x.id, list.filter(r => f(r) === x.id)]));
    const sub = (d, t) => `${d}<span>${t}</span>`, m = v => (v / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' млн';
    return [
      { key: 'sales', label: 'Реализации', n: sales.length, sub: sub(dot(overdue.length, sales.some(r => r.st === 'new')), `${overdue.length ? plural(overdue.length, 'просрочена', 'просрочены', 'просрочено') + ' · ' : ''}${plural(sales.filter(r => r.st === 'new').length, 'оформляется', 'оформляются', 'оформляются')}`), docs: sales, lanes: byDir(sales, r => r.dir), attn: r => overdue.includes(r), page: 'sales' },
      { key: 'supply', label: 'Снабжение', n: sup.length, sub: sub(dot(late.length, noInv.length), `${late.length ? plural(late.length, 'опаздывает', 'опаздывают', 'опаздывают') + ' · ' : ''}${noInv.length} без счёта`), docs: sup, lanes: byDir(sup, r => r.dir), attn: r => late.includes(r) || noInv.includes(r), page: 'supply' },
      { key: 'stock', label: 'Склад', n: stock.length, unit: 'поз.', sub: sub(dot(shortSkus.size), `остаток ${rubK(stockVal)} · нет ${plural(shortSkus.size, 'позиции', 'позиций', 'позиций')}`), docs: stock, lanes: byDir(stock, x => x.dir), attn: x => shortSkus.has(x.sku), page: 'warehouse' },
      { key: 'prod', label: 'Производство', n: prod.length, sub: sub(dot(shortOrders.length || over.length), `${shortOrders.length} ждут материалы${over.length ? ' · ' + over.map(l => this.prodArea(l.dir).toLowerCase()).join(', ') + ' перегружен' : ''}`), docs: prod, lanes: byDir(prod, o => REC[o.rec].dir), attn: o => !!shortages[o.id], page: 'production' },
      { key: 'ship', label: 'Отгрузки', n: ships.length, sub: sub(dot(false, false), nextShip ? 'ближайшая ' + shortDate(nextShip.ship) + ' · ' + nextShip.id : 'в ожидании нет'), docs: ships, lanes: byDir(ships, r => r.dir), attn: () => false, page: 'sales' },
      { key: 'pay', label: 'Оплаты', n: unpaidS.length + unpaidP.length, sub: sub(dot(overdue.length), `ждём ${m(toGet)} · платим ${m(toPay)}`), docs: [...unpaidS, ...unpaidP], lanes: byDir([...unpaidS, ...unpaidP], r => r.dir), attn: r => overdue.includes(r), page: 'finance' },
    ];
  },
  docGo(key, r) { return r.rec !== undefined ? `production:orders:pz-${r.id}` : r.supplier !== undefined && r.inn !== undefined ? `supply::sup-${r.id}` : r.client !== undefined ? `sales::sl-${r.id}` : 'warehouse::'; },
  docRow(key, r) {
    const chip = key === 'sales' || key === 'ship' ? slChip(r.st) : key === 'supply' ? stChip(r.st) : key === 'prod' ? pzChip(r.st) : key === 'pay' ? (r.client !== undefined ? payChipOf(this.saleTotal(r), r.paid) : payChip(false)) : '';
    const who = key === 'stock' ? r.name : key === 'prod' ? REC[r.rec].name : (r.client || r.supplier), no = key === 'stock' ? r.sku : r.id;
    return `<div class="row"><span class="no small">${no}</span>${chip}<span class="who small">${esc(who)}</span></div>`;
  },
  stageTable(x) {
    const cols = x.key === 'stock' ? '90px minmax(0,1.6fr) 110px 110px 150px 140px' : '70px 140px minmax(0,1.6fr) 150px 120px 150px';
    const head = x.key === 'stock' ? ['артикул', 'наименование', 'остаток', 'сумма', 'потребность', 'направление'] : ['номер', 'статус', x.key === 'prod' ? 'рецепт' : 'контрагент', x.key === 'prod' ? 'количество' : 'сумма', x.key === 'supply' ? 'срок доставки' : x.key === 'prod' ? 'срок' : x.key === 'pay' ? 'срок оплаты' : 'отгрузка', 'направление'];
    const rows = x.docs.map(r => {
      if (x.key === 'stock') return [`<span class="num mute">${r.sku}</span>`, esc(r.name), `<span class="num">${fmtQty(r.left)} ${r.unit}</span>`, `<span class="num">${rub(r.left * r.price)}</span>`, x.attn(r) ? '<span class="bad-t small">не хватает заказам</span>' : '<span class="mute">—</span>', chipDir(r.dir)];
      const isSale = r.client !== undefined, isProd = r.rec !== undefined;
      const chip = isProd ? pzChip(r.st) : isSale ? slChip(r.st) : stChip(r.st);
      const who = isProd ? `${REC[r.rec].name} <span class="mute small">${r.rec}</span>` : esc(isSale ? r.client : r.supplier);
      const sum = isProd ? `${fmtQty(r.qty)} ${REC[r.rec].unit}` : isSale ? rub(this.saleTotal(r)) + (x.key === 'pay' ? ` <span class="mute small">· не хватает ${rub(this.saleTotal(r) - r.paid)}</span>` : '') : rub(this.supTotal(r));
      const date = isProd ? fmtDate(r.due) : !isSale ? fmtDate(r.eta) : x.key === 'pay' ? (r.due !== '—' ? fmtDate(r.due) : '<span class="mute">по договору</span>') : fmtDate(r.ship);
      return [`<button type="button" class="lnk no" data-go="${this.docGo(x.key, r)}">${r.id}</button>`, chip, who, `<span class="num">${sum}</span>`, `<span class="num${x.attn(r) ? ' bad-t' : ''}">${date}</span>`, chipDir(isProd ? REC[r.rec].dir : r.dir)];
    });
    return `<div class="tbl items"><div class="tr th" style="grid-template-columns:${cols}">${head.map(h => `<div>${h}</div>`).join('')}</div>${rows.map(r => `<div class="tr" style="grid-template-columns:${cols}">${r.map(c => `<div class="ellip">${c}</div>`).join('')}</div>`).join('')}</div>`;
  },
  ovFlow() {
    const st = this.stages(), s = this.state, dirs = DIRS.filter(d => s.dir === 'all' || d.id === s.dir);
    const tiles = `<div class="lbl"><b>Этапы</b><span class="txt">активных документов</span></div>` + st.map((x, i) => (i ? this.conn() : '') + this.stile(x.key, x.label, x.n, x.unit, x.sub, s.stage === x.key ? 'on' : '')).join('');
    const lanes = dirs.map(d => `<div class="lbl"><span class="chip dir" title="${DIR[d.id].name}"><span class="dk">${d.k}</span><span class="nm">${d.short}</span></span></div>` + st.map((x, i) => {
      const list = x.lanes[d.id] || [], bad = list.filter(x.attn).length;
      const pop = list.length ? `<div class="hp-pop"><div class="sec-t">${x.label} · ${DIR[d.id].name}</div>${list.slice(0, 8).map(r => this.docRow(x.key, r)).join('')}${list.length > 8 ? `<div class="mute small" style="padding-top:4px">и ещё ${list.length - 8}</div>` : ''}</div>` : '';
      return (i ? '<div class="lane-x"></div>' : '') + `<div class="lane-c hp ${list.length ? '' : 'z'}">${list.length || '—'}${bad ? '<i class="dot bad"></i>' : ''}${pop}</div>`;
    }).join('')).join('');
    const cur = st.find(x => x.key === s.stage);
    const body = `<div class="ov-flow">${tiles}${lanes}</div>${cur ? `<div class="stage-panel"><div class="ov-h"><div class="sec-t">${cur.label} · ${cur.docs.length}</div><button type="button" class="lnk small" data-go="${cur.page}::">открыть страницу</button></div>${this.stageTable(cur)}</div>` : ''}`;
    return mod({ span: 12, title: 'Поток предприятия', sub: 'от заказа клиента до денег на счёте: активные документы по этапам и направлениям · по наведению на число — документы, по клику на плитку — список этапа', body });
  },
  ovAttention() {
    const inD = x => this.state.dir === 'all' || x === this.state.dir, items = [], cut = n => n.length > 24 ? n.slice(0, 23).replace(/\s\S*$/, '') + '…' : n;
    this.overdueSales().filter(r => inD(r.dir)).forEach(r => items.push({ sev: 'bad', icon: 'money', t: `Счёт №${r.doc} просрочен на ${plural(dayDiff(r.due, DEMO.date), 'день', 'дня', 'дней')}`, m: `${r.client} · ${rub(this.saleTotal(r) - r.paid)}`, no: r.id, go: `sales::sl-${r.id}` }));
    SALES.filter(r => r.type === 'contract' && r.st === 'ok' && r.paid === 0 && inD(r.dir)).forEach(r => items.push({ sev: 'bad', icon: 'money', t: 'Аванс по договору не получен', m: `${r.client} · договор №${r.doc} · ${rub(this.saleTotal(r))}`, no: r.id, go: `sales::sl-${r.id}` }));
    Object.entries(this.shortages()).forEach(([id, sh]) => {
      const o = PROD_ORDERS.find(x => x.id === id); if (!inD(REC[o.rec].dir)) return;
      const none = sh.filter(m => m.cover === 'none'), reqs = [...new Set(sh.filter(m => m.cover !== 'none').map(m => m.cover.slice(4)))];
      const t = none.length ? `Не заказано: ${none.slice(0, 2).map(m => `${cut(m.m.name)} ${fmtQty(m.short)} ${m.m.unit}`).join(', ')}${none.length > 2 ? ` и ещё ${none.length - 2}` : ''}` : `Не хватает ${plural(sh.length, 'позиции', 'позиций', 'позиций')} — ${plural(reqs.length, 'заявка', 'заявки', 'заявок')} ${reqs.join(', ')} без заказа`;
      items.push({ sev: none.length ? 'bad' : 'warn', icon: 'factory', t, m: `${REC[o.rec].name} · ${fmtQty(o.qty)} ${REC[o.rec].unit} · срок ${fmtDate(o.due)}${none.length && reqs.length ? ` · ещё ${plural(sh.length - none.length, 'позиция', 'позиции', 'позиций')} в заявках` : ''}`, no: id, go: `production:orders:pz-${id}` });
    });
    this.lateSupply().filter(r => inD(r.dir)).forEach(r => items.push({ sev: 'warn', icon: 'box', t: `Груз опаздывает на ${plural(dayDiff(r.eta, DEMO.date), 'день', 'дня', 'дней')}`, m: `${r.supplier} · ${r.tc} · ${r.track}`, no: r.id, go: `supply::sup-${r.id}` }));
    this.noInvoice().filter(r => inD(r.dir)).forEach(r => items.push({ sev: 'warn', icon: 'file', t: `Заявка без счёта ${plural(dayDiff(r.hist[0][1], DEMO.date), 'день', 'дня', 'дней')}`, m: `${r.supplier} · ${rub(this.supTotal(r))}`, no: r.id, go: `supply::sup-${r.id}` }));
    this.loadByDir().filter(l => l.pct > 100 && inD(l.dir)).forEach(l => items.push({ sev: 'warn', icon: 'factory', t: `${this.prodArea(l.dir)} перегружен: ${l.pct} % мощности недели`, m: `${fmtQty(l.h)} ч работ при ${l.cap} ч · ${l.next ? l.next.id + ' до ' + shortDate(l.next.due) : ''}`, no: l.next ? l.next.id : '', go: l.next ? `production:orders:pz-${l.next.id}` : 'production::' }));
    ISSUES.filter(i => i.st !== 'done' && dayDiff(i.due, DEMO.date) > 0).forEach(i => items.push({ sev: 'warn', icon: 'users', t: `Обращение без ответа ${plural(dayDiff(i.due, DEMO.date), 'день', 'дня', 'дней')}`, m: `${i.client} · ${i.kind}`, no: i.id, go: `clients:issues:ob-${i.id}` }));
    STAFF.filter(p => p.st === 'sick' && p.pos === 'Начальник цеха' && inD(p.dirs[0])).forEach(p => items.push({ sev: 'warn', icon: 'idcard', t: `${this.prodArea(p.dirs[0])} без начальника`, m: `${p.name} на больничном с 1 октября`, no: '', go: 'staff::' }));
    const order = { bad: 0, warn: 1 }, LIMIT = 7;
    items.sort((a, b) => order[a.sev] - order[b.sev]);
    const shown = items.slice(0, LIMIT), rest = items.length - shown.length;
    const body = `<div class="att">${shown.map(it => `<a href="#" data-go="${it.go}" title="Открыть документ"><i class="dot ${it.sev}"></i><span class="ic">${ic(it.icon, 'sm')}</span><span style="min-width:0"><span class="t" style="display:block" title="${esc(it.t)}">${esc(it.t)}</span><span class="m" style="display:block" title="${esc(it.m)}">${esc(it.m)}</span></span><span class="no">${it.no}</span></a>`).join('') || '<div class="mute small" style="padding:8px 4px">Всё в порядке: просрочек, нехватки и пробелов нет</div>'}${rest ? `<div class="more">и ещё ${plural(rest, 'замечание', 'замечания', 'замечаний')} — на страницах документов</div>` : ''}</div>`;
    return mod({ span: 4, title: 'Требует внимания', sub: `${items.length} · ${items.filter(i => i.sev === 'bad').length} срочных · просрочки, нехватка, опоздания, обращения и кадровые пробелы — строка ведёт в документ`, body });
  },
  ovMoney() {
    const inD = x => this.state.dir === 'all' || x === this.state.dir;
    const unpaidS = this.unpaidSales().filter(r => inD(r.dir)), unpaidP = this.unpaidSupply().filter(r => inD(r.dir)), overdue = this.overdueSales().filter(r => inD(r.dir));
    const toGet = unpaidS.reduce((a, r) => a + this.saleTotal(r) - r.paid, 0), toPay = unpaidP.reduce((a, r) => a + this.supTotal(r), 0), over = overdue.reduce((a, r) => a + this.saleTotal(r) - r.paid, 0);
    const cash = ACCOUNTS.reduce((a, x) => a + x.balance, 0);
    const days = Array.from({ length: 14 }, (_, i) => addDays(DEMO.date, i)), inflow = {}, outflow = {};
    PAYMENTS.filter(p => p.st === 'plan' && (p.dir === '—' ? this.state.dir === 'all' : inD(p.dir))).forEach(p => { const d = dayDiff(DEMO.date, p.at) < 0 ? DEMO.date : p.at; (p.kind === 'in' ? inflow : outflow)[d] = ((p.kind === 'in' ? inflow : outflow)[d] || 0) + p.sum; });
    const max = Math.max(1, ...days.map(d => Math.max(inflow[d] || 0, outflow[d] || 0))), BAR = 30, short = v => rubK(v).replace(' ₽', '');
    const cols = days.map((d, i) => { const a = inflow[d] || 0, b = outflow[d] || 0, ha = Math.max(a ? 2 : 0, Math.round(a / max * BAR)), hb = Math.max(b ? 2 : 0, Math.round(b / max * BAR));
      return `<div class="col ${i === 0 ? 'td' : ''}" title="${fmtDate(d)}: поступления ${rub(a)}, выплаты ${rub(b)}"><div class="up">${a ? `<i style="height:${ha}px"></i>${a >= max * .3 ? `<b style="bottom:${ha + 2}px">${short(a)}</b>` : ''}` : ''}</div><div class="dn">${b ? `<i style="height:${hb}px"></i>${b >= max * .3 ? `<b style="top:${hb + 2}px">${short(b)}</b>` : ''}` : ''}</div><span class="dl">${d.slice(0, 2)}</span></div>`; }).join('');
    const chart = `<div class="cash"><div class="cols">${cols}</div><div class="legend"><span><i style="background:var(--ok)"></i>поступления по срокам счетов и отгрузок</span><span><i style="background:var(--bad)"></i>выплаты поставщикам, зарплата, аренда</span></div></div>`;
    const debts = {}; unpaidS.forEach(r => { const d = debts[r.client] || (debts[r.client] = { v: 0, n: 0, over: false }); d.v += this.saleTotal(r) - r.paid; d.n++; if (overdue.includes(r)) d.over = true; });
    const top = Object.entries(debts).sort((a, b) => b[1].v - a[1].v).slice(0, 4);
    const debt = top.length ? `<div class="debt"><div class="ov-h" style="margin:10px 0 2px"><div class="sec-t">Крупнейшие должники</div><button type="button" class="lnk small sub" data-go="finance:debts:">все долги</button></div>${top.map(([n, d]) => `<div class="row"><button type="button" class="lnk nm" data-go="clients:clients:cl-${esc(n)}" style="text-align:left">${esc(n)}</button><span class="s">${plural(d.n, 'документ', 'документа', 'документов')}${d.over ? ' · <span class="bad-t">просрочка</span>' : ''}</span><span class="v">${rub(d.v)}</span></div>`).join('')}</div>` : '';
    const body = `<div class="stats3">
        <div class="stat"><span class="k">На счетах и в кассе</span><div class="v">${rub(cash)}</div><div class="s">${ACCOUNTS.map(a => `${a.name.replace(/^Р\/с /, '')} ${fmtMoney(a.balance)}`).join(' · ')}</div></div>
        <div class="stat"><span class="k">К получению</span><div class="v">${rub(toGet)}</div><div class="s ${over ? 'bad' : ''}">${over ? `просрочено ${rub(over)} · ${plural(overdue.length, 'счёт', 'счёта', 'счетов')}` : 'просрочек нет'} · ${plural(unpaidS.length, 'реализация', 'реализации', 'реализаций')}</div></div>
        <div class="stat"><span class="k">К оплате</span><div class="v">${rub(toPay)}</div><div class="s">поставщикам по ${plural(unpaidP.length, 'заявке', 'заявкам', 'заявкам')}${this.state.dir === 'all' ? ' · зарплата 10.10 — 412 000' : ''}</div></div>
      </div>${chart}${debt}`;
    return mod({ span: 4, title: 'Деньги', sub: 'остатки — ввод до подключения банка · к получению и к оплате — из документов · план на две недели по срокам', body });
  },
  ovDirs() {
    const load = this.loadByDir(), stock = this.stockRows(), shortages = this.shortages(), inD = x => this.state.dir === 'all' || x === this.state.dir;
    const rows = DIRS.filter(d => inD(d.id)).map(d => {
      const l = load.find(x => x.dir === d.id), st = stock.filter(x => x.dir === d.id && x.left > 0), val = st.reduce((a, x) => a + x.left * x.price, 0);
      const transit = SUPPLY.filter(r => r.dir === d.id && (r.st === 'tr' || r.st === 'ord')).reduce((a, r) => a + this.supTotal(r), 0);
      const short = [...new Map(Object.entries(shortages).flatMap(([id, sh]) => REC[PROD_ORDERS.find(o => o.id === id).rec].dir === d.id ? sh.map(m => [m.sku, m]) : [])).values()];
      const none = short.filter(m => m.cover === 'none').length, req = short.length - none, pct = Math.min(100, l.pct), cls = l.pct > 100 ? 'bad' : l.pct > 85 ? 'warn' : '';
      return `<div class="dr">
        <div class="dh"><span class="chip dir"><span class="dk">${d.k}</span>${d.short}</span><span class="s">${this.prodArea(d.id)} · ${this.whName(d.id)}</span></div>
        <div class="cell"><div class="r1">${fmtQty(l.h)} ч <span class="pct ${l.pct > 100 ? 'bad' : ''}">из ${l.cap} ч · ${l.pct} %</span></div><div class="bar"><i class="${cls}" style="width:${pct}%"></i>${l.pct > 100 ? '<i class="over"></i>' : ''}</div><div class="r2">${l.next ? `${l.next.id} · ${REC[l.next.rec].name} · до ${shortDate(l.next.due)}` : 'заказов в работе нет'}</div></div>
        <div class="cell"><div class="r1">${rub(val)} <span class="pct">остаток · ${st.length} поз.</span></div><div class="r2">${transit ? `в пути ${rub(transit)}` : 'в пути ничего'}</div><div class="r2">${short.length ? `<i class="dot ${none ? 'bad' : 'warn'}"></i>нет ${plural(short.length, 'позиции', 'позиций', 'позиций')}${none ? ` · ${none} не заказано` : ''}${req ? ` · ${req} в заявках` : ''}` : '<i class="dot ok"></i>всё для заказов есть'}</div></div>
      </div>`;
    }).join('');
    const sel = load.filter(l => inD(l.dir)), totalH = sel.reduce((a, l) => a + l.h, 0), totalCap = sel.reduce((a, l) => a + l.cap, 0);
    const totalVal = stock.filter(x => inD(x.dir)).reduce((a, x) => a + x.left * x.price, 0), totalTr = SUPPLY.filter(r => inD(r.dir) && (r.st === 'tr' || r.st === 'ord')).reduce((a, r) => a + this.supTotal(r), 0);
    const eta = SUPPLY.filter(r => inD(r.dir) && (r.st === 'tr' || r.st === 'ord') && dayDiff(DEMO.date, r.eta) >= 0 && dayDiff(DEMO.date, r.eta) < 7).length;
    const foot = `<div class="foot"><span>работ в заказах <b>${fmtQty(totalH)} ч</b> из ${totalCap} ч в неделю</span><span>остатки <b>${rub(totalVal)}</b></span><span>в пути <b>${rub(totalTr)}</b></span><span>поставок на неделе <b>${eta}</b></span></div>`;
    return mod({ span: 4, title: 'Цеха и склады', sub: 'по направлениям: нормо-часы активных заказов против мощности недели; остатки, грузы в пути и нехватка по потребности заказов', body: `<div class="dirs">${rows}${foot}</div>` });
  },
  ovTodayWeek() {
    const inD = x => this.state.dir === 'all' || x === this.state.dir;
    const evs = NOTIFS.filter(n => n.day === 'today').map(n => ({ t: n.t, icon: n.kind, text: n.text, m: `${n.who} · ${PAGES.find(p => p.id === n.page).name}`, go: n.page + '::' }));
    evs.push({ t: '09:38', icon: 'chat', text: 'Царёв: по ПЗ-0005 не хватает красителя и стабилизатора', m: 'чат Обзора', go: 'overview::' });
    evs.sort((a, b) => b.t.localeCompare(a.t));
    const tl = `<div class="tl">${evs.map(e => `<div class="ev"><span class="tm">${e.t}</span><span class="ic">${ic(e.icon, 'xs')}</span><span style="min-width:0"><span class="t" style="display:block" title="${esc(e.text)}">${esc(e.text)}</span><span class="m" style="display:block">${esc(e.m)}</span></span></div>`).join('')}</div>`;
    const items = [];
    this.activeSupply().forEach(r => { if (inD(r.dir) && r.eta !== '—') items.push({ d: r.eta, kind: 'supply', no: r.id, text: r.supplier.replace(/^(ООО|АО|ИП) /, ''), bad: dayDiff(r.eta, DEMO.date) > 0 && r.st === 'tr', go: `supply::sup-${r.id}` }); });
    this.activeSales().forEach(r => { if (!inD(r.dir)) return; if (r.st === 'ok' && r.ship !== '—') items.push({ d: r.ship, kind: 'ship', no: r.id, text: r.client.replace(/^(ООО|АО|ИП) /, ''), go: `sales::sl-${r.id}` }); if (r.due !== '—' && this.saleTotal(r) - r.paid > .5) items.push({ d: r.due, kind: 'pay', no: r.id, text: 'оплата · ' + r.client.replace(/^(ООО|АО|ИП) /, ''), bad: dayDiff(r.due, DEMO.date) > 0, go: `sales::sl-${r.id}` }); });
    this.activeProd().forEach(o => { if (inD(REC[o.rec].dir)) items.push({ d: o.due, kind: 'prod', no: o.id, text: REC[o.rec].name, go: `production:orders:pz-${o.id}` }); });
    ISSUES.forEach(i => { if (i.st !== 'done' && i.due !== '—') items.push({ d: i.due, kind: 'issue', no: i.id, text: i.client.replace(/^(ООО|АО|ИП) /, ''), bad: dayDiff(i.due, DEMO.date) > 0, go: `clients:issues:ob-${i.id}` }); });
    if (this.state.dir === 'all') PAYMENTS.filter(p => p.st === 'plan' && p.doc === '—').forEach(p => items.push({ d: p.at, kind: 'pay', no: p.id, text: `${p.cat} · ${rubK(p.sum)}`, go: `finance::pl-${p.id}` }));
    const kinds = { supply: ['поставка', '#199948'], ship: ['отгрузка', '#0E9AA7'], pay: ['оплата', '#1F9D6B'], prod: ['производство', '#8A63D2'], issue: ['обращение', '#CC6E19'] };
    const days = Array.from({ length: 7 }, (_, i) => addDays(DEMO.date, i)), wds = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    const overdueItems = items.filter(it => dayDiff(it.d, DEMO.date) > 0);
    const wk = `<div class="wk">${days.map((d, i) => { const list = [...(i === 0 ? overdueItems : []), ...items.filter(it => it.d === d)], wd = toDate(d).getDay(), we = wd === 0 || wd === 6;
      return `<div class="d ${i === 0 ? 'td' : ''} ${we ? 'we' : ''}"><div class="dh"><b>${d.slice(0, 2)}</b><span>${i === 0 ? 'сегодня' : wds[wd]}</span></div>${list.map(it => `<div class="it ${it.bad ? 'bad' : ''}" data-go="${it.go}" style="cursor:pointer" title="${kinds[it.kind][0]} · ${it.no} · ${esc(it.text)}${it.bad ? ' · просрочено' : ''}"><span class="r"><i class="dot" style="background:${kinds[it.kind][1]}"></i><b>${it.no}</b></span><span class="x">${esc(it.text)}${it.bad ? ' · просрочено' : ''}</span></div>`).join('') || '<div class="none">—</div>'}</div>`; }).join('')}</div>
      <div class="legend" style="margin-top:6px">${Object.entries(kinds).map(([k, v]) => `<span><i style="background:${v[1]}"></i>${v[0]}</span>`).join('')}<span><i style="background:transparent;border:1px solid var(--bad)"></i>просрочено</span></div>`;
    const body = `<div class="tw"><div><div class="ov-h"><div class="sec-t">Сегодня</div><span class="sub">${evs.length} событий · ${DEMO.time}</span></div>${tl}</div><div><div class="ov-h"><div class="sec-t">Неделя</div><span class="sub">сроки поставок, отгрузок, оплат, заказов и обращений</span></div>${wk}</div></div>`;
    return mod({ span: 8, title: 'Сегодня и неделя', sub: 'события дня из документов и чатов · сроки на семь дней вперёд, просроченное переносится на сегодня · клик ведёт в документ', body });
  },
  ovTeam() {
    const c = st => STAFF.filter(p => p.st === st).length, on = STAFF.filter(p => p.on).length, absent = STAFF.filter(p => p.st === 'vacation' || p.st === 'sick');
    const body = `<div class="team">
      <div class="dirbar" style="grid-template-columns:96px 1fr auto;margin-bottom:8px"><span class="small mute">На связи</span>${ticks(Math.round(16 * on / STAFF.length), 16)}<span class="n">${on} из ${STAFF.length}</span></div>
      <div class="kpis"><div class="kpi"><b>${c('office')}</b><span>${dot('ok')}в офисе</span></div><div class="kpi"><b>${c('remote')}</b><span>${dot('')}удалённо</span></div><div class="kpi"><b>${c('trip')}</b><span>${dot('fg')}в рейсе</span></div><div class="kpi ${absent.length ? 'bad' : ''}"><b>${absent.length}</b><span>${dot('warn')}отсутствуют</span></div></div>
      <div class="sec-t" style="margin-top:10px">Отсутствуют</div>
      ${absent.map(p => `<div class="row p">${av(p)}<span class="nm">${p.name}</span><span class="s">${ST[p.st].name.toLowerCase()} · ${p.st === 'vacation' ? 'до 12.10' : 'с 01.10'}</span></div>`).join('')}
      <div class="sec-t" style="margin-top:10px">Адаптация</div>
      ${ONBOARDING.map(o => { const p = BY_ID[o.who]; return `<div class="adapt">${av(p)}<span class="nm small" style="flex:1;min-width:0;font-weight:500">${shortName(p.name)}</span>${ticks(o.done, o.steps.length, 'fg sm')}<span class="small mute num">${o.done} / ${o.steps.length}</span></div>`; }).join('')}
      <div class="row" style="margin-top:10px"><button type="button" class="btn sm ghost" data-go="staff::">${ic('idcard', 'xs')}Открыть «Сотрудники»</button></div>
    </div>`;
    return mod({ span: 4, title: 'Команда', sub: `${STAFF.length} сотрудников · кто на связи, кто отсутствует, кто в адаптации`, body });
  },
  overview() { return this.ovFlow() + this.ovAttention() + this.ovMoney() + this.ovDirs() + this.ovTodayWeek() + this.ovTeam(); },

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
  /* поступления: позиции завершённых заявок снабжения, выпуск по готовым заказам на производство (34-й круг: изделия и полуфабрикаты по себестоимости,
     поставщик — цех) и ручные поступления по накладным (STOCK_MANUAL) */
  stockRows() {
    const ts = d => d.replace(/^(\d\d)\.(\d\d)\.(\d{4}) ?(.*)$/, '$3$2$1 $4');
    const sup = SUPPLY.filter(r => r.st === 'done').flatMap(r => {
      const at = (r.hist.find(h => h[0] === 'done') || r.hist[r.hist.length - 1])[1];
      return r.items.map(([sku, name, cat, unit, qty, price, sub]) => ({ sku, name, cat, sub: sub || '—', unit, qty, price, left: Math.max(0, qty - (STOCK_ISSUED[sku] || 0)), supplier: r.supplier, req: r.id, order: r.order, dir: r.dir, at, src: 'supply' }));
    });
    const prod = PROD_ORDERS.filter(o => o.st === 'done').map(o => { const r = REC[o.rec];   // остаток выпуска уменьшают только выдачи (STOCK_ISSUED): расход в новых заказах считает «Производство»
      return { sku: r.id, name: r.name, cat: r.kind === 'item' ? 'Готовая продукция' : 'Полуфабрикаты', sub: 'выпуск производства', unit: r.unit, qty: o.qty, price: Math.round(this.recCost(r.id).unit), left: Math.max(0, o.qty - (STOCK_ISSUED[r.id] || 0)), supplier: this.prodArea(r.dir), req: o.id, order: o.order, dir: r.dir, at: o.due + ' 17:00', src: 'prod' }; });
    const man = STOCK_MANUAL.map(m => ({ sku: m.sku, name: m.name, cat: m.cat, sub: m.sub, unit: m.unit, qty: m.qty, price: m.price, left: m.qty, supplier: m.supplier, req: m.id, order: '—', dir: m.dir, at: m.at, src: 'manual' }));
    return [...sup, ...prod, ...man].sort((a, b) => ts(b.at).localeCompare(ts(a.at)) || a.sku.localeCompare(b.sku, 'ru'));
  },
  warehouse() {
    const s = this.state, q = s.q.trim().toLowerCase(), all = this.stockRows();
    const list = all.filter(x => (s.dir === 'all' || x.dir === s.dir) && hit(q, x.sku, x.name, x.cat, x.sub, x.supplier, x.req, x.order));
    const L = this.whCols, R = this.whRight, money = v => `${fmtMoney(v)} ₽`;
    const head = `<div class="wh-head">
        <div class="sup-head"><div class="tr th" style="grid-template-columns:${L}"><div>артикул</div><div>наименование</div><div>категория</div><div>подкатегория</div><div>поставщик</div><div>ед. изм.</div><div>кол-во</div><div>цена за ед.</div><div>сумма</div></div></div>
        <div class="sup-head"><div class="tr th" style="grid-template-columns:${R}"><div>остаток</div><div>сумма остатка</div></div></div>
      </div>`;
    const rows = list.map(x => `<div class="wh-row" title="${x.src === 'prod' ? 'Выпуск по заказу на производство' : x.src === 'manual' ? 'Поступление по накладной' : 'Поступление по заявке'} ${x.req} · заказ клиента ${x.order} · ${fmtDT(x.at)}">
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
    const body = `<div class="sup-list">${head}<div class="recs">${rows || '<div class="mute small" style="padding:14px 10px">Поступлений нет: позиции появляются здесь из завершённых заявок снабжения, готовых заказов на производство и накладных</div>'}</div></div>`;
    return mod({ span: 12, cls: 'fill', title: 'Поступления и остатки', sub: `${list.length} из ${all.length} позиций · ${where} · из завершённых заявок снабжения, выпуска производства и накладных · остаток на ${money(leftSum)}`, body, tight: true, acts: `<button class="btn ghost sm">${ic('filter', 'sm')}Фильтр</button><button class="btn ghost sm icon">${icRaw('more', 'sm')}</button>` });
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
    if (tab) { if (page === 'production') this.state.prodTab = tab; else if (page === 'clients') this.state.clTab = tab; else if (page === 'finance') this.state.finTab = tab; }
    if (xpId && xpId !== 'new') this.state.q = '';   // целевая запись должна быть в списке: поиск сбрасывается
    this.pendingOpen = xpId || null; XP.closeAll();
    if (this.state.page === page) { this.renderTopbar(); this.renderGrid(); if (!xpId) this.el.grid.scrollTo({ top: 0, behavior: 'instant' }); } else location.hash = '#' + page;
  },

  /* ---------- Клиенты (34-й круг): общая база контрагентов — клиенты, поставщики, перевозчики и обращения клиентов.
     Клиент один на все направления, история — по направлениям; статусы из CLIENT_INFO, долг и просрочка — из реализаций ---------- */
  clCols: '196px 92px 108px 124px 110px 60px 112px 112px 118px 128px',
  spCols: '196px 136px 108px 124px 60px 112px 112px 118px 140px minmax(84px,1fr)',
  crCols: '150px 100px 200px 140px 110px 100px 130px minmax(84px,1fr)',
  obCols: '70px 128px 88px 100px 180px 70px 110px 118px minmax(120px,1fr)',
  clientStats(name) {
    const info = CLIENT_INFO[name] || {}, sales = SALES.filter(r => r.client === name), reg = CLIENTS[name] || { inn: info.inn || '—', kind: clientKind(name), contacts: [{ name: '—', tel: '—', mail: '—' }] };
    const total = sales.reduce((a, r) => a + this.saleTotal(r), 0) + (info.total || 0), debt = sales.reduce((a, r) => a + Math.max(0, this.saleTotal(r) - r.paid), 0);
    const overdue = sales.some(r => this.overdueSales().includes(r)), dirs = [...new Set([...sales.map(r => r.dir), ...(info.dirs || [])])];
    const last = sales.length ? sales.map(r => r.hist[0][1].slice(0, 10)).sort((a, b) => dKey(b).localeCompare(dKey(a)))[0] : info.last || '—';
    const st = overdue ? 'debt' : info.st || 'new';
    return { info, sales, reg, total, debt, overdue, dirs, last, st, mgr: BY_ID[info.mgr || 18] };
  },
  supplierStats(name) {
    const sp = SUPPLIERS[name], info = SUP_INFO[name] || { cat: '—', terms: 'оплата по счёту', addr: '—', since: '2026' }, reqs = SUPPLY.filter(r => r.supplier === name);
    const total = reqs.reduce((a, r) => a + this.supTotal(r), 0), toPay = reqs.filter(r => !r.paid && r.st !== 'done').reduce((a, r) => a + this.supTotal(r), 0), dirs = [...new Set(reqs.map(r => r.dir))];
    const last = reqs.map(r => r.eta).sort((a, b) => dKey(b).localeCompare(dKey(a)))[0] || '—', late = reqs.some(r => this.lateSupply().includes(r));
    const st = late ? 'prob' : info.isNew || (reqs.length && reqs.every(r => dayDiff(r.hist[0][1], DEMO.date) < 30) && reqs.length < 2) ? 'new' : 'act';
    return { sp, info, reqs, total, toPay, dirs, last, late, st };
  },
  clients() {
    const s = this.state, tab = s.clTab || 'clients', q = s.q.trim().toLowerCase(), inD = x => s.dir === 'all' || x === s.dir;
    const clientsAll = Object.keys(CLIENTS).map(n => ({ name: n, ...this.clientStats(n) })).filter(c => (s.dir === 'all' || c.dirs.includes(s.dir)) && hit(q, c.name, c.reg.inn, CLIENT_ST[c.st][0], c.mgr.name, c.reg.contacts.map(x => x.name).join(' '), c.info.note)).sort((a, b) => dKey(b.last).localeCompare(dKey(a.last)));
    const supsAll = Object.keys(SUPPLIERS).map(n => ({ name: n, ...this.supplierStats(n) })).filter(x => (s.dir === 'all' || x.dirs.includes(s.dir)) && hit(q, x.name, x.sp.inn, x.info.cat, x.info.terms, SPL_ST[x.st][0])).sort((a, b) => dKey(b.last).localeCompare(dKey(a.last)));
    const carriers = CARRIER_INFO.filter(c => hit(q, c.name, c.kind, c.contact, c.note));
    const issues = ISSUES.filter(i => hit(q, i.id, i.client, i.kind, i.src, i.text, i.doc, ISSUE_ST[i.st][0], BY_ID[i.who].name) && (s.dir === 'all' || (SALES.find(r => r.id === i.doc) || {}).dir === s.dir));
    const segs = [['clients', 'Клиенты', clientsAll.length], ['suppliers', 'Поставщики', supsAll.length], ['carriers', 'Перевозчики', carriers.length], ['issues', 'Обращения', issues.length]].map(([k, name, n]) => `<button type="button" class="${tab === k ? 'on' : ''}" data-ctab="${k}">${name} <span class="n">${n}</span></button>`).join('');
    const hint = { clients: 'один клиент на все направления: история, долг и обращения в карточке', suppliers: 'заявки, условия и последние цены закупки в карточке', carriers: 'транспортные компании, курьер и свой транспорт', issues: 'вопросы, претензии и заявки клиентов — входящие клиентского сервиса' }[tab];
    const tabs = `<div class="seg-row"><div class="seg">${segs}</div><span class="mute small">${hint}</span></div>`;
    let head, rows, title, sub;
    if (tab === 'clients') {
      head = `<div class="sup-head"><div class="tr th" style="grid-template-columns:${this.clCols}"><div>наименование</div><div>вид</div><div>ИНН</div><div class="gl">направления</div><div>менеджер</div><div>сделок</div><div>выручка</div><div>долг</div><div class="r gl">последняя</div><div class="gl">статус</div></div></div>`;
      rows = clientsAll.map(c => xp({ id: 'cl-' + c.name, head: this.clientRow(c), panel: this.clientCard(c), place: 'under', cls: 'rec' })).join('');
      const debt = clientsAll.reduce((a, c) => a + c.debt, 0);
      title = 'Клиенты'; sub = `${clientsAll.length} из ${Object.keys(CLIENTS).length} · выручка ${rub(clientsAll.reduce((a, c) => a + c.total, 0))} · долг ${rub(debt)} · ${plural(clientsAll.filter(c => c.st === 'debt').length, 'клиент с просрочкой', 'клиента с просрочкой', 'клиентов с просрочкой')}`;
    } else if (tab === 'suppliers') {
      head = `<div class="sup-head"><div class="tr th" style="grid-template-columns:${this.spCols}"><div>наименование</div><div>категория</div><div>ИНН</div><div class="gl">направления</div><div>заявок</div><div>закупок</div><div>к оплате</div><div class="r gl">последняя поставка</div><div class="gl">статус</div><div>условия</div></div></div>`;
      rows = supsAll.map(x => xp({ id: 'sp-' + x.name, head: this.supplierRow(x), panel: this.supplierCard(x), place: 'under', cls: 'rec' })).join('');
      title = 'Поставщики'; sub = `${supsAll.length} из ${Object.keys(SUPPLIERS).length} · закупок ${rub(supsAll.reduce((a, x) => a + x.total, 0))} · к оплате ${rub(supsAll.reduce((a, x) => a + x.toPay, 0))}`;
    } else if (tab === 'carriers') {
      head = `<div class="sup-head"><div class="tr th" style="grid-template-columns:${this.crCols}"><div>название</div><div>вид</div><div>контакт</div><div>телефон</div><div>грузов в пути</div><div>перевозок</div><div>отслеживание</div><div>что возим</div></div></div>`;
      rows = carriers.map(c => { const inTr = SUPPLY.filter(r => r.tc === c.name && r.st === 'tr'), all = SUPPLY.filter(r => r.tc === c.name).length + SALES.filter(r => r.dlv === c.name).length;
        const card = `<div class="ph"><span class="t">${esc(c.name)}</span><span class="chip line">${c.kind}</span><span class="mute small">${esc(c.contact)} · ${c.tel}</span><button class="btn ghost sm icon" data-xp-close style="margin-left:auto">${icRaw('x', 'sm')}</button></div>
          <div class="pb"><div class="tbl items"><div class="tr th" style="grid-template-columns:70px 128px minmax(0,1fr) 140px 120px 110px"><div>заявка</div><div>статус</div><div>поставщик</div><div>трек</div><div>срок</div><div>направление</div></div>${SUPPLY.filter(r => r.tc === c.name).map(r => `<div class="tr" style="grid-template-columns:70px 128px minmax(0,1fr) 140px 120px 110px;min-height:30px"><div><button type="button" class="lnk no" data-go="supply::sup-${r.id}">${r.id}</button></div><div>${stChip(r.st)}</div><div class="ellip">${esc(r.supplier)}</div><div class="num small ${r.track === '—' ? 'mute' : ''}">${r.track}</div><div class="num">${fmtDate(r.eta)}</div><div>${chipDir(r.dir)}</div></div>`).join('') || '<div class="mute small" style="padding:6px 4px">Грузов по заявкам снабжения нет</div>'}</div></div>`;
        return xp({ id: 'cr-' + c.name, head: `<div class="rec-card"><div class="tr clickable" style="grid-template-columns:${this.crCols}"><div class="t ellip">${esc(c.name)}</div><div><span class="chip line">${c.kind}</span></div><div class="ellip small">${esc(c.contact)}</div><div class="num">${c.tel}</div><div class="num" style="text-align:center">${inTr.length || '<span class="mute">—</span>'}</div><div class="num" style="text-align:center">${all || '<span class="mute">—</span>'}</div><div class="small ellip ${c.site === '—' ? 'mute' : ''}">${c.site}</div><div class="ellip small" title="${esc(c.note)}">${esc(c.note)}</div></div></div>`, panel: card, place: 'under', cls: 'rec' }); }).join('');
      title = 'Перевозчики'; sub = `${carriers.length} · транспортные компании из заявок снабжения, курьерская служба и свой транспорт`;
    } else {
      head = `<div class="sup-head"><div class="tr th" style="grid-template-columns:${this.obCols}"><div>№</div><div class="gl">статус</div><div>вид</div><div>источник</div><div>клиент</div><div>документ</div><div>ответственный</div><div class="r gl">срок</div><div>суть</div></div></div>`;
      rows = issues.map(i => xp({ id: 'ob-' + i.id, head: this.issueRow(i), panel: this.issueCard(i), place: 'under', cls: 'rec' })).join('');
      const cnt = st => issues.filter(i => i.st === st).length;
      title = 'Обращения клиентов'; sub = `${issues.length} · новых ${cnt('new')} · в работе ${cnt('work')} · решено ${cnt('done')} · просрочено ${issues.filter(i => i.st !== 'done' && dayDiff(i.due, DEMO.date) > 0).length}`;
    }
    const body = `${tabs}<div class="sup-list">${head}<div class="recs">${rows || '<div class="mute small" style="padding:14px 10px">Ничего не найдено</div>'}</div></div>`;
    return mod({ span: 12, cls: 'fill', title, sub, body, tight: true, acts: `<button class="btn ghost sm">${ic('filter', 'sm')}Фильтр</button><button class="btn ghost sm icon">${icRaw('more', 'sm')}</button>` });
  },
  clientRow(c) {
    return `<div class="rec-card"><div class="tr clickable" style="grid-template-columns:${this.clCols}">
        <div class="t ellip" title="${esc(c.name)}">${esc(c.name)}</div>
        <div><span class="chip line">${c.reg.kind}</span></div>
        <div class="num mute small">${c.reg.inn}</div>
        <div class="gl">${c.dirs.length ? c.dirs.map(d => chipDir(d)).join(' ') : '<span class="mute">—</span>'}</div>
        <div class="small ellip">${shortFio(c.mgr.name)}</div>
        <div class="num" style="text-align:center">${c.sales.length || '<span class="mute">—</span>'}</div>
        <div class="num rn">${rub(c.total)}</div>
        <div class="num rn ${c.debt ? (c.overdue ? 'bad-t b' : 'b') : 'mute'}">${c.debt ? rub(c.debt) : '—'}</div>
        <div class="r num gl">${fmtDate(c.last)}</div>
        <div class="gl">${clChip(c.st)}</div>
      </div></div>`;
  },
  clientCard(c) {
    const cols = '70px 128px 100px 112px 124px minmax(0,1fr)', sellers = STAFF.filter(p => p.role === 'seller'), ct = c.reg.contacts[0] || { name: '—', tel: '—', mail: '—' };
    const files = c.sales.flatMap(r => r.files.filter(f => f[1] === 'договор' || f[1] === 'спецификация').map(f => [...f, r.id]));
    const hist = c.sales.sort((a, b) => dKey(b.hist[0][1]).localeCompare(dKey(a.hist[0][1]))).map(r => `<div class="tr" style="grid-template-columns:${cols};min-height:30px"><div><button type="button" class="lnk no" data-go="sales::sl-${r.id}">${r.id}</button></div><div>${slChip(r.st)}</div><div>${chipDir(r.dir)}</div><div class="num rn">${rub(this.saleTotal(r))}</div><div>${payChipOf(this.saleTotal(r), r.paid)}</div><div class="ellip small" title="${esc(r.comment)}">${esc(r.comment)}</div></div>`).join('');
    const iss = ISSUES.filter(i => i.client === c.name).map(i => `<div class="tr" style="grid-template-columns:70px 128px minmax(0,1fr) 100px;min-height:30px"><div><button type="button" class="lnk no" data-go="clients:issues:ob-${i.id}">${i.id}</button></div><div>${obChip(i.st)}</div><div class="ellip small" title="${esc(i.text)}">${esc(i.text)}</div><div class="num small">${fmtDate(i.due)}</div></div>`).join('');
    return `<div class="ph">${c.dirs.map(d => dirChip(d)).join('')}${clChip(c.st)}<span class="mute small">${c.reg.kind} · с ${c.info.since && c.info.since !== '—' ? fmtDate(c.info.since) : '—'} · менеджер ${shortFio(c.mgr.name)}</span><button class="btn ghost sm icon" data-xp-close style="margin-left:auto">${icRaw('x', 'sm')}</button></div>
      <div class="pb" data-ccard="${esc(c.name)}">
        <div class="of-row cl">
          ${fld('Статус', sel('cf-st', Object.entries(CLIENT_ST).map(([k, v]) => [k, v[0]]), c.st))}
          ${fld('Менеджер', sel('cf-mgr', sellers.map(p => [p.id, shortFio(p.name)]), c.info.mgr || 18))}
          ${fld('Контакт', sel('cf-contact', c.reg.contacts.map(x => [x.name, shortFio(x.name)]), ct.name))}
          ${fld('Телефон', inp('cf-tel', `value="${ct.tel === '—' ? '' : esc(ct.tel)}" placeholder="+7 …"`))}
          ${fld('Почта', inp('cf-mail', `value="${ct.mail === '—' ? '' : esc(ct.mail)}" placeholder="name@company.ru"`))}
          ${fld('Адрес', inp('cf-addr', `value="${c.info.addr === '—' ? '' : esc(c.info.addr || '')}" placeholder="город, улица, дом"`))}
          ${fld('Заметка', inp('cf-note', `value="${esc(c.info.note || '')}" placeholder="что важно знать о клиенте"`))}
        </div>
        <div class="oc-blocks">
          <div class="oc-block"><div class="oc-h"><div class="sec-t">Реквизиты и документы</div><span class="mute small">договоры и спецификации из реализаций</span></div>
            <dl class="kv cl"><dt>ИНН / КПП</dt><dd class="num">${c.reg.inn}${c.info.kpp && c.info.kpp !== '—' ? ' / ' + c.info.kpp : ''}</dd><dt>Вид</dt><dd>${c.reg.kind}</dd><dt>Адрес</dt><dd class="ellip">${esc(c.info.addr || '—')}</dd><dt>Направления</dt><dd>${c.dirs.map(d => DIR[d].name).join(', ') || '—'}</dd><dt>Выручка всего</dt><dd class="num">${rub(c.total)}</dd><dt>Долг</dt><dd class="num ${c.overdue ? 'bad-t' : ''}">${c.debt ? rub(c.debt) + (c.overdue ? ' · просрочка' : '') : 'нет'}</dd></dl>
            <div class="files" style="margin-top:8px">${files.map(([name, kind, size, at, id]) => `<div class="file"><span class="fi">${ic('file', 'sm')}</span><span class="grow ellip">${esc(name)}</span><span class="chip">${kind}</span><span class="mute small num">${id}</span><span class="mute small num">${fmtDate(at)}</span></div>`).join('') || '<div class="mute small" style="padding:2px">Договоров нет — продажи по счёту, чеку или с сайта</div>'}</div>
          </div>
          <div class="oc-block"><div class="oc-h"><div class="sec-t">История · ${c.sales.length}</div><span class="mute small">по направлениям</span></div>
            <div class="tbl items"><div class="tr th" style="grid-template-columns:${cols}"><div>№</div><div>статус</div><div>направление</div><div>сумма</div><div>оплата</div><div>комментарий</div></div>${hist || '<div class="mute small" style="padding:4px 6px">Реализаций пока нет</div>'}</div>
            <div class="oc-h" style="margin-top:10px"><div class="sec-t">Обращения · ${ISSUES.filter(i => i.client === c.name).length}</div></div>
            <div class="tbl items">${iss || '<div class="mute small" style="padding:4px 6px">Обращений нет</div>'}</div>
          </div>
        </div>
      </div>`;
  },
  updateClient(name, f, v) {
    const info = CLIENT_INFO[name] || (CLIENT_INFO[name] = { st: 'new', mgr: 18, addr: '—', note: '' }), reg = CLIENTS[name];
    if (f === 'st') info.st = v; else if (f === 'mgr') info.mgr = +v; else if (f === 'addr') info.addr = v.trim() || '—'; else if (f === 'note') info.note = v.trim();
    else if (f === 'contact') { const c = reg.contacts.find(x => x.name === v); if (c) reg.contacts.splice(reg.contacts.indexOf(c), 1), reg.contacts.unshift(c); }
    else if (f === 'tel' || f === 'mail') { if (reg.contacts[0]) reg.contacts[0][f] = v.trim() || '—'; }
    const el = document.querySelector(`[data-xp="cl-${CSS.escape(name)}"]`); if (!el) return;
    const c = { name, ...this.clientStats(name) };
    el.querySelector(':scope > .xp-head').innerHTML = this.clientRow(c);
    if (!['addr', 'note', 'tel', 'mail'].includes(f)) el.querySelector(':scope > .xp-panel').innerHTML = this.clientCard(c);
    if (XP.open) XP.focus();
  },
  supplierRow(x) {
    return `<div class="rec-card"><div class="tr clickable" style="grid-template-columns:${this.spCols}">
        <div class="t ellip" title="${esc(x.name)}">${esc(x.name)}</div>
        <div class="small ellip">${esc(x.info.cat)}</div>
        <div class="num mute small">${x.sp.inn}</div>
        <div class="gl">${x.dirs.map(d => chipDir(d)).join(' ') || '<span class="mute">—</span>'}</div>
        <div class="num" style="text-align:center">${x.reqs.length || '<span class="mute">—</span>'}</div>
        <div class="num rn">${rub(x.total)}</div>
        <div class="num rn ${x.toPay ? 'b' : 'mute'}">${x.toPay ? rub(x.toPay) : '—'}</div>
        <div class="r num gl">${fmtDate(x.last)}</div>
        <div class="gl">${spChip(x.st)}</div>
        <div class="ellip small" title="${esc(x.info.terms)}">${esc(x.info.terms)}</div>
      </div></div>`;
  },
  supplierCard(x) {
    const cols = '70px 128px 118px 110px 124px minmax(0,1fr)', ct = x.sp.contacts[0];
    const reqs = x.reqs.map(r => `<div class="tr" style="grid-template-columns:${cols};min-height:30px"><div><button type="button" class="lnk no" data-go="supply::sup-${r.id}">${r.id}</button></div><div>${stChip(r.st)}</div><div class="num">${fmtDate(r.eta)}</div><div class="num rn">${rub(this.supTotal(r))}</div><div>${payChip(r.paid)}</div><div class="ellip small" title="${esc(r.comment)}">${esc(r.comment)}</div></div>`).join('');
    const prices = x.reqs.flatMap(r => r.items.map(it => ({ sku: it[0], name: it[1], unit: it[3], price: it[5], at: r.hist[0][1].slice(0, 10), req: r.id }))).sort((a, b) => dKey(b.at).localeCompare(dKey(a.at)));
    const seen = new Set(), last = prices.filter(p => !seen.has(p.sku) && seen.add(p.sku));
    return `<div class="ph">${x.dirs.map(d => dirChip(d)).join('')}${spChip(x.st)}<span class="mute small">${esc(x.info.cat)} · с ${x.info.since} года · ${esc(x.info.terms)}</span><button class="btn ghost sm icon" data-xp-close style="margin-left:auto">${icRaw('x', 'sm')}</button></div>
      <div class="pb" data-spcard="${esc(x.name)}">
        <div class="of-row sp">
          ${fld('Контакт', sel('pf2-contact', x.sp.contacts.map(c => [c.name, shortFio(c.name)]), ct.name))}
          ${fld('Категория', inp('pf2-cat', `value="${esc(x.info.cat)}"`))}
          ${fld('Условия оплаты', inp('pf2-terms', `value="${esc(x.info.terms)}"`))}
          ${fld('Адрес', inp('pf2-addr', `value="${x.info.addr === '—' ? '' : esc(x.info.addr)}" placeholder="город, улица"`))}
          ${fld('Контакт: телефон и почта', inp('pf2-tm', `value="${esc(ct.tel)} · ${esc(ct.mail)}" readonly`))}
        </div>
        <div class="oc-blocks">
          <div class="oc-block"><div class="oc-h"><div class="sec-t">Заявки · ${x.reqs.length}</div><span class="mute small">закупок ${rub(x.total)}</span></div>
            <div class="tbl items"><div class="tr th" style="grid-template-columns:${cols}"><div>№</div><div>статус</div><div>срок</div><div>сумма</div><div>оплата</div><div>комментарий</div></div>${reqs || '<div class="mute small" style="padding:4px 6px">Заявок ещё не было</div>'}</div></div>
          <div class="oc-block"><div class="oc-h"><div class="sec-t">Последние цены закупки · ${last.length}</div><span class="mute small">подсказка при новой заявке</span></div>
            <div class="tbl items"><div class="tr th" style="grid-template-columns:80px minmax(0,1fr) 90px 100px 70px"><div>артикул</div><div>наименование</div><div>цена</div><div>дата</div><div>заявка</div></div>${last.map(p => `<div class="tr" style="grid-template-columns:80px minmax(0,1fr) 90px 100px 70px;min-height:30px"><div class="num mute small">${p.sku}</div><div class="ellip" title="${esc(p.name)}">${esc(p.name)}</div><div class="num rn">${rub(p.price)} <span class="mute small">/ ${p.unit}</span></div><div class="num small">${fmtDate(p.at)}</div><div class="num small mute">${p.req}</div></div>`).join('') || '<div class="mute small" style="padding:4px 6px">Позиций ещё не было</div>'}</div></div>
        </div>
      </div>`;
  },
  updateSupplier(name, f, v) {
    const info = SUP_INFO[name] || (SUP_INFO[name] = { cat: '—', terms: 'оплата по счёту', addr: '—', since: '2026' }), sp = SUPPLIERS[name];
    if (f === 'cat') info.cat = v.trim() || '—'; else if (f === 'terms') info.terms = v.trim() || 'оплата по счёту'; else if (f === 'addr') info.addr = v.trim() || '—';
    else if (f === 'contact') { const c = sp.contacts.find(x => x.name === v); if (c) sp.contacts.splice(sp.contacts.indexOf(c), 1), sp.contacts.unshift(c); }
    const el = document.querySelector(`[data-xp="sp-${CSS.escape(name)}"]`); if (!el) return;
    const x = { name, ...this.supplierStats(name) };
    el.querySelector(':scope > .xp-head').innerHTML = this.supplierRow(x);
    if (f === 'contact') el.querySelector(':scope > .xp-panel').innerHTML = this.supplierCard(x);
    if (XP.open) XP.focus();
  },
  issueRow(i) {
    const late = i.st !== 'done' && dayDiff(i.due, DEMO.date) > 0;
    return `<div class="rec-card"><div class="tr clickable" style="grid-template-columns:${this.obCols}">
        <div class="no">${i.id}</div>
        <div class="gl">${obChip(i.st)}</div>
        <div><span class="chip line">${i.kind}</span></div>
        <div class="src small">${ic(ISSUE_SRC[i.src], 'xs')}${i.src}</div>
        <div class="t ellip" title="${esc(i.client)}">${esc(i.client)}</div>
        <div class="no ${i.doc === '—' ? 'mute' : ''}">${i.doc}</div>
        <div class="small ellip">${shortFio(BY_ID[i.who].name)}</div>
        <div class="r num gl ${late ? 'bad-t' : ''}">${fmtDate(i.due)}</div>
        <div class="ellip small" title="${esc(i.text)}">${esc(i.text)}</div>
      </div></div>`;
  },
  issueCard(i) {
    const c = this.clientStats(i.client), ct = c.reg.contacts[0] || { name: '—', tel: '—', mail: '—' }, who = STAFF.filter(p => p.role === 'cs' || p.role === 'seller'), iso = /^\d{2}\.\d{2}\.\d{4}$/.test(i.due) ? i.due.split('.').reverse().join('-') : '';
    const docGo = i.doc.startsWith('ЗК') ? `sales::sl-${i.doc}` : i.doc.startsWith('СН') ? `supply::sup-${i.doc}` : '';
    return `<div class="ph">${obChip(i.st)}<span class="chip line">${i.kind}</span><span class="src small">${ic(ISSUE_SRC[i.src], 'xs')}${i.src}</span><span class="mute small">создано ${fmtDT(i.at)}</span><button class="btn ghost sm icon" data-xp-close style="margin-left:auto">${icRaw('x', 'sm')}</button></div>
      <div class="pb" data-icard="${i.id}">
        <div class="ob-text">${esc(i.text)}</div>
        <div class="of-row ob">
          ${fld('Статус', sel('if-st', Object.entries(ISSUE_ST).map(([k, v]) => [k, v[0]]), i.st))}
          ${fld('Ответственный', sel('if-who', who.map(p => [p.id, shortFio(p.name)]), i.who))}
          ${fld('Срок ответа', dsel('if-due', iso))}
          ${fld('По документу', inp('if-doc', `value="${i.doc === '—' ? '' : esc(i.doc)}" placeholder="ЗК-0000"`))}
          ${fld('Результат', inp('if-result', `value="${esc(i.result)}" placeholder="что сделано и когда"`))}
        </div>
        <div class="oc-blocks">
          <div class="oc-block"><div class="oc-h"><div class="sec-t">Клиент</div><button type="button" class="lnk small" data-go="clients:clients:cl-${esc(i.client)}">открыть карточку</button></div>
            <dl class="kv cl"><dt>Клиент</dt><dd>${esc(i.client)}</dd><dt>Контакт</dt><dd>${esc(ct.name)}</dd><dt>Телефон</dt><dd class="num">${ct.tel}</dd><dt>Почта</dt><dd class="ellip">${ct.mail}</dd><dt>Документ</dt><dd>${docGo ? `<button type="button" class="lnk" data-go="${docGo}">${i.doc}</button>` : '<span class="mute">не указан</span>'}</dd><dt>Статус клиента</dt><dd>${CLIENT_ST[c.st][0]}</dd></dl></div>
          <div class="oc-block"><div class="oc-h"><div class="sec-t">История</div></div>
            ${[...i.hist].reverse().map(([st, at]) => `<div class="row" style="gap:8px;min-height:26px">${obChip(st)}<span class="num mute small">${fmtDT(at)}</span></div>`).join('')}
            ${i.result ? `<div class="sec-t" style="margin-top:8px">Результат</div><div class="small">${esc(i.result)}</div>` : ''}
          </div>
        </div>
      </div>`;
  },
  updateIssue(id, f, v) {
    const i = ISSUES.find(x => x.id === id); if (!i) return;
    if (f === 'st') { if (i.st !== v) { i.st = v; i.hist.push([v, nowStamp()]); } }
    else if (f === 'who') i.who = +v; else if (f === 'due') i.due = v ? isoToRu(v) : '—'; else if (f === 'doc') i.doc = v.trim() || '—'; else if (f === 'result') i.result = v.trim();
    const el = document.querySelector(`[data-xp="ob-${id}"]`); if (!el) return;
    el.querySelector(':scope > .xp-head').innerHTML = this.issueRow(i);
    if (f !== 'doc' && f !== 'result') el.querySelector(':scope > .xp-panel').innerHTML = this.issueCard(i);
    if (XP.open) XP.focus();
  },

  /* ---------- Финансы (34-й круг): общая служба с учётом по направлениям. Единственный источник чисел — оплаты ПЛ (план и факт) ---------- */
  plCols: '70px 128px 128px 118px 180px 70px 104px 110px 110px minmax(84px,1fr)',
  finance() {
    const s = this.state, tab = s.finTab || 'flow', q = s.q.trim().toLowerCase(), inD = p => s.dir === 'all' || p.dir === s.dir || (p.dir === '—' && s.dir === 'all');
    const all = PAYMENTS.filter(p => inD(p) && (s.company === 'bereg' || p.co === s.company || s.dir !== 'all'));
    const list = all.filter(p => hit(q, p.id, p.who, p.doc, p.cat, p.note, PAY_ST[p.st][0], p.kind === 'in' ? 'поступление' : 'выплата'));
    const mm = DEMO.date.slice(3), factIn = all.filter(p => p.st === 'fact' && p.kind === 'in' && inMonth(p.at, mm)).reduce((a, p) => a + p.sum, 0), factOut = all.filter(p => p.st === 'fact' && p.kind === 'out' && inMonth(p.at, mm)).reduce((a, p) => a + p.sum, 0);
    const planIn = all.filter(p => p.st === 'plan' && p.kind === 'in'), planOut = all.filter(p => p.st === 'plan' && p.kind === 'out');
    const toGet = planIn.reduce((a, p) => a + p.sum, 0), toPay = planOut.reduce((a, p) => a + p.sum, 0), overdue = planIn.filter(p => dayDiff(p.at, DEMO.date) > 0).reduce((a, p) => a + p.sum, 0);
    const cash = ACCOUNTS.reduce((a, x) => a + x.balance, 0);
    const kpis = `<div class="fin-kpis">
        <div class="kpi"><b>${rub(cash)}</b><span>на счетах и в кассе</span><div class="accs">${ACCOUNTS.map(a => `<span>${a.name.replace(/^Р\/с /, '')} <b>${fmtMoney(a.balance)}</b></span>`).join('')}</div></div>
        <div class="kpi"><b>${rub(factIn)}</b><span>${dot('ok')}поступления за октябрь, факт</span></div>
        <div class="kpi"><b>${rub(factOut)}</b><span>${dot('bad')}выплаты за октябрь, факт</span></div>
        <div class="kpi ${overdue ? 'bad' : ''}"><b>${rub(toGet)}</b><span>к получению · просрочено ${rub(overdue)}</span></div>
        <div class="kpi"><b>${rub(toPay)}</b><span>к оплате по плану</span></div>
      </div>`;
    const segs = [['flow', 'Движение денег', list.length], ['calendar', 'Платёжный календарь', planIn.length + planOut.length], ['debts', 'Долги', this.unpaidSales().length + this.unpaidSupply().length], ['margin', 'Затраты и маржа', DIRS.length]].map(([k, name, n]) => `<button type="button" class="${tab === k ? 'on' : ''}" data-ftab="${k}">${name} <span class="n">${n}</span></button>`).join('');
    const hint = { flow: 'поступления и выплаты, план и факт; оплаты по документам появляются из реализаций и заявок', calendar: 'по дням: что придёт и что отдать, остаток на конец дня; просроченное — на сегодня', debts: 'дебиторка по клиентам и кредиторка по поставщикам, по документам', margin: 'выручка минус себестоимость минус распределённые общие затраты — по направлениям' }[tab];
    const tabs = `<div class="seg-row"><div class="seg">${segs}</div><span class="mute small">${hint}</span></div>`;
    let body, title, sub;
    if (tab === 'flow') {
      const head = `<div class="sup-head"><div class="tr th" style="grid-template-columns:${this.plCols}"><div>№</div><div class="gl">вид</div><div class="gl">статус</div><div class="r gl">дата</div><div>контрагент</div><div>документ</div><div>категория</div><div>направление</div><div>сумма</div><div>комментарий</div></div></div>`;
      const rows = list.map(p => xp({ id: 'pl-' + p.id, head: this.payRow(p), panel: this.payCard(p), place: 'under', cls: 'rec' })).join('');
      body = `${tabs}${kpis}<div class="sup-list">${head}<div class="recs">${rows || '<div class="mute small" style="padding:14px 10px">Ничего не найдено</div>'}</div></div>`;
      title = 'Движение денег'; sub = `${list.length} из ${PAYMENTS.length} оплат · факт ${PAYMENTS.filter(p => p.st === 'fact').length} · план ${PAYMENTS.filter(p => p.st === 'plan').length} · из реализаций, заявок и общих выплат`;
    } else if (tab === 'calendar') {
      body = `${tabs}${kpis}<div class="sup-list"><div class="recs">${this.finCalendar(planIn, planOut, cash)}</div></div>`;
      title = 'Платёжный календарь'; sub = `30 дней с ${fmtDate(DEMO.date)} · поступления по срокам счетов и отгрузок, выплаты по срокам поставок, зарплата, аренда, налоги`;
    } else if (tab === 'debts') {
      body = `${tabs}${kpis}<div class="sup-list"><div style="padding:2px 4px">${this.finDebts()}</div></div>`;
      title = 'Долги'; sub = `к получению ${rub(toGet)} · поставщикам ${rub(this.unpaidSupply().reduce((a, r) => a + this.supTotal(r), 0))} · по контрагентам и документам`;
    } else {
      body = `${tabs}${kpis}<div class="sup-list"><div style="padding:2px 4px">${this.finMargin()}</div></div>`;
      title = 'Затраты и маржа'; sub = `октябрь 2026 · выручка подтверждённых реализаций, себестоимость по рецептам, общие затраты распределены ${ALLOC_RULES[s.finRule || 'revenue']}`;
    }
    return mod({ span: 12, cls: 'fill', title, sub, body, tight: true, acts: `<button class="btn ghost sm">${ic('filter', 'sm')}Фильтр</button><button class="btn ghost sm icon">${icRaw('more', 'sm')}</button>` });
  },
  payRow(p) {
    const late = p.st === 'plan' && dayDiff(p.at, DEMO.date) > 0;
    return `<div class="rec-card"><div class="tr clickable" style="grid-template-columns:${this.plCols}">
        <div class="no">${p.id}</div>
        <div class="gl">${pkChip(p.kind)}</div>
        <div class="gl">${plChip(p.st)}</div>
        <div class="r num gl ${late ? 'bad-t' : ''}" title="${late ? 'просрочено' : ''}">${fmtDate(p.at)}</div>
        <div class="t ellip" title="${esc(p.who)}">${esc(p.who)}</div>
        <div class="no ${p.doc === '—' ? 'mute' : ''}">${p.doc}</div>
        <div class="small ellip">${p.cat}</div>
        <div>${p.dir === '—' ? '<span class="chip all small" style="height:18px">общие</span>' : chipDir(p.dir)}</div>
        <div class="num rn b ${p.kind === 'in' ? 'pos' : 'neg'}">${p.kind === 'in' ? '+' : '−'}${fmtMoney(p.sum)} ₽</div>
        <div class="ellip small" title="${esc(p.note)}">${esc(p.note)}</div>
      </div></div>`;
  },
  payCard(p) {
    const iso = /^\d{2}\.\d{2}\.\d{4}$/.test(p.at) ? p.at.split('.').reverse().join('-') : '', go = p.doc.startsWith('ЗК') ? `sales::sl-${p.doc}` : p.doc.startsWith('СН') ? `supply::sup-${p.doc}` : '';
    const doc = p.doc.startsWith('ЗК') ? SALES.find(r => r.id === p.doc) : p.doc.startsWith('СН') ? SUPPLY.find(r => r.id === p.doc) : null;
    const total = doc ? (doc.client !== undefined ? this.saleTotal(doc) : this.supTotal(doc)) : 0, acc = ACCOUNTS.find(a => a.id === p.acc) || ACCOUNTS[0];
    return `<div class="ph">${pkChip(p.kind)}${plChip(p.st)}<span class="mute small">${p.cat} · ${acc.name} · ${COMPANIES.find(c => c.id === acc.co).name}</span><button class="btn ghost sm icon" data-xp-close style="margin-left:auto">${icRaw('x', 'sm')}</button></div>
      <div class="pb" data-plcard="${p.id}">
        <div class="of-row sl">
          ${fld('Статус', sel('plf-st', Object.entries(PAY_ST).map(([k, v]) => [k, v[0]]), p.st))}
          ${fld('Дата', dsel('plf-at', iso))}
          ${fld('Счёт или касса', sel('plf-acc', ACCOUNTS.map(a => [a.id, a.name]), p.acc))}
          ${fld('Категория', sel('plf-cat', PAY_CATS.map(c => [c, c]), p.cat))}
          ${fld('Направление', sel('plf-dir', [['—', 'общие службы'], ...DIRS.map(d => [d.id, d.name])], p.dir))}
          ${fld('Сумма, ₽', inp('plf-sum', `type="number" min="0" step="any" value="${p.sum}"`))}
          ${fld('Комментарий', inp('plf-note', `value="${esc(p.note)}" placeholder="основание"`))}
        </div>
        <div class="row wrap" style="gap:8px">
          <span class="mute small">Контрагент</span><span class="b">${esc(p.who)}</span>
          ${go ? `<span class="mute small" style="margin-left:8px">Документ</span><button type="button" class="chip line" data-go="${go}">${ic(p.doc.startsWith('ЗК') ? 'tag' : 'box', 'xs')}${p.doc} · ${doc ? (doc.client !== undefined ? SALE_ST[doc.st][0] : SUP_ST[doc.st][0]) : ''}</button><span class="mute small">сумма документа ${rub(total)}${doc && doc.client !== undefined ? ` · получено ${rub(doc.paid)}` : ''}</span>` : '<span class="mute small" style="margin-left:8px">без документа — общая выплата</span>'}
        </div>
      </div>`;
  },
  updatePayment(id, f, v) {
    const p = PAYMENTS.find(x => x.id === id); if (!p) return;
    if (f === 'st') p.st = v; else if (f === 'at') p.at = v ? isoToRu(v) : p.at; else if (f === 'acc') { p.acc = v; p.co = (ACCOUNTS.find(a => a.id === v) || ACCOUNTS[0]).co; } else if (f === 'cat') p.cat = v; else if (f === 'dir') p.dir = v;
    else if (f === 'sum') { const n = parseFloat(String(v).replace(',', '.')); if (n >= 0) p.sum = n; } else if (f === 'note') p.note = v.trim();
    const el = document.querySelector(`[data-xp="pl-${id}"]`); if (!el) return;
    el.querySelector(':scope > .xp-head').innerHTML = this.payRow(p);
    if (f !== 'note' && f !== 'sum') el.querySelector(':scope > .xp-panel').innerHTML = this.payCard(p);
    if (XP.open) XP.focus();
  },
  finCalendar(planIn, planOut, cash) {
    const days = Array.from({ length: 30 }, (_, i) => addDays(DEMO.date, i)), wds = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    const on = (list, d, i) => list.filter(p => p.at === d || (i === 0 && dayDiff(p.at, DEMO.date) > 0));
    let bal = cash, minBal = cash, minDay = DEMO.date;
    const rows = days.map((d, i) => {
      const ins = on(planIn, d, i), outs = on(planOut, d, i), sIn = ins.reduce((a, p) => a + p.sum, 0), sOut = outs.reduce((a, p) => a + p.sum, 0), delta = sIn - sOut;
      bal += delta; if (bal < minBal) { minBal = bal; minDay = d; }
      const wd = toDate(d).getDay(), we = wd === 0 || wd === 6;
      const fl = (p, late) => `<div class="fl ${late ? 'late' : ''}" data-go="finance:flow:pl-${p.id}" style="cursor:pointer" title="${p.id} · ${esc(p.note)}${late ? ' · просрочено' : ''}"><span class="who">${esc(p.who)}${p.doc !== '—' ? ` · ${p.doc}` : ''}</span><b>${fmtMoney(p.sum)}</b></div>`;
      return `<div class="cal-row ${i === 0 ? 'td' : ''} ${we ? 'we' : ''}"><div class="d">${fmtDate(d)}<span>${i === 0 ? 'сегодня' : wds[wd]}</span></div><div class="flows">${ins.map(p => fl(p, i === 0 && dayDiff(p.at, DEMO.date) > 0)).join('') || '<div class="none">—</div>'}</div><div class="flows">${outs.map(p => fl(p, false)).join('') || '<div class="none">—</div>'}</div><div class="sum ${delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'mute'}">${delta ? (delta > 0 ? '+' : '−') + fmtMoney(Math.abs(delta)) : '—'}</div><div class="bal ${bal < 500000 ? 'low' : ''}">${fmtMoney(bal)} ₽</div></div>`;
    }).join('');
    const head = `<div class="cal-row" style="background:transparent;border-color:transparent;padding-top:0;padding-bottom:0"><div class="small mute">дата</div><div class="small mute">поступления</div><div class="small mute">выплаты</div><div class="small mute" style="text-align:right">сальдо дня</div><div class="small mute" style="text-align:right">остаток на конец дня</div></div>`;
    return `${head}${rows}<div class="mute small" style="padding:6px 8px">Остаток на конец периода ${rub(bal)} · минимум ${rub(minBal)} (${fmtDate(minDay)}) · остатки ниже 500 000 ₽ выделяются</div>`;
  },
  finDebts() {
    const inD = x => this.state.dir === 'all' || x === this.state.dir, us = this.unpaidSales().filter(r => inD(r.dir)), up = this.unpaidSupply().filter(r => inD(r.dir));
    const age = r => r.due !== '—' ? dayDiff(r.due, DEMO.date) : -1, rem = r => this.saleTotal(r) - r.paid;
    const buckets = [['не наступил', r => age(r) <= 0], ['просрочка 1–7 дней', r => age(r) > 0 && age(r) <= 7], ['8–30 дней', r => age(r) > 7 && age(r) <= 30], ['больше 30 дней', r => age(r) > 30]];
    const aging = `<div class="aging">${buckets.map(([n, f], i) => { const l = us.filter(f), v = l.reduce((a, r) => a + rem(r), 0); return `<div class="${i && v ? 'bad' : ''}"><span>${n}</span><b>${rub(v)}</b> <span style="display:inline">· ${plural(l.length, 'документ', 'документа', 'документов')}</span></div>`; }).join('')}</div>`;
    const byC = {}; us.forEach(r => { (byC[r.client] = byC[r.client] || []).push(r); });
    const byS = {}; up.forEach(r => { (byS[r.supplier] = byS[r.supplier] || []).push(r); });
    const dc = '70px 128px 100px 110px minmax(0,1fr)', ds = '70px 128px 100px 110px minmax(0,1fr)';
    const deb = Object.entries(byC).sort((a, b) => b[1].reduce((x, r) => x + rem(r), 0) - a[1].reduce((x, r) => x + rem(r), 0)).map(([n, l]) => `<div class="row" style="min-height:30px;gap:8px;margin-top:6px"><button type="button" class="lnk b" data-go="clients:clients:cl-${esc(n)}">${esc(n)}</button><span class="grow"></span><span class="num b">${rub(l.reduce((a, r) => a + rem(r), 0))}</span></div><div class="tbl items">${l.map(r => `<div class="tr" style="grid-template-columns:${dc};min-height:28px"><div><button type="button" class="lnk no" data-go="sales::sl-${r.id}">${r.id}</button></div><div>${slChip(r.st)}</div><div class="num rn">${rub(rem(r))}</div><div class="num small ${age(r) > 0 ? 'bad-t' : ''}">${r.due !== '—' ? fmtDate(r.due) : 'по договору'}</div><div class="small ${age(r) > 0 ? 'bad-t' : 'mute'}">${age(r) > 0 ? 'просрочка ' + plural(age(r), 'день', 'дня', 'дней') : r.due !== '—' ? 'срок через ' + plural(-age(r), 'день', 'дня', 'дней') : r.paid ? 'аванс получен, остаток при отгрузке' : 'ждём аванс'}</div></div>`).join('')}</div>`).join('');
    const cred = Object.entries(byS).map(([n, l]) => `<div class="row" style="min-height:30px;gap:8px;margin-top:6px"><button type="button" class="lnk b" data-go="clients:suppliers:sp-${esc(n)}">${esc(n)}</button><span class="grow"></span><span class="num b">${rub(l.reduce((a, r) => a + this.supTotal(r), 0))}</span></div><div class="tbl items">${l.map(r => `<div class="tr" style="grid-template-columns:${ds};min-height:28px"><div><button type="button" class="lnk no" data-go="supply::sup-${r.id}">${r.id}</button></div><div>${stChip(r.st)}</div><div class="num rn">${rub(this.supTotal(r))}</div><div class="num small">${fmtDate(r.eta)}</div><div class="small mute">${r.st === 'req' ? 'счёт не получен' : (SUP_INFO[r.supplier] || {}).terms || 'по счёту'}</div></div>`).join('')}</div>`).join('');
    return `${aging}<div class="oc-blocks"><div class="oc-block"><div class="oc-h"><div class="sec-t">Дебиторы · ${Object.keys(byC).length}</div><span class="mute small">остаток к получению по реализациям</span></div>${deb || '<div class="mute small">Долгов нет</div>'}</div><div class="oc-block"><div class="oc-h"><div class="sec-t">Кредиторы · ${Object.keys(byS).length}</div><span class="mute small">неоплаченные заявки поставщикам</span></div>${cred || '<div class="mute small">Долгов нет</div>'}</div></div>`;
  },
  finMargin() {
    const rule = this.state.finRule || 'revenue', mm = DEMO.date.slice(3);
    const shared = PAYMENTS.filter(p => p.kind === 'out' && p.dir === '—' && inMonth(p.at, mm)).reduce((a, p) => a + p.sum, 0);
    const rows = DIRS.map(d => {
      const sales = SALES.filter(r => r.dir === d.id && r.st !== 'new'), rev = sales.reduce((a, r) => a + this.saleTotal(r), 0);
      let cost = 0, est = 0; sales.forEach(r => r.items.forEach(([code, , , qty, price]) => { if (REC[code]) cost += this.recCost(code).unit * qty; else { cost += price * qty * .65; est += price * qty; } }));
      const direct = PAYMENTS.filter(p => p.kind === 'out' && p.dir === d.id && p.doc === '—' && inMonth(p.at, mm)).reduce((a, p) => a + p.sum, 0);
      const hours = this.loadByDir().find(l => l.dir === d.id).h, staff = STAFF.filter(p => Array.isArray(p.dirs) && p.dirs.includes(d.id)).length;
      return { d, sales: sales.length, rev, cost, est, direct, hours, staff };
    });
    const wsum = rows.reduce((a, r) => a + (rule === 'revenue' ? r.rev : rule === 'hours' ? r.hours : r.staff), 0);
    rows.forEach(r => { r.alloc = shared * (rule === 'revenue' ? r.rev : rule === 'hours' ? r.hours : r.staff) / (wsum || 1); r.margin = r.rev - r.cost - r.direct - r.alloc; r.pct = r.rev ? Math.round(100 * r.margin / r.rev) : 0; });
    const tot = rows.reduce((a, r) => ({ rev: a.rev + r.rev, cost: a.cost + r.cost, direct: a.direct + r.direct, alloc: a.alloc + r.alloc, margin: a.margin + r.margin }), { rev: 0, cost: 0, direct: 0, alloc: 0, margin: 0 });
    const cols = 'minmax(140px,1.2fr) 70px 120px 120px 110px 120px 120px 150px';
    const ruleSeg = `<div class="mg-rule"><span class="small mute">Общие затраты ${rub(shared)} за октябрь распределяются</span><div class="seg">${Object.entries(ALLOC_RULES).map(([k, n]) => `<button type="button" class="${rule === k ? 'on' : ''}" data-rule="${k}">${n}</button>`).join('')}</div><span class="mute">правило задаётся в настройках, здесь — пересчёт для сравнения</span></div>`;
    const tbl = `<div class="tbl items mg"><div class="tr th" style="grid-template-columns:${cols}"><div>направление</div><div>реализаций</div><div>выручка</div><div>себестоимость</div><div>прямые</div><div>общие (доля)</div><div>маржа</div><div>маржа, %</div></div>
      ${rows.map(r => `<div class="tr" style="grid-template-columns:${cols}"><div>${chipDir(r.d.id)} <span class="small mute">${this.prodArea(r.d.id)}</span></div><div class="num" style="text-align:center">${r.sales}</div><div class="num rn">${rub(r.rev)}</div><div class="num rn" title="${r.est ? 'товары без рецепта — оценка 65 % от цены' : ''}">${rub(r.cost)}${r.est ? ' <span class="mute small">≈</span>' : ''}</div><div class="num rn ${r.direct ? '' : 'mute'}">${r.direct ? rub(r.direct) : '—'}</div><div class="num rn">${rub(r.alloc)}</div><div class="num rn b ${r.margin < 0 ? 'bad-t' : ''}">${rub(r.margin)}</div><div><div class="row" style="gap:8px"><span class="num b ${r.pct < 0 ? 'bad-t' : ''}" style="width:42px">${r.pct} %</span><div class="bar grow"><i class="${r.pct < 10 ? 'bad' : r.pct < 25 ? 'warn' : ''}" style="width:${Math.max(0, Math.min(100, r.pct))}%"></i></div></div></div></div>`).join('')}
      <div class="tr tot" style="grid-template-columns:${cols}"><div>Итого</div><div class="num" style="text-align:center">${rows.reduce((a, r) => a + r.sales, 0)}</div><div class="num rn">${rub(tot.rev)}</div><div class="num rn">${rub(tot.cost)}</div><div class="num rn">${rub(tot.direct)}</div><div class="num rn">${rub(tot.alloc)}</div><div class="num rn ${tot.margin < 0 ? 'bad-t' : ''}">${rub(tot.margin)}</div><div class="num">${tot.rev ? Math.round(100 * tot.margin / tot.rev) : 0} %</div></div></div>`;
    return `${ruleSeg}${tbl}<div class="mute small" style="padding:8px 4px 2px">Выручка — реализации со статусом «подтверждена», «отгружена» и «закрыта»; себестоимость изделий по рецептам (материалы по ценам последних закупок и работы), товары без рецепта — оценка 65 % от цены; прямые затраты — выплаты направления без документа (лизинг, доставка); общие — аренда, коммунальные, связь, зарплата, налоги за октябрь.</div>`;
  },

  /* ---------- Настройки (34-й круг): организации, направления и подразделения, нумерация, роли и доступ, печатные формы, уведомления, тариф.
     Интеграций нет — модули после запуска в прототип не добавляются ---------- */
  settings() {
    const orgInfo = { bereg: ['6316123400', '631601001', 'УСН «доходы минус расходы»', 'Орлов Дмитрий'], 'bereg-m': ['6316123411', '631601001', 'УСН «доходы»', 'Орлов Дмитрий'], orlov: ['631600112233', '—', 'патент · розница', 'Орлов Дмитрий'] };
    const orgs = `<div class="orgs">${COMPANIES.map(c => { const [inn, kpp, sno, head] = orgInfo[c.id], accs = ACCOUNTS.filter(a => a.co === c.id), dirs = [...new Set([...SALES.filter(r => r.co === c.id).map(r => r.dir), ...SUPPLY.filter(r => r.co === c.id).map(r => r.dir)])];
      return `<div class="org"><div class="t">${c.name}</div><div class="mute small">${c.sub}</div><dl class="kv"><dt>ИНН / КПП</dt><dd class="num">${inn}${kpp !== '—' ? ' / ' + kpp : ''}</dd><dt>Налоги</dt><dd>${sno}</dd><dt>Руководитель</dt><dd>${head}</dd><dt>Направления</dt><dd>${dirs.length ? dirs.map(d => chipDir(d)).join(' ') : '<span class="mute">—</span>'}</dd></dl><div class="accs">${accs.map(a => `<div class="row"><span>${a.name}</span><span class="num">${rub(a.balance)}</span></div>`).join('')}</div><div class="row" style="margin-top:auto;padding-top:6px"><button type="button" class="btn sm ghost">${ic('edit', 'xs')}Реквизиты</button><button type="button" class="btn sm ghost">${ic('file', 'xs')}Печать и подпись</button></div></div>`; }).join('')}</div>`;
    const dirRows = DIRS.map(d => `<div class="tr" style="grid-template-columns:150px 1fr 1fr 1fr 90px"><div>${chipDir(d.id)}</div><div class="small">${this.whName(d.id)}</div><div class="small">${this.prodArea(d.id)}</div><div class="small">${DEPTS.find(x => x.id === 'sales').names[d.id]}</div><div class="num" style="text-align:center">${STAFF.filter(p => Array.isArray(p.dirs) && p.dirs.includes(d.id)).length}</div></div>`).join('');
    const shared = DEPTS.filter(d => d.shared).map(d => `<span class="chip line">${d.name} · ${STAFF.filter(p => p.dept === d.id).length}</span>`).join('');
    const dirs = `<div class="tbl set-tbl"><div class="tr th" style="grid-template-columns:150px 1fr 1fr 1fr 90px"><div>направление</div><div>склад</div><div>цех</div><div>продажи</div><div>людей</div></div>${dirRows}</div><div class="sec-t" style="margin-top:10px">Общие службы на все направления</div><div class="row wrap" style="gap:6px">${shared}</div>`;
    const nextOf = { 'ЗК': nextNo([...SALES.map(r => r.id), ...SUPPLY.map(r => r.order)], 'ЗК'), 'СН': nextNo(SUPPLY.map(r => r.id), 'СН'), 'ПС': nextNo(STOCK_MANUAL.map(r => r.id), 'ПС'), 'ПЗ': nextNo(PROD_ORDERS.map(o => o.id), 'ПЗ'), 'ВП': 'ВП-0001', 'ОТ': 'ОТ-0001', 'ПЛ': nextNo(PAYMENTS.map(p => p.id), 'ПЛ'), 'ОБ': nextNo(ISSUES.map(i => i.id), 'ОБ'), 'РЦ': nextNo(RECIPES.map(r => r.id), 'РЦ') };
    const num = `<div class="tbl set-tbl"><div class="tr th" style="grid-template-columns:1fr 60px 110px 1fr"><div>документ</div><div>код</div><div>следующий</div><div>формат</div></div>${NUMBERING.map(([n, code]) => `<div class="tr" style="grid-template-columns:1fr 60px 110px 1fr"><div>${n}</div><div class="no">${code}</div><div class="no">${nextOf[code]}</div><div class="small mute">две буквы, дефис, четыре цифры; после 9999 меняется буква</div></div>`).join('')}</div>`;
    const roles = `<div class="matrix" style="grid-template-columns:150px repeat(${PAGES.length},1fr)"><div></div>${PAGES.map(pg => `<div class="mh" title="${pg.name}">${ic(pg.icon, 'xs')}</div>`).join('')}${Object.values(ROLES).map(r => `<div class="mr small">${r.name}</div>${PAGES.map(pg => { const a = r.pages[pg.id]; return `<div class="mc ${a === 'full' ? '' : a === 'view' ? 'view' : 'no'}" title="${pg.name}: ${a === 'full' ? 'работа' : a === 'view' ? 'просмотр' : 'нет доступа'}">${a === 'full' ? ic('check', 'xs') : a === 'view' ? 'просм.' : '—'}</div>`; }).join('')}`).join('')}</div><div class="mute small" style="margin-top:8px">Доступ по направлению ограничивает склад, цех и продажи своим направлением; общие службы видят все. Роль сотруднику назначается на странице «Сотрудники».</div>`;
    const forms = `<div class="tbl set-tbl"><div class="tr th" style="grid-template-columns:1fr 1fr 80px"><div>форма</div><div>где используется</div><div>готова</div></div>${PRINT_FORMS.map(([n, where, ok]) => `<div class="tr" style="grid-template-columns:1fr 1fr 80px"><div>${n}</div><div class="small mute">${where}</div><div style="text-align:center">${ok ? dot('ok') : dot('')}</div></div>`).join('')}</div><div class="mute small" style="margin-top:8px">Реквизиты, логотип и подпись берутся из карточки организации.</div>`;
    const notif = `<div class="ntf-m"><div></div><div></div>${NOTIF_CHANNELS.map(c => `<div class="mh">${c}</div>`).join('')}${NOTIF_EVENTS.map(([ev, who], i) => `<div class="ev">${ev}</div><div class="who">${who}</div>${NOTIF_CHANNELS.map((c, j) => `<div class="tg"><button type="button" class="sw-tg ${NOTIF_RULES[i][j] ? 'on' : ''}" data-sw-tg="${i}:${j}" title="${ev} — ${c}"></button></div>`).join('')}`).join('')}</div><div class="mute small" style="margin-top:8px">Панель — внутри RIVA; почта и мессенджер — дубли по выбору сотрудника.</div>`;
    const plan = `<div class="plan-card"><div class="kpi"><b>${PLAN_INFO.name}</b><span>тариф до ${fmtDate(PLAN_INFO.until)}</span></div><div class="kpi"><b>${PLAN_INFO.users} из ${PLAN_INFO.limit}</b><span>сотрудников</span></div><div class="kpi"><b>${PLAN_INFO.storage}</b><span>файлы</span></div><div class="kpi"><b>${COMPANIES.length}</b><span>организации</span></div></div><div class="mute small" style="margin-top:8px">${PLAN_INFO.note}</div>`;
    return mod({ span: 12, title: 'Организации', sub: 'юрлица и ИП: реквизиты, налоговый режим, счета и кассы, направления', body: orgs })
      + mod({ span: 6, title: 'Направления и подразделения', sub: 'у каждого направления свой склад, цех и продажи; общие службы работают на все', body: dirs })
      + mod({ span: 6, title: 'Нумерация документов', sub: 'следующие номера считаются по документам прототипа', body: num })
      + mod({ span: 7, title: 'Роли и доступ', sub: `${Object.keys(ROLES).length} ролей · ${PAGES.length} страниц · работа, просмотр или нет доступа`, body: roles })
      + mod({ span: 5, title: 'Печатные формы', sub: 'PDF с реквизитами организации', body: forms })
      + mod({ span: 7, title: 'Уведомления', sub: 'какие события и по каким каналам — переключатели', body: notif })
      + mod({ span: 5, title: 'Тариф', sub: 'ограничения и срок', body: plan });
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

  /* ---------- события ---------- */
  reopen(id) { const el = document.querySelector(`[data-xp="${CSS.escape(id)}"]`); if (el) XP.show(el); },

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
      const cc = x.closest('[data-ccard]'); if (cc) this.updateClient(cc.dataset.ccard, nm.replace(/^cf-/, ''), opt.dataset.opt);
      const spc = x.closest('[data-spcard]'); if (spc) this.updateSupplier(spc.dataset.spcard, nm.replace(/^pf2-/, ''), opt.dataset.opt);
      const ic2 = x.closest('[data-icard]'); if (ic2) this.updateIssue(ic2.dataset.icard, nm.replace(/^if-/, ''), opt.dataset.opt);
      const plc = x.closest('[data-plcard]'); if (plc) this.updatePayment(plc.dataset.plcard, nm.replace(/^plf-/, ''), opt.dataset.opt);
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
      const ic2 = x.closest('[data-icard]'); if (ic2) this.updateIssue(ic2.dataset.icard, 'due', v);
      const plc = x.closest('[data-plcard]'); if (plc) this.updatePayment(plc.dataset.plcard, 'at', v);
      return;
    }
    const ptab = t.closest('[data-ptab]');
    if (ptab) { this.state.prodTab = ptab.dataset.ptab; XP.closeAll(); this.renderTopbar(); this.renderGrid(); return; }
    const ctab = t.closest('[data-ctab]');
    if (ctab) { this.state.clTab = ctab.dataset.ctab; XP.closeAll(); this.renderTopbar(); this.renderGrid(); return; }
    const ftab = t.closest('[data-ftab]');
    if (ftab) { this.state.finTab = ftab.dataset.ftab; XP.closeAll(); this.renderTopbar(); this.renderGrid(); return; }
    const rule = t.closest('[data-rule]');
    if (rule) { this.state.finRule = rule.dataset.rule; this.renderGrid(); return; }
    const stage = t.closest('[data-stage]');
    if (stage) { this.state.stage = this.state.stage === stage.dataset.stage ? null : stage.dataset.stage; XP.closeAll(); this.renderGrid(); return; }
    const swt = t.closest('[data-sw-tg]');
    if (swt) { const [i, j] = swt.dataset.swTg.split(':').map(Number); NOTIF_RULES[i][j] = !NOTIF_RULES[i][j]; swt.classList.toggle('on', NOTIF_RULES[i][j]); return; }
    const stype = t.closest('[data-stype]');
    if (stype) { this.state.saleType = stype.dataset.stype; XP.closeAll(); this.renderGrid(); return; }
    const iadd = t.closest('[data-item-add]');
    if (iadd) { this.saleItemAdd(iadd.closest('[data-scard]')); return; }
    const irm = t.closest('[data-item-rm]');
    if (irm) { const r = SALES.find(x => x.id === irm.closest('[data-scard]').dataset.scard); if (r) { r.items.splice(+irm.dataset.itemRm, 1); this.refreshSale(r); } return; }
    const go = t.closest('[data-go]');
    if (go) { e.preventDefault(); this.goTo(go.dataset.go); return; }
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
    const cf = e.target.closest('[data-ccard] input.in[name^="cf-"]');
    if (cf) { this.updateClient(cf.closest('[data-ccard]').dataset.ccard, cf.name.replace(/^cf-/, ''), cf.value); return; }
    const pf2 = e.target.closest('[data-spcard] input.in[name^="pf2-"]');
    if (pf2) { this.updateSupplier(pf2.closest('[data-spcard]').dataset.spcard, pf2.name.replace(/^pf2-/, ''), pf2.value); return; }
    const inf = e.target.closest('[data-icard] input.in[name^="if-"]');
    if (inf) { this.updateIssue(inf.closest('[data-icard]').dataset.icard, inf.name.replace(/^if-/, ''), inf.value); return; }
    const plf = e.target.closest('[data-plcard] input.in[name^="plf-"]');
    if (plf) { this.updatePayment(plf.closest('[data-plcard]').dataset.plcard, plf.name.replace(/^plf-/, ''), plf.value); return; }
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
