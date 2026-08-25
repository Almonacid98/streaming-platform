import { useEffect, useRef, useState } from 'react'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ContentCard from '../components/ContentCard'


// ==========================================
// IMÁGENES HERO
// ==========================================
import interstellarHero from '../assets/hero/interstellar-hero.jpeg'
import batmanHero from '../assets/hero/the-batman-hero.jpeg'
import quietPlaceHero from '../assets/hero/a-quiet-place-hero.jpeg'
import unchartedHero from '../assets/hero/uncharted-hero.jpeg'
import knivesOutHero from '../assets/hero/knives-out-hero.jpeg'
import grayManHero from '../assets/hero/the-gray-man-hero.jpeg'
import walkingDeadHero from '../assets/hero/the-walking-dead-hero.jpg'
import walkingDeadImg from '../assets/posters/the-walking-dead.jpeg'

// ==========================================
// PORTADAS
// ==========================================
import interstellarImg from '../assets/posters/interstellar.jpeg'
import batmanImg from '../assets/posters/the-batman.jpeg'
import quietPlaceImg from '../assets/posters/a-quiet-place.jpeg'
import unchartedImg from '../assets/posters/uncharted.jpeg'
import knivesOutImg from '../assets/posters/knives-out.jpg'
import grayManImg from '../assets/posters/the-gray-man.jpg'


function Home() {

  // ==========================================
  // CARRUSEL DE CONTENIDOS
  // ==========================================
  const sliderRef = useRef(null)

  const moverSlider = (direccion) => {
    const slider = sliderRef.current

    if (!slider) return

    const distancia = slider.clientWidth * 0.8

    slider.scrollBy({
      left: direccion * distancia,
      behavior: 'smooth'
    })
  }


  // ==========================================
  // PELÍCULAS
  // ==========================================
  const contenidos = [
    {
      id: 1,
      titulo: 'Interstellar',
      tipo: 'Película',
      genero: 'Ciencia ficción',
      descripcion:
        'Un grupo de exploradores viaja a través del espacio en busca de un nuevo hogar para la humanidad.',
      imagen: interstellarImg,
      hero: interstellarHero
    },

    {
      id: 2,
      titulo: 'The Batman',
      tipo: 'Película',
      genero: 'Acción / Crimen',
      descripcion:
        'Batman investiga una serie de crímenes mientras descubre secretos ocultos en Gotham.',
      imagen: batmanImg,
      hero: batmanHero
    },

    {
      id: 3,
      titulo: 'A Quiet Place',
      tipo: 'Película',
      genero: 'Terror / Suspenso',
      descripcion:
        'Una familia debe sobrevivir en completo silencio para evitar criaturas que cazan mediante el sonido.',
      imagen: quietPlaceImg,
      hero: quietPlaceHero
    },

    {
      id: 4,
      titulo: 'Uncharted',
      tipo: 'Película',
      genero: 'Acción / Aventura',
      descripcion:
        'Un joven aventurero comienza una peligrosa búsqueda de un legendario tesoro perdido.',
      imagen: unchartedImg,
      hero: unchartedHero
    },

    {
      id: 5,
      titulo: 'Knives Out',
      tipo: 'Película',
      genero: 'Misterio',
      descripcion:
        'Un detective investiga la misteriosa muerte de un escritor dentro de una familia llena de secretos.',
      imagen: knivesOutImg,
      hero: knivesOutHero
    },

    {
      id: 6,
      titulo: 'The Gray Man',
      tipo: 'Película',
      genero: 'Acción / Thriller',
      descripcion:
        'Un agente encubierto descubre secretos peligrosos y termina perseguido por asesinos internacionales.',
      imagen: grayManImg,
      hero: grayManHero
    },
    {
      id: 7,
      titulo: 'The Walking Dead',
      tipo: 'Serie',
      genero: 'Terror / Drama',
      descripcion:
        'Un grupo de sobrevivientes intenta mantenerse con vida en un mundo devastado por un apocalipsis zombie.',
      imagen: walkingDeadImg,
      hero: walkingDeadHero
    }
  ]


  // ==========================================
  // HERO AUTOMÁTICO
  // ==========================================
  const [heroActual, setHeroActual] = useState(0)

  const siguienteHero = () => {
    setHeroActual((actual) =>
      actual === contenidos.length - 1
        ? 0
        : actual + 1
    )
  }

  const anteriorHero = () => {
    setHeroActual((actual) =>
      actual === 0
        ? contenidos.length - 1
        : actual - 1
    )
  }


  // Cambia automáticamente cada 5 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      setHeroActual((actual) =>
        actual === contenidos.length - 1
          ? 0
          : actual + 1
      )
    }, 5000)

    return () => clearInterval(intervalo)
  }, [contenidos.length])


  const peliculaHero = contenidos[heroActual]


  return (
    <>
      <Navbar />

      <main>

        {/* =====================================
            HERO PRINCIPAL
        ====================================== */}
        <section
          className="hero-section"
          style={{
            backgroundImage: `
              linear-gradient(
                to right,
                rgba(0, 0, 0, 0.95) 0%,
                rgba(0, 0, 0, 0.72) 40%,
                rgba(0, 0, 0, 0.20) 100%
              ),
              linear-gradient(
                to bottom,
                rgba(0, 0, 0, 0.05) 60%,
                #141414 100%
              ),
              url(${peliculaHero.hero})
            `
          }}
        >

          <div className="container py-5">

            <div className="row align-items-center">

              <div className="col-12 col-lg-7">

                <p className="text-uppercase fw-bold text-danger mb-2">
                  Contenido destacado
                </p>

                <h1 className="display-2 fw-bold">
                  {peliculaHero.titulo}
                </h1>

                <p className="hero-genre mb-2">
                  {peliculaHero.tipo} • {peliculaHero.genero}
                </p>

                <p className="lead mt-3 mb-4">
                  {peliculaHero.descripcion}
                </p>


                <div className="d-flex flex-column flex-sm-row gap-3">

                  <button className="btn btn-streaming btn-lg">
                    ▶ Reproducir
                  </button>

                  <button className="btn btn-outline-light btn-lg">
                    Más información
                  </button>

                </div>

              </div>

            </div>

          </div>


          {/* FLECHAS HERO */}
          <button
            className="hero-arrow hero-arrow-left"
            onClick={anteriorHero}
            aria-label="Película anterior"
          >
            ‹
          </button>

          <button
            className="hero-arrow hero-arrow-right"
            onClick={siguienteHero}
            aria-label="Película siguiente"
          >
            ›
          </button>


          {/* INDICADORES HERO */}
          <div className="hero-indicators">

            {contenidos.map((contenido, index) => (
              <button
                key={contenido.id}
                className={
                  index === heroActual
                    ? 'hero-dot active'
                    : 'hero-dot'
                }
                onClick={() => setHeroActual(index)}
                aria-label={`Mostrar ${contenido.titulo}`}
              />
            ))}

          </div>

        </section>


        {/* =====================================
            CONTENIDO DESTACADO
        ====================================== */}
        <section className="content-section py-5">

          <div className="container-fluid px-4 px-lg-5">

            <div className="mb-4">

              <h2 className="fw-bold mb-2">
                Películas destacadas
              </h2>

              <p className="text-secondary mb-0">
                Descubrí películas seleccionadas para vos.
              </p>

            </div>


            <div className="streaming-slider-wrapper">

              {/* FLECHA IZQUIERDA */}
              <button
                className="slider-button slider-button-left"
                onClick={() => moverSlider(-1)}
                aria-label="Contenido anterior"
              >
                ‹
              </button>


              {/* CARRUSEL */}
              <div
                className="streaming-slider"
                ref={sliderRef}
              >

                {contenidos.map((contenido) => (

                  <ContentCard
                    key={contenido.id}
                    titulo={contenido.titulo}
                    tipo={contenido.tipo}
                    genero={contenido.genero}
                    descripcion={contenido.descripcion}
                    imagen={contenido.imagen}
                  />

                ))}

              </div>


              {/* FLECHA DERECHA */}
              <button
                className="slider-button slider-button-right"
                onClick={() => moverSlider(1)}
                aria-label="Contenido siguiente"
              >
                ›
              </button>

            </div>

          </div>

        </section>


        {/* =====================================
            DISPOSITIVOS
        ====================================== */}
        <section className="py-5 bg-black">

          <div className="container text-center">

            <h2 className="fw-bold mb-3">
              Mirá donde quieras
            </h2>

            <p className="text-secondary mb-0">
              Disfrutá tus contenidos favoritos desde tu computadora,
              tablet o celular.
            </p>

          </div>

        </section>

      </main>

      <Footer />
    </>
  )
}

export default Home