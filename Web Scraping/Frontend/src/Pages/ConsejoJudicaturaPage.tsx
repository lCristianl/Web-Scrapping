import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ResultModal } from "@/components/result-modal"

type FormData = {
  nombre: string
  tipoBusqueda: "PROVINCIAS" | "INSTITUCIONES"
  institucion?: string
  provincia?: string
  canton?: string
}

interface Funcionario {
  funcionario: string
  cargo: string
  departamento: string
  edificio: string
  direccion: string
  ciudad: string
  telefono: string
  email: string
}

interface ConsejoJudicaturaData {
  funcionarios: Funcionario[]
  totalFuncionarios: number
  nombre: string
  tipoBusqueda: string
}

const instituciones = ["CONSEJO DE LA JUDICATURA", "CORTE NACIONAL DE JUSTICIA"]

const provincias = [
  "Esmeraldas",
  "Manabí", 
  "Guayas",
  "Los Ríos",
  "Santa Elena",
  "El Oro",
  "Santo Domingo de los Tsáchilas",
  "Carchi",
  "Imbabura",
  "Pichincha",
  "Cotopaxi",
  "Tungurahua",
  "Chimborazo",
  "Bolívar",
  "Cañar",
  "Azuay",
  "Loja",
  "Sucumbíos",
  "Napo",
  "Orellana",
  "Pastaza",
  "Morona Santiago",
  "Zamora Chinchipe",
  "Galápagos",
]

const cantonesPorProvincia: Record<string, string[]> = {
  Pichincha: ["Cayambe", "Mejia-Machachi", "Nanegal", "Pedro Moncayo-Tabacundo", "Pedro Vicente Maldonado", "Puerto Quito", "Quito", "Rumiñahui-Sangolquí", "San Miguel de los Bancos", "Santo Domingo"],
  Guayas: ["Alfredo Baquerizo Moreno - Jujan", "Balao", "Balzar", "Colimes", "Crnel Marcelino Maridueña", "Daule", "Durán-Eloy Alfaro", "El Empalme", "El Piedrero", "El Triunfo", "Gral. Antonio Elizalde - Bucay", "Guayaquil", "Isidro Ayora", "La Libertad", "Lomas de Sargentillo", "Milagro", "Naranjal", "Naranjito", "Nobol", "Palestina", "Pedro Carbo", "Playas", "Salinas", "Salit", "Samborondón", "Santa Elena", "Santa Lucía", "Simon Bolívar", "Urbina Jado (Salitre)", "Yaguachi"],
  Azuay: ["Camilo Ponce Enríquez", "Chordeleg", "Cuenca", "El Pan", "Girón", "Guachapala", "Gualaceo", "Nabón", "Oña", "Paute", "Pucará", "San Fernando", "Santa Isabel", "Sevilla de Oro", "Sígsig"],
  Manabí: ["24 de Mayo", "Bolívar-Calceta", "Chone", "El Carmen", "Flavio Alfaro", "Jama", "Jaramijó", "Jipijapa", "Junín", "Manta", "Montecristi", "Olmedo", "Paján", "Pedernales", "Pichincha", "Portoviejo", "Puerto Lopez", "Rocafuerte", "San Vicente", "Santa Ana", "Sucre-Bahía de Caráquez", "Tosagua"],
  Esmeraldas: ["Atacames", "Eloy Alfaro", "Esmeraldas", "Las Golondrinas", "Muisne", "Quinindé", "Río Verde", "San Lorenzo"],
  "Los Ríos": ["Baba", "Babahoyo", "Buena Fe", "Catarama-Urdaneta", "Mocache", "Montalvo", "Palenque", "Puebloviejo", "Quevedo", "Quinsaloma", "Valencia", "Ventanas", "Vinces"],
  "Santa Elena": ["La Libertad", "Salinas", "Santa Elena"],
  "El Oro": ["Arenillas", "Atahualpa", "Balsas", "Chilla", "El Guabo", "Huaquillas", "Las Lajas", "Machala", "Marcabelí", "Pasaje", "Piñas", "Portovelo", "Santa Rosa", "Zaruma"],
  "Santo Domingo de los Tsáchilas": ["La Concordia", "Santo Domingo"],
  Carchi: ["Bolívar", "Espejo / El Ángel", "Mira", "Montúfar / San Gabriel", "San Pedro de Huaca", "Tulcán"],
  Imbabura: ["Antonio Ante-Atuntaqui", "Cotacachi", "Ibarra", "Otavalo", "Pimampiro", "San Miguel Urcuquí"],
  Cotopaxi: ["La Maná", "Latacunga", "Pangua Corazón", "Pujilí", "Salcedo", "Saquisilí", "Sigchos"],
  Tungurahua: ["Ambato", "Baños", "Cevallos", "Mocha", "Patate", "Pelileo", "Píllaro", "Quero", "Tisaleo"],
  Chimborazo: ["Alausí", "Chambo", "Chunchi", "Colta", "Cumandá", "Guamote", "Guano", "Pallatanga", "Penipe", "Riobamba"],
  Bolívar: ["Caluma", "Chillanes", "Chimbo", "Echeandía", "Guaranda", "Las Naves", "San Miguel"],
  Cañar: ["Azogues", "Biblián", "Cañar", "Déleg", "El Tambo", "La Troncal", "Suscal"],
  Loja: ["Calvas-Cariamanga", "Catamayo", "Celica", "Chaguarpamba", "Espíndola", "Gonzanamá", "Loja", "Macará", "Olmedo", "Paltas", "Pindal", "Puyango", "Quilanga", "Saraguro", "Sozoranga", "Zapotillo"],
  "Morona Santiago": ["Gualaquiza", "Huamboya", "Limón Indanza", "Logroño", "Morona", "Pablo Sexto", "Palora", "San Juan Bosco", "Santiago Méndez", "Sucúa", "Taisha", "Tiwintza"],
  Pastaza: ["Arajuno", "Mera", "Pastaza", "Santa Clara"],
  Orellana: ["Aguarico", "Francisco de Orellana", "La Joya de los Sachas", "Loreto"],
  Napo: ["Archidona", "Carlos Julio Arosemena Tola", "El Chaco", "Quijos-Baeza", "Tena"],
  Sucumbíos: ["Cascales", "Cuyabeno", "Gonzalo Pizarro", "Nueva Loja-Lago Agrio", "Putumayo", "Shushufindi", "Sucumbíos-Bonita", "Tarapoa"],
  Galápagos: ["Isabela", "San Cristóbal", "Santa Cruz"],
  "Zamora Chinchipe": ["Centinela del Cóndor", "Chinchipe Zumba", "El Pangui", "Nangaritza", "Palanda", "Paquisha", "Yacuambi", "Yantzaza", "Zamora"],
}

export function ConsejoJudicaturaPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [result, setResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [consejoData, setConsejoData] = useState<ConsejoJudicaturaData | null>(null)
  const [showCards, setShowCards] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>()

  const tipoBusqueda = watch("tipoBusqueda")
  const provinciaSeleccionada = watch("provincia")

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setShowCards(false)
    setConsejoData(null)

    try {
      const requestData = {
        nombre: data.nombre,
        tipoBusqueda: data.tipoBusqueda,
        provinciaInstitucion: data.tipoBusqueda === "INSTITUCIONES" ? data.institucion : data.provincia,
        canton: data.tipoBusqueda === "PROVINCIAS" ? data.canton : null
      }

      const response = await fetch("http://localhost:3001/api/consejo-judicatura", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      const resultado = await response.json()

      if (resultado.success) {
        const { funcionarios, totalFuncionarios, nombre, tipoBusqueda } = resultado.data

        if (totalFuncionarios > 0) {
          setConsejoData({
            funcionarios,
            totalFuncionarios,
            nombre,
            tipoBusqueda
          })
          setShowCards(true)
        } else {
          setResult(`No se encontraron funcionarios con el nombre "${data.nombre}" en el sistema del Consejo de la Judicatura.`)
          setIsModalOpen(true)
        }
      } else {
        setResult(`Error: ${resultado.error || "Error desconocido"}`)
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error("Error al consultar Consejo de la Judicatura:", error)
      setResult("Error de conexión. Verifique que el servidor backend esté funcionando.")
      setIsModalOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const FuncionariosCards = ({ funcionarios }: { funcionarios: Funcionario[] }) => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          👨‍⚖️ Funcionarios Encontrados
          <span className="text-sm font-normal text-muted-foreground">
            ({funcionarios.length} {funcionarios.length === 1 ? 'funcionario' : 'funcionarios'})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {funcionarios.map((funcionario, index) => (
            <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header del funcionario */}
                  <div className="border-b pb-3">
                    <h3 className="font-bold text-lg text-blue-600 mb-1">
                      {funcionario.funcionario}
                    </h3>
                    <p className="text-sm font-medium text-gray-600">Cargo: {funcionario.cargo}</p>
                  </div>

                  {/* Información laboral */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-sm text-blue-800 mb-2">💼 Información Laboral</h4>
                    <p className="text-sm mb-1">
                      <span className="font-medium">Departamento:</span> {funcionario.departamento}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Edificio:</span> {funcionario.edificio}
                    </p>
                  </div>

                  {/* Ubicación */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-sm text-green-800 mb-2">📍 Ubicación</h4>
                    <p className="text-sm mb-1">
                      <span className="font-medium">Ciudad:</span> {funcionario.ciudad}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Dirección:</span> {funcionario.direccion}
                    </p>
                  </div>

                  {/* Contacto */}
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-sm text-orange-800 mb-2">📞 Contacto</h4>
                    <div className="space-y-2">
                      {funcionario.telefono && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">Teléfono:</span>
                          <a 
                            href={`tel:${funcionario.telefono}`}
                            className="text-xs text-blue-600 hover:underline font-mono"
                          >
                            {funcionario.telefono}
                          </a>
                        </div>
                      )}
                      {funcionario.email && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">Email:</span>
                          <a 
                            href={`mailto:${funcionario.email}`}
                            className="text-xs text-blue-600 hover:underline break-all"
                          >
                            {funcionario.email}
                          </a>
                        </div>
                      )}
                    </div>
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
            <h1 className="text-lg font-semibold">Consejo de la Judicatura</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Consulta Consejo de la Judicatura</CardTitle>
              <CardDescription>
                Busca funcionarios por nombre en instituciones o por ubicación geográfica.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Funcionario</Label>
                  <Input
                    id="nombre"
                    placeholder="Ingresa el nombre a buscar"
                    {...register("nombre", {
                      required: "El nombre es requerido",
                      minLength: {
                        value: 2,
                        message: "El nombre debe tener al menos 2 caracteres",
                      },
                    })}
                  />
                  {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Búsqueda</Label>
                  <Controller
                    name="tipoBusqueda"
                    control={control}
                    rules={{ required: "Selecciona un tipo de búsqueda" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de búsqueda" />
                        </SelectTrigger>
                        <SelectContent className="max-h-40">
                          <SelectItem value="PROVINCIAS">PROVINCIAS</SelectItem>
                          <SelectItem value="INSTITUCIONES">INSTITUCIONES</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.tipoBusqueda && <p className="text-sm text-destructive">{errors.tipoBusqueda.message}</p>}
                </div>

                {tipoBusqueda === "INSTITUCIONES" && (
                  <div className="space-y-2">
                    <Label>Institución</Label>
                    <Controller
                      name="institucion"
                      control={control}
                      rules={{ required: "Selecciona una institución" }}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona la institución" />
                          </SelectTrigger>
                          <SelectContent className="max-h-40">
                            {instituciones.map((inst) => (
                              <SelectItem key={inst} value={inst}>
                                {inst}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.institucion && <p className="text-sm text-destructive">{errors.institucion.message}</p>}
                  </div>
                )}

                {tipoBusqueda === "PROVINCIAS" && (
                  <>
                    <div className="space-y-2">
                      <Label>Provincia</Label>
                      <Controller
                        name="provincia"
                        control={control}
                        rules={{ required: "Selecciona una provincia" }}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona la provincia" />
                            </SelectTrigger>
                            <SelectContent className="max-h-40">
                              {provincias.map((prov) => (
                                <SelectItem key={prov} value={prov}>
                                  {prov}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.provincia && <p className="text-sm text-destructive">{errors.provincia.message}</p>}
                    </div>

                    {provinciaSeleccionada && cantonesPorProvincia[provinciaSeleccionada] && (
                      <div className="space-y-2">
                        <Label>Cantón</Label>
                        <Controller
                          name="canton"
                          control={control}
                          rules={{ required: "Selecciona un cantón" }}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona el cantón" />
                              </SelectTrigger>
                              <SelectContent className="max-h-40">
                                {cantonesPorProvincia[provinciaSeleccionada].map((canton) => (
                                  <SelectItem key={canton} value={canton}>
                                    {canton}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.canton && <p className="text-sm text-destructive">{errors.canton.message}</p>}
                      </div>
                    )}
                  </>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Consultando..." : "Consultar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {showCards && consejoData && (
            <div className="space-y-6">
              {/* Resumen */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Resumen de Búsqueda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{consejoData.totalFuncionarios}</div>
                      <div className="text-sm text-blue-600">Funcionarios Encontrados</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-sm font-bold text-green-600">{consejoData.nombre}</div>
                      <div className="text-sm text-green-600">Nombre Buscado</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm font-bold text-orange-600">{consejoData.tipoBusqueda}</div>
                      <div className="text-sm text-orange-600">Tipo de Búsqueda</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cards de Funcionarios */}
              <FuncionariosCards funcionarios={consejoData.funcionarios} />
            </div>
          )}
        </div>
      </div>

      <ResultModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Resultado de Consulta - Consejo de la Judicatura"
        result={result}
      />
    </div>
  )
}
