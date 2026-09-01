import { useState } from 'react'
import {
  Link,
  useNavigate
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'


function Login() {

  const navigate = useNavigate()

  const { login } = useAuth()


  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')


  const handleSubmit = (event) => {

    event.preventDefault()

    setError('')


    const loginCorrecto = login(
      username,
      password
    )


    if (loginCorrecto) {

      navigate('/')

      return
    }


    setError(
      'Usuario o contraseña incorrectos.'
    )
  }


  return (
    <main className="auth-page">

      <div className="container">

        <div className="row justify-content-center">

          <div className="col-12 col-md-8 col-lg-5">

            <div className="auth-card">

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


              {error && (
                <div
                  className="alert alert-danger"
                  role="alert"
                >
                  {error}
                </div>
              )}


              <form onSubmit={handleSubmit}>

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
                      setUsername(event.target.value)
                    }
                    placeholder="Ingresá tu usuario"
                    required
                  />

                </div>


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
                      setPassword(event.target.value)
                    }
                    placeholder="Ingresá tu contraseña"
                    required
                  />

                </div>


                <button
                  type="submit"
                  className="btn btn-streaming w-100 py-2"
                >
                  Iniciar sesión
                </button>

              </form>


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

    </main>
  )
}


export default Login