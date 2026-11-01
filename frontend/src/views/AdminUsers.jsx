import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const API_URL = import.meta.env.VITE_API_URL

function AdminUsers() {
  const { authFetch, usuario } = useAuth()

  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    setError('')

    try {
      let url = `${API_URL}/users/`
      const collected = []
      const visited = new Set()

      while (url) {
        if (visited.has(url)) {
          throw new Error('Error en la paginación de usuarios.')
        }

        visited.add(url)

        const response = await authFetch(url)

        if (!response.ok) {
          throw new Error('No se pudieron cargar los usuarios.')
        }

        const data = await response.json()

        if (Array.isArray(data)) {
          collected.push(...data)
          url = null
        } else {
          collected.push(...(data.results || []))
          url = data.next
            ? new URL(data.next, url).href
            : null
        }
      }

      setUsers(collected)
    } catch (err) {
      setError(err.message || 'Error al cargar usuarios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // Se ejecuta al montar la vista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateUser = async (id, changes) => {
    setSavingId(id)
    setError('')
    setSuccess('')

    try {
      const response = await authFetch(
        `${API_URL}/users/${id}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(changes)
        }
      )

      if (!response.ok) {
        throw new Error('No se pudo actualizar el usuario.')
      }

      const updated = await response.json()

      setUsers(previous =>
        previous.map(item =>
          item.id === id ? updated : item
        )
      )

      setSuccess('Usuario actualizado correctamente.')
    } catch (err) {
      setError(err.message || 'Error al actualizar usuario.')
    } finally {
      setSavingId(null)
    }
  }

  const changeRole = async (user, rol) => {
    if (savingId !== null || user.id === usuario?.id) return

    const confirmed = window.confirm(
      `¿Querés cambiar el rol de ${user.username} a ${rol}?`
    )

    if (!confirmed) return

    await updateUser(user.id, { rol })
  }

  const toggleActive = async (user) => {
    if (savingId !== null || user.id === usuario?.id) return

    const action = user.is_active ? 'desactivar' : 'activar'

    const confirmed = window.confirm(
      `¿Querés ${action} la cuenta de ${user.username}?`
    )

    if (!confirmed) return

    await updateUser(user.id, {
      is_active: !user.is_active
    })
  }

  const filtered = users.filter(user => {
    const term = search.trim().toLowerCase()

    return (
      user.username?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.first_name?.toLowerCase().includes(term) ||
      user.last_name?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="min-vh-100 bg-dark text-white d-flex flex-column">
      <Navbar />

      <main className="container py-5 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <h1 className="fw-bold">Administrar usuarios</h1>
            <p className="text-white-50">
              Consultá usuarios, modificá roles y gestioná cuentas.
            </p>
          </div>

          <Link to="/admin" className="btn btn-outline-light">
            Volver al panel
          </Link>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-8">
            <input
              type="search"
              className="form-control bg-dark text-white border-secondary"
              placeholder="Buscar por nombre o correo..."
              aria-label="Buscar usuarios"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>

          <div className="col-md-4">
            <button
              type="button"
              className="btn btn-outline-light w-100"
              onClick={loadUsers}
              disabled={loading || savingId !== null}
            >
              Actualizar usuarios
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="status">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(user => {
                  const isSelf = user.id === usuario?.id
                  const busy = savingId !== null

                  return (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.username}</strong>
                        {isSelf && (
                          <span className="badge bg-secondary ms-2">
                            Vos
                          </span>
                        )}
                        {user.is_superuser && (
                          <span className="badge bg-warning text-dark ms-2">
                            Superusuario
                          </span>
                        )}
                      </td>

                      <td>{user.email || 'Sin correo'}</td>

                      <td>
                        <select
                          className="form-select form-select-sm bg-dark text-white border-secondary"
                          value={user.rol}
                          onChange={event =>
                            changeRole(user, event.target.value)
                          }
                          disabled={busy || isSelf || user.is_superuser}
                          aria-label={`Rol de ${user.username}`}
                        >
                          <option value="usuario">Usuario</option>
                          <option value="creador">Creador</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            user.is_active ? 'bg-success' : 'bg-secondary'
                          }`}
                        >
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`btn btn-sm ${
                            user.is_active
                              ? 'btn-outline-danger'
                              : 'btn-outline-success'
                          }`}
                          disabled={busy || isSelf || user.is_superuser}
                          onClick={() => toggleActive(user)}
                        >
                          {savingId === user.id
                            ? 'Guardando...'
                            : user.is_active
                              ? 'Desactivar'
                              : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center text-white-50 py-4">
                No se encontraron usuarios.
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default AdminUsers
