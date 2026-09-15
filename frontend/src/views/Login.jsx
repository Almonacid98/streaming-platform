import { useState } from 'react'
import AuthBackground from '../components/AuthBackground'

import {
  Link,
  useNavigate
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'


function Login() {

  const navigate = useNavigate()

  const { login } = useAuth()


  // ==========================================
  // ESTADOS
  // ==========================================

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)


  // ==========================================
  // INICIAR SESIÓN
  // ==========================================

  const handleSubmit = async (event) => {

    event.preventDefault()

    setError('')
    setCargando(true)


    // Esperar respuesta del AuthContext
    const loginCorrecto = await login(
      username,
      password
    )


    setCargando(false)


    // ========================================
    // LOGIN CORRECTO
    // ========================================

    if (loginCorrecto) {

      navigate('/')

      return
    }


    // ========================================
    // LOGIN INCORRECTO
    // ========================================

    setError(
      'Usuario o contraseña incorrectos.'
    )
  }


  return (

    <AuthBackground>

      <div className="container">

        <div className="row justify-content-center">

          <div className="col-12 col-md-8 col-lg-5">

            <div className="auth-card">


              {/* LOGO */}

              <div className="text-center mb-4">

                <h1 className="auth-logo">
                  STREAM <span>PLATFORM</span>
                </h1>

                <h2 className="fw-bold mt-4">
                  Iniciar sesión
                </h2>

                <p className="text-secondary">
                  Ingresá a tu cuenta para continuar.
                </p>

              </div>


              {/* ERROR */}

              {error && (

                <div
                  className="alert alert-danger"
                  role="alert"
                >

                  {error}

                </div>

              )}


              {/* FORMULARIO */}

              <form onSubmit={handleSubmit}>


                {/* USUARIO */}

                <div className="mb-3">

                  <label
                    htmlFor="username"
                    className="form-label"
                  >
                    Usuario
                  </label>

                  <input
                    id="username"
                    type="text"
                    className="form-control auth-input"
                    value={username}

                    onChange={(event) =>
                      setUsername(
                        event.target.value
                      )
                    }

                    placeholder="Ingresá tu usuario"
                    required
                    disabled={cargando}
                  />

                </div>


                {/* CONTRASEÑA */}

                <div className="mb-4">

                  <label
                    htmlFor="password"
                    className="form-label"
                  >
                    Contraseña
                  </label>

                  <input
                    id="password"
                    type="password"
                    className="form-control auth-input"
                    value={password}

                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }

                    placeholder="Ingresá tu contraseña"
                    required
                    disabled={cargando}
                  />

                </div>


                {/* BOTÓN */}

                <button
                  type="submit"
                  className="btn btn-streaming w-100 py-2"
                  disabled={cargando}
                >

                  {
                    cargando
                      ? 'Iniciando sesión...'
                      : 'Iniciar sesión'
                  }

                </button>

              </form>


              {/* REGISTRO */}

              <div className="text-center mt-4">

                <span className="text-secondary">
                  ¿Todavía no tenés una cuenta?{' '}
                </span>

                <Link
                  to="/register"
                  className="auth-link"
                >
                  Registrate
                </Link>

              </div>

            </div>

          </div>

        </div>

      </div>

    </AuthBackground>
  )
}


export default Login