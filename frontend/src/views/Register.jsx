import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import AuthBackground from '../components/AuthBackground'


function Register() {

  const navigate = useNavigate()
  const { register } = useAuth()

  const [formulario, setFormulario] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


  // Actualiza los campos del formulario
  const handleChange = (event) => {

    const { name, value } = event.target

    setFormulario({
      ...formulario,
      [name]: value
    })
  }


  // Procesa el registro
  const handleSubmit = (event) => {

    event.preventDefault()

    setError('')
    setSuccess('')


    // Verificar que las contraseñas coincidan
    if (formulario.password !== formulario.confirmPassword) {

      setError('Las contraseñas no coinciden.')

      return
    }


    // Validación básica
    if (formulario.password.length < 4) {

      setError(
        'La contraseña debe tener al menos 4 caracteres.'
      )

      return
    }


    const resultado = register({
      username: formulario.username,
      email: formulario.email,
      password: formulario.password
    })


    if (!resultado.success) {

      setError(resultado.message)

      return
    }


    setSuccess(
      'Cuenta creada correctamente. Redirigiendo al login...'
    )


    // Pequeña pausa para mostrar el mensaje
    setTimeout(() => {
      navigate('/login')
    }, 1200)
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
                  Crear cuenta
                </h2>

                <p className="text-secondary">
                  Registrate para comenzar a disfrutar
                  del contenido.
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


              {/* REGISTRO EXITOSO */}
              {success && (

                <div
                  className="alert alert-success"
                  role="alert"
                >
                  {success}
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
                    name="username"
                    type="text"
                    className="form-control auth-input"
                    value={formulario.username}
                    onChange={handleChange}
                    placeholder="Elegí un nombre de usuario"
                    required
                  />

                </div>


                {/* EMAIL */}
                <div className="mb-3">

                  <label
                    htmlFor="email"
                    className="form-label"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-control auth-input"
                    value={formulario.email}
                    onChange={handleChange}
                    placeholder="nombre@email.com"
                    required
                  />

                </div>


                {/* CONTRASEÑA */}
                <div className="mb-3">

                  <label
                    htmlFor="password"
                    className="form-label"
                  >
                    Contraseña
                  </label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="form-control auth-input"
                    value={formulario.password}
                    onChange={handleChange}
                    placeholder="Creá una contraseña"
                    required
                  />

                </div>


                {/* REPETIR CONTRASEÑA */}
                <div className="mb-4">

                  <label
                    htmlFor="confirmPassword"
                    className="form-label"
                  >
                    Repetir contraseña
                  </label>

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className="form-control auth-input"
                    value={formulario.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repetí la contraseña"
                    required
                  />

                </div>


                {/* BOTÓN */}
                <button
                  type="submit"
                  className="btn btn-streaming w-100 py-2"
                >
                  Crear cuenta
                </button>

              </form>


              {/* VOLVER AL LOGIN */}
              <div className="text-center mt-4">

                <span className="text-secondary">
                  ¿Ya tenés una cuenta?{' '}
                </span>

                <Link
                  to="/login"
                  className="auth-link"
                >
                  Iniciar sesión
                </Link>

              </div>

            </div>

          </div>

        </div>

      </div>

    </AuthBackground>

  )
}


export default Register