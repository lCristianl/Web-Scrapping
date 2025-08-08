import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { HomePage } from "./Pages/HomePage"
import { CertificadosIESSPage } from "./Pages/CertificadosIESSPage"
import { CitacionesANTPage } from "./Pages/CitacionesANTPage"
import { CitacionJudicialPage } from "./Pages/CitacionJudicialPage"
import { ConsejoJudicaturaPage } from "./Pages/ConsejoJudicaturaPage"
import { ConsultaSRIPage } from "./Pages/ConsultaSRIPage"
import { ImpedimentosCargosPage } from "./Pages/ImpedimentosCargosPage"
import { PensionAlimenticiaPage } from "./Pages/PensionAlimenticiaPage"
import { ProcesosJudicialesPage } from "./Pages/ProcesosJudicialesPage"
import { SenescytPage } from "./Pages/SenescytPage"
import { SuperCiasPage } from "./Pages/SuperCiasPage"

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <AppSidebar />  
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/certificado-iess" element={<CertificadosIESSPage />} />
            <Route path="/citaciones-ant" element={<CitacionesANTPage />} />
            <Route path="/citacion-judicial" element={<CitacionJudicialPage />} />
            <Route path="/consejo-judicatura" element={<ConsejoJudicaturaPage />} />
            <Route path="/consulta-sri" element={<ConsultaSRIPage />} />
            <Route path="/impedimentos-cargos" element={<ImpedimentosCargosPage />} />
            <Route path="/pension-alimenticia" element={<PensionAlimenticiaPage />} />
            <Route path="/procesos-judiciales" element={<ProcesosJudicialesPage />} />
            <Route path="/senescyt" element={<SenescytPage />} />
            <Route path="/supercias" element={<SuperCiasPage />} />
          </Routes>
        </main>
      </SidebarProvider>
    </BrowserRouter>
  )
}

export default App
