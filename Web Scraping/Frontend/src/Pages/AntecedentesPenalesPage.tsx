"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ResultModal } from "@/components/result-modal"
import { Shield, AlertTriangle, CheckCircle, User, Calendar, FileText } from "lucide-react"

type FormData = {
  cedula: string
}

interface AntecedentesPenalesData {
  cedula: string
  nombre: string
  resultado: string
  tieneAntecedentes: boolean
  fechaConsulta: string
  estado: string
}

export function AntecedentesPenalesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [result, setResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [antecedentesPenalesData, setAntecedentesPenalesData] = useState<AntecedentesPenalesData | null>(null)
  const [showResult, setShowResult] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setShowResult(false)
    setAntecedentesPenalesData(null)

    try {
      const response = await fetch("http://localhost:3001/api/antecedentes-penales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cedula: data.cedula }),
      })

      const resultado = await response.json()

      if (resultado.success) {
        setAntecedentesPenalesData(resultado.data)
        setShowResult(true)
      } else {
        setResult(`Error: ${resultado.error || "Error desconocido"}`)
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error("Error al consultar antecedentes penales:", error)
      setResult("Error de conexión. Verifique que el servidor backend esté funcionando.")
      setIsModalOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const ResultCard = ({ data }: { data: AntecedentesPenalesData }) => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-blue-600" />
          Resultado de Antecedentes Penales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Estado del resultado */}
          <div className="flex items-center justify-center p-6 rounded-lg border-2 border-dashed">
            {data.tieneAntecedentes ? (
              <div className="text-center space-y-2">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
                <div className="text-xl font-bold text-red-600">TIENE ANTECEDENTES PENALES</div>
                <div className="text-sm text-red-500">Se encontraron registros en el sistema</div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <div className="text-xl font-bold text-green-600">NO TIENE ANTECEDENTES PENALES</div>
                <div className="text-sm text-green-500">No se encontraron registros en el sistema</div>
              </div>
            )}
          </div>

          {/* Información personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Nombre</div>
                  <div className="font-semibold">{data.nombre}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Cédula</div>
                  <div className="font-semibold">{data.cedula}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Fecha de Consulta</div>
                  <div className="font-semibold">
                    {new Date(data.fechaConsulta).toLocaleDateString('es-EC', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Estado de Consulta</div>
                  <div className="font-semibold capitalize">{data.estado}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Información importante:</strong> Este certificado es válido únicamente para el momento de su consulta. 
              Los antecedentes penales pueden cambiar en cualquier momento. Para trámites oficiales, 
              se recomienda obtener un certificado oficial del Ministerio del Interior.
            </div>
          </div>

          {/* Resultado detallado */}
          <div className={`p-4 rounded-lg border ${
            data.tieneAntecedentes 
              ? 'bg-red-50 border-red-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="text-sm font-medium text-gray-700 mb-2">Resultado de la consulta:</div>
            <div className={`font-bold ${
              data.tieneAntecedentes ? 'text-red-700' : 'text-green-700'
            }`}>
              {data.resultado}
            </div>
          </div>
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
            <h1 className="text-lg font-semibold">Antecedentes Penales</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Consulta de Antecedentes Penales
              </CardTitle>
              <CardDescription>
                Consulta los antecedentes penales de una persona mediante el número de cédula. 
                Esta información proviene del Ministerio del Interior del Ecuador.
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Consultando..." : "Consultar Antecedentes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {showResult && antecedentesPenalesData && (
            <ResultCard data={antecedentesPenalesData} />
          )}
        </div>
      </div>

      <ResultModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Error en Consulta - Antecedentes Penales"
        result={result}
      />
    </div>
  )
}