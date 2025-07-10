import { chromium } from "playwright"

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

await page.goto("https://www.funcionjudicial.gob.ec/autoridades/", {
    waitUntil: "domcontentloaded"
})

try {

    /*
=============================================================================    
    

    FALTA AREGLAR LA EXTRACCION DE DATOS
    

=============================================================================
    */
    const resultados = await page.$$eval(".elementor-widget-container", (element) => {
        return element.map((el) => {
            return {
                nombre: el.querySelector(".elementor-heading-title")?.innerText.trim() || "",
                autoridad: el.querySelector(".elementor-heading-title")?.innerText.trim() || "",
            }
        })
    })    

  console.log("\nConsejo de la Judicatura:")
  console.log(resultados)

} catch (error) {
    console.error("\n❌ No se encontraron resultados.")
}

await browser.close()