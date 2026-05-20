#!/usr/bin/env node
// Uso:  node scripts/screenshot.js <url> <outPath> [--profile=default] [--headless] [--no-full]

const path = require('path');
const { launch, close } = require('../lib/browser');
const { logAction } = require('../lib/guardrails');

function parseArgs(argv) {
  const args = { url: null, out: null, profile: 'default', headless: true, fullPage: true };
  const pos = [];
  for (const a of argv.slice(2)) {
    if (a.startsWith('--profile=')) args.profile = a.slice('--profile='.length);
    else if (a === '--headless') args.headless = true;
    else if (a === '--head') args.headless = false;
    else if (a === '--no-full') args.fullPage = false;
    else pos.push(a);
  }
  args.url = pos[0];
  args.out = pos[1] || path.join(process.cwd(), `screenshot-${Date.now()}.png`);
  return args;
}

(async () => {
  const args = parseArgs(process.argv);
  if (!args.url) {
    console.error('Uso: node scripts/screenshot.js <url> <outPath> [--profile=default] [--head] [--no-full]');
    process.exit(1);
  }

  const { context, page } = await launch({ profile: args.profile, headless: args.headless });
  try {
    await page.goto(args.url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.screenshot({ path: args.out, fullPage: args.fullPage });
    logAction({ script: 'screenshot', url: args.url, out: args.out });
    console.log(JSON.stringify({ ok: true, path: args.out, url: page.url() }));
  } catch (err) {
    logAction({ script: 'screenshot', url: args.url, error: err.message });
    console.error(JSON.stringify({ ok: false, error: err.message }));
    process.exitCode = 1;
  } finally {
    await close(context);
  }
})();
