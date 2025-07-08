const { chromium } = require('playwright');

(async () => {
  // 1. Navegador visible para resolver CAPTCHA
  const browserVisible = await chromium.launch({ headless: false });
  const contextVisible = await browserVisible.newContext();
  const pageVisible = await contextVisible.newPage();

  await pageVisible.goto('https://certificados.ministeriodelinterior.gob.ec/gestorcertificados/antecedentes/', {
    waitUntil: 'domcontentloaded'
  });

  // Esperar botón del banner cookies (como señal de CAPTCHA resuelto)
  await pageVisible.waitForSelector('.cc-btn.cc-dismiss', { timeout: 0 });

  // Hacer clic en el botón de cookies antes de cerrar la ventana visible
  await pageVisible.click('.cc-btn.cc-dismiss');

  // Guardar estado y cerrar navegador visible
  const storage = await contextVisible.storageState();
  await browserVisible.close();

  // 2. Navegador headless para continuar
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: storage });
  const page = await context.newPage();

  await page.goto('https://certificados.ministeriodelinterior.gob.ec/gestorcertificados/antecedentes/', {
    waitUntil: 'domcontentloaded'
  });

  await page.waitForSelector('button.ui-button-text-only >> text=Aceptar', { timeout: 10000 });
await page.click('button.ui-button-text-only >> text=Aceptar');

// Esperar a que cargue el input para ingresar la cédula
await page.waitForSelector('#txtCi', { visible: false });

// Ingresar la cédula
await page.fill('#txtCi', '1102961867');

// Clic en "Siguiente"
await page.click('#btnSig1');

// Llenar el motivo de la consulta
await page.waitForSelector('#txtMotivo', { timeout: 30000 });
await page.fill('#txtMotivo', 'Consulta Personal');
await page.waitForSelector('#btnSig2', { timeout: 20000 });
await page.click('#btnSig2');

await page.waitForSelector('#dvAntecedent1', { timeout: 20000 });

const resultado = await page.textContent('#dvAntecedent1');

if (resultado.trim().toUpperCase() === 'NO') {
  console.log('No tiene antecedentes penales');
} else {
  console.log('Tiene antecedentes penales'); 
}

  await browser.close();
})();