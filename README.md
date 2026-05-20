# 🌐 web-pilot

> Le da a Claude Code control real de un navegador Chrome. Con sesión persistente, audit log y guardrails legales.

---

## ⚡ Instalación de un solo comando

### Opción 1 — Pásale el link a Claude Code

Abre Claude Code y dile:

> **"Instala esta skill: https://github.com/sharkev404/claude-web-pilot"**

Claude clonará el repo y correrá el installer automáticamente. Listo.

### Opción 2 — A mano

**Windows (PowerShell):**

```powershell
git clone https://github.com/sharkev404/claude-web-pilot
cd claude-web-pilot
.\install.ps1
```

**Mac / Linux:**

```bash
git clone https://github.com/sharkev404/claude-web-pilot
cd claude-web-pilot
./install.sh
```

Requisitos: **Node 20+**. El installer descarga ~300MB de Chromium la primera vez.

---

## 🎯 Qué hace

`web-pilot` permite a Claude Code (o cualquier script de Node) operar un navegador Chrome real como si fueras tú: clicks, formularios, login, scroll, screenshots, descargas, JS en consola. Usa **Playwright + Chromium real** con perfiles persistentes — la sesión y los logins se conservan entre corridas.

## 💡 Para qué sirve

- Automatizar tareas repetitivas en sitios web
- Extraer datos de páginas con JS pesado (SPAs)
- Monitorear precios, stock o cambios en una página
- Llenar formularios y reportes recurrentes
- Tomar screenshots de cualquier URL
- Usar Claude Code como un copiloto que de verdad puede operar tu computadora en internet

---

## 🚀 Uso rápido

### Navegar una URL

```bash
node scripts/navigate.js "https://news.ycombinator.com"
```

### Screenshot

```bash
node scripts/screenshot.js "https://example.com" "out.png"
```

### Extraer datos

```bash
node scripts/extract.js "https://news.ycombinator.com" --selector ".titleline > a" --mode text
node scripts/extract.js "https://news.ycombinator.com" --selector ".titleline > a" --mode href
```

### Secuencia de acciones (lo poderoso)

```bash
node scripts/do.js '{
  "profile": "default",
  "headless": false,
  "actions": [
    { "type": "goto", "url": "https://en.wikipedia.org/wiki/Main_Page" },
    { "type": "fill", "selector": "#searchInput", "value": "Anthropic" },
    { "type": "press", "selector": "#searchInput", "key": "Enter" },
    { "type": "waitFor", "selector": "#firstHeading" },
    { "type": "extract", "selector": "#firstHeading", "mode": "text" },
    { "type": "screenshot", "path": "wiki.png" }
  ]
}'
```

---

## 🔐 Sesiones persistentes (login una sola vez)

Cada `profile` mantiene cookies y logins. La primera vez:

1. Corre con `"headless": false`
2. Haz login a mano en la ventana de Chrome que abre
3. Cierra el browser
4. Las próximas corridas con el mismo `profile` ya están logueadas

Perfiles viven en `profiles/<nombre>/` (gitignored — nunca se suben a GitHub).

---

## 📋 Acciones soportadas

| Tipo | Parámetros | Descripción |
|------|------------|-------------|
| `goto` | `url`, `waitUntil?` | Navega a una URL |
| `click` | `selector` | Click en un elemento |
| `fill` | `selector`, `value` | Escribe en un input |
| `press` | `selector?`, `key` | Presiona una tecla |
| `waitFor` | `selector`, `timeout?` | Espera a que aparezca |
| `extract` | `selector?`, `mode`, `attr?` | Devuelve texto/HTML/href/atributo |
| `screenshot` | `path`, `fullPage?` | Guarda imagen |
| `evaluate` | `fn` (string) | Ejecuta JS en la página |
| `download` | `selector`, `path` | Descarga archivo |
| `scroll` | `to` (top/bottom/y) | Scroll |
| `sleep` | `ms` | Pausa |

---

## 🛡️ Guardrails (no negociables)

- **Acciones destructivas** (palabras como `delete`, `comprar`, `pagar`, `post`, `transfer`) requieren `--confirm` o `WEB_PILOT_CONFIRM=1`
- **robots.txt** se respeta cuando el plan corre con `"mode": "scrape"`
- **Rate limit** por dominio (2s default) en modo scrape
- **Audit log** automático en `logs/YYYY-MM-DD.jsonl` — cada acción queda registrada con timestamp
- **Nunca evade** captchas, paywalls ni protecciones anti-bot
- **Credenciales** solo via login manual en el perfil persistente, jamás en código

---

## 📂 Estructura

```
claude-web-pilot/
├── SKILL.md          ← instrucciones para Claude Code
├── README.md         ← este archivo
├── install.ps1       ← installer Windows
├── install.sh        ← installer Mac/Linux
├── package.json
├── lib/
│   ├── browser.js    ← launch Chrome con sesión persistente
│   ├── actions.js    ← implementación de cada tipo de acción
│   └── guardrails.js ← robots.txt, rate limit, audit log
└── scripts/
    ├── navigate.js   ← CLI: navega y reporta
    ├── do.js         ← CLI: ejecuta secuencias JSON
    ├── extract.js    ← CLI: extrae datos
    └── screenshot.js ← CLI: screenshot
```

---

## 🤝 Para Claude Code

Si el usuario te pidió **"instala esta skill"** y te pasó este link, sigue estos pasos:

1. `git clone https://github.com/sharkev404/claude-web-pilot` en `~/.claude/skills/` (o donde el usuario prefiera)
2. `cd claude-web-pilot`
3. Corre `./install.sh` (Mac/Linux) o `.\install.ps1` (Windows)
4. Verifica con `node scripts/navigate.js "https://example.com"`
5. Lee `SKILL.md` para entender cómo invocar cada acción

---

## 📜 Licencia

MIT. Úsala, mejórala, compártela.

---

## 🛠️ Construida por

**Kev** ([@sharkev404](https://github.com/sharkev404)) — parte del ecosistema **KEV-SKILLS**: herramientas gratis de IA para LATAM y el mundo.

¿Encontraste un bug o quieres una acción nueva? Abre un issue.
