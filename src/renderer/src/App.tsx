import { Navigate, Route, Routes } from 'react-router-dom'
import Home from "./pages/Home"
import Settings from './pages/Settings'
import Dashboard from './pages/Dashboard'
import CastWindow from './pages/CastWindow'
import Layout from './assets/Layout'


export default function App() {
  return (
    <Routes>
      {/* Cast window - separate route without layout */}
      <Route path="/cast" element={<CastWindow />} />
      
      {/* Main app with layout */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="settings" element={<Settings />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
