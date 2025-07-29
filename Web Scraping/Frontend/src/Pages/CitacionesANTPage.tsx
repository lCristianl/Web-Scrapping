"use client"

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

interface Citacion {
  id: string
  infraccion: string
  entidad: string
  citacion: string
  placa: string
  fechaEmision: string
  fechaNotificacion: string
  puntos: string
  sancion: string
  multa: string
  remision: string
  totalPagar: string
  articulo: string
}

interface CitacionesData {
  citacionesPendientes: Citacion[]
  citacionesPagadas: Citacion[]
  totalCitaciones: number
  cedula: string
}

export function CitacionesANTPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [result, setResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [citacionesData, setCitacionesData] = useState<CitacionesData | null>(null)
  const [showTables, setShowTables] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setShowTables(false)
    setCitacionesData(null)

    try {
      const response = await fetch("http://localhost:3001/api/citaciones-ant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cedula: data.cedula }),
      })

      const resultado = await response.json()

      if (resultado.success) {
        const { citacionesPendientes, citacionesPagadas, totalCitaciones, cedula } = resultado.data

        if (totalCitaciones > 0) {
          setCitacionesData({
            citacionesPendientes,
            citacionesPagadas,
            totalCitaciones,
            cedula
          })
          setShowTables(true)
        } else {
          setResult("No se encontraron citaciones ANT para esta cédula.")
          setIsModalOpen(true)
        }
      } else {
        setResult(`Error: ${resultado.error || "Error desconocido"}`)
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error("Error al consultar citaciones ANT:", error)
      setResult("Error de conexión. Verifique que el servidor backend esté funcionando.")
      setIsModalOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const CitacionesCards = ({ citaciones, titulo, tipo }: { 
    citaciones: Citacion[], 
    titulo: string, 
    tipo: 'pendientes' | 'pagadas' 
  }) => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {tipo === 'pendientes' ? '📋' : '✅'} {titulo}
          <span className="text-sm font-normal text-muted-foreground">
            ({citaciones.length} {citaciones.length === 1 ? 'citación' : 'citaciones'})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {citaciones.map((citacion, index) => (
            <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header de la citación */}
                  <div className="flex justify-between items-start border-b pb-2">
                    <div>
                      <p className="font-semibold text-sm text-blue-600">#{citacion.citacion}</p>
                      <p className="text-xs text-gray-500">ID: {citacion.id}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tipo === 'pendientes' 
                          ? "bg-orange-100 text-orange-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {tipo === 'pendientes' ? 'Pendiente' : 'Pagada'}
                      </span>
                    </div>
                  </div>

                  {/* Información del vehículo */}
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-sm"><span className="font-medium">Placa:</span> {citacion.placa}</p>
                    <p className="text-sm"><span className="font-medium">Infracción:</span> {citacion.infraccion}</p>
                  </div>

                  {/* Fechas */}
                  <div className="grid grid-cols-1 gap-2">
                    <p className="text-xs"><span className="font-medium">Emisión:</span> {citacion.fechaEmision}</p>
                    <p className="text-xs"><span className="font-medium">Notificación:</span> {citacion.fechaNotificacion}</p>
                  </div>

                  {/* Entidad */}
                  <p className="text-xs"><span className="font-medium">Entidad:</span> {citacion.entidad}</p>

                  {/* Sanciones y costos */}
                  <div className="bg-red-50 p-2 rounded space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs font-medium">Puntos:</span>
                      <span className={`text-xs font-bold ${
                        parseInt(citacion.puntos) > 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {citacion.puntos}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs font-medium">Multa:</span>
                      <span className="text-xs font-bold text-green-600">{citacion.multa}</span>
                    </div>
                    {citacion.remision && (
                      <div className="flex justify-between">
                        <span className="text-xs font-medium">Remisión:</span>
                        <span className="text-xs font-bold text-blue-600">{citacion.remision}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-sm font-bold">Total a Pagar:</span>
                      <span className="text-sm font-bold text-red-600">{citacion.totalPagar}</span>
                    </div>
                  </div>

                  {/* Sanción y artículo */}
                  <div className="text-xs space-y-1">
                    <p><span className="font-medium">Sanción:</span> {citacion.sancion}</p>
                    <p><span className="font-medium">Artículo:</span> {citacion.articulo}</p>
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
            <h1 className="text-lg font-semibold">Citaciones ANT</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Consulta de Citaciones ANT</CardTitle>
              <CardDescription>
                Ingresa el número de cédula para verificar citaciones pendientes y pagadas de la Agencia Nacional de Tránsito.
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
                  {isLoading ? "Consultando..." : "Consultar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {showTables && citacionesData && (
            <div className="space-y-6">
              {/* Resumen */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Resumen de Consulta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{citacionesData.totalCitaciones}</div>
                      <div className="text-sm text-blue-600">Total Citaciones</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{citacionesData.citacionesPendientes.length}</div>
                      <div className="text-sm text-orange-600">Pendientes</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{citacionesData.citacionesPagadas.length}</div>
                      <div className="text-sm text-green-600">Pagadas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cards de Citaciones Pendientes */}
              {citacionesData.citacionesPendientes.length > 0 && (
                <CitacionesCards 
                  citaciones={citacionesData.citacionesPendientes}
                  titulo="Citaciones Pendientes"
                  tipo="pendientes"
                />
              )}

              {/* Cards de Citaciones Pagadas */}
              {citacionesData.citacionesPagadas.length > 0 && (
                <CitacionesCards 
                  citaciones={citacionesData.citacionesPagadas}
                  titulo="Citaciones Pagadas"
                  tipo="pagadas"
                />
              )}
            </div>
          )}
        </div>
      </div>

      <ResultModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Resultado de Consulta - Citaciones ANT"
        result={result}
      />
    </div>
  )
}
