import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <section className="bg-primary text-white text-center py-5">
          <div className="container">
            <h1 className="display-4">
              Streaming Platform
            </h1>

            <p className="lead">
              Disfrutá de tus películas y series favoritas.
            </p>

            <button className="btn btn-light">
              Explorar contenido
            </button>
          </div>
        </section>

        <section className="container py-5">
          <h2 className="text-center mb-4">
            Contenido destacado
          </h2>

          <div className="row">

            <div className="col-md-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">
                    Película destacada
                  </h5>

                  <p className="card-text">
                    Una película disponible en nuestra plataforma.
                  </p>

                  <button className="btn btn-primary">
                    Ver contenido
                  </button>
                </div>
              </div>
            </div>

            <div className="col-md-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">
                    Serie destacada
                  </h5>

                  <p className="card-text">
                    Una serie disponible en nuestra plataforma.
                  </p>

                  <button className="btn btn-primary">
                    Ver contenido
                  </button>
                </div>
              </div>
            </div>

            <div className="col-md-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">
                    Nuevo contenido
                  </h5>

                  <p className="card-text">
                    Descubrí las novedades de la plataforma.
                  </p>

                  <button className="btn btn-primary">
                    Ver contenido
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default Home