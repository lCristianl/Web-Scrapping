import { obtenerDatosCertificadoIESS } from '../Scrapers/certificadosIESS.mjs' // Ya no está comentado
import { DatabaseOperations, Collections } from '../Models/database.js'

export const consultarCertificadoIESS = async (req, res) => {
  try {
    const { cedula, fechaNacimiento } = req.body
    
    console.log(`🔍 Iniciando consulta certificado IESS para cédula: ${cedula}`)
    
    // Verificar si hay datos recientes en BD (últimas 24 horas)
    const datosExistentes = await DatabaseOperations.findByCedula(Collections.CERTIFICADOS_IESS, cedula)
    
    const esReciente = datosExistentes && 
      datosExistentes.fechaConsulta && 
      (new Date() - new Date(datosExistentes.fechaConsulta)) < (24 * 60 * 60 * 1000) &&
      datosExistentes.fechaNacimiento === fechaNacimiento

    let resultado

    if (esReciente && datosExistentes.estado === 'exitoso') {
      console.log(`📋 Usando datos existentes de la base de datos`)
      resultado = datosExistentes
    } else {
      console.log(`🌐 Realizando nueva consulta...`)
      try {
        // Intentar usar el scraper real
        resultado = await obtenerDatosCertificadoIESS(cedula, fechaNacimiento)
      } catch (scraperError) {
        console.warn('⚠️ Error en scraper principal, usando función temporal:', scraperError.message)
        // Función de respaldo si falla el scraper
        resultado = await obtenerDatosCertificadoIESSTemp(cedula, fechaNacimiento)
      }
    }
    
    // Validar resultado
    if (!resultado) {
      throw new Error('No se pudo obtener información del certificado')
    }

    res.json({
      success: true,
      data: resultado,
      message: resultado.error 
        ? `Error: ${resultado.error}` 
        : resultado.mensaje || 'Consulta completada exitosamente',
      esConsultaReciente: esReciente
    })
    
  } catch (error) {
    console.error('❌ Error en consultarCertificadoIESS:', error)
    
    // Intentar devolver datos de respaldo
    try {
      const datosRespaldo = await DatabaseOperations.findByCedula(Collections.CERTIFICADOS_IESS, req.body.cedula)
      if (datosRespaldo) {
        return res.json({
          success: true,
          data: datosRespaldo,
          message: 'Datos obtenidos de base de datos (consulta web falló)',
          warning: 'Los datos pueden no estar actualizados'
        })
      }
    } catch (dbError) {
      console.error('❌ Error obteniendo datos de respaldo:', dbError)
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    })
  }
}

// Función temporal de respaldo
async function obtenerDatosCertificadoIESSTemp(cedula, fechaNacimiento) {
  return {
    cedula,
    fechaNacimiento,
    nombre: "Usuario",
    registradoComoEmpleador: false,
    estadoActividad: null,
    mensaje: "Consulta realizada con función de respaldo",
    fechaConsulta: new Date(),
    estado: 'respaldo'
  }
}