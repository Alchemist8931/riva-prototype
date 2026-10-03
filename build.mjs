// Сборка единого index.html из src/ (стили и скрипты встраиваются целиком).
import { readFileSync, writeFileSync } from 'node:fs';
const r = f => readFileSync(new URL('./src/' + f, import.meta.url), 'utf8');
const html = `<!doctype html>
<html lang="ru" data-theme="light">
<head>
<meta charset="utf-8">
<title>RIVA · прототип интерфейса для ПК</title>
<meta name="viewport" content="width=1280">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%278%27 fill=%27%23111%27/%3E%3Ctext x=%2716%27 y=%2722%27 font-family=%27Arial%27 font-weight=%27800%27 font-size=%2718%27 fill=%27%23fff%27 text-anchor=%27middle%27%3ER%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${r('style.css')}
</style>
</head>
<body>
<div class="frame">
  <aside class="side" id="side"></aside>
  <main class="content">
    <header class="topbar" id="topbar"></header>
    <div class="body">
      <div class="grid" id="grid"></div>
      <div class="chatcol" id="chatcol"></div>
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
