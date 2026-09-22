// Punto de entrada de la vitrina de Capta Delivery (pedi.html).
//
// Es una pantalla aparte de los menus: no comparte estado ni estilos con
// MenuApp, y entra sola al navegador del cliente.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CaptaDeliveryApp from './CaptaDeliveryApp.jsx'

document.documentElement.lang = 'es'
document.documentElement.translate = false
document.documentElement.classList.add('notranslate')
document.body.translate = false
document.body.classList.add('notranslate')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CaptaDeliveryApp />
  </StrictMode>,
)
