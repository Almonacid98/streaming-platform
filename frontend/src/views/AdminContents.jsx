
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL

function AdminContents() {
  const { usuario, authFetch } = useAuth()

  const [contenidos, setContenidos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eliminando, setEliminando] = useState(null)

  // ==========================================
  // PERMISOS
  // ==========================================

  const esAdmin =
    usuario?.is_superuser === true ||
    usuario?.rol === 'admin'

  const puedeEditar = (contenido) =>
    esAdmin ||
    (
      usuario?.rol === 'creador' &&
      Number(contenido.creador?.id) === Number(usuario?.id)
    )

  // ==========================================
  // CARGAR CONTENIDOS
  // ==========================================

  const cargarContenidos = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await authFetch(`${API_URL}/contenidos/`)

      if (!response.ok) {
        throw new Error(
          `No se pudieron cargar los contenidos (${response.status}).`
        )
      }

      const data = await response.json()

      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
          ? data.results
          : []

      setContenidos(lista)
    } catch (err) {
      setError(err.message || 'Error al cargar contenidos.')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    cargarContenidos()
  }, [cargarContenidos])

  // ==========================================
  // ELIMINAR CONTENIDO
  // ==========================================

  const eliminarContenido = async (contenido) => {
    if (!puedeEditar(contenido)) return

    const confirmado = window.confirm(
      `¿Seguro que querés eliminar "${contenido.titulo}"? Esta acción no se puede deshacer.`
    )

    if (!confirmado) return

    setEliminando(contenido.id)
    setError('')

    try {
      const response = await authFetch(
        `${API_URL}/contenidos/${contenido.id}/`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error(
          `No se pudo eliminar el contenido (${response.status}).`
        )
      }

      setContenidos((actuales) =>
        actuales.filter((item) => item.id !== contenido.id)
      )
    } catch (err) {
      setError(err.message || 'Error al eliminar el contenido.')
    } finally {
      setEliminando(null)
    }
  }

  // ==========================================
  // BUSCAR CONTENIDOS
  // ==========================================

  const contenidosFiltrados = contenidos.filter((contenido) => {
    const texto = `${contenido.titulo} ${contenido.genero} ${contenido.tipo}`
      .toLowerCase()

    return texto.includes(busqueda.toLowerCase())
  })

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="min-vh-100 bg-dark text-white py-5">
      <div className="container">

        {/* ENCABEZADO */}

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <h1 className="fw-bold">
              Gestionar contenidos
            </h1>

            <p className="text-white-50">
              Administración de películas, series y episodios.
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link
              to="/admin"
              className="btn btn-outline-light"
            >
              Panel
            </Link>

            <Link
              to="/admin/content/new"
              className="btn btn-danger"
            >
              + Nuevo contenido
            </Link>
          </div>
        </div>

        {/* ERRORES */}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* BUSCADOR */}

        <input
          type="search"
          className="form-control bg-black text-white border-secondary mb-4"
          placeholder="Buscar por título, género o tipo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        {/* CONTENIDOS */}

        {loading ? (
          <div className="text-center py-5">
            <div
              className="spinner-border text-danger"
              role="status"
            />

            <p className="mt-3">
              Cargando contenidos...
            </p>
          </div>
        ) : contenidosFiltrados.length === 0 ? (
          <div className="alert alert-secondary">
            No se encontraron contenidos.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle">

              <thead>
                <tr>
                  <th>Portada</th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Género</th>
                  <th>Creador</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {contenidosFiltrados.map((contenido) => (
                  <tr key={contenido.id}>

                    {/* PORTADA */}

                    <td>
                      {contenido.portada_url ? (
                        <img
                          src={contenido.portada_url}
                          alt={contenido.titulo}
                          style={{
                            width: 55,
                            height: 75,
                            objectFit: 'cover',
                            borderRadius: 5
                          }}
                        />
                      ) : (
                        <span className="text-white-50">
                          Sin portada
                        </span>
                      )}
                    </td>

                    {/* TÍTULO */}

                    <td>
                      {contenido.titulo}
                    </td>

                    {/* TIPO */}

                    <td>
                      {contenido.tipo}
                    </td>

                    {/* GÉNERO */}

                    <td>
                      {contenido.genero}
                    </td>

                    {/* CREADOR */}

                    <td>
                      {contenido.creador?.username || 'Sin creador'}
                    </td>

                    {/* ACCIONES */}

                    <td>
                      {puedeEditar(contenido) ? (
                        <div className="d-flex flex-wrap gap-2">

                          {/* ADMINISTRAR EPISODIOS */}

                          {contenido.tipo === 'serie' && (
                            <Link
                              to={`/admin/series/${contenido.id}/episodes`}
                              className="btn btn-sm btn-outline-info"
                              title={`Administrar episodios de ${contenido.titulo}`}
                            >
                              Episodios
                            </Link>
                          )}

                          {/* EDITAR CONTENIDO */}

                          <Link
                            to={`/admin/content/${contenido.id}/edit`}
                            className="btn btn-sm btn-outline-light"
                          >
                            Editar
                          </Link>

                          {/* ELIMINAR CONTENIDO */}

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            disabled={eliminando === contenido.id}
                            onClick={() => eliminarContenido(contenido)}
                          >
                            {eliminando === contenido.id
                              ? 'Eliminando...'
                              : 'Eliminar'}
                          </button>

                        </div>
                      ) : (
                        <span className="text-white-50">
                          Solo lectura
                        </span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>
    </div>
  )
}

export default AdminContents
