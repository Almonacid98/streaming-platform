import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'


function Navbar() {

  const navigate = useNavigate()

  const { usuario, logout } = useAuth()


  // Cerrar la sesión actual
  const handleLogout = () => {

    logout()

    navigate('/login')

  }


  return (

    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">

      <div className="container">


        {/* LOGO */}
        <a
          className="navbar-brand streaming-logo"
          href="#"
        >

          <span className="logo-stream">
            STREAM
          </span>

          <span className="logo-platform">
            PLATFORM
          </span>

        </a>


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

              <a
                className="nav-link active"
                href="#"
              >
                Inicio
              </a>

            </li>


            {/* PELÍCULAS */}
            <li className="nav-item">

              <a
                className="nav-link"
                href="#"
              >
                Películas
              </a>

            </li>


            {/* SERIES */}
            <li className="nav-item">

              <a
                className="nav-link"
                href="#"
              >
                Series
              </a>

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
                  >

                    Cerrar sesión

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