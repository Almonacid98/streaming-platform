import {
  useEffect,
  useRef,
  useState
} from 'react'

import { useNavigate } from 'react-router-dom'

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


// ==========================================
// PORTADAS
// ==========================================

import interstellarImg from '../assets/posters/interstellar.jpeg'
import batmanImg from '../assets/posters/the-batman.jpeg'
import quietPlaceImg from '../assets/posters/a-quiet-place.jpeg'
import unchartedImg from '../assets/posters/uncharted.jpeg'
import knivesOutImg from '../assets/posters/knives-out.jpg'
import grayManImg from '../assets/posters/the-gray-man.jpg'
import walkingDeadImg from '../assets/posters/the-walking-dead.jpeg'


function Home() {

  const navigate = useNavigate()

  const sliderRef = useRef(null)
  const heroVideoRef = useRef(null)
  const heroTimeoutRef = useRef(null)

  const API_URL =
    import.meta.env.VITE_API_URL


  // ==========================================
  // VIDEO INTERSTELLAR
  // ==========================================

  const [interstellarVideo, setInterstellarVideo] =
    useState(null)


  // ==========================================
  // HERO
  // ==========================================

  const [heroActual, setHeroActual] =
    useState(0)

  const [mouseSobreHero, setMouseSobreHero] =
    useState(false)

  const [heroPreview, setHeroPreview] =
    useState(false)

  const [
    heroAudioBloqueado,
    setHeroAudioBloqueado
  ] = useState(false)


  // ==========================================
  // CARGAR INTERSTELLAR DESDE DJANGO
  // ==========================================

  useEffect(() => {

    let activo = true


    const cargarInterstellar = async () => {

      try {

        const response =
          await fetch(
            `${API_URL}/contenidos/3/`
          )


        if (!response.ok) {

          throw new Error(
            'No se pudo cargar Interstellar.'
          )
        }


        const data =
          await response.json()


        if (activo) {

          setInterstellarVideo(
            data.video_url || null
          )
        }

      } catch (error) {

        console.error(
          'Error cargando Interstellar:',
          error
        )
      }
    }


    cargarInterstellar()


    return () => {
      activo = false
    }

  }, [API_URL])


  // ==========================================
  // CONTENIDOS
  // ==========================================

  const contenidos = [

    {
      id: 1,
      apiId: 3,

      titulo: 'Interstellar',
      tipo: 'Película',
      genero: 'Ciencia ficción',

      descripcion:
        'Un grupo de exploradores viaja a través del espacio en busca de un nuevo hogar para la humanidad.',

      imagen: interstellarImg,
      hero: interstellarHero,

      videoUrl: interstellarVideo
    },

    {
      id: 2,
      apiId: null,

      titulo: 'The Batman',
      tipo: 'Película',
      genero: 'Acción / Crimen',

      descripcion:
        'Batman investiga una serie de crímenes mientras descubre secretos ocultos en Gotham.',

      imagen: batmanImg,
      hero: batmanHero,

      videoUrl: null
    },

    {
      id: 3,
      apiId: null,

      titulo: 'A Quiet Place',
      tipo: 'Película',
      genero: 'Terror / Suspenso',

      descripcion:
        'Una familia debe sobrevivir en completo silencio para evitar criaturas que cazan mediante el sonido.',

      imagen: quietPlaceImg,
      hero: quietPlaceHero,

      videoUrl: null
    },

    {
      id: 4,
      apiId: null,

      titulo: 'Uncharted',
      tipo: 'Película',
      genero: 'Acción / Aventura',

      descripcion:
        'Un joven aventurero comienza una peligrosa búsqueda de un legendario tesoro perdido.',

      imagen: unchartedImg,
      hero: unchartedHero,

      videoUrl: null
    },

    {
      id: 5,
      apiId: null,

      titulo: 'Knives Out',
      tipo: 'Película',
      genero: 'Misterio',

      descripcion:
        'Un detective investiga la misteriosa muerte de un escritor dentro de una familia llena de secretos.',

      imagen: knivesOutImg,
      hero: knivesOutHero,

      videoUrl: null
    },

    {
      id: 6,
      apiId: null,

      titulo: 'The Gray Man',
      tipo: 'Película',
      genero: 'Acción / Thriller',

      descripcion:
        'Un agente encubierto descubre secretos peligrosos y termina perseguido por asesinos internacionales.',

      imagen: grayManImg,
      hero: grayManHero,

      videoUrl: null
    },

    {
      id: 7,
      apiId: null,

      titulo: 'The Walking Dead',
      tipo: 'Serie',
      genero: 'Terror / Drama',

      descripcion:
        'Un grupo de sobrevivientes intenta mantenerse con vida en un mundo devastado por un apocalipsis zombie.',

      imagen: walkingDeadImg,
      hero: walkingDeadHero,

      videoUrl: null
    }
  ]


  const peliculaHero =
    contenidos[heroActual]


  // ==========================================
  // REPRODUCIR CONTENIDO
  // ==========================================

  const reproducirContenido = (contenido) => {

    if (!contenido.apiId) {
      return
    }


    navigate(
      `/watch/${contenido.apiId}`
    )
  }


  // ==========================================
  // SLIDER
  // ==========================================

  const moverSlider = (direccion) => {

    const slider =
      sliderRef.current


    if (!slider) {
      return
    }


    const distancia =
      slider.clientWidth * 0.8


    slider.scrollBy({
      left: direccion * distancia,
      behavior: 'smooth'
    })
  }


  // ==========================================
  // LIMPIAR PREVIEW DEL HERO
  // ==========================================

  const limpiarPreviewHero = () => {

    clearTimeout(
      heroTimeoutRef.current
    )

    heroTimeoutRef.current = null


    if (heroVideoRef.current) {

      heroVideoRef.current.pause()
      heroVideoRef.current.currentTime = 0
    }


    setHeroAudioBloqueado(false)
    setHeroPreview(false)
  }


  // ==========================================
  // CAMBIAR HERO
  // ==========================================

  const siguienteHero = () => {

    limpiarPreviewHero()


    setHeroActual((actual) =>
      actual === contenidos.length - 1
        ? 0
        : actual + 1
    )
  }


  const anteriorHero = () => {

    limpiarPreviewHero()


    setHeroActual((actual) =>
      actual === 0
        ? contenidos.length - 1
        : actual - 1
    )
  }


  // ==========================================
  // CARRUSEL AUTOMÁTICO
  // ==========================================

  useEffect(() => {

    // Mientras el cursor está sobre el Hero,
    // el carrusel queda detenido.

    if (mouseSobreHero) {
      return
    }


    const intervalo =
      setInterval(() => {

        setHeroActual((actual) =>
          actual === contenidos.length - 1
            ? 0
            : actual + 1
        )

      }, 5000)


    return () => {

      clearInterval(
        intervalo
      )
    }

  }, [
    mouseSobreHero,
    contenidos.length
  ])


  // ==========================================
  // CURSOR ENTRA AL HERO
  // ==========================================

  const entrarHero = () => {

    setMouseSobreHero(true)


    // Si la película actual no tiene trailer,
    // solamente detenemos el carrusel.

    if (!peliculaHero.videoUrl) {
      return
    }


    clearTimeout(
      heroTimeoutRef.current
    )


    // Esperamos 2 segundos antes
    // de mostrar el trailer.

    heroTimeoutRef.current =
      setTimeout(() => {

        setHeroPreview(true)

      }, 2000)
  }


  // ==========================================
  // CURSOR SALE DEL HERO
  // ==========================================

  const salirHero = () => {

    setMouseSobreHero(false)

    limpiarPreviewHero()
  }


  // ==========================================
  // REPRODUCIR PREVIEW HERO CON SONIDO
  // ==========================================

  useEffect(() => {

    if (!heroPreview) {
      return
    }


    const video =
      heroVideoRef.current


    if (!video) {
      return
    }


    video.currentTime = 0
    video.muted = false
    video.volume = 1

    setHeroAudioBloqueado(false)


    const reproducir = async () => {

      try {

        await video.play()

        setHeroAudioBloqueado(false)

      } catch (error) {

        console.log(
          'El navegador requiere una interacción para reproducir con sonido.'
        )

        setHeroAudioBloqueado(true)
      }
    }


    reproducir()

  }, [heroPreview])


  // ==========================================
  // ACTIVAR TRAILER CON SONIDO
  // ==========================================

  const activarTrailerConSonido = async () => {

    const video =
      heroVideoRef.current


    if (!video) {
      return
    }


    try {

      video.muted = false
      video.volume = 1

      await video.play()

      setHeroAudioBloqueado(false)

    } catch (error) {

      console.error(
        'No se pudo reproducir el trailer con sonido:',
        error
      )
    }
  }


  // ==========================================
  // LIMPIEZA GENERAL
  // ==========================================

  useEffect(() => {

    return () => {

      clearTimeout(
        heroTimeoutRef.current
      )
    }

  }, [])


  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>

      <Navbar />


      <main>

        {/* =====================================
            HERO PRINCIPAL
        ====================================== */}

        <section
          className="
            hero-section
            position-relative
            overflow-hidden
          "

          onMouseEnter={
            entrarHero
          }

          onMouseLeave={
            salirHero
          }

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


          {/* =================================
              VIDEO DEL HERO
          ================================== */}

          {heroPreview &&
            peliculaHero.videoUrl && (

            <video
              ref={heroVideoRef}

              src={
                peliculaHero.videoUrl
              }

              playsInline
              preload="metadata"

              style={{
                position: 'absolute',

                top: 0,
                left: 0,

                width: '100%',
                height: '100%',

                objectFit: 'cover',

                zIndex: 0
              }}
            >
              Tu navegador no soporta
              reproducción de video.
            </video>

          )}


          {/* =================================
              BOTÓN PARA HABILITAR SONIDO
          ================================== */}

          {heroPreview &&
            heroAudioBloqueado && (

            <button
              type="button"

              onClick={
                activarTrailerConSonido
              }

              className="
                btn
                btn-light
                position-absolute
                top-50
                start-50
                translate-middle
                fw-bold
                px-4
                py-3
                shadow-lg
              "

              style={{
                zIndex: 6
              }}
            >
              🔊 Reproducir trailer
            </button>

          )}


          {/* =================================
              DEGRADADO SOBRE EL VIDEO
          ================================== */}

          {heroPreview && (

            <div
              style={{
                position: 'absolute',

                inset: 0,

                zIndex: 1,

                pointerEvents: 'none',

                background: `
                  linear-gradient(
                    to right,
                    rgba(0,0,0,0.92) 0%,
                    rgba(0,0,0,0.55) 42%,
                    rgba(0,0,0,0.05) 100%
                  ),
                  linear-gradient(
                    to bottom,
                    transparent 65%,
                    #141414 100%
                  )
                `
              }}
            />

          )}


          {/* =================================
              INFORMACIÓN HERO
          ================================== */}

          <div
            className="
              container
              py-5
              position-relative
            "

            style={{
              zIndex: 2
            }}
          >

            <div className="row align-items-center">

              <div className="col-12 col-lg-7">

                <p
                  className="
                    text-uppercase
                    fw-bold
                    text-danger
                    mb-2
                  "
                >
                  Contenido destacado
                </p>


                <h1 className="display-2 fw-bold">
                  {peliculaHero.titulo}
                </h1>


                <p className="hero-genre mb-2">

                  {peliculaHero.tipo}

                  {' • '}

                  {peliculaHero.genero}

                </p>


                <p className="lead mt-3 mb-4">
                  {peliculaHero.descripcion}
                </p>


                <div
                  className="
                    d-flex
                    flex-column
                    flex-sm-row
                    gap-3
                  "
                >

                  {peliculaHero.apiId ? (

                    <button
                      className="
                        btn
                        btn-streaming
                        btn-lg
                      "

                      onClick={() =>
                        reproducirContenido(
                          peliculaHero
                        )
                      }
                    >
                      ▶ Reproducir
                    </button>

                  ) : (

                    <button
                      className="
                        btn
                        btn-secondary
                        btn-lg
                      "

                      disabled
                    >
                      Próximamente
                    </button>

                  )}


                  <button
                    className="
                      btn
                      btn-outline-light
                      btn-lg
                    "
                  >
                    Más información
                  </button>

                </div>

              </div>

            </div>

          </div>


          {/* =================================
              FLECHA IZQUIERDA
          ================================== */}

          <button
            className="
              hero-arrow
              hero-arrow-left
            "

            style={{
              zIndex: 5
            }}

            onClick={
              anteriorHero
            }

            aria-label="Película anterior"
          >
            ‹
          </button>


          {/* =================================
              FLECHA DERECHA
          ================================== */}

          <button
            className="
              hero-arrow
              hero-arrow-right
            "

            style={{
              zIndex: 5
            }}

            onClick={
              siguienteHero
            }

            aria-label="Película siguiente"
          >
            ›
          </button>


          {/* =================================
              INDICADORES HERO
          ================================== */}

          <div
            className="hero-indicators"

            style={{
              zIndex: 5
            }}
          >

            {contenidos.map(
              (contenido, index) => (

                <button
                  key={
                    contenido.id
                  }

                  className={
                    index === heroActual
                      ? 'hero-dot active'
                      : 'hero-dot'
                  }

                  onClick={() => {

                    limpiarPreviewHero()

                    setHeroActual(
                      index
                    )
                  }}

                  aria-label={
                    `Mostrar ${contenido.titulo}`
                  }
                />

              )
            )}

          </div>

        </section>


        {/* =====================================
            CONTENIDOS DESTACADOS
        ====================================== */}

        <section className="content-section py-5">

          <div
            className="
              container-fluid
              px-4
              px-lg-5
            "
          >

            <div className="mb-4">

              <h2 className="fw-bold mb-2">
                Películas destacadas
              </h2>


              <p className="text-secondary mb-0">
                Descubrí películas seleccionadas
                para vos.
              </p>

            </div>


            <div className="streaming-slider-wrapper">


              {/* =================================
                  FLECHA IZQUIERDA
              ================================== */}

              <button
                className="
                  slider-button
                  slider-button-left
                "

                onClick={() =>
                  moverSlider(-1)
                }

                aria-label="Contenido anterior"
              >
                ‹
              </button>


              {/* =================================
                  CARRUSEL
              ================================== */}

              <div
                className="streaming-slider"

                ref={
                  sliderRef
                }
              >

                {contenidos.map(
                  (contenido) => (

                    <ContentCard
                      key={
                        contenido.id
                      }

                      titulo={
                        contenido.titulo
                      }

                      tipo={
                        contenido.tipo
                      }

                      genero={
                        contenido.genero
                      }

                      descripcion={
                        contenido.descripcion
                      }

                      imagen={
                        contenido.imagen
                      }

                      videoUrl={
                        contenido.videoUrl
                      }

                      disponible={
                        Boolean(
                          contenido.apiId
                        )
                      }

                      onReproducir={() =>
                        reproducirContenido(
                          contenido
                        )
                      }
                    />

                  )
                )}

              </div>


              {/* =================================
                  FLECHA DERECHA
              ================================== */}

              <button
                className="
                  slider-button
                  slider-button-right
                "

                onClick={() =>
                  moverSlider(1)
                }

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

              Disfrutá tus contenidos favoritos
              desde tu computadora, tablet o celular.

            </p>

          </div>

        </section>

      </main>


      <Footer />

    </>
  )
}


export default Home