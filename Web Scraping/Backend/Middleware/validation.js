export const validateCedula = (req, res, next) => {
  const { cedula } = req.body
  
  if (!cedula) {
    return res.status(400).json({
      success: false,
      error: 'La cédula es requerida'
    })
  }
  
  // Validar formato de cédula ecuatoriana (10 dígitos)
  const cedulaRegex = /^\d{10}$/
  if (!cedulaRegex.test(cedula)) {
    return res.status(400).json({
      success: false,
      error: 'La cédula debe tener exactamente 10 dígitos'
    })
  }
  
  // Validación del dígito verificador de cédula ecuatoriana
  const digits = cedula.split('').map(Number)
  const province = parseInt(cedula.substring(0, 2))
  
  if (province < 1 || province > 24) {
    return res.status(400).json({
      success: false,
      error: 'Código de provincia inválido en la cédula'
    })
  }
  
  next()
}

export const validateRuc = (req, res, next) => {
  const { ruc } = req.body
  
  if (!ruc) {
    return res.status(400).json({
      success: false,
      error: 'El RUC es requerido'
    })
  }
  
  // Validar formato de RUC (13 dígitos)
  const rucRegex = /^\d{13}$/
  if (!rucRegex.test(ruc)) {
    return res.status(400).json({
      success: false,
      error: 'El RUC debe tener exactamente 13 dígitos'
    })
  }
  
  next()
}

export const validateSearchParams = (req, res, next) => {
  const { nombre} = req.body
  
  if (!nombre) {
    return res.status(400).json({
      success: false,
      error: 'El nombre es requerido'
    })
  }
  
  const tiposValidos = ['PROVINCIAS', 'INSTITUCIONES']
  if (!tiposValidos.includes(tipoBusqueda.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: 'Tipo de búsqueda inválido. Use: PROVINCIAS o INSTITUCIONES'
    })
  }
  
  next()
}

export const validateCertificadoIESS = (req, res, next) => {
  const { cedula, fechaNacimiento } = req.body
  
  // Validar cédula
  if (!cedula) {
    return res.status(400).json({
      success: false,
      error: 'La cédula es requerida'
    })
  }
  
  const cedulaRegex = /^\d{10}$/
  if (!cedulaRegex.test(cedula)) {
    return res.status(400).json({
      success: false,
      error: 'La cédula debe tener exactamente 10 dígitos'
    })
  }
  
  // Validar fecha de nacimiento
  if (!fechaNacimiento) {
    return res.status(400).json({
      success: false,
      error: 'La fecha de nacimiento es requerida'
    })
  }
  
  const fechaRegex = /^\d{8}$/
  if (!fechaRegex.test(fechaNacimiento)) {
    return res.status(400).json({
      success: false,
      error: 'La fecha de nacimiento debe tener el formato YYYYMMDD (8 dígitos)'
    })
  }
  
  // Validar que la fecha sea válida
  const año = parseInt(fechaNacimiento.substring(0, 4))
  const mes = parseInt(fechaNacimiento.substring(4, 6))
  const dia = parseInt(fechaNacimiento.substring(6, 8))
  
  const fechaActual = new Date()
  const añoActual = fechaActual.getFullYear()
  
  if (año < 1900 || año > añoActual) {
    return res.status(400).json({
      success: false,
      error: 'El año debe estar entre 1900 y el año actual'
    })
  }
  
  if (mes < 1 || mes > 12) {
    return res.status(400).json({
      success: false,
      error: 'El mes debe estar entre 01 y 12'
    })
  }
  
  if (dia < 1 || dia > 31) {
    return res.status(400).json({
      success: false,
      error: 'El día debe estar entre 01 y 31'
    })
  }
  
  // Validar que la fecha no sea futura
  const fechaNac = new Date(año, mes - 1, dia)
  if (fechaNac > fechaActual) {
    return res.status(400).json({
      success: false,
      error: 'La fecha de nacimiento no puede ser futura'
    })
  }
  
  // Validar edad mínima (18 años)
  const edad = añoActual - año
  if (edad < 18) {
    return res.status(400).json({
      success: false,
      error: 'La persona debe ser mayor de 18 años'
    })
  }
  
  next()
}