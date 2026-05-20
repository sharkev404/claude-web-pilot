#!/usr/bin/env node
// Uso:
//   node scripts/extract.js <url> --selector "h1" --mode text
//   node scripts/extract.js <url> --selector "a" --mode href
//   node scripts/extract.js <url> --selector ".card" --mode attr --attr data-id
//   node scripts/extract.js <url> --mode text     (sin selector => todo el body)

const { launch, close } = require('../lib/browser');
const { logAction, checkUrlAllowed, rateLimit } = require('../lib/guardrails');
const { run } = require('../lib/actions');

function parseArgs(argv) {
  const args = {
    url: null, selector: null, mode: 'text', attr: null,
    profile: 'default', headless: true, scrape: false,
  };
  const pos = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--selector') args.selector = argv[++i];
    else if (a === '--mode') args.mode = argv[++i];
    else if (a === '--attr') args.attr = argv[++i];
    else if (a.startsWith('--profile=')) args.profile = a.slice('--profile='.length);
    else if (a === '--head') args.headless = false;
    else if (a === '--scrape') args.scrape = true;
    else pos.push(a);
  }
  args.url = pos[0];
  return args;
}

(async () => {
  const args = parseArgs(process.argv);
  if (!args.url) {
    console.error('Uso: node scripts/extract.js <url> [--selector ...] [--mode text|html|href|attr] [--attr name] [--scrape]');
    process.exit(1);
  }

  if (args.scrape) {
    const check = await checkUrlAllowed(args.url, { mode: 'scrape', userAgent: 'web-pilot' });
    if (!check.allowed) {
      console.error(JSON.stringify({ ok: false, error: `Bloqueado por robots.txt: ${args.url}` }));
      process.exit(2);
    }
    await rateLimit(args.url);
  }

  const { context, page } = await launch({ profile: args.profile, headless: args.headless });
  try {
    await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const result = await run(page, {
      type: 'extract', selector: args.selector, mode: args.mode, attr: args.attr,
    });
    logAction({ script: 'extract', url: args.url, selector: args.selector, mode: args.mode, count: Array.isArray(result.data) ? result.data.length : 1 });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    logAction({ script: 'extract', url: args.url, error: err.message });
    console.error(JSON.stringify({ ok: false, error: err.message }));
    process.exitCode = 1;
  } finally {
    await close(context);
  }
})();
