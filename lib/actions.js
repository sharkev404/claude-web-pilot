// Implementacion de cada tipo de accion soportada por do.js.
// Cada funcion recibe (page, params) y regresa { ok, data?, error? }.

async function goto(page, { url, waitUntil = 'domcontentloaded', timeout = 30000 }) {
  await page.goto(url, { waitUntil, timeout });
  return { ok: true, data: { url: page.url(), title: await page.title() } };
}

async function click(page, { selector, timeout = 10000 }) {
  await page.click(selector, { timeout });
  return { ok: true };
}

async function fill(page, { selector, value, timeout = 10000 }) {
  await page.fill(selector, value, { timeout });
  return { ok: true };
}

async function press(page, { selector, key, timeout = 10000 }) {
  if (selector) {
    await page.locator(selector).press(key, { timeout });
  } else {
    await page.keyboard.press(key);
  }
  return { ok: true };
}

async function waitFor(page, { selector, state = 'visible', timeout = 15000 }) {
  await page.waitForSelector(selector, { state, timeout });
  return { ok: true };
}

async function extract(page, { selector, mode = 'text', attr = null, all = true }) {
  if (!selector) {
    // Sin selector = todo el body
    if (mode === 'text') return { ok: true, data: await page.evaluate(() => document.body.innerText) };
    if (mode === 'html') return { ok: true, data: await page.content() };
  }
  const locator = page.locator(selector);
  const count = await locator.count();
  const indices = all ? [...Array(count).keys()] : (count > 0 ? [0] : []);
  const out = [];
  for (const i of indices) {
    const el = locator.nth(i);
    if (mode === 'text') out.push((await el.innerText().catch(() => '')).trim());
    else if (mode === 'html') out.push(await el.innerHTML().catch(() => ''));
    else if (mode === 'href') out.push(await el.getAttribute('href').catch(() => null));
    else if (mode === 'attr') out.push(await el.getAttribute(attr).catch(() => null));
    else out.push((await el.innerText().catch(() => '')).trim());
  }
  return { ok: true, data: all ? out : out[0] };
}

async function screenshot(page, { path: outPath, fullPage = true }) {
  await page.screenshot({ path: outPath, fullPage });
  return { ok: true, data: { path: outPath } };
}

async function evaluate(page, { fn, args = [] }) {
  // fn llega como string. La parseamos a funcion.
  // eslint-disable-next-line no-new-func
  const wrapped = new Function(`return (${fn})`)();
  const result = await page.evaluate(wrapped, ...args);
  return { ok: true, data: result };
}

async function download(page, { selector, path: outPath, timeout = 30000 }) {
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout }),
    page.click(selector),
  ]);
  await dl.saveAs(outPath);
  return { ok: true, data: { path: outPath, suggested: dl.suggestedFilename() } };
}

async function scroll(page, { to = 'bottom', y = null }) {
  if (to === 'bottom') {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  } else if (to === 'top') {
    await page.evaluate(() => window.scrollTo(0, 0));
  } else if (y !== null) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
  }
  return { ok: true };
}

async function sleep(_page, { ms = 1000 }) {
  await new Promise(r => setTimeout(r, ms));
  return { ok: true };
}

const REGISTRY = {
  goto, click, fill, press, waitFor, extract, screenshot,
  evaluate, download, scroll, sleep,
};

async function run(page, action) {
  const fn = REGISTRY[action.type];
  if (!fn) return { ok: false, error: `Tipo de accion desconocido: ${action.type}` };
  try {
    return await fn(page, action);
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { run, REGISTRY };
