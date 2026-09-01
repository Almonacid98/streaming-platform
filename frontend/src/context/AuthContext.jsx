import { createContext, useContext, useState } from 'react'


const AuthContext = createContext()


export function AuthProvider({ children }) {

  // USUARIOS HARDCODEADOS
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


  // Usuario actualmente autenticado
  const [usuario, setUsuario] = useState(null)

  // LOGIN
  const login = (username, password) => {

    const usuarioEncontrado = usuarios.find(
      (usuario) =>
        usuario.username === username &&
        usuario.password === password
    )

    if (usuarioEncontrado) {

      setUsuario(usuarioEncontrado)

      return true
    }

    return false
  }

  // REGISTRO
  const register = (nuevoUsuario) => {

    const usuarioExistente = usuarios.find(
      (usuario) =>
        usuario.username === nuevoUsuario.username ||
        usuario.email === nuevoUsuario.email
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


    setUsuarios([
      ...usuarios,
      usuarioCreado
    ])


    return {
      success: true
    }
  }

  // LOGOUT
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

  return useContext(AuthContext)
}