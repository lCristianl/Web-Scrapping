import { chromium } from "playwright"
import { MongoClient } from "mongodb"

// Parámetros de conexión
const uri = "mongodb://localhost:27017"
const dbName = "webScraping"
const collectionName = "impedimentosCargosPublicos"

export const obtenerImpedimentos = async () => { 
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

        console.log("\nRegistro Impedimentos:")
        console.log(resultados)

        if (resultados.length === 0) {
            console.log("ℹ️ No se encontraron impedimentos para cargos públicos.")
            return
        } else {
            // Conectar a MongoDB
            const client = new MongoClient(uri)
            await client.connect()
            const db = client.db(dbName)
            const collection = db.collection(collectionName)

            // Verificar si ya existen registros de impedimentos
            const doc = await collection.findOne({ tipo: "impedimentos_cargos_publicos" })

            if (!doc) {
                // Insertar nuevo documento
                await collection.insertOne({ 
                    tipo: "impedimentos_cargos_publicos",
                    fechaActualizacion: new Date(),
                    impedimentos: resultados 
                })
                console.log(`✅ Se guardaron ${resultados.length} impedimentos nuevos en la base de datos.`)
            } else {
                // Evitar duplicados
                const existentes = doc.impedimentos || []
                const nuevos = resultados.filter(n =>
                    !existentes.some(e => 
                        e.causalImpedimiento === n.causalImpedimiento && 
                        e.respaldos === n.respaldos
                    )
                )

                if (nuevos.length > 0) {
                    await collection.updateOne(
                        { tipo: "impedimentos_cargos_publicos" },
                        { 
                            $push: { impedimentos: { $each: nuevos } },
                            $set: { fechaActualizacion: new Date() }
                        }
                    )
                    console.log(`✅ Se agregaron ${nuevos.length} nuevos impedimentos a la base de datos.`)
                } else {
                    console.log("⚠️ Ya existen todos los datos de impedimentos en la base de datos.")
                }
            }

            await client.close()
        }

    } catch (error) {
        console.error("\n❌ Error: ", error)
    } finally {
        await browser.close()
    }
}

obtenerImpedimentos()