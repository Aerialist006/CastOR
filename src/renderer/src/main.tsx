import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom' // ← was BrowserRouter
import '@/i18n/index'
import App from './App'
import './assets/main.css'
import { ThemeProvider } from './components/theme-provider'
import { BibleProvider } from './context/BibleContext'
import { PresentationProvider } from './context/PresentationContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <BibleProvider>
          <PresentationProvider>
            <App />
          </PresentationProvider>
        </BibleProvider>
      </ThemeProvider>
    </HashRouter>
  </StrictMode>
)
