import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL

function AdminEpisodes() {
  const { serieId } = useParams()
  const { usuario, authFetch } = useAuth()

  const [serie, setSerie] = useState(null)
  const [episodios, setEpisodios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eliminando, setEliminando] = useState(null)

  const esAdmin =
    usuario?.is_superuser === true ||
    usuario?.rol === 'admin'

  const puedeAdministrar =
    esAdmin ||
    (
      usuario?.rol === 'creador' &&
      Number(serie?.creador?.id) === Number(usuario?.id)
    )

  useEffect(() => {
    let activo = true

    const cargar = async () => {
      try {
        const response = await authFetch(
          `${API_URL}/contenidos/${serieId}/`
        )

        if (!response.ok) {
          throw new Error('No se pudo cargar la serie.')
        }

        const data = await response.json()

        if (data.tipo !== 'serie') {
          throw new Error('El contenido seleccionado no es una serie.')
        }

        if (activo) {
          setSerie(data)
          setEpisodios(data.episodios || [])
        }
      } catch (err) {
        if (activo) setError(err.message)
      } finally {
        if (activo) setLoading(false)
      }
    }

    cargar()

    return () => {
      activo = false
    }
  }, [serieId, authFetch])

  const eliminar = async (episodio) => {
    if (!puedeAdministrar) return

    if (!window.confirm(
      `¿Eliminar el episodio "${episodio.titulo}"?`
    )) return

    setEliminando(episodio.id)
    setError('')

    try {
      const response = await authFetch(
        `${API_URL}/episodios/${episodio.id}/`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error(
          `No se pudo eliminar el episodio (${response.status}).`
        )
      }

      setEpisodios((actuales) =>
        actuales.filter((e) => e.id !== episodio.id)
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setEliminando(null)
    }
  }

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white p-5 text-center">
        <div className="spinner-border text-danger" role="status" />
        <p>Cargando episodios...</p>
      </div>
    )
  }

  return (
    <div className="min-vh-100 bg-dark text-white py-5">
      <div className="container">
        <Link to="/admin/content" className="btn btn-outline-light mb-4">
          Volver a contenidos
        </Link>

        <h1>Episodios de {serie?.titulo || 'la serie'}</h1>

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {serie && puedeAdministrar && (
          <Link
            to={`/admin/series/${serieId}/episodes/new`}
            className="btn btn-danger my-3"
          >
            + Agregar episodio
          </Link>
        )}

        {!puedeAdministrar && serie && (
          <div className="alert alert-warning">
            No tenés permisos para modificar esta serie.
          </div>
        )}

        {episodios.length === 0 ? (
          <p className="text-white-50">
            No hay episodios registrados.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle">
              <thead>
                <tr>
                  <th>Temporada</th>
                  <th>Episodio</th>
                  <th>Título</th>
                  <th>Duración</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {episodios.map((episodio) => (
                  <tr key={episodio.id}>
                    <td>{episodio.temporada}</td>
                    <td>{episodio.numero}</td>
                    <td>{episodio.titulo}</td>
                    <td>{episodio.duracion_min} min</td>
                    <td>
                      {puedeAdministrar ? (
                        <div className="d-flex gap-2">
                          <Link
                            className="btn btn-outline-light btn-sm"
                            to={`/admin/series/${serieId}/episodes/${episodio.id}/edit`}
                          >
                            Editar
                          </Link>

                          <button
                            className="btn btn-outline-danger btn-sm"
                            disabled={eliminando === episodio.id}
                            onClick={() => eliminar(episodio)}
                          >
                            {eliminando === episodio.id
                              ? 'Eliminando...'
                              : 'Eliminar'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-white-50">Solo lectura</span>
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

export default AdminEpisodes
