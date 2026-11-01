import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function OnlyAdminRoute({ children }) {
  const { usuario, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  const esAdmin =
    usuario.is_superuser === true ||
    usuario.rol === 'admin'

  if (!esAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

export default OnlyAdminRoute