// Guardrails: deteccion de acciones destructivas, robots.txt, rate limit, audit log.

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', 'logs');

const DESTRUCTIVE_KEYWORDS = [
  'delete', 'remove', 'eliminar', 'borrar',
  'comprar', 'pagar', 'pay', 'buy', 'checkout', 'purchase',
  'subscribe', 'unsubscribe', 'suscribir', 'cancelar',
  'transfer', 'transferir', 'send money', 'enviar dinero',
  'post', 'publicar', 'tweet', 'publish',
  'submit order', 'place order', 'confirmar pedido',
];

function isDestructive(action) {
  const blob = JSON.stringify(action).toLowerCase();
  return DESTRUCTIVE_KEYWORDS.some(k => blob.includes(k));
}

function isConfirmed() {
  return process.env.WEB_PILOT_CONFIRM === '1'
      || process.argv.includes('--confirm');
}

// robots.txt -- lectura simple con cache por dominio en memoria.
const robotsCache = new Map();

async function fetchRobots(origin) {
  if (robotsCache.has(origin)) return robotsCache.get(origin);
  try {
    const res = await fetch(`${origin}/robots.txt`, { method: 'GET' });
    const text = res.ok ? await res.text() : '';
    robotsCache.set(origin, text);
    return text;
  } catch (_) {
    robotsCache.set(origin, '');
    return '';
  }
}

// Parser minimo: devuelve true si la ruta esta permitida para el UA.
function isAllowedByRobots(robotsTxt, pathName, userAgent = '*') {
  if (!robotsTxt) return true;
  const lines = robotsTxt.split(/\r?\n/).map(l => l.replace(/#.*/, '').trim()).filter(Boolean);
  let active = false;
  const rules = [];
  for (const line of lines) {
    const [rawKey, ...rest] = line.split(':');
    const key = rawKey.toLowerCase().trim();
    const value = rest.join(':').trim();
    if (key === 'user-agent') {
      active = value === '*' || value.toLowerCase() === userAgent.toLowerCase();
    } else if (active && (key === 'disallow' || key === 'allow')) {
      rules.push({ type: key, path: value });
    }
  }
  let allowed = true;
  let longestMatch = -1;
  for (const r of rules) {
    if (!r.path) continue;
    if (pathName.startsWith(r.path) && r.path.length > longestMatch) {
      allowed = r.type === 'allow';
      longestMatch = r.path.length;
    }
  }
  return allowed;
}

async function checkUrlAllowed(url, { userAgent = '*', mode = 'interactive' } = {}) {
  if (mode !== 'scrape') return { allowed: true, reason: 'interactive mode skips robots.txt' };
  try {
    const u = new URL(url);
    const robots = await fetchRobots(`${u.protocol}//${u.host}`);
    const ok = isAllowedByRobots(robots, u.pathname, userAgent);
    return { allowed: ok, reason: ok ? 'robots allows' : 'blocked by robots.txt' };
  } catch (err) {
    return { allowed: true, reason: `url parse failed: ${err.message}` };
  }
}

// Rate limit por dominio (en memoria).
const lastHit = new Map();
async function rateLimit(url, { minIntervalMs = 2000 } = {}) {
  try {
    const host = new URL(url).host;
    const last = lastHit.get(host) || 0;
    const wait = Math.max(0, last + minIntervalMs - Date.now());
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastHit.set(host, Date.now());
  } catch (_) { /* ignore */ }
}

// Audit log: una linea JSON por accion.
function logAction(entry) {
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(LOGS_DIR, `${date}.jsonl`);
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
  fs.appendFileSync(file, line);
}

module.exports = {
  isDestructive,
  isConfirmed,
  checkUrlAllowed,
  rateLimit,
  logAction,
  DESTRUCTIVE_KEYWORDS,
};
