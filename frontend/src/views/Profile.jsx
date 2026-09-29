import {
  useEffect,
  useState
} from 'react'

import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL


function Profile() {
  const navigate = useNavigate()
  const { authFetch } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
            `No se pudo cargar el perfil. Estado: ${response.status}`
          )
        }

        const data = await response.json()

        if (active) {
          setProfile(data)
        }
      } catch (error) {
        console.error(
          'Error al cargar el perfil:',
          error
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

  const formatDate = (date) => {
    if (!date) {
      return 'No disponible'
    }

    return new Intl.DateTimeFormat(
      'es-AR',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }
    ).format(new Date(date))
  }

  const formatGender = (gender) => {
    if (!gender) {
      return 'No especificado'
    }

    const genders = {
      M: 'Masculino',
      F: 'Femenino',
      O: 'Otro'
    }

    return genders[gender] || gender
  }

  const formatRole = (role) => {
    if (!role) {
      return 'Usuario'
    }

    const roles = {
      ADMIN: 'Administrador',
      USUARIO: 'Usuario',
      CREADOR: 'Creador'
    }

    return roles[role] || role
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

          <p>
            Cargando tu perfil...
          </p>

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

  if (!profile) {
    return null
  }

  const fullName = [
    profile.first_name,
    profile.last_name
  ]
    .filter(Boolean)
    .join(' ')

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
            Información de tu cuenta.
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

          <div className="profile-information">

            <div className="profile-field">

              <span>
                Nombre
              </span>

              <strong>
                {profile.first_name ||
                  'No especificado'}
              </strong>

            </div>

            <div className="profile-field">

              <span>
                Apellido
              </span>

              <strong>
                {profile.last_name ||
                  'No especificado'}
              </strong>

            </div>

            <div className="profile-field">

              <span>
                Correo electrónico
              </span>

              <strong>
                {profile.email ||
                  'No especificado'}
              </strong>

            </div>

            <div className="profile-field">

              <span>
                Edad
              </span>

              <strong>
                {profile.edad
                  ? `${profile.edad} años`
                  : 'No especificada'}
              </strong>

            </div>

            <div className="profile-field">

              <span>
                Género
              </span>

              <strong>
                {formatGender(
                  profile.genero
                )}
              </strong>

            </div>

            <div className="profile-field">

              <span>
                Miembro desde
              </span>

              <strong>
                {formatDate(
                  profile.fecha_creacion
                )}
              </strong>

            </div>

          </div>

        </section>

      </div>

    </main>
  )
}

export default Profile