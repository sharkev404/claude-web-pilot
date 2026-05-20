#!/usr/bin/env node
// Uso:
//   node scripts/do.js '<json>'
//   node scripts/do.js --file plan.json
//
// El JSON tiene esta forma:
// {
//   "profile": "default",
//   "headless": false,
//   "mode": "interactive",   // o "scrape"
//   "actions": [ { "type": "goto", "url": "..." }, ... ]
// }

const fs = require('fs');
const { launch, close } = require('../lib/browser');
const { run } = require('../lib/actions');
const {
  isDestructive, isConfirmed, checkUrlAllowed, rateLimit, logAction,
} = require('../lib/guardrails');

function parseArgs(argv) {
  const args = { json: null, file: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') args.file = argv[++i];
    else if (a === '--confirm') { /* leido por isConfirmed via process.argv */ }
    else if (!args.json) args.json = a;
  }
  return args;
}

function loadPlan(args) {
  if (args.file) return JSON.parse(fs.readFileSync(args.file, 'utf8'));
  if (args.json) return JSON.parse(args.json);
  throw new Error('Falta el plan. Pasa JSON inline o --file plan.json');
}

(async () => {
  const args = parseArgs(process.argv);
  let plan;
  try {
    plan = loadPlan(args);
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err.message }));
    process.exit(1);
  }

  const profile = plan.profile || 'default';
  const headless = plan.headless ?? false;
  const mode = plan.mode || 'interactive';
  const actions = plan.actions || [];

  // Pre-check: si alguna accion es destructiva y no hay confirmacion, abortar.
  for (const action of actions) {
    if (isDestructive(action) && !isConfirmed()) {
      const msg = `Accion destructiva detectada: ${JSON.stringify(action)}. Re-corre con --confirm o WEB_PILOT_CONFIRM=1 si estas seguro.`;
      console.error(JSON.stringify({ ok: false, error: msg }));
      process.exit(3);
    }
  }

  const { context, page } = await launch({ profile, headless });
  const results = [];
  const sessionId = `${Date.now()}`;
  logAction({ script: 'do', event: 'session_start', sessionId, profile, mode, actionCount: actions.length });

  try {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];

      // robots.txt en modo scrape para gotos
      if (mode === 'scrape' && action.type === 'goto' && action.url) {
        const check = await checkUrlAllowed(action.url, { mode: 'scrape', userAgent: 'web-pilot' });
        if (!check.allowed) {
          const r = { ok: false, error: `Bloqueado por robots.txt: ${action.url}` };
          results.push(r);
          logAction({ script: 'do', sessionId, step: i, action, result: r });
          break;
        }
        await rateLimit(action.url);
      }

      const r = await run(page, action);
      results.push(r);
      logAction({ script: 'do', sessionId, step: i, action, ok: r.ok, error: r.error });

      if (!r.ok && action.stopOnError !== false) {
        break;
      }
    }
    console.log(JSON.stringify({ ok: results.every(r => r.ok), results }, null, 2));
  } catch (err) {
    logAction({ script: 'do', sessionId, event: 'crash', error: err.message });
    console.error(JSON.stringify({ ok: false, error: err.message, results }));
    process.exitCode = 1;
  } finally {
    logAction({ script: 'do', sessionId, event: 'session_end' });
    await close(context);
  }
})();
