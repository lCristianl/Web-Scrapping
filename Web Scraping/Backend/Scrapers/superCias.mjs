import { chromium } from 'playwright';
import { MongoClient } from 'mongodb';

const mongoUri = 'mongodb://localhost:27017';
const dbName = 'webScraping';
const collectionName = 'supercias-empresas';

function esPersonaNatural(ruc) {
  if (!ruc || typeof ruc !== 'string') return false;
  if (ruc.length === 10) return true;
  if (ruc.length === 13 && /^[0-9]{10}001$/.test(ruc)) {
    const tercerDigito = parseInt(ruc[2]);
    return tercerDigito >= 0 && tercerDigito <= 5;
  }
  return false;
}

export async function obtenerSuperciasEmpresas() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page= await context.newPage();

  await page.goto('https://appscvs1.supercias.gob.ec/consultaPersona/consulta_cia_param.zul', {
    waitUntil: 'domcontentloaded'
  });

  await page.keyboard.press('Enter');
  await page.waitForSelector('input.z-combobox-inp', { timeout: 0 });
  const input = await page.$('input.z-combobox-inp');
  await input.fill('1102961867', { delay: 100 });
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  await page.keyboard.press('Enter');
  await page.evaluate(() => {
      const combobox = document.querySelector('.z-combobox-inp');
      combobox.blur();
      combobox.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await page.click('button.z-button');
  await page.waitForSelector('tr.z-listitem', { timeout: 0 });

  const rows = await page.$$('tr.z-listitem');

  const datosExtraidos = [];

  for (const row of rows) {
    const cells = await row.$$('td.z-listcell');

    const expediente = await cells[0].innerText();
    const nombre = await cells[1].innerText();
    const ruc = await cells[2].innerText();
    const capitalInvertido = await cells[3].innerText();
    const capitalTotal = await cells[4].innerText();
    const valorNominal = await cells[5].innerText();
    const situacionLegal = await cells[6].innerText();
    const posesionEfectiva = await cells[7].innerText();
    const tipoPersona = esPersonaNatural(ruc) ? 'Persona NATURAL' : 'Persona JURÍDICA';

    const registro = {
      tipoPersona,
      expediente,
      nombre,
      ruc,
      capitalInvertido,
      capitalTotal,
      valorNominal,
      situacionLegal,
      posesionEfectiva,
      fechaConsulta: new Date()
    };

    datosExtraidos.push(registro);
  }

  if (datosExtraidos.length > 0) {
    await collection.insertMany(datosExtraidos);
  }

  await browser.close();
  await client.close();

  return datosExtraidos; 
}
