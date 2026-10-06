// Сборка единого index.html из src/ (стили и скрипты встраиваются целиком).
import { readFileSync, writeFileSync } from 'node:fs';
const r = f => readFileSync(new URL('./src/' + f, import.meta.url), 'utf8');
// отметка сборки в заголовке вкладки (московское время): по ней владелец сверяет, что видит свежую выкладку, а не кэш
const stamp = new Date(Date.now() + 3 * 3600e3).toISOString().replace(/^\d{4}-(\d\d)-(\d\d)T(\d\d):(\d\d).*$/, '$2.$1 $3:$4');
const html = `<!doctype html>
<html lang="ru" data-theme="light">
<head>
<meta charset="utf-8">
<title>RIVA · прототип интерфейса для ПК · сборка ${stamp}</title>
<meta name="viewport" content="width=1280">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%278%27 fill=%27%23111%27/%3E%3Ctext x=%2716%27 y=%2722%27 font-family=%27Arial%27 font-weight=%27800%27 font-size=%2718%27 fill=%27%23fff%27 text-anchor=%27middle%27%3ER%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=SN+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
${r('style.css')}
</style>
</head>
<body>
<script>document.documentElement.dataset.theme = localStorage.getItem('riva.theme') || 'light';
if (localStorage.getItem('riva.bg.v') !== '2') { localStorage.setItem('riva.bg', 'waves'); localStorage.setItem('riva.bg.v', '2'); }   /* один раз вернуть волны: до этой сборки фон мог быть переключён, пока волны не было видно */
document.documentElement.dataset.bg = localStorage.getItem('riva.bg') || 'waves';</script>
<div class="bg-layer bg-hatch"></div>
<canvas class="bg-layer" id="bg-wave" aria-hidden="true"></canvas>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="gi-back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b4b4b"/><stop offset="1" stop-color="#0d0d0d"/></linearGradient>
  <linearGradient id="gi-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#fff" stop-opacity=".94"/></linearGradient>
  <linearGradient id="gi-back-i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f6f6"/><stop offset="1" stop-color="#9c9c9c"/></linearGradient>
  <linearGradient id="gi-glass-i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101010" stop-opacity=".32"/><stop offset="1" stop-color="#101010" stop-opacity=".86"/></linearGradient>
  <filter id="gi-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter>
  <filter id="gi-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter>
</defs></svg>
<div class="frame">
  <aside class="side" id="side"></aside>
  <main class="content">
    <header class="topbar" id="topbar"></header>
    <div class="body">
      <div class="grid" id="grid"></div>
      <div class="chatcol xp" id="chatcol" data-xp="chat"></div>
      <div class="notifcol xp" id="notifcol" data-xp="notifs"></div>
    </div>
  </main>
  <div class="veil"></div>
</div>
<script>
${r('data.js')}
${r('ui.js')}
${r('pages.js')}
</script>
</body>
</html>
`;
writeFileSync(new URL('./index.html', import.meta.url), html);
console.log('index.html', html.length, 'bytes');
