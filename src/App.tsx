import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { UpdatePanel } from './components/UpdatePanel'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { DossierCreate } from './pages/DossierCreate'
import { DossierList } from './pages/DossierList'
import { DossierDetail } from './pages/DossierDetail'
import { RedactionStatuts } from './pages/RedactionStatuts'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <UpdatePanel />
        <Routes>
          {/* Route publique de connexion */}
          <Route path="/login" element={<Login />} />
          
          {/* Routes protégées */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dossiers" element={<DossierList />} />
            <Route path="/dossiers/nouveau" element={<DossierCreate />} />
            <Route path="/dossiers/:id" element={<DossierDetail />} />
            <Route path="/dossiers/:id/redaction" element={<RedactionStatuts />} />
          </Route>

          {/* Route par défaut : redirection vers dashboard ou login */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
