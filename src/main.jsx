import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

document.documentElement.lang = 'es'
document.documentElement.translate = false
document.documentElement.classList.add('notranslate')
document.body.translate = false
document.body.classList.add('notranslate')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
