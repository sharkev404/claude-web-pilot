// Browser launcher con sesion persistente.
// Cada "profile" mantiene cookies/localStorage/historial entre sesiones.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PROFILES_DIR = path.join(__dirname, '..', 'profiles');

async function launch({
  profile = 'default',
  headless = false,
  slowMo = 30,
  viewport = { width: 1280, height: 800 },
  userAgent = null,
} = {}) {
  const userDataDir = path.join(PROFILES_DIR, profile);
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const launchOpts = {
    headless,
    slowMo,
    viewport,
    args: ['--disable-blink-features=AutomationControlled'],
    ignoreDefaultArgs: ['--enable-automation'],
  };
  if (userAgent) launchOpts.userAgent = userAgent;

  const context = await chromium.launchPersistentContext(userDataDir, launchOpts);

  const page = context.pages()[0] || await context.newPage();
  return { context, page };
}

async function close(context) {
  if (!context) return;
  try { await context.close(); } catch (_) { /* ignore */ }
}

module.exports = { launch, close, PROFILES_DIR };
