import { useState } from 'react'

import {
  NavLink,
  useNavigate
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'


function Navbar() {

  const navigate = useNavigate()

  const { usuario, logout } = useAuth()

  const [cerrandoSesion, setCerrandoSesion] =
    useState(false)


  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const handleLogout = async () => {

    setCerrandoSesion(true)

    await logout()

    navigate('/login')
  }


  return (

    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">

      <div className="container">


        {/* LOGO */}

        <NavLink
          className="navbar-brand streaming-logo"
          to="/"
        >

          <span className="logo-stream">
            STREAM
          </span>

          <span className="logo-platform">
            PLATFORM
          </span>

        </NavLink>


        {/* BOTÓN RESPONSIVE */}

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMenu"
          aria-controls="navbarMenu"
          aria-expanded="false"
          aria-label="Abrir navegación"
        >

          <span className="navbar-toggler-icon"></span>

        </button>


        <div
          className="collapse navbar-collapse"
          id="navbarMenu"
        >

          <ul className="navbar-nav ms-auto align-items-lg-center">


            {/* INICIO */}

            <li className="nav-item">

              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? 'nav-link active'
                    : 'nav-link'
                }
                to="/"
                end
              >
                Inicio
              </NavLink>

            </li>


            {/* CATÁLOGO */}

            <li className="nav-item">

              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? 'nav-link active'
                    : 'nav-link'
                }
                to="/catalog"
              >
                Catálogo
              </NavLink>

            </li>


            {/* PELÍCULAS */}

            <li className="nav-item">

              <NavLink
                className="nav-link"
                to="/catalog?tipo=pelicula"
              >
                Películas
              </NavLink>

            </li>


            {/* SERIES */}

            <li className="nav-item">

              <NavLink
                className="nav-link"
                to="/catalog?tipo=serie"
              >
                Series
              </NavLink>

            </li>


            {/* USUARIO AUTENTICADO */}

            {usuario && (

              <>

                <li className="nav-item">

                  <span className="nav-link">

                    Hola, {usuario.username}

                  </span>

                </li>


                {/* CERRAR SESIÓN */}

                <li className="nav-item ms-lg-2">

                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleLogout}
                    disabled={cerrandoSesion}
                  >

                    {
                      cerrandoSesion
                        ? 'Cerrando...'
                        : 'Cerrar sesión'
                    }

                  </button>

                </li>

              </>

            )}

          </ul>

        </div>

      </div>

    </nav>

  )
}


export default Navbar