import { chromium } from "playwright"
import { MongoClient } from "mongodb"

// Parámetros de conexión
const uri = "mongodb://localhost:27017"
const dbName = "webScraping"
const collectionName = "citacionesANT"

// Datos simulados
const cedula = "1102961867"

export const obtenerCitaciones = async (cedula) => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto("https://consultaweb.ant.gob.ec/PortalWEB/paginas/clientes/clp_criterio_consulta.jsp", {
        waitUntil: "domcontentloaded"
    })

    try {

        // Rellenamos el campo de cedula
        await page.type("#ps_identificacion", cedula)
        // Se le da click al botón de buscar
        await page.click('a[href="javascript:validar();"]')

        //Espera hasta que se ingresen la cedula y le de clik, ahí aparece el div con el id div_estado_cuenta
        await page.waitForSelector("#div_estado_cuenta", { timeout: 60000 })

        //Espera 1 segundo para que se cargue la tabla de citaciones pendientes
        await page.waitForTimeout(2000)

        //Recorro las filas de la tabla de citaciones pendientes y obtengo los datos   
        const citacionesPendientes = await page.$$eval("#list10 tbody", (tabla) => {
            const filas = Array.from(tabla[0].querySelectorAll("tr"))
            return filas.slice(1).map((fila) => {
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

        //Espera 1 segundo para que se cargue la tabla de citaciones pagadas
        await page.waitForTimeout(1000)

        //Recorro las filas de la tabla de citaciones pagadas y obtengo los datos
        const citacionesPagadas = await page.$$eval("#list10 tbody", (tabla) => {
            const filas = Array.from(tabla[0].querySelectorAll("tr"))
            return filas.slice(1).map((fila) => {
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

        console.log("Citaciones Pendientes:")
        console.log(citacionesPendientes)
        console.log("\nCitaciones Pagadas:")
        console.log(citacionesPagadas)

        // Verificar si se encontraron datos
        if (citacionesPendientes.length === 0 && citacionesPagadas.length === 0) {
            console.log(`ℹ️ No se encontraron citaciones para la cédula ${cedula}.`)
            return
        } else {
            // Conectar a MongoDB
            const client = new MongoClient(uri)
            await client.connect()
            const db = client.db(dbName)
            const collection = db.collection(collectionName)

            // Verificar si ya existen registros para esta cédula
            const doc = await collection.findOne({ cedula })

            if (!doc) {
                // Insertar nuevo documento
                await collection.insertOne({ 
                    cedula, 
                    fechaActualizacion: new Date(),
                    citacionesPendientes: citacionesPendientes,
                    citacionesPagadas: citacionesPagadas 
                })
                console.log(`✅ Se guardaron los datos de citaciones para la cédula ${cedula} en la base de datos.`)
                console.log(`   - Citaciones pendientes: ${citacionesPendientes.length} guardadas`)
                console.log(`   - Citaciones pagadas: ${citacionesPagadas.length} guardadas`)
            } else {
                let cambios = false

                // Verificar nuevas citaciones pendientes
                const pendientesExistentes = doc.citacionesPendientes || []
                const nuevasPendientes = citacionesPendientes.filter(nueva =>
                    !pendientesExistentes.some(existente => 
                        existente.id === nueva.id &&
                        existente.citacion === nueva.citacion &&
                        existente.placa === nueva.placa
                    )
                )

                // Verificar nuevas citaciones pagadas
                const pagadasExistentes = doc.citacionesPagadas || []
                const nuevasPagadas = citacionesPagadas.filter(nueva =>
                    !pagadasExistentes.some(existente => 
                        existente.id === nueva.id &&
                        existente.citacion === nueva.citacion &&
                        existente.placa === nueva.placa
                    )
                )

                // Actualizar citaciones pendientes si hay nuevas
                if (nuevasPendientes.length > 0) {
                    await collection.updateOne(
                        { cedula },
                        { 
                            $push: { citacionesPendientes: { $each: nuevasPendientes } },
                            $set: { fechaActualizacion: new Date() }
                        }
                    )
                    cambios = true
                    console.log(`✅ Se agregaron ${nuevasPendientes.length} nuevas citaciones pendientes para la cédula ${cedula}.`)
                }

                // Actualizar citaciones pagadas si hay nuevas
                if (nuevasPagadas.length > 0) {
                    await collection.updateOne(
                        { cedula },
                        { 
                            $push: { citacionesPagadas: { $each: nuevasPagadas } },
                            $set: { fechaActualizacion: new Date() }
                        }
                    )
                    cambios = true
                    console.log(`✅ Se agregaron ${nuevasPagadas.length} nuevas citaciones pagadas para la cédula ${cedula}.`)
                }

                if (!cambios) {
                    console.log(`⚠️ Ya existen todos los datos de citaciones guardados para la cédula ${cedula}.`)
                }
            }

            await client.close()
        }

    } catch (error) {
        console.error("\n❌ Error al procesar las citaciones: ", error)
    } finally {
        await browser.close()
    }
}

obtenerCitaciones(cedula)