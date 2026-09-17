import {
  useEffect,
  useRef,
  useState
} from 'react'

import { useNavigate } from 'react-router-dom'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ContentCard from '../components/ContentCard'


function Home() {

  const navigate = useNavigate()

  const sliderRef = useRef(null)
  const heroVideoRef = useRef(null)
  const heroTimeoutRef = useRef(null)

  const API_URL =
    import.meta.env.VITE_API_URL


  // ==========================================
  // CONTENIDOS DESDE DJANGO
  // ==========================================

  const [contenidos, setContenidos] =
    useState([])

  const [cargandoContenidos, setCargandoContenidos] =
    useState(true)

  const [errorContenidos, setErrorContenidos] =
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
  // CARGAR CATÁLOGO DESDE DJANGO
  // ==========================================

  useEffect(() => {

    let activo = true


    const cargarContenidos = async () => {

      try {

        setCargandoContenidos(true)
        setErrorContenidos(null)


        const response =
          await fetch(
            `${API_URL}/contenidos/`
          )


        if (!response.ok) {

          throw new Error(
            'No se pudo cargar el catálogo.'
          )
        }


        const data =
          await response.json()


        if (!Array.isArray(data)) {

          throw new Error(
            'La respuesta del catálogo no es válida.'
          )
        }


        if (activo) {

          const contenidosAdaptados =
            data.map((contenido) => ({

              id: contenido.id,

              apiId: contenido.id,

              titulo:
                contenido.titulo,

              tipo:
                contenido.tipo,

              genero:
                contenido.genero,

              descripcion:
                contenido.descripcion ||
                'Sin descripción disponible.',

              imagen:
                contenido.portada_url ||
                null,

              hero:
                contenido.hero_url ||
                contenido.portada_url ||
                null,

              videoUrl:
                contenido.video_url ||
                null,

              videoHlsUrl:
                contenido.video_hls_url ||
                null,

              anio:
                contenido.anio,

              duracionMin:
                contenido.duracion_min

            }))


          setContenidos(
            contenidosAdaptados
          )


          setHeroActual(0)
        }

      } catch (error) {

        console.error(
          'Error cargando contenidos:',
          error
        )


        if (activo) {

          setErrorContenidos(
            'No se pudo cargar el catálogo.'
          )
        }

      } finally {

        if (activo) {

          setCargandoContenidos(false)
        }
      }
    }


    cargarContenidos()


    return () => {

      activo = false
    }

  }, [API_URL])


  // ==========================================
  // CONTENIDO ACTUAL DEL HERO
  // ==========================================

  const peliculaHero =
    contenidos[heroActual] || null


  // ==========================================
  // REPRODUCIR CONTENIDO
  // ==========================================

  const reproducirContenido = (contenido) => {

    if (!contenido?.apiId) {
      return
    }


    navigate(
      `/watch/${contenido.apiId}`
    )
  }


  // ==========================================
  // VER DETALLE DEL CONTENIDO
  // ==========================================

  const verDetalleContenido = (contenido) => {

    if (!contenido?.apiId) {
      return
    }


    navigate(
      `/content/${contenido.apiId}`
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

    if (contenidos.length === 0) {
      return
    }


    limpiarPreviewHero()


    setHeroActual((actual) =>
      actual === contenidos.length - 1
        ? 0
        : actual + 1
    )
  }


  const anteriorHero = () => {

    if (contenidos.length === 0) {
      return
    }


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

    if (
      mouseSobreHero ||
      contenidos.length <= 1
    ) {
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


    if (!peliculaHero?.videoUrl) {
      return
    }


    clearTimeout(
      heroTimeoutRef.current
    )


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
  // CAMBIO DE CONTENIDO DEL HERO
  // ==========================================

  useEffect(() => {

    limpiarPreviewHero()

  }, [heroActual])


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
  // CARGANDO CATÁLOGO
  // ==========================================

  if (cargandoContenidos) {

    return (
      <>
        <Navbar />

        <main
          className="
            min-vh-100
            d-flex
            justify-content-center
            align-items-center
            bg-dark
            text-white
          "
        >
          <div className="text-center">

            <div
              className="
                spinner-border
                text-danger
                mb-3
              "
              role="status"
            >
              <span className="visually-hidden">
                Cargando...
              </span>
            </div>

            <p>
              Cargando catálogo...
            </p>

          </div>
        </main>

        <Footer />
      </>
    )
  }


  // ==========================================
  // ERROR AL CARGAR
  // ==========================================

  if (errorContenidos) {

    return (
      <>
        <Navbar />

        <main
          className="
            min-vh-100
            d-flex
            justify-content-center
            align-items-center
            bg-dark
            text-white
          "
        >
          <div className="text-center">

            <h2 className="fw-bold mb-3">
              No pudimos cargar el catálogo
            </h2>

            <p className="text-secondary">
              {errorContenidos}
            </p>

          </div>
        </main>

        <Footer />
      </>
    )
  }


  // ==========================================
  // CATÁLOGO VACÍO
  // ==========================================

  if (
    contenidos.length === 0 ||
    !peliculaHero
  ) {

    return (
      <>
        <Navbar />

        <main
          className="
            min-vh-100
            d-flex
            justify-content-center
            align-items-center
            bg-dark
            text-white
          "
        >
          <div className="text-center">

            <h2 className="fw-bold mb-3">
              Catálogo vacío
            </h2>

            <p className="text-secondary">
              Todavía no hay contenidos disponibles.
            </p>

          </div>
        </main>

        <Footer />
      </>
    )
  }


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

                  {peliculaHero.anio && (
                    <>
                      {' • '}
                      {peliculaHero.anio}
                    </>
                  )}

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


                  <button
                    className="
                      btn
                      btn-outline-light
                      btn-lg
                    "

                    onClick={() =>
                      verDetalleContenido(
                        peliculaHero
                      )
                    }
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

          {contenidos.length > 1 && (

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

              aria-label="Contenido anterior"
            >
              ‹
            </button>

          )}


          {/* =================================
              FLECHA DERECHA
          ================================== */}

          {contenidos.length > 1 && (

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

              aria-label="Contenido siguiente"
            >
              ›
            </button>

          )}


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
                Contenidos destacados
              </h2>


              <p className="text-secondary mb-0">
                Descubrí películas y series
                seleccionadas para vos.
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

                      onVerDetalle={() =>
                        verDetalleContenido(
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