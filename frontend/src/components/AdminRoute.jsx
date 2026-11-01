import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AdminRoute({ children }) {
  const { usuario, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center bg-dark text-white">
        <div className="text-center">
          <div className="spinner-border text-danger mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p>Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  const autorizado =
    usuario.is_superuser === true ||
    usuario.rol === 'admin' ||
    usuario.rol === 'creador'

  if (!autorizado) {
    return <Navigate to="/" replace />
  }

  return children
}

export default AdminRoute
