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
  const { nombre, tipoBusqueda } = req.body
  
  if (!nombre) {
    return res.status(400).json({
      success: false,
      error: 'El nombre es requerido'
    })
  }
  
  if (!tipoBusqueda) {
    return res.status(400).json({
      success: false,
      error: 'El tipo de búsqueda es requerido'
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