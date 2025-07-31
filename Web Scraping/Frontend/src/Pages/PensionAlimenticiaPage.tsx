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

interface Interviniente {
  representanteLegal: string
  obligadoPrincipal: string
}

interface Pension {
  codigo: string
  numProcesoJudicial: string
  dependenciaJurisdiccional: string
  tipoPension: string
  intervinientes: Interviniente
}

interface PensionAlimenticiaData {
  cedula: string
  pensiones: Pension[]
  totalPensiones: number
  fechaConsulta: string
  estado: string
}

export function PensionAlimenticiaPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [result, setResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [pensionData, setPensionData] = useState<PensionAlimenticiaData | null>(null)
  const [showCards, setShowCards] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setShowCards(false)
    setPensionData(null)

    try {
      const response = await fetch("http://localhost:3001/api/pension-alimenticia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cedula: data.cedula }),
      })

      const resultado = await response.json()

      if (resultado.success) {
        const { cedula, pensiones, totalPensiones, fechaConsulta, estado } = resultado.data

        if (totalPensiones > 0) {
          setPensionData({
            cedula,
            pensiones,
            totalPensiones,
            fechaConsulta,
            estado
          })
          setShowCards(true)
        } else {
          setResult(`No se encontraron pensiones alimenticias registradas para la cédula ${data.cedula}.`)
          setIsModalOpen(true)
        }
      } else {
        setResult(`Error: ${resultado.error || "Error desconocido"}`)
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error("Error al consultar pensiones alimenticias:", error)
      setResult("Error de conexión. Verifique que el servidor backend esté funcionando.")
      setIsModalOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const PensionesCards = ({ pensiones }: { pensiones: Pension[] }) => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          👨‍👩‍👧‍👦 Pensiones Alimenticias Registradas
          <span className="text-sm font-normal text-muted-foreground">
            ({pensiones.length} {pensiones.length === 1 ? 'pensión' : 'pensiones'})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pensiones.map((pension, index) => (
            <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header de la pensión */}
                  <div className="border-b pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-blue-600">
                          Código: {pension.codigo}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Proceso: {pension.numProcesoJudicial}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {pension.tipoPension}
                      </span>
                    </div>
                  </div>

                  {/* Información de la dependencia judicial */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm text-blue-800 mb-2">🏛️ Dependencia Jurisdiccional</h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      {pension.dependenciaJurisdiccional}
                    </p>
                  </div>

                  {/* Intervinientes */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm text-orange-800 mb-3">👥 Partes Intervinientes</h4>
                    <div className="space-y-3">
                      {pension.intervinientes.representanteLegal && (
                        <div className="bg-white p-3 rounded border border-orange-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-orange-600">👩‍💼</span>
                            <span className="font-medium text-sm text-orange-800">Representante Legal</span>
                          </div>
                          <p className="text-sm text-orange-700 font-semibold">
                            {pension.intervinientes.representanteLegal}
                          </p>
                        </div>
                      )}
                      
                      {pension.intervinientes.obligadoPrincipal && (
                        <div className="bg-white p-3 rounded border border-orange-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-orange-600">👨‍💼</span>
                            <span className="font-medium text-sm text-orange-800">Obligado Principal</span>
                          </div>
                          <p className="text-sm text-orange-700 font-semibold">
                            {pension.intervinientes.obligadoPrincipal}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-medium text-gray-600">Código:</span>
                        <p className="font-mono text-gray-800">{pension.codigo}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Tipo:</span>
                        <p className="font-semibold text-gray-800">{pension.tipoPension}</p>
                      </div>
                    </div>
                  </div>

                  {/* Alerta importante */}
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-600">⚠️</span>
                      <p className="text-sm text-yellow-800 font-medium">
                        Obligación Alimentaria Vigente
                      </p>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">
                      Esta pensión alimenticia se encuentra registrada en el sistema judicial.
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
            <h1 className="text-lg font-semibold">Pensión Alimenticia</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Consulta de Pensión Alimenticia</CardTitle>
              <CardDescription>
                Verifica información sobre pensiones alimenticias registradas en el sistema judicial ecuatoriano.
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
                        Esta consulta busca pensiones alimenticias donde la cédula ingresada aparezca 
                        como parte interviniente (representante legal u obligado principal).
                      </p>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Consultando..." : "Consultar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {showCards && pensionData && (
            <div className="space-y-6">
              {/* Resumen */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Resumen de Consulta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{pensionData.totalPensiones}</div>
                      <div className="text-sm text-blue-600">Pensiones Encontradas</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-sm font-bold text-green-600">{pensionData.cedula}</div>
                      <div className="text-sm text-green-600">Cédula Consultada</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm font-bold text-orange-600 capitalize">
                        {pensionData.estado.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-orange-600">Estado de Consulta</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cards de Pensiones */}
              <PensionesCards pensiones={pensionData.pensiones} />

              {/* Información legal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📖 Información Legal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>
                      <strong>Marco Legal:</strong> Las pensiones alimenticias están reguladas por el Código de la Niñez y Adolescencia 
                      y el Código Orgánico General de Procesos (COGEP).
                    </p>
                    <p>
                      <strong>Obligación:</strong> La pensión alimenticia es un derecho personalísimo, intransferible, 
                      inembargable e imprescriptible.
                    </p>
                    <p>
                      <strong>Fuente:</strong> Sistema Único de Pensiones Alimenticias (SUPA) - Función Judicial del Ecuador.
                    </p>
                    <p>
                      <strong>Nota:</strong> Esta información tiene carácter referencial. Para procesos legales, 
                      consulte directamente con la dependencia judicial correspondiente.
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
        title="Resultado de Consulta - Pensión Alimenticia"
        result={result}
      />
    </div>
  )
}
