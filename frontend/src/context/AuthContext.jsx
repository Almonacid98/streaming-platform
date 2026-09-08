import {
  createContext,
  useContext,
  useState
} from 'react'


const AuthContext = createContext(null)


export function AuthProvider({ children }) {

  const [usuarios, setUsuarios] = useState([
    {
      id: 1,
      username: 'gabriel',
      password: '1234',
      email: 'gabriel@email.com'
    },
    {
      id: 2,
      username: 'ramiro',
      password: '1234',
      email: 'ramiro@email.com'
    }
  ])


  const [usuario, setUsuario] = useState(null)


  const login = (username, password) => {

    const usuarioEncontrado = usuarios.find(
      (item) =>
        item.username === username &&
        item.password === password
    )

    if (!usuarioEncontrado) {
      return false
    }

    setUsuario(usuarioEncontrado)

    return true
  }


  const register = (nuevoUsuario) => {

    const usuarioExistente = usuarios.find(
      (item) =>
        item.username === nuevoUsuario.username ||
        item.email === nuevoUsuario.email
    )

    if (usuarioExistente) {
      return {
        success: false,
        message: 'El usuario o email ya se encuentra registrado.'
      }
    }


    const usuarioCreado = {
      id: usuarios.length + 1,
      ...nuevoUsuario
    }


    setUsuarios((usuariosActuales) => [
      ...usuariosActuales,
      usuarioCreado
    ])


    return {
      success: true
    }
  }


  const logout = () => {
    setUsuario(null)
  }


  return (
    <AuthContext.Provider
      value={{
        usuario,
        usuarios,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


export function useAuth() {

  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider'
    )
  }

  return context
}