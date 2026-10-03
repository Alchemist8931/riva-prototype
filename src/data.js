/* ============================================================
   Тестовые данные. Вымышленное предприятие ПК «Берег»:
   три направления, у каждого свой склад, цех и отдел продаж;
   логистика, финансы, клиентский сервис и HR — общие.
   ============================================================ */

const COMPANY = { name: 'ПК «Берег»', sub: '3 направления · 27 чел.' };

const DIRS = [
  { id: 'metal', name: 'Металлоконструкции', short: 'Металл', k: 'М' },
  { id: 'furn',  name: 'Корпусная мебель',   short: 'Мебель', k: 'К' },
  { id: 'poly',  name: 'Полимерные изделия', short: 'Полимеры', k: 'П' },
];
const DIR = Object.fromEntries(DIRS.map(d => [d.id, d]));

const PAGES = [
  { id: 'logistics',  name: 'Логистика',    icon: 'truck',   sub: 'общая служба · все направления', ready: true,  unread: 3 },
  { id: 'warehouse',  name: 'Склад',        icon: 'wh',      sub: 'по каждому направлению отдельно', ready: false, unread: 0 },
  { id: 'production', name: 'Производство', icon: 'factory', sub: 'по каждому направлению отдельно', ready: false, unread: 1 },
  { id: 'sales',      name: 'Продажи',      icon: 'tag',     sub: 'по каждому направлению отдельно', ready: false, unread: 0 },
  { id: 'clients',    name: 'Клиенты',      icon: 'users',   sub: 'общая база',                     ready: false, unread: 0 },
  { id: 'finance',    name: 'Финансы',      icon: 'money',   sub: 'общая служба · учёт по направлениям', ready: false, unread: 0 },
  { id: 'staff',      name: 'Сотрудники',   icon: 'idcard',  sub: 'все подразделения',             ready: true,  unread: 2 },
];

/* подразделения: shared — одно на все направления, иначе — по направлению */
const DEPTS = [
  { id: 'mgmt',   name: 'Руководство',        shared: true },
  { id: 'log',    name: 'Логистика',          shared: true },
  { id: 'wh',     name: 'Склад',              perDir: true, names: { metal: 'Склад А', furn: 'Склад Б', poly: 'Склад В' } },
  { id: 'prod',   name: 'Производство',       perDir: true, names: { metal: 'Цех №1', furn: 'Цех №2', poly: 'Цех №3' } },
  { id: 'sales',  name: 'Продажи',            perDir: true, names: { metal: 'Продажи · металл', furn: 'Продажи · мебель', poly: 'Продажи · полимеры' } },
  { id: 'fin',    name: 'Финансы',            shared: true },
  { id: 'cs',     name: 'Клиентский сервис',  shared: true },
  { id: 'hr',     name: 'Кадры',              shared: true },
];

/* доступ к страницам по роли: full — работа, view — просмотр */
const ROLES = {
  director:   { name: 'Директор',            pages: { logistics: 'full', warehouse: 'full', production: 'full', sales: 'full', clients: 'full', finance: 'full', staff: 'full' } },
  logist:     { name: 'Логист',              pages: { logistics: 'full', warehouse: 'view', sales: 'view', clients: 'view' } },
  driver:     { name: 'Водитель',            pages: { logistics: 'full' } },
  storekeeper:{ name: 'Кладовщик',           pages: { warehouse: 'full', logistics: 'view', production: 'view' } },
  foreman:    { name: 'Производство',        pages: { production: 'full', warehouse: 'view' } },
  seller:     { name: 'Менеджер продаж',     pages: { sales: 'full', clients: 'full', warehouse: 'view', logistics: 'view' } },
  finance:    { name: 'Финансы',             pages: { finance: 'full', sales: 'view', clients: 'view', staff: 'view' } },
  cs:         { name: 'Клиентский сервис',   pages: { clients: 'full', sales: 'view', logistics: 'view' } },
  hr:         { name: 'Кадры',               pages: { staff: 'full' } },
};

/* статусы присутствия: office, remote, trip (в рейсе), vacation, sick */
const STAFF = [
  { id: 1,  name: 'Орлов Дмитрий',      pos: 'Генеральный директор',     dept: 'mgmt',  dirs: 'all',     role: 'director',    st: 'office',   on: true,  tel: '+7 927 100-01-01', mail: 'orlov@bereg.example' },
  { id: 2,  name: 'Савельев Антон',     pos: 'Руководитель логистики',   dept: 'log',   dirs: 'all',     role: 'logist',      st: 'office',   on: true,  tel: '+7 927 100-01-02', mail: 'saveliev@bereg.example', me: true },
  { id: 3,  name: 'Кузнецова Марина',   pos: 'Логист',                   dept: 'log',   dirs: 'all',     role: 'logist',      st: 'office',   on: true,  tel: '+7 927 100-01-03', mail: 'kuznetsova@bereg.example' },
  { id: 4,  name: 'Петров Илья',        pos: 'Логист',                   dept: 'log',   dirs: 'all',     role: 'logist',      st: 'remote',   on: true,  tel: '+7 927 100-01-04', mail: 'petrov@bereg.example' },
  { id: 5,  name: 'Громов Сергей',      pos: 'Водитель',                 dept: 'log',   dirs: 'all',     role: 'driver',      st: 'trip',     on: true,  tel: '+7 927 100-01-05', mail: '' },
  { id: 6,  name: 'Лебедев Олег',       pos: 'Водитель',                 dept: 'log',   dirs: 'all',     role: 'driver',      st: 'office',   on: false, tel: '+7 927 100-01-06', mail: '' },
  { id: 7,  name: 'Титов Руслан',       pos: 'Водитель',                 dept: 'log',   dirs: 'all',     role: 'driver',      st: 'trip',     on: true,  tel: '+7 927 100-01-07', mail: '' },
  { id: 8,  name: 'Фомин Павел',        pos: 'Водитель',                 dept: 'log',   dirs: 'all',     role: 'driver',      st: 'trip',     on: true,  tel: '+7 927 100-01-08', mail: '' },
  { id: 9,  name: 'Беляев Виктор',      pos: 'Заведующий складом',       dept: 'wh',    dirs: ['metal'], role: 'storekeeper', st: 'office',   on: true,  tel: '+7 927 100-01-09', mail: 'belyaev@bereg.example' },
  { id: 10, name: 'Жуков Андрей',       pos: 'Кладовщик',                dept: 'wh',    dirs: ['metal'], role: 'storekeeper', st: 'office',   on: false, tel: '+7 927 100-01-10', mail: '' },
  { id: 11, name: 'Мельникова Ольга',   pos: 'Заведующая складом',       dept: 'wh',    dirs: ['furn'],  role: 'storekeeper', st: 'office',   on: true,  tel: '+7 927 100-01-11', mail: 'melnikova@bereg.example' },
  { id: 12, name: 'Соколов Иван',       pos: 'Кладовщик',                dept: 'wh',    dirs: ['furn'],  role: 'storekeeper', st: 'vacation', on: false, tel: '+7 927 100-01-12', mail: '' },
  { id: 13, name: 'Царёв Николай',      pos: 'Заведующий складом',       dept: 'wh',    dirs: ['poly'],  role: 'storekeeper', st: 'office',   on: true,  tel: '+7 927 100-01-13', mail: 'tsarev@bereg.example' },
  { id: 14, name: 'Климов Егор',        pos: 'Начальник цеха',           dept: 'prod',  dirs: ['metal'], role: 'foreman',     st: 'office',   on: true,  tel: '+7 927 100-01-14', mail: 'klimov@bereg.example' },
  { id: 15, name: 'Зайцев Артём',       pos: 'Мастер участка',           dept: 'prod',  dirs: ['metal'], role: 'foreman',     st: 'office',   on: false, tel: '+7 927 100-01-15', mail: '' },
  { id: 16, name: 'Прохорова Елена',    pos: 'Начальник цеха',           dept: 'prod',  dirs: ['furn'],  role: 'foreman',     st: 'office',   on: true,  tel: '+7 927 100-01-16', mail: 'prokhorova@bereg.example' },
  { id: 17, name: 'Галкин Михаил',      pos: 'Начальник цеха',           dept: 'prod',  dirs: ['poly'],  role: 'foreman',     st: 'sick',     on: false, tel: '+7 927 100-01-17', mail: 'galkin@bereg.example' },
  { id: 18, name: 'Воронцова Анна',     pos: 'Руководитель продаж',      dept: 'sales', dirs: ['metal'], role: 'seller',      st: 'office',   on: true,  tel: '+7 927 100-01-18', mail: 'vorontsova@bereg.example' },
  { id: 19, name: 'Степанов Денис',     pos: 'Менеджер продаж',          dept: 'sales', dirs: ['metal'], role: 'seller',      st: 'office',   on: true,  tel: '+7 927 100-01-19', mail: 'stepanov@bereg.example', newbie: true },
  { id: 20, name: 'Якушева Ирина',      pos: 'Менеджер продаж',          dept: 'sales', dirs: ['furn'],  role: 'seller',      st: 'remote',   on: true,  tel: '+7 927 100-01-20', mail: 'yakusheva@bereg.example' },
  { id: 21, name: 'Никитин Глеб',       pos: 'Менеджер продаж',          dept: 'sales', dirs: ['poly'],  role: 'seller',      st: 'office',   on: false, tel: '+7 927 100-01-21', mail: 'nikitin@bereg.example' },
  { id: 22, name: 'Романова Светлана',  pos: 'Главный бухгалтер',        dept: 'fin',   dirs: 'all',     role: 'finance',     st: 'office',   on: true,  tel: '+7 927 100-01-22', mail: 'romanova@bereg.example' },
  { id: 23, name: 'Ефимова Дарья',      pos: 'Экономист',                dept: 'fin',   dirs: 'all',     role: 'finance',     st: 'vacation', on: false, tel: '+7 927 100-01-23', mail: 'efimova@bereg.example' },
  { id: 24, name: 'Морозова Юлия',      pos: 'Специалист по клиентам',   dept: 'cs',    dirs: 'all',     role: 'cs',          st: 'office',   on: true,  tel: '+7 927 100-01-24', mail: 'morozova@bereg.example' },
  { id: 25, name: 'Данилова Ксения',    pos: 'Специалист по кадрам',     dept: 'hr',    dirs: 'all',     role: 'hr',          st: 'office',   on: true,  tel: '+7 927 100-01-25', mail: 'danilova@bereg.example' },
  { id: 26, name: 'Ковалёв Станислав',  pos: 'Кладовщик',                dept: 'wh',    dirs: ['poly'],  role: 'storekeeper', st: 'office',   on: true,  tel: '+7 927 100-01-26', mail: '', newbie: true },
  { id: 27, name: 'Абрамова Вера',      pos: 'Сборщик мебели',           dept: 'prod',  dirs: ['furn'],  role: 'foreman',     st: 'office',   on: false, tel: '+7 927 100-01-27', mail: '' },
];
const BY_ID = Object.fromEntries(STAFF.map(s => [s.id, s]));
const ME = STAFF.find(s => s.me);

const ST = {
  office:   { name: 'В офисе',   cls: 'ok' },
  remote:   { name: 'Удалённо',  cls: 'line' },
  trip:     { name: 'В рейсе',   cls: 'solid' },
  vacation: { name: 'Отпуск',    cls: 'dashed' },
  sick:     { name: 'Больничный',cls: 'warn' },
};

/* этапы рейса */
const STAGES = ['Заявка', 'Сборка на складе', 'Погрузка', 'В пути', 'Доставлено'];

/* рейсы на сегодня. stage — индекс текущего этапа; times — время по пройденным этапам */
const TRIPS = [
  { id: 'Р-1042', dir: 'metal', from: 'Склад А', to: 'Казань, «Стройкомплект»', veh: 'МАН TGL · А 123 ВС', driver: 5,  cargo: '12 ферм, 6,4 т', stage: 3, times: ['вчера 16:10', '07:20', '08:35', '08:40', ''], eta: '14:30', km: 345, prog: '≈ 190 км из 345', docs: ['ТТН №1042', 'Счёт-фактура', 'Пропуск на объект'], contact: 'Ибрагимов Р., приёмка · +7 843 000-00-00', note: 'Окно разгрузки 14:00–16:00, кран заказчика.' },
  { id: 'Р-1043', dir: 'furn',  from: 'Склад Б', to: 'Самара, «Домострой»',     veh: 'Газель Next · В 456 ЕК', driver: 6, cargo: '18 шкафов, 1,1 т', stage: 2, times: ['вчера 11:00', '09:10', '', '', ''], eta: '13:10', km: 38, prog: 'погрузка · док 2', docs: ['ТТН №1043', 'УПД'], contact: 'Селезнёва О. · +7 846 000-00-00', note: 'Хрупкое, упаковка в стрейч + уголки.' },
  { id: 'Р-1044', dir: 'poly',  from: '«Полипласт», Тольятти', to: 'Склад В', veh: 'ТК «Дельта» (наёмный)', driver: null, cargo: 'Гранулят ПЭ, 4 т', stage: 1, times: ['вчера 14:40', '', '', '', ''], eta: '16:00', km: 92, prog: 'ждём подтверждение поставщика', docs: ['Заявка ТК', 'Спецификация №88'], contact: 'Диспетчер ТК · +7 800 000-00-00', note: 'Входящая поставка сырья на склад В.' },
  { id: 'Р-1045', dir: 'metal', from: 'Склад А', to: 'Цех №1 (внутреннее)',    veh: 'Погрузчик Toyota', driver: 10, cargo: 'Профиль 40×40, 2 т', stage: 4, times: ['08:00', '08:05', '08:20', '08:30', '08:50'], eta: '—', km: 0, prog: 'завершён', docs: ['Накладная на перемещение'], contact: 'Климов Е., цех №1', note: 'Перемещение между складом и цехом одного направления.' },
  { id: 'Р-1046', dir: 'furn',  from: 'Склад Б', to: 'Тольятти, ИП Серова',    veh: 'Газель Next · Е 789 КМ', driver: 7, cargo: '6 кухонь, 0,9 т', stage: 3, times: ['вчера 15:30', '07:40', '08:50', '09:05', ''], eta: '11:40', km: 96, prog: '≈ 70 км из 96', docs: ['ТТН №1046', 'УПД', 'Акт приёма'], contact: 'Серова Н. · +7 848 000-00-00', note: 'Подъём на 4 этаж, лифт есть.' },
  { id: 'Р-1047', dir: 'poly',  from: 'Склад В', to: 'Пенза, «Агротех»',       veh: 'Fiat Ducato · К 321 ОР', driver: 8, cargo: '300 ящиков, 1,5 т', stage: 2, times: ['вчера 12:00', '08:30', '', '', ''], eta: '—', km: 410, prog: 'простой на погрузке 1 ч 20 мин', docs: ['ТТН №1047'], contact: 'Диспетчер «Агротех» · +7 841 000-00-00', note: 'Склад В не успел собрать партию: смена кладовщика с 09:00.', bad: true },
  { id: 'Р-1048', dir: 'metal', from: '«Металлсервис»', to: 'Склад А',         veh: 'не назначен', driver: null, cargo: 'Лист 3 мм, 6 т', stage: 0, times: ['10:05', '', '', '', ''], eta: '—', km: 120, prog: 'нужен транспорт 6 т', docs: ['Счёт №3301'], contact: 'Менеджер поставщика · +7 846 000-00-01', note: 'Поставка под заказ «Стройкомплект», вторая партия.' },
  { id: 'Р-1049', dir: 'furn',  from: 'Склад Б', to: 'Самара, «Мебель-Маркет»', veh: 'не назначен', driver: null, cargo: '24 стола, 1,3 т', stage: 0, times: ['09:50', '', '', '', ''], eta: '—', km: 41, prog: 'ждёт назначения', docs: [], contact: 'Отдел закупок · +7 846 000-00-02', note: 'Можно совместить с Р-1043 завтрашним рейсом.' },
];

/* заявки на доставку от отделов продаж и складов разных направлений */
const REQUESTS = [
  { id: 'З-311', dir: 'metal', from: 'Продажи · металл', who: 18, what: '12 ферм → «Стройкомплект»',     due: 'до 3 окт', prio: 'high', trip: 'Р-1042' },
  { id: 'З-314', dir: 'furn',  from: 'Продажи · мебель', who: 20, what: '10 шкафов → «Уют», Самара',    due: 'до 7 окт', prio: 'norm', trip: null },
  { id: 'З-315', dir: 'poly',  from: 'Продажи · полимеры', who: 21, what: '300 ящиков → «Агротех»',    due: 'до 4 окт', prio: 'high', trip: 'Р-1047' },
  { id: 'З-316', dir: 'poly',  from: 'Склад В',            who: 13, what: 'Сырьё от «Полипласт» → Склад В', due: 'до 3 окт', prio: 'norm', trip: 'Р-1044' },
  { id: 'З-317', dir: 'metal', from: 'Продажи · металл', who: 19, what: 'Лист 3 мм от «Металлсервис»', due: 'до 6 окт', prio: 'norm', trip: 'Р-1048' },
  { id: 'З-318', dir: 'furn',  from: 'Продажи · мебель', who: 20, what: '24 стола → «Мебель-Маркет»',  due: 'до 8 окт', prio: 'low',  trip: 'Р-1049' },
];

const FLEET = [
  { name: 'МАН TGL 5 т',        plate: 'А 123 ВС 163', driver: 5,  state: 'В рейсе Р-1042', load: 8,  cls: 'solid', to: 'ТО через 1 200 км' },
  { name: 'Газель Next',        plate: 'В 456 ЕК 163', driver: 6,  state: 'Погрузка Р-1043', load: 6, cls: 'line', to: 'ТО через 4 800 км' },
  { name: 'Газель Next',        plate: 'Е 789 КМ 163', driver: 7,  state: 'В рейсе Р-1046', load: 5,  cls: 'solid', to: 'ТО через 900 км' },
  { name: 'Fiat Ducato',        plate: 'К 321 ОР 163', driver: 8,  state: 'Простой на погрузке', load: 0, cls: 'bad', to: 'ТО через 3 100 км' },
  { name: 'Погрузчик Toyota',   plate: 'внутренний',   driver: 10, state: 'Свободен', load: 0, cls: 'ok', to: 'Осмотр 10 окт' },
  { name: 'ТК «Дельта»',        plate: 'наёмный',      driver: null, state: 'Заказан на Р-1044', load: 10, cls: 'dashed', to: '' },
];

/* задачи смены (раскрывающийся элемент, образец -49) */
const SHIFT_TASKS = [
  { n: 'Согласовать окно разгрузки у «Стройкомплект»', done: true },
  { n: 'Передать ТТН по Р-1045 в бухгалтерию', done: true },
  { n: 'Назначить рейс на заявку З-314 («Уют»)', done: false },
  { n: 'Разобраться с простоем Фомина на складе В', done: false },
  { n: 'Заявка на ТО Газели Е 789 КМ', done: false },
];

/* адаптация новых сотрудников */
const ONBOARDING = [
  { who: 19, steps: ['Документы и договор', 'Доступы в RIVA', 'Инструктаж по ТБ', 'Наставник и план', 'Испытательный срок'], done: 3, cur: 3 },
  { who: 26, steps: ['Документы и договор', 'Доступы в RIVA', 'Инструктаж по ТБ', 'Обучение на ТСД', 'Испытательный срок'], done: 2, cur: 2 },
];

/* чат по страницам: участники — те, у кого есть доступ к странице */
const CHATS = {
  logistics: [
    { who: 9,  t: '08:52', text: 'Р-1045 принят в цех №1, профиль пересчитали — 2 т ровно.' },
    { who: 2,  t: '09:03', text: 'Спасибо. Фомин стоит на складе В уже час, кто-нибудь из полимеров на связи?' },
    { who: 13, t: '09:07', text: 'Царёв. Партию добираем, кладовщик вышел в 09:00. Погрузим к 10:30.' },
    { who: 18, t: '09:40', text: 'По Р-1042: заказчик подтвердил кран на 14:00, пропуск на водителя отправила.' },
    { who: 3,  t: '10:12', text: 'З-314 («Уют») можно поставить на понедельник вместе с Р-1049, направление одно.' },
  ],
  staff: [
    { who: 25, t: '09:15', text: 'Степанов и Ковалёв: инструктаж по ТБ в пятницу прошли, отметила в адаптации.' },
    { who: 1,  t: '09:20', text: 'Хорошо. Ковалёву нужен доступ в Склад В — Царёв, подтверди.' },
    { who: 13, t: '09:31', text: 'Подтверждаю, кладовщик склада В, доступ по направлению «Полимеры».' },
    { who: 22, t: '10:02', text: 'Напоминаю: табель за сентябрь закрываем сегодня до 17:00.' },
  ],
  generic: [
    { who: 1, t: '09:00', text: 'Страница в проектировании, чат уже работает для участников.' },
  ],
};

/* автоответы для демонстрации онлайн-переписки */
const REPLIES = {
  logistics: { who: 13, text: 'Царёв: вижу, отвечу через пару минут — заканчиваем погрузку Р-1047.' },
  staff:     { who: 25, text: 'Данилова: приняла, внесу в карточку сотрудника.' },
  generic:   { who: 1,  text: 'Орлов: принято.' },
};

/* модули-заглушки для страниц, которые спроектируем позже */
const STUBS = {
  warehouse:  { text: 'Остатки и движения по каждому складу отдельно: склад А (металл), склад Б (мебель), склад В (полимеры). Переключатель склада — в верхней полосе, как переключатель направления на этой странице.', mods: ['Остатки по номенклатуре', 'Приход и расход за день', 'Инвентаризация', 'Заявки на отгрузку от логистики', 'Чат склада'] },
  production: { text: 'Планы и выпуск по каждому цеху отдельно. Наряды, загрузка участков, потребность в материалах со склада своего направления.', mods: ['План выпуска на неделю', 'Наряды и исполнители', 'Потребность в материалах', 'Брак и переделки', 'Чат цеха'] },
  sales:      { text: 'Воронка и сделки по каждому отделу продаж отдельно, с заявками на доставку, которые уходят в общую логистику.', mods: ['Воронка сделок', 'Счета и оплаты', 'Заявки на доставку', 'План и факт по менеджерам', 'Чат отдела'] },
  clients:    { text: 'Общая база клиентов по всем направлениям: один клиент может покупать и металл, и мебель.', mods: ['Карточки клиентов', 'История заказов по направлениям', 'Обращения и претензии', 'Чат клиентского сервиса'] },
  finance:    { text: 'Общая финансовая служба с учётом по направлениям: выручка, затраты и маржа каждого направления отдельно, общие расходы распределяются.', mods: ['ДДС по направлениям', 'Дебиторка и кредиторка', 'Платёжный календарь', 'Распределение общих затрат', 'Чат финансов'] },
};
