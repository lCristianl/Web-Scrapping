import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage()

await page.goto("https://consultaweb.ant.gob.ec/PortalWEB/paginas/clientes/clp_criterio_consulta.jsp", {
    waitUntil: "domcontentloaded"
})

/*
============================================================================

                            FALTA PROBAR

                            (PAGINA CAIDA)

============================================================================
*/ 

try {

    //Recorro las filas de la tabla de citaciones pendientes y obtengo los datos
    const citacionesPendientes = await page.$$eval("table#list10 tbody tr", (filas) => {
        return filas.slice(1, -2).map((fila) => {
        const columnas = fila.querySelectorAll("td")
            return {
                id: columnas[0]?.innerText.trim(),
                infraccion: columnas[2]?.innerText.trim(),
                entidad: columnas[3]?.innerText.trim(),
                citacion: columnas[4]?.innerText.trim(),
                placa: columnas[5]?.innerText.trim(),
                fechaEmision: columnas[7]?.innerText.trim(),
                fechaNotificacion: columnas[8]?.innerText.trim(),
                puntos: columnas[10]?.innerText.trim(),
                sancion: columnas[14]?.innerText.trim(),
                multa: columnas[15]?.innerText.trim(),
                remision: columnas[16]?.innerText.trim(),
                totalPagar: columnas[17]?.innerText.trim(),
                articulo: columnas[18]?.innerText.trim(),
            }
        })
    })

    //Le doy click al botón de "Pagadas" para cambiar la tabla
    await page.evaluate(() => {
        const divs = document.querySelectorAll("div")

        for (const div of divs) {
            const font = div.querySelector("font")
            const input = div.querySelector("input[type='radio']")

            // Verifica que el texto del <font> diga "Pagadas"
            if (font && input && font.innerText.trim().startsWith("Pagadas")) {
                input.click()
                break
            }
        }
    })

    //Recorro las filas de la tabla de citaciones pagadas y obtengo los datos
    const citacionesPagadas = await page.$$eval("table#list10 tbody tr", (filas) => {
        return filas.slice(1, -2).map((fila) => {
            const columnas = fila.querySelectorAll("td")
            return {
                id: columnas[0]?.innerText.trim(),
                infraccion: columnas[2]?.innerText.trim(),
                entidad: columnas[3]?.innerText.trim(),
                citacion: columnas[4]?.innerText.trim(),
                placa: columnas[5]?.innerText.trim(),
                fechaEmision: columnas[7]?.innerText.trim(),
                fechaNotificacion: columnas[8]?.innerText.trim(),
                puntos: columnas[10]?.innerText.trim(),
                sancion: columnas[14]?.innerText.trim(),
                multa: columnas[15]?.innerText.trim(),
                remision: columnas[16]?.innerText.trim(),
                totalPagar: columnas[17]?.innerText.trim(),
                articulo: columnas[18]?.innerText.trim(),
            }
        })
    })

    await page.waitForSelector("table", { timeout: 60000 })

    console.log("Citaciones Pendientes:")
    console.log(citacionesPendientes)
    console.log("\nCitaciones Pagadas:")
    console.log(citacionesPagadas)

} catch (error) {
    console.error("\n❌ No se encontraron resultados.")
}

await browser.close()