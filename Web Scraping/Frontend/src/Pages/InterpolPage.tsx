"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarTrigger } from "@/components/ui/sidebar"

type FormData = {
  nombre: string
  apellido: string
}

type InterpolResultado = {
  nombre: string
  edad: string | null
  nacionalidad: string | null
  fuente: string
}

export function InterpolPage() {
  const [datos, setDatos] = useState<InterpolResultado[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Estados adicionales para la información extra
  const [personaConsultada, setPersonaConsultada] = useState<string>("")
  const [esHomonimo, setEsHomonimo] = useState<boolean>(false)
  const [cantidadResultados, setCantidadResultados] = useState<number>(0)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)
    setDatos(null)
    // Limpiar estados adicionales
    setPersonaConsultada("")
    setEsHomonimo(false)
    setCantidadResultados(0)

    try {
      const response = await fetch("http://localhost:3001/api/interpol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: data.nombre, apellido: data.apellido }),
      })

      const resultado = await response.json()

      if (resultado.success) {
        // Tu lógica original - setear los avisos para la tabla
        setDatos(resultado.data.avisos || resultado.data)
        
        // Información adicional para mostrar antes de la tabla
        setPersonaConsultada(resultado.data.clave || `${data.nombre} ${data.apellido}`.trim())
        setEsHomonimo(resultado.data.homonimo || false)
        setCantidadResultados(resultado.data.cantidadResultados || 0)
      } else {
        setError(resultado.error || "No se encontraron resultados.")
      }
    } catch (err) {
      console.error(err)
      setError("Error de conexión con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center px-4">
          <SidebarTrigger />
          <div className="ml-4">
            <h1 className="text-lg font-semibold">INTERPOL</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Consulta Interpol</CardTitle>
              <CardDescription>
                Ingresa un nombre y apellido para buscar notificaciones rojas de Interpol.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      placeholder="Ej: Juan"
                      {...register("nombre", { required: "El nombre es requerido" })}
                    />
                    {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      placeholder="Ej: Pérez"
                      {...register("apellido")}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Consultando..." : "Consultar"}
                </Button>
              </form>

              {/* Mostrar errores */}
              {error && (
                <div className="mt-4 text-red-600 font-semibold">
                  {error}
                </div>
              )}

              {/* INFORMACIÓN ADICIONAL - Solo se muestra si hay datos */}
              {datos !== null && personaConsultada && (
                <div className="mt-6 mb-4">
                  <Card className={`border-2 ${esHomonimo ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xl font-bold text-blue-700">{personaConsultada}</p>
                          <p className="text-sm text-gray-600">Persona consultada</p>
                        </div>
                        <div>
                          <p className={`text-xl font-bold ${esHomonimo ? 'text-red-600' : 'text-green-600'}`}>
                            {esHomonimo ? 'SÍ ES HOMÓNIMO' : 'NO ES HOMÓNIMO'}
                          </p>
                          <p className="text-sm text-gray-600">Estado</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-orange-600">{cantidadResultados}</p>
                          <p className="text-sm text-gray-600">Resultados encontrados</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TU TABLA ORIGINAL - EXACTAMENTE IGUAL */}
              {datos && datos.length > 0 && (
                <div className="mt-6 overflow-auto">
                  <h2 className="text-lg font-semibold mb-2">Resultados</h2>
                  <table className="w-full table-auto border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2">Nombre</th>
                        <th className="border p-2">Edad</th>
                        <th className="border p-2">Nacionalidad</th>
                        <th className="border p-2">Fuente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos.map((fila, idx) => (
                        <tr key={idx}>
                          <td className="border p-2">{fila.nombre}</td>
                          <td className="border p-2">{fila.edad || "N/A"}</td>
                          <td className="border p-2">{fila.nacionalidad || "N/A"}</td>
                          <td className="border p-2">{fila.fuente}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {datos && datos.length === 0 && (
                <div className="mt-4 text-gray-600 font-semibold">
                  No se encontraron resultados.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}