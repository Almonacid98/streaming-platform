import { Navigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'


function ProtectedRoute({ children }) {

  const {
    usuario,
    loading
  } = useAuth()


  // ==========================================
  // ESPERAR VERIFICACIÓN DEL TOKEN
  // ==========================================

  if (loading) {

    return (

      <div
        className="
          min-vh-100
          d-flex
          justify-content-center
          align-items-center
          bg-dark
          text-white
        "
      >

        <div className="text-center">

          <div
            className="spinner-border text-danger mb-3"
            role="status"
          >
            <span className="visually-hidden">
              Cargando...
            </span>
          </div>

          <p>
            Verificando sesión...
          </p>

        </div>

      </div>
    )
  }


  // ==========================================
  // USUARIO NO AUTENTICADO
  // ==========================================

  if (!usuario) {

    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }


  // ==========================================
  // USUARIO AUTENTICADO
  // ==========================================

  return children
}


export default ProtectedRoute