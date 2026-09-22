import './App.css'
import AdminApp from './AdminApp.jsx'
import MenuApp from './MenuApp.jsx'
import VolverAVitrina from './VolverAVitrina.jsx'

function isAdminRoute() {
  const [firstSegment] = window.location.pathname.split('/').filter(Boolean)
  return firstSegment === 'admin'
}

export default function App() {
  if (isAdminRoute()) {
    return <AdminApp />
  }

  return (
    <>
      <MenuApp />
      {/* Solo aparece si el cliente llego desde la vitrina de Capta Delivery. */}
      <VolverAVitrina />
    </>
  )
}
