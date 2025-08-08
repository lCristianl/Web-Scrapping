"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarTrigger } from "@/components/ui/sidebar"

type FormData = {
  ruc: string
}

type SuperciasResultado = {
  tipoPersona: string
  expediente: string
  nombre: string
  ruc: string
  capitalInvertido: string
  capitalTotal: string
  valorNominal: string
  situacionLegal: string
  posesionEfectiva: string
}

export function SuperCiasPage() {
  const [datos, setDatos] = useState<SuperciasResultado[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)
    setDatos(null)

    try {
      const response = await fetch("http://localhost:3001/api/supercias-empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruc: data.ruc }),
      })

      const resultado = await response.json()

      if (resultado.success) {
        setDatos(resultado.data)
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
            <h1 className="text-lg font-semibold">SUPERCIAS</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Consulta Superintendencia de Compañías</CardTitle>
              <CardDescription>
                Ingresa el RUC para verificar la información registrada en SUPERCIAS.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ruc">RUC</Label>
                  <Input
                    id="ruc"
                    placeholder="Ej: 1234567890001"
                    {...register("ruc", { required: "El RUC o Cédula son requeridos" })}
                  />
                  {errors.ruc && <p className="text-sm text-destructive">{errors.ruc.message}</p>}
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

              {/* Mostrar resultados */}
              {datos && (
                <div className="mt-6 overflow-auto">
                  <h2 className="text-lg font-semibold mb-2">Resultados</h2>
                  <table className="w-full table-auto border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2">Tipo Persona</th>
                        <th className="border p-2">Expediente</th>
                        <th className="border p-2">Nombre</th>
                        <th className="border p-2">RUC</th>
                        <th className="border p-2">Capital Invertido</th>
                        <th className="border p-2">Capital Total</th>
                        <th className="border p-2">Valor Nominal</th>
                        <th className="border p-2">Situación Legal</th>
                        <th className="border p-2">Posesión Efectiva</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos.map((fila, idx) => (
                        <tr key={idx}>
                          <td className="border p-2">{fila.tipoPersona}</td>
                          <td className="border p-2">{fila.expediente}</td>
                          <td className="border p-2">{fila.nombre}</td>
                          <td className="border p-2">{fila.ruc}</td>
                          <td className="border p-2">{fila.capitalInvertido}</td>
                          <td className="border p-2">{fila.capitalTotal}</td>
                          <td className="border p-2">{fila.valorNominal}</td>
                          <td className="border p-2">{fila.situacionLegal}</td>
                          <td className="border p-2">{fila.posesionEfectiva}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
