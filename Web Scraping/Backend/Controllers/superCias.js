import { obtenerSuperciasEmpresas } from '../Scrapers/superCias.mjs'

export const consultarSuperciasEmpresas = async (req, res) => {
  const { ruc } = req.body // Puede ser cédula o RUC
  
  try {
    console.log(`🔍 Iniciando consulta Supercias para: ${ruc}`)
    
    const resultado = await obtenerSuperciasEmpresas(ruc)
    
    if (resultado.success) {
      console.log(`✅ Consulta Supercias exitosa para: ${ruc}`)
      return res.json({
        success: true,
        data: resultado.data,
        message: 'Consulta realizada exitosamente'
      })
    } else {
      console.log(`⚠️ No se encontraron datos Supercias para: ${ruc}`)
      return res.json({
        success: false,
        error: resultado.error || 'No se encontraron resultados',
        message: 'No se encontraron empresas para el documento consultado'
      })
    }
    
  } catch (error) {
    console.error(`❌ Error en consulta Supercias para ${ruc}:`, error.message)
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error interno del servidor al consultar Supercias'
    })
  }
}