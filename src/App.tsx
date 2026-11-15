import React from "react";
import { Layout } from "./components/Layout";
import { ClinicProvider, useClinic } from "./context/ClinicContext";
import { AiAgentsPage } from "./pages/AiAgentsPage";
import { BillingFinancePage } from "./pages/BillingFinancePage";
import { CalendarPage } from "./pages/CalendarPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GrowthCrmPage } from "./pages/GrowthCrmPage";
import { InventoryPage } from "./pages/InventoryPage";
import { PatientPortalPage } from "./pages/PatientPortalPage";
import { PatientsEmrPage } from "./pages/PatientsEmrPage";
import { PharmacyPosPage } from "./pages/PharmacyPosPage";
import { QueueAttendancePage } from "./pages/QueueAttendancePage";
import { ReportsIntegrationsPage } from "./pages/ReportsIntegrationsPage";
import { TutorialsPage } from "./pages/TutorialsPage";
import { VoiceWhatsAppPage } from "./pages/VoiceWhatsAppPage";

const PageRouter: React.FC = () => {
  const { activePage } = useClinic();

  switch (activePage) {
    case "dashboard":
      return <DashboardPage />;
    case "calendar":
      return <CalendarPage />;
    case "queue":
      return <QueueAttendancePage />;
    case "patients":
      return <PatientsEmrPage />;
    case "pharmacy":
      return <PharmacyPosPage />;
    case "inventory":
      return <InventoryPage />;
    case "billing":
      return <BillingFinancePage />;
    case "growth":
      return <GrowthCrmPage />;
    case "voice-whatsapp":
      return <VoiceWhatsAppPage />;
    case "ai-agents":
      return <AiAgentsPage />;
    case "reports":
      return <ReportsIntegrationsPage />;
    case "patient-portal":
      return <PatientPortalPage />;
    case "tutorials":
      return <TutorialsPage />;
    default:
      return <DashboardPage />;
  }
};

export function App() {
  return (
    <ClinicProvider>
      <Layout>
        <PageRouter />
      </Layout>
    </ClinicProvider>
  );
}

export default App;
