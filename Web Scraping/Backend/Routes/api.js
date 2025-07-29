import express from 'express'
import { validateCedula, validateRuc, validateSearchParams } from '../Middleware/validation.js'

// Importar controllers
//import { consultarCertificadoIESS } from '../Controllers/certificadosIESSController.js'
import { consultarCitacionesANT } from '../Controllers/citacionesANT.js'
import { consultarCitacionesJudiciales } from '../Controllers/citacionJudicial.js'
import { consultarConsejoJudicatura } from '../Controllers/consejoJudicatura.js'
import { consultarSRI } from '../Controllers/consultaSRI.js'
import { consultarImpedimentos } from '../Controllers/impedimentosCargosPublicos.js'
import { consultarPensionAlimenticia } from '../Controllers/pensionAlimenticia.js'
import { consultarProcesosJudiciales } from '../Controllers/procesosJudiciales.js'
import { consultarSenescyt } from '../Controllers/senescyt.js'

const router = express.Router()

// Rutas con validación y controllers
//router.post('/certificados-iess', validateCedula, consultarCertificadoIESS)
router.post('/citaciones-ant', validateCedula, consultarCitacionesANT)
router.post('/citaciones-judiciales', validateCedula, consultarCitacionesJudiciales)
router.post('/consejo-judicatura', validateSearchParams, consultarConsejoJudicatura)
router.post('/consulta-sri', validateRuc, consultarSRI)
router.post('/impedimentos-cargos-publicos', consultarImpedimentos) // No requiere validación
router.post('/pension-alimenticia', validateCedula, consultarPensionAlimenticia)
router.post('/procesos-judiciales', validateCedula, consultarProcesosJudiciales)
router.post('/senescyt', validateCedula, consultarSenescyt)

// Ruta de estado de la API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API de Web Scraping funcionando correctamente',
    timestamp: new Date().toISOString()
  })
})

// Ruta para obtener todas las colecciones disponibles
router.get('/collections', (req, res) => {
  res.json({
    success: true,
    collections: [
      //'certificados-iess',
      'citaciones-ant',
      'citaciones-judiciales',
      'consejo-judicatura',
      'consulta-sri',
      'impedimentos-cargos-publicos',
      'pension-alimenticia',
      'procesos-judiciales',
      'senescyt'
    ]
  })
})

export default router