import { useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ResultModal } from "@/components/result-modal"

type FormData = {
  cedula: string
}

interface Titulo {
  titulo: string
  institucion: string
  tipo: string
  fechaRegistro: string
  area: string
}

interface SenescytData {
  cedula: string
  titulos: Titulo[]
  totalTitulos: number
  fechaConsulta: string
  estado: string
}

export function SenescytPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [result, setResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [senescytData, setSenescytData] = useState<SenescytData | null>(null)
  const [showCards, setShowCards] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setShowCards(false)
    setSenescytData(null)

    try {
      const response = await fetch("http://localhost:3001/api/senescyt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cedula: data.cedula }),
      })

      const resultado = await response.json()

      if (resultado.success) {
        const { cedula, titulos, totalTitulos, fechaConsulta, estado } = resultado.data

        if (totalTitulos > 0) {
          setSenescytData({
            cedula,
            titulos,
            totalTitulos,
            fechaConsulta,
            estado
          })
          setShowCards(true)
        } else {
          setResult(`No se encontraron títulos académicos registrados para la cédula ${data.cedula} en Senescyt.`)
          setIsModalOpen(true)
        }
      } else {
        setResult(`Error: ${resultado.error || "Error desconocido"}`)
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error("Error al consultar Senescyt:", error)
      setResult("Error de conexión. Verifique que el servidor backend esté funcionando.")
      setIsModalOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const formatearFecha = (fecha: string): string => {
    try {
      return new Date(fecha).toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return fecha
    }
  }

  const obtenerColorTipo = (tipo: string): string => {
    switch (tipo.toLowerCase()) {
      case 'nacional':
        return 'bg-blue-100 text-blue-800'
      case 'internacional':
        return 'bg-green-100 text-green-800'
      case 'extranjero':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const obtenerIconoArea = (area: string): string => {
    if (area.toLowerCase().includes('ciencias sociales')) return '👥'
    if (area.toLowerCase().includes('ingenieria')) return '⚙️'
    if (area.toLowerCase().includes('salud')) return '🏥'
    if (area.toLowerCase().includes('educacion')) return '📚'
    if (area.toLowerCase().includes('arte')) return '🎨'
    if (area.toLowerCase().includes('derecho')) return '⚖️'
    return '🎓'
  }

  const TitulosCards = ({ titulos }: { titulos: Titulo[] }) => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎓 Títulos Académicos Registrados
          <span className="text-sm font-normal text-muted-foreground">
            ({titulos.length} {titulos.length === 1 ? 'título' : 'títulos'})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {titulos.map((titulo, index) => (
            <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header del título */}
                  <div className="border-b pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-blue-600 leading-tight">
                          {titulo.titulo}
                        </h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ml-2 ${obtenerColorTipo(titulo.tipo)}`}>
                        {titulo.tipo}
                      </span>
                    </div>
                  </div>

                  {/* Información de la institución */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm text-blue-800 mb-2 flex items-center gap-2">
                      🏛️ Institución Educativa
                    </h4>
                    <p className="text-sm text-blue-700 font-semibold">
                      {titulo.institucion}
                    </p>
                  </div>

                  {/* Área de conocimiento */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm text-green-800 mb-2 flex items-center gap-2">
                      {obtenerIconoArea(titulo.area)} Área de Conocimiento
                    </h4>
                    <p className="text-sm text-green-700 leading-relaxed">
                      {titulo.area}
                    </p>
                  </div>

                  {/* Información adicional */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Fecha de Registro:</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {formatearFecha(titulo.fechaRegistro)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Tipo de Título:</span>
                        <span className="text-sm font-semibold text-gray-800">{titulo.tipo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badge de validación */}
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✅</span>
                      <p className="text-sm text-green-800 font-medium">
                        Título Registrado y Validado
                      </p>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Este título ha sido registrado oficialmente en Senescyt.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <SidebarTrigger />
          <div className="ml-4">
            <h1 className="text-lg font-semibold">Senescyt</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Consulta Senescyt</CardTitle>
              <CardDescription>
                Verifica títulos académicos registrados en la Secretaría de Educación Superior, Ciencia, Tecnología e Innovación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cedula">Número de Cédula</Label>
                  <Input
                    id="cedula"
                    placeholder="Ej: 1234567890"
                    {...register("cedula", {
                      required: "La cédula es requerida",
                      pattern: {
                        value: /^\d{10}$/,
                        message: "La cédula debe tener 10 dígitos",
                      },
                    })}
                  />
                  {errors.cedula && <p className="text-sm text-destructive">{errors.cedula.message}</p>}
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 text-xl">ℹ️</span>
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-1">Información Importante</h4>
                      <p className="text-sm text-blue-700">
                        Esta consulta utiliza reconocimiento automático de captcha para obtener 
                        información directamente del portal oficial de Senescyt.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-600 text-xl">⏱️</span>
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-1">Tiempo de Procesamiento</h4>
                      <p className="text-sm text-yellow-700">
                        Esta consulta puede tomar varios segundos debido al procesamiento 
                        automático del captcha requerido por el sitio web.
                      </p>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Consultando... (Esto puede tomar unos segundos)" : "Consultar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {showCards && senescytData && (
            <div className="space-y-6">
              {/* Resumen */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Resumen de Consulta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{senescytData.totalTitulos}</div>
                      <div className="text-sm text-blue-600">Títulos Encontrados</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-sm font-bold text-green-600">{senescytData.cedula}</div>
                      <div className="text-sm text-green-600">Cédula Consultada</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm font-bold text-orange-600 capitalize">
                        {senescytData.estado.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-orange-600">Estado</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm font-bold text-purple-600">
                        {new Date(senescytData.fechaConsulta).toLocaleDateString('es-EC')}
                      </div>
                      <div className="text-sm text-purple-600">Fecha de Consulta</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cards de Títulos */}
              <TitulosCards titulos={senescytData.titulos} />

              {/* Información adicional */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📖 Información Adicional</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>
                      <strong>Senescyt:</strong> Secretaría de Educación Superior, Ciencia, Tecnología e Innovación 
                      del Ecuador, entidad responsable del registro oficial de títulos académicos.
                    </p>
                    <p>
                      <strong>Validez:</strong> Todos los títulos mostrados han sido oficialmente registrados 
                      y son válidos para efectos legales y laborales en Ecuador.
                    </p>
                    <p>
                      <strong>Tecnología:</strong> Esta consulta utiliza OCR (Reconocimiento Óptico de Caracteres) 
                      para resolver automáticamente el captcha del sitio oficial.
                    </p>
                    <p>
                      <strong>Fuente:</strong> Portal oficial de consulta de títulos de Senescyt - 
                      Información obtenida en tiempo real.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <ResultModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Resultado de Consulta - Senescyt"
        result={result}
      />
    </div>
  )
}
