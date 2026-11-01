
import {
  useEffect,
  useState
} from 'react'

import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL

const editableFields = [
  'username',
  'first_name',
  'last_name',
  'email',
  'edad',
  'genero'
]

function Profile() {
  const navigate = useNavigate()

  const {
    authFetch,
    actualizarUsuario
  } = useAuth()

  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await authFetch(
          `${API_URL}/users/profile/`
        )

        if (!response.ok) {
          throw new Error(
            `Error HTTP ${response.status}`
          )
        }

        const data = await response.json()

        if (active) {
          setProfile(data)
          setForm(createForm(data))
        }
      } catch (err) {
        console.error(
          'Error al cargar el perfil:',
          err
        )

        if (active) {
          setError(
            'No pudimos cargar la información de tu perfil.'
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [authFetch])

  const createForm = (data) => ({
    username: data.username || '',
    first_name: data.first_name || '',
    last_name: data.last_name || '',
    email: data.email || '',
    edad: data.edad ?? '',
    genero: data.genero || ''
  })

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value
    }))

    setFormError('')
    setSuccess('')
  }

  const handleEdit = () => {
    setForm(createForm(profile))
    setEditing(true)
    setFormError('')
    setSuccess('')
  }

  const handleCancel = () => {
    setForm(createForm(profile))
    setEditing(false)
    setFormError('')
  }

  const handleSave = async (event) => {
    event.preventDefault()

    if (saving) return

    setSaving(true)
    setFormError('')
    setSuccess('')

    try {
      const payload = {}

      editableFields.forEach((field) => {
        payload[field] = form[field]
      })

      payload.edad =
        form.edad === ''
          ? null
          : Number(form.edad)

      if (
        payload.edad !== null &&
        (
          !Number.isInteger(payload.edad) ||
          payload.edad < 0
        )
      ) {
        setFormError(
          'Ingresá una edad válida.'
        )
        return
      }

      const response = await authFetch(
        `${API_URL}/users/profile/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const firstError = Object.values(data)[0]

        const message = Array.isArray(firstError)
          ? firstError[0]
          : typeof firstError === 'string'
            ? firstError
            : 'No se pudieron guardar los cambios.'

        throw new Error(message)
      }

      setProfile(data)
      setForm(createForm(data))

      // Mantener sincronizado AuthContext
      actualizarUsuario(data)

      setEditing(false)
      setSuccess(
        'Tu perfil se actualizó correctamente.'
      )

    } catch (err) {
      console.error(
        'Error al actualizar el perfil:',
        err
      )

      setFormError(
        err.message ||
        'No pudimos actualizar tu perfil.'
      )
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'No disponible'

    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) {
      return 'No disponible'
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(parsed)
  }

  const formatGender = (gender) => {
    const genders = {
      masculino: 'Masculino',
      femenino: 'Femenino',
      otro: 'Otro',
      no_decir: 'Prefiero no decir'
    }

    return genders[gender] || 'No especificado'
  }

  const formatRole = (role) => {
    const roles = {
      admin: 'Administrador',
      usuario: 'Usuario',
      creador: 'Creador'
    }

    return roles[role] || 'Usuario'
  }

  if (loading) {
    return (
      <main className="min-vh-100 bg-dark text-white d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div
            className="spinner-border text-danger mb-3"
            role="status"
          >
            <span className="visually-hidden">
              Cargando perfil...
            </span>
          </div>

          <p>Cargando tu perfil...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-vh-100 bg-dark text-white d-flex justify-content-center align-items-center">
        <div className="text-center">
          <h1 className="h3 mb-3">
            No pudimos cargar tu perfil
          </h1>

          <p className="text-secondary mb-4">
            {error}
          </p>

          <button
            type="button"
            className="btn btn-outline-light"
            onClick={() => navigate('/')}
          >
            ← Volver al inicio
          </button>
        </div>
      </main>
    )
  }

  if (!profile) return null

  const fullName = [
    profile.first_name,
    profile.last_name
  ].filter(Boolean).join(' ')

  const fields = [
    {
      name: 'username',
      label: 'Nombre de usuario',
      type: 'text'
    },
    {
      name: 'first_name',
      label: 'Nombre',
      type: 'text'
    },
    {
      name: 'last_name',
      label: 'Apellido',
      type: 'text'
    },
    {
      name: 'email',
      label: 'Correo electrónico',
      type: 'email'
    },
    {
      name: 'edad',
      label: 'Edad',
      type: 'number'
    }
  ]

  return (
    <main className="min-vh-100 bg-dark text-white py-5">
      <div className="container">

        <button
          type="button"
          className="btn btn-outline-light mb-4"
          onClick={() => navigate('/')}
        >
          ← Volver al inicio
        </button>

        <section className="mb-5">
          <span className="d-block text-danger fw-bold text-uppercase">
            Stream Platform
          </span>

          <h1 className="display-5 fw-bold mt-2 mb-2">
            Mi perfil
          </h1>

          <p className="text-secondary">
            Consultá y administrá la información de tu cuenta.
          </p>
        </section>

        <section className="profile-card">

          <div className="profile-header">
            <div className="profile-avatar">
              {profile.username
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <span className="profile-role">
                {formatRole(profile.rol)}
              </span>

              <h2 className="mt-2 mb-1">
                {fullName || profile.username}
              </h2>

              <p className="text-secondary mb-0">
                @{profile.username}
              </p>
            </div>
          </div>

          <div className="profile-divider" />

          {success && (
            <div
              className="alert alert-success"
              role="status"
            >
              {success}
            </div>
          )}

          {!editing ? (
            <>
              <div className="profile-information">

                <div className="profile-field">
                  <span>Nombre</span>
                  <strong>
                    {profile.first_name ||
                      'No especificado'}
                  </strong>
                </div>

                <div className="profile-field">
                  <span>Apellido</span>
                  <strong>
                    {profile.last_name ||
                      'No especificado'}
                  </strong>
                </div>

                <div className="profile-field">
                  <span>Correo electrónico</span>
                  <strong>
                    {profile.email ||
                      'No especificado'}
                  </strong>
                </div>

                <div className="profile-field">
                  <span>Edad</span>
                  <strong>
                    {profile.edad !== null &&
                    profile.edad !== undefined
                      ? `${profile.edad} años`
                      : 'No especificada'}
                  </strong>
                </div>

                <div className="profile-field">
                  <span>Género</span>
                  <strong>
                    {formatGender(profile.genero)}
                  </strong>
                </div>

                <div className="profile-field">
                  <span>Miembro desde</span>
                  <strong>
                    {formatDate(
                      profile.fecha_creacion
                    )}
                  </strong>
                </div>

              </div>

              <button
                type="button"
                className="btn btn-danger mt-4"
                onClick={handleEdit}
              >
                Editar perfil
              </button>
            </>
          ) : (
            <form onSubmit={handleSave}>

              {fields.map((field) => (
                <div className="mb-3" key={field.name}>
                  <label
                    className="form-label"
                    htmlFor={field.name}
                  >
                    {field.label}
                  </label>

                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    className="form-control bg-dark text-white border-secondary"
                    value={form[field.name] ?? ''}
                    onChange={handleChange}
                    min={
                      field.name === 'edad'
                        ? 0
                        : undefined
                    }
                    required={
                      field.name === 'username'
                    }
                    disabled={saving}
                  />
                </div>
              ))}

              <div className="mb-4">
                <label
                  className="form-label"
                  htmlFor="genero"
                >
                  Género
                </label>

                <select
                  id="genero"
                  name="genero"
                  className="form-select bg-dark text-white border-secondary"
                  value={form.genero ?? ''}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">
                    No especificado
                  </option>
                  <option value="masculino">
                    Masculino
                  </option>
                  <option value="femenino">
                    Femenino
                  </option>
                  <option value="otro">
                    Otro
                  </option>
                  <option value="no_decir">
                    Prefiero no decir
                  </option>
                </select>
              </div>

              {formError && (
                <div
                  className="alert alert-danger"
                  role="alert"
                >
                  {formError}
                </div>
              )}

              <div className="d-flex gap-2 flex-wrap">

                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={saving}
                >
                  {saving
                    ? 'Guardando...'
                    : 'Guardar cambios'}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-light"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancelar
                </button>

              </div>
            </form>
          )}

        </section>
      </div>
    </main>
  )
}

export default Profile
