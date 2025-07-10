import { chromium } from "playwright"

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

await page.goto("https://www.gob.ec/mt/tramites/registro-impedimentos-laborar-sector-publico", {
    waitUntil: "domcontentloaded"
})

try {

    //obtengo los datos de la tabla saltandome el primer tr ya que ese es del tutulo de la tabla
    const resultados = await page.$$eval("tbody", (tbodies) => {
        const tbody = tbodies[0] // primer tbody sin clase ni id
        const filas = Array.from(tbody.querySelectorAll("tr")).slice(1)
        return filas.map(fila => {
            const tds = fila.querySelectorAll("td")
            return {
            causalImpedimiento: tds[0]?.innerText.trim() || "",
            respaldos: tds[1]?.innerText.trim() || "",
            }
        })
    })

  console.log("\nRegistro Impedimientos:")
  console.log(resultados)

} catch (error) {
    console.error("\n❌ No se encontraron resultados.")
}

await browser.close()