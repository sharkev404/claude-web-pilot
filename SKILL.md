---
name: web-pilot
description: Controla un navegador Chrome real (Playwright) con sesión persistente desde Claude Code. Navega cualquier URL, llena formularios, da clicks, hace login, extrae datos, toma screenshots, ejecuta JS, descarga archivos. Úsalo cuando el usuario quiera que Claude interactúe con un sitio web — leer, automatizar, extraer información o ejecutar tareas en su nombre. Respeta robots.txt en modo scrape, exige confirmación antes de acciones destructivas y nunca evade captchas, paywalls ni hace login en cuentas ajenas.
---

# web-pilot

Esta skill te da control directo sobre un navegador Chrome real con sesión persistente. Es **lo más cercano a tener una computadora del usuario navegando internet por ti**.

## Cuándo usar esta skill

- El usuario te pide entrar a un sitio y hacer algo (leer, comprar, buscar, llenar form, postear, descargar).
- El usuario quiere extraer datos de una o varias páginas.
- El usuario quiere automatizar un flujo recurrente en un sitio web.
- El usuario quiere monitorear un sitio (precios, stock, cambios).
- El usuario quiere que ejecutes JS en un sitio o saques un screenshot.

## Cuándo NO usar

- Si lo único que se necesita es **fetch de HTML estático** sin JS ni interacción → usar `fetch` directo, no enciendas Chromium.
- Si el sitio requiere **login en cuenta ajena** al usuario → detente y pide aclaración.
- Si la acción evade captcha, paywall o protección anti-bot → no.

## Cómo se usa

Desde la raíz de `skills/web-pilot/`:

```bash
# Navegar y leer
node scripts/navigate.js "https://example.com"

# Screenshot
node scripts/screenshot.js "https://example.com" "out.png"

# Extraer texto / links / atributos
node scripts/extract.js "https://example.com" --selector "h1,p" --mode text

# Secuencia de acciones (lo más poderoso)
node scripts/do.js '{
  "profile": "default",
  "headless": false,
  "actions": [
    { "type": "goto", "url": "https://example.com" },
    { "type": "fill", "selector": "#search", "value": "claude code" },
    { "type": "click", "selector": "button[type=submit]" },
    { "type": "waitFor", "selector": ".results" },
    { "type": "extract", "selector": ".result-title", "mode": "text" },
    { "type": "screenshot", "path": "out.png" }
  ]
}'
```

### Tipos de acción soportados en `do.js`

| type | params | qué hace |
|------|--------|----------|
| `goto` | `url`, `waitUntil?` | navega |
| `click` | `selector`, `confirm?` | click |
| `fill` | `selector`, `value` | escribe en un input |
| `press` | `selector`, `key` | presiona tecla (Enter, etc.) |
| `waitFor` | `selector`, `timeout?` | espera elemento |
| `extract` | `selector`, `mode` (text/html/href/attr), `attr?` | regresa el contenido |
| `screenshot` | `path`, `fullPage?` | guarda imagen |
| `evaluate` | `fn` (string de función) | ejecuta JS en la página |
| `download` | `selector`, `path` | descarga archivo |
| `scroll` | `to` (bottom/top/y) | scroll |
| `sleep` | `ms` | pausa |

## Sesiones persistentes (login una sola vez)

Cada `profile` mantiene cookies, localStorage e historial. La primera vez que el usuario necesite estar logueado en un sitio:

1. Corre con `headless: false`.
2. El usuario hace login a mano en la ventana.
3. Cierras el browser.
4. La próxima vez con el mismo `profile`, ya está logueado.

Perfiles viven en `profiles/<nombre>/`. Están gitignored. Cada cuenta/contexto usa su perfil aparte (ej: `kev-personal`, `pact-cliente-X`).

## Guardrails (no negociables)

1. **Acciones destructivas requieren confirmación.** Si una acción contiene palabras como "delete", "comprar", "pay", "post", "publicar", "enviar", "transfer" — el script se detiene y pide `--confirm` o `WEB_PILOT_CONFIRM=1`.
2. **robots.txt se respeta en modo scrape.** Para extracciones masivas (más de 5 páginas del mismo dominio) se consulta robots.txt y se respeta. Para navegación interactiva normal no — un humano tampoco lee robots.
3. **User-Agent honesto en scraping.** En modo scrape se agrega un UA identificable. En interactivo se usa el UA real de Chrome.
4. **Rate limit por dominio.** Default 1 request cada 2s en scrape. Configurable.
5. **Nunca evadir captcha, paywall, ni protección anti-bot.** Si aparece, detenerse y avisar.
6. **Credenciales jamás en código.** Solo via login manual en perfil persistente.
7. **Audit log automático.** Cada sesión escribe en `logs/YYYY-MM-DD.jsonl` qué acciones ejecutó.

## Estructura

```
web-pilot/
├── SKILL.md              ← este archivo
├── README.md             ← docs públicas pa' GitHub
├── package.json
├── lib/
│   ├── browser.js        ← launch/close del browser con sesión persistente
│   ├── actions.js        ← implementación de cada tipo de acción
│   └── guardrails.js     ← robots.txt, detección destructiva, rate limit
├── scripts/
│   ├── navigate.js       ← CLI: navega y lee
│   ├── do.js             ← CLI: ejecuta secuencia JSON de acciones
│   ├── extract.js        ← CLI: extrae datos
│   └── screenshot.js     ← CLI: screenshot
├── profiles/             ← (gitignored) perfiles persistentes de Chrome
└── logs/                 ← (gitignored) audit log de acciones
```

## Setup (primera vez)

```bash
cd skills/web-pilot
npm install
npx playwright install chromium
```

Descarga ~300MB de Chromium la primera vez. Después ya jala.
