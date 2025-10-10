import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Dashboard } from './pages/Dashboard'
import { DossierCreate } from './pages/DossierCreate'
import { DossierList } from './pages/DossierList'
import { DossierDetail } from './pages/DossierDetail'
import { RedactionStatuts } from './pages/RedactionStatuts'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dossiers" element={<DossierList />} />
        <Route path="/dossiers/nouveau" element={<DossierCreate />} />
        <Route path="/dossiers/:id" element={<DossierDetail />} />
        <Route path="/dossiers/:id/redaction" element={<RedactionStatuts />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
