
import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react'


const AuthContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL


// ==========================================
// REFRESH COMPARTIDO
// ==========================================

// Permite compartir una misma renovación
// de token entre varias peticiones.
let refreshPromise = null


export function AuthProvider({ children }) {

  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)


  // ==========================================
  // LIMPIAR TOKENS
  // ==========================================

  const limpiarTokens = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
  }


  // ==========================================
  // LIMPIAR SESIÓN COMPLETA
  // ==========================================

  const limpiarSesion = () => {
    limpiarTokens()
    setUsuario(null)
  }


  // ==========================================
  // ACTUALIZAR USUARIO
  // ==========================================

  // NUEVO: permite actualizar los datos
  // del usuario después de editar su perfil.

  const actualizarUsuario = (datos) => {
    setUsuario(datos)
  }


  // ==========================================
  // RENOVAR ACCESS TOKEN
  // POST /api/token/refresh/
  // ==========================================

  const renovarAccessToken = async () => {

    if (refreshPromise) {
      return refreshPromise
    }

    const refresh = localStorage.getItem('refresh')

    if (!refresh) {
      return null
    }

    refreshPromise = (async () => {

      try {

        const response = await fetch(
          `${API_URL}/token/refresh/`,
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({
              refresh
            })
          }
        )

        if (!response.ok) {
          limpiarTokens()
          return null
        }

        const data = await response.json()

        localStorage.setItem(
          'access',
          data.access
        )

        // Si SimpleJWT rota el refresh,
        // guardamos el nuevo token.
        if (data.refresh) {
          localStorage.setItem(
            'refresh',
            data.refresh
          )
        }

        return data.access

      } catch (error) {

        console.error(
          'Error al renovar el token:',
          error
        )

        return null

      } finally {

        refreshPromise = null

      }

    })()

    return refreshPromise
  }


  // ==========================================
  // OBTENER PERFIL
  // GET /api/users/profile/
  // ==========================================

  const cargarPerfil = async (access) => {

    try {

      let response = await fetch(
        `${API_URL}/users/profile/`,
        {
          method: 'GET',

          headers: {
            'Authorization': `Bearer ${access}`
          }
        }
      )

      // Si el access expiró,
      // intentamos renovarlo.
      if (response.status === 401) {

        const nuevoAccess =
          await renovarAccessToken()

        if (!nuevoAccess) {
          return null
        }

        response = await fetch(
          `${API_URL}/users/profile/`,
          {
            method: 'GET',

            headers: {
              'Authorization': `Bearer ${nuevoAccess}`
            }
          }
        )
      }

      if (!response.ok) {
        return null
      }

      return await response.json()

    } catch (error) {

      console.error(
        'Error al obtener el perfil:',
        error
      )

      return null
    }
  }


  // ==========================================
  // FETCH AUTENTICADO
  // ==========================================

  // Agrega automáticamente el JWT.
  // Si expiró, lo renueva y repite
  // la petición original.

  const authFetch = async (url, options = {}) => {

    let access = localStorage.getItem('access')

    // Intentar renovar si no hay access.
    if (!access) {

      access = await renovarAccessToken()

      if (!access) {

        limpiarSesion()

        throw new Error(
          'No existe una sesión válida.'
        )
      }
    }

    // Mantener las opciones y cabeceras
    // enviadas por cada componente.
    const crearOpciones = (token) => ({
      ...options,

      headers: {
        ...options.headers,

        'Authorization': `Bearer ${token}`
      }
    })

    let response = await fetch(
      url,
      crearOpciones(access)
    )

    // Access vencido o inválido.
    if (response.status === 401) {

      const nuevoAccess =
        await renovarAccessToken()

      if (!nuevoAccess) {

        limpiarSesion()

        throw new Error(
          'La sesión ha expirado.'
        )
      }

      // Repetir la petición original.
      response = await fetch(
        url,
        crearOpciones(nuevoAccess)
      )
    }

    return response
  }


  // ==========================================
  // RESTAURAR SESIÓN
  // ==========================================

  useEffect(() => {

    let activo = true

    const restaurarSesion = async () => {

      const access =
        localStorage.getItem('access')

      const refresh =
        localStorage.getItem('refresh')

      if (!access && !refresh) {

        if (activo) {
          setLoading(false)
        }

        return
      }

      let profileData = null

      // Tenemos access.
      if (access) {

        profileData =
          await cargarPerfil(access)

      }

      // Solo tenemos refresh.
      else if (refresh) {

        const nuevoAccess =
          await renovarAccessToken()

        if (nuevoAccess) {

          profileData =
            await cargarPerfil(nuevoAccess)

        }
      }

      if (!activo) {
        return
      }

      if (profileData) {

        setUsuario(profileData)

      } else {

        limpiarSesion()

      }

      setLoading(false)
    }

    restaurarSesion()

    return () => {
      activo = false
    }

  }, [])


  // ==========================================
  // LOGIN
  // POST /api/token/
  // ==========================================

  const login = async (username, password) => {

    try {

      const response = await fetch(
        `${API_URL}/token/`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            username,
            password
          })
        }
      )

      if (!response.ok) {
        return false
      }

      const data = await response.json()

      // Guardar tokens JWT.
      localStorage.setItem(
        'access',
        data.access
      )

      localStorage.setItem(
        'refresh',
        data.refresh
      )

      // Obtener los datos del usuario.
      const profileData =
        await cargarPerfil(data.access)

      if (!profileData) {

        limpiarSesion()

        return false
      }

      setUsuario(profileData)

      return true

    } catch (error) {

      console.error(
        'Error al iniciar sesión:',
        error
      )

      limpiarSesion()

      return false
    }
  }


  // ==========================================
  // REGISTRO
  // POST /api/users/register/
  // ==========================================

  const register = async (nuevoUsuario) => {

    try {

      const response = await fetch(
        `${API_URL}/users/register/`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify(
            nuevoUsuario
          )
        }
      )

      const data = await response.json()

      if (!response.ok) {

        let message =
          'No se pudo registrar el usuario.'

        if (data.username) {

          message = data.username[0]

        } else if (data.email) {

          message = data.email[0]

        } else if (data.first_name) {

          message = data.first_name[0]

        } else if (data.last_name) {

          message = data.last_name[0]

        } else if (data.password) {

          message = data.password[0]

        } else if (data.edad) {

          message = data.edad[0]

        } else if (data.genero) {

          message = data.genero[0]

        } else if (data.detail) {

          message = data.detail

        }

        return {
          success: false,
          message
        }
      }

      return {
        success: true,
        user: data
      }

    } catch (error) {

      console.error(
        'Error al registrar usuario:',
        error
      )

      return {
        success: false,
        message:
          'No se pudo conectar con el servidor.'
      }
    }
  }


  // ==========================================
  // LOGOUT
  // POST /api/logout/
  // ==========================================

  const logout = async () => {

    let access =
      localStorage.getItem('access')

    let refresh =
      localStorage.getItem('refresh')

    try {

      if (refresh) {

        // Si falta access, intentamos
        // obtener uno antes de cerrar sesión.
        if (!access) {

          access =
            await renovarAccessToken()

          refresh =
            localStorage.getItem('refresh')
        }

        if (access) {

          let response = await fetch(
            `${API_URL}/logout/`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                'Authorization':
                  `Bearer ${access}`
              },

              body: JSON.stringify({
                refresh
              })
            }
          )

          // Si el access expiró justo
          // durante el logout.
          if (response.status === 401) {

            const nuevoAccess =
              await renovarAccessToken()

            const nuevoRefresh =
              localStorage.getItem('refresh')

            if (
              nuevoAccess &&
              nuevoRefresh
            ) {

              response = await fetch(
                `${API_URL}/logout/`,
                {
                  method: 'POST',

                  headers: {
                    'Content-Type':
                      'application/json',

                    'Authorization':
                      `Bearer ${nuevoAccess}`
                  },

                  body: JSON.stringify({
                    refresh: nuevoRefresh
                  })
                }
              )
            }
          }
        }
      }

    } catch (error) {

      console.error(
        'Error al cerrar sesión:',
        error
      )

    } finally {

      // Limpiar siempre la sesión local.
      limpiarSesion()

    }
  }


  // ==========================================
  // PROVIDER
  // ==========================================

  return (
    <AuthContext.Provider
      value={{
        usuario,
        loading,
        login,
        register,
        logout,
        authFetch,
        actualizarUsuario
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


// ==========================================
// HOOK useAuth
// ==========================================

export function useAuth() {

  const context = useContext(AuthContext)

  if (!context) {

    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider'
    )
  }

  return context
}
