import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react'


// ==========================================
// CONTEXTO DE AUTENTICACIÓN
// ==========================================

const AuthContext = createContext(null)


// ==========================================
// URL BASE DEL BACKEND
// ==========================================

const API_URL = import.meta.env.VITE_API_URL


export function AuthProvider({ children }) {

  // ==========================================
  // ESTADO DE AUTENTICACIÓN
  // ==========================================

  const [usuario, setUsuario] = useState(null)

  const [loading, setLoading] = useState(true)


  // ==========================================
  // CARGAR PERFIL
  // ==========================================

  const cargarPerfil = async (access) => {

    try {

      const response = await fetch(
        `${API_URL}/users/profile/`,
        {
          method: 'GET',

          headers: {
            'Authorization': `Bearer ${access}`
          }
        }
      )


      if (!response.ok) {
        return null
      }


      const data = await response.json()

      return data

    } catch (error) {

      console.error(
        'Error al obtener el perfil:',
        error
      )

      return null
    }
  }


  // ==========================================
  // RESTAURAR SESIÓN AL ABRIR / RECARGAR
  // ==========================================

  useEffect(() => {

    const restaurarSesion = async () => {

      const access =
        localStorage.getItem('access')


      // No existe una sesión guardada
      if (!access) {

        setLoading(false)

        return
      }


      // Existe token: comprobarlo con Django
      const profileData =
        await cargarPerfil(access)


      if (profileData) {

        setUsuario(profileData)

      } else {

        // Token inválido o vencido
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')

        setUsuario(null)
      }


      setLoading(false)
    }


    restaurarSesion()

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


      // Obtener JWT
      const data = await response.json()


      // Guardar JWT
      localStorage.setItem(
        'access',
        data.access
      )

      localStorage.setItem(
        'refresh',
        data.refresh
      )


      // Obtener perfil real
      const profileData =
        await cargarPerfil(data.access)


      if (!profileData) {

        localStorage.removeItem('access')
        localStorage.removeItem('refresh')

        return false
      }


      setUsuario(profileData)


      return true

    } catch (error) {

      console.error(
        'Error al iniciar sesión:',
        error
      )

      localStorage.removeItem('access')
      localStorage.removeItem('refresh')

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

          body: JSON.stringify(nuevoUsuario)
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
        message: 'No se pudo conectar con el servidor.'
      }
    }
  }


  // ==========================================
  // LOGOUT
  // POST /api/logout/
  // ==========================================

  const logout = async () => {

    const access =
      localStorage.getItem('access')

    const refresh =
      localStorage.getItem('refresh')


    try {

      if (access && refresh) {

        const response = await fetch(
          `${API_URL}/logout/`,
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${access}`
            },

            body: JSON.stringify({
              refresh
            })
          }
        )


        if (!response.ok) {

          console.warn(
            'El backend no pudo invalidar el refresh token.'
          )
        }
      }

    } catch (error) {

      console.error(
        'Error al cerrar sesión:',
        error
      )

    } finally {

      // Limpiar sesión local
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')

      setUsuario(null)
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
        logout
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