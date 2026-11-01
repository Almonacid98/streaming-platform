import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AdminDashboard() {
  const { usuario } = useAuth()

  const esAdmin =
    usuario?.is_superuser === true ||
    usuario?.rol === 'admin'

  return (
    <div className="min-vh-100 bg-dark text-white py-5">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <h1 className="fw-bold">Panel de administración</h1>
            <p className="text-white-50">
              Bienvenido, {usuario?.username}.
              Gestioná el contenido de Streaming Platform.
            </p>
          </div>

          <Link to="/" className="btn btn-outline-light">
            Volver al inicio
          </Link>
        </div>

        <div className="row g-4">
          <div className="col-md-6">
            <div className="card bg-black text-white border-secondary h-100">
              <div className="card-body p-4">
                <h4>Películas y series</h4>
                <p className="text-white-50">
                  Consultá, editá y eliminá contenidos según tus permisos.
                </p>
                <Link to="/admin/content" className="btn btn-danger">
                  Gestionar contenidos
                </Link>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card bg-black text-white border-secondary h-100">
              <div className="card-body p-4">
                <h4>Agregar contenido</h4>
                <p className="text-white-50">
                  Publicá una nueva película o serie en el catálogo.
                </p>
                <Link to="/admin/content/new" className="btn btn-danger">
                  Crear contenido
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="alert alert-secondary mt-4">
          Tu rol: <strong>
            {usuario?.is_superuser
              ? 'Superusuario'
              : usuario?.rol}
          </strong>.
          {esAdmin
            ? ' Podés administrar todos los contenidos.'
            : ' Podés modificar solamente tus publicaciones.'}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
