import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import SignIn from "./components/auth/SignIn";
import SignUp from "./components/auth/Signup";
import PatientsPage from "./pages/PatientsPage";
import Sidebar from "./layout/Sidebar";
import PatientCard from "./pages/PatientCardPage";
import VisitCardPage from "./pages/VisitcardPage";
import VisitFillPage from "./pages/VisitFillPage";
import PatientFilePage from "./pages/PatientFilePage";
import DiseaseList from "./pages/DiseaseList";
import MedicalActsPage from "./pages/MedicalActsPage";

const NO_SIDEBAR_PATHS = ["/login", "/signup"];

function AppContent() {
  const location = useLocation();
  const hideSidebar = NO_SIDEBAR_PATHS.includes(location.pathname);

  const routes = (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/patients" element={<PatientsPage />} />
      <Route path="/patients/:id" element={<PatientCard />} />
      <Route path="/visits/:id" element={<VisitCardPage />} />
      <Route path="/visits/:id/fill" element={<VisitFillPage />} />
      <Route path="/patients/:id/file" element={<PatientFilePage />} />
      <Route path="/icd10-codes" element={<DiseaseList />} />
      <Route path="/medical-acts" element={<MedicalActsPage />} />
    </Routes>
  );

  if (hideSidebar) {
    return routes;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: "auto" }}>{routes}</div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;