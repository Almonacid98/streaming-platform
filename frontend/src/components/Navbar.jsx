function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">

        <a className="navbar-brand streaming-logo" href="#">
          <span className="logo-stream">STREAM</span>
          <span className="logo-platform">PLATFORM</span>
        </a>

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
          <ul className="navbar-nav ms-auto">

            <li className="nav-item">
              <a className="nav-link active" href="#">
                Inicio
              </a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="#">
                Películas
              </a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="#">
                Series
              </a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="#">
                Mi perfil
              </a>
            </li>

          </ul>
        </div>

      </div>
    </nav>
  )
}

export default Navbar