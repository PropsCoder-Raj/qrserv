import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ContactProvider } from './context/ContactContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ContactProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ContactProvider>
  </StrictMode>,
)
