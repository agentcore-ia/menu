import './App.css'
import AdminApp from './AdminApp.jsx'
import MenuApp from './MenuApp.jsx'

function isAdminRoute() {
  const [firstSegment] = window.location.pathname.split('/').filter(Boolean)
  return firstSegment === 'admin'
}

export default function App() {
  return isAdminRoute() ? <AdminApp /> : <MenuApp />
}
