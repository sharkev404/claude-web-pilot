#!/usr/bin/env node
// Uso:  node scripts/navigate.js <url> [--profile=default] [--headless]
//
// Navega a la URL y reporta titulo, URL final y un snippet del body.

const { launch, close } = require('../lib/browser');
const { logAction } = require('../lib/guardrails');

function parseArgs(argv) {
  const args = { url: null, profile: 'default', headless: false };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--profile=')) args.profile = a.slice('--profile='.length);
    else if (a === '--headless') args.headless = true;
    else if (!args.url) args.url = a;
  }
  return args;
}

(async () => {
  const args = parseArgs(process.argv);
  if (!args.url) {
    console.error('Uso: node scripts/navigate.js <url> [--profile=default] [--headless]');
    process.exit(1);
  }

  const { context, page } = await launch({ profile: args.profile, headless: args.headless });
  try {
    await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const title = await page.title();
    const finalUrl = page.url();
    const snippet = (await page.evaluate(() => document.body.innerText)).slice(0, 1500);

    logAction({ script: 'navigate', url: args.url, finalUrl, title });

    console.log(JSON.stringify({ ok: true, title, url: finalUrl, snippet }, null, 2));
  } catch (err) {
    logAction({ script: 'navigate', url: args.url, error: err.message });
    console.error(JSON.stringify({ ok: false, error: err.message }));
    process.exitCode = 1;
  } finally {
    await close(context);
  }
})();
