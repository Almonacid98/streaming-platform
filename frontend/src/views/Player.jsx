import {
  useEffect,
  useRef,
  useState
} from 'react'

import {
  useNavigate,
  useParams
} from 'react-router-dom'

import Hls from 'hls.js'

import { useAuth } from '../context/AuthContext'


function Player() {

  const { id } = useParams()
  const navigate = useNavigate()

  const { authFetch } = useAuth()

  const videoRef = useRef(null)

  const [contenido, setContenido] =
    useState(null)

  const [progresoGuardado, setProgresoGuardado] =
    useState(0)

  const [mostrarReanudacion, setMostrarReanudacion] =
    useState(false)

  const [decisionTomada, setDecisionTomada] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')


  const API_URL =
    import.meta.env.VITE_API_URL


  // ==========================================
  // HLS LOCAL DE PRUEBA
  // ==========================================

  const HLS_PRUEBA_URL =
    'http://localhost:8081/interstellar_prueba/index.m3u8'


  // ==========================================
  // FORMATEAR TIEMPO
  // ==========================================

  const formatearTiempo = (segundos) => {

    const minutos =
      Math.floor(segundos / 60)

    const segundosRestantes =
      Math.floor(segundos % 60)

    return (
      `${minutos}:` +
      `${String(segundosRestantes).padStart(2, '0')}`
    )
  }


  // ==========================================
  // CARGAR CONTENIDO Y PROGRESO
  // ==========================================

  useEffect(() => {

    let activo = true


    const cargarDatos = async () => {

      try {

        setLoading(true)
        setError('')


        const responseContenido =
          await fetch(
            `${API_URL}/contenidos/${id}/`
          )


        if (!responseContenido.ok) {

          throw new Error(
            'No se pudo cargar el contenido.'
          )
        }


        const dataContenido =
          await responseContenido.json()


        const responseVisualizaciones =
          await authFetch(
            `${API_URL}/visualizaciones/`
          )


        if (!responseVisualizaciones.ok) {

          throw new Error(
            'No se pudo recuperar el progreso.'
          )
        }


        const visualizaciones =
          await responseVisualizaciones.json()


        const visualizacion =
          visualizaciones.find(
            (item) =>
              Number(item.contenido) ===
              Number(id)
          )


        const progreso =
          visualizacion
            ? Number(
                visualizacion.progreso_segundos
              )
            : 0


        if (activo) {

          setContenido(
            dataContenido
          )

          setProgresoGuardado(
            progreso || 0
          )


          if (progreso > 0) {

            setMostrarReanudacion(true)
            setDecisionTomada(false)

          } else {

            setMostrarReanudacion(false)
            setDecisionTomada(true)
          }
        }

      } catch (error) {

        console.error(
          'Error al cargar el reproductor:',
          error
        )


        if (activo) {

          setError(
            'No se pudo cargar el reproductor.'
          )
        }

      } finally {

        if (activo) {
          setLoading(false)
        }
      }
    }


    cargarDatos()


    return () => {
      activo = false
    }

  }, [API_URL, id])


  // ==========================================
  // CONFIGURAR HLS
  // ==========================================

  useEffect(() => {

    const video =
      videoRef.current


    if (!video || !contenido) {
      return
    }


    // Por ahora solamente el contenido 3
    // utiliza nuestro HLS local de prueba.

    if (Number(id) !== 3) {

      if (contenido.video_url) {
        video.src = contenido.video_url
      }

      return
    }


    console.log(
      'Cargando HLS:',
      HLS_PRUEBA_URL
    )


    // Safari y algunos navegadores pueden
    // reproducir HLS directamente.

    if (
      video.canPlayType(
        'application/vnd.apple.mpegurl'
      )
    ) {

      video.src = HLS_PRUEBA_URL

      return
    }


    // Chrome, Firefox, Edge, etc.
    // utilizan hls.js.

    if (Hls.isSupported()) {

      const hls =
        new Hls()


      hls.loadSource(
        HLS_PRUEBA_URL
      )


      hls.attachMedia(
        video
      )


      hls.on(
        Hls.Events.MANIFEST_PARSED,
        () => {

          console.log(
            'Manifiesto HLS cargado correctamente.'
          )
        }
      )


      hls.on(
        Hls.Events.ERROR,
        (event, data) => {

          console.error(
            'Error HLS:',
            data
          )
        }
      )


      return () => {

        hls.destroy()
      }
    }


    setError(
      'Este navegador no soporta reproducción HLS.'
    )

  }, [contenido, id])


  // ==========================================
  // GUARDAR PROGRESO
  // ==========================================

  const guardarProgreso = async (
    segundosPersonalizados = null
  ) => {

    const video =
      videoRef.current


    let segundos =
      segundosPersonalizados


    if (segundos === null) {

      if (!video) {
        return
      }

      segundos =
        Math.floor(video.currentTime)
    }


    segundos =
      Math.floor(Number(segundos))


    if (
      !Number.isFinite(segundos) ||
      segundos < 0
    ) {
      return
    }


    try {

      const response =
        await authFetch(
          `${API_URL}/visualizaciones/`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              contenido: Number(id),
              progreso_segundos: segundos
            })
          }
        )


      if (!response.ok) {

        console.error(
          'No se pudo guardar el progreso.'
        )

        return
      }


      setProgresoGuardado(
        segundos
      )


      console.log(
        `Progreso guardado: ${segundos} segundos`
      )

    } catch (error) {

      console.error(
        'Error al guardar el progreso:',
        error
      )
    }
  }


  // ==========================================
  // CONTINUAR VIDEO
  // ==========================================

  const continuarVideo = async () => {

    const video =
      videoRef.current


    if (!video) {
      return
    }


    // La prueba HLS solamente dura 2 minutos.
    // Evitamos intentar posicionarnos fuera
    // de su duración.

    let tiempoContinuacion =
      progresoGuardado


    if (
      Number.isFinite(video.duration) &&
      tiempoContinuacion >= video.duration
    ) {

      tiempoContinuacion = 0
    }


    video.currentTime =
      tiempoContinuacion


    setMostrarReanudacion(false)
    setDecisionTomada(true)


    try {

      await video.play()

    } catch (error) {

      console.error(
        'El navegador no pudo iniciar el video:',
        error
      )
    }
  }


  // ==========================================
  // EMPEZAR DESDE EL INICIO
  // ==========================================

  const empezarDesdeInicio = async () => {

    const video =
      videoRef.current


    if (!video) {
      return
    }


    video.currentTime = 0


    setMostrarReanudacion(false)
    setDecisionTomada(true)


    await guardarProgreso(0)


    try {

      await video.play()

    } catch (error) {

      console.error(
        'El navegador no pudo iniciar el video:',
        error
      )
    }
  }


  // ==========================================
  // GUARDADO AUTOMÁTICO CADA 10 SEGUNDOS
  // ==========================================

  useEffect(() => {

    if (
      !contenido ||
      !decisionTomada
    ) {
      return
    }


    const intervalo =
      setInterval(() => {

        const video =
          videoRef.current


        if (
          video &&
          !video.paused &&
          !video.ended
        ) {

          guardarProgreso()
        }

      }, 10000)


    return () => {
      clearInterval(intervalo)
    }

  }, [
    contenido,
    id,
    decisionTomada
  ])


  // ==========================================
  // PAUSA
  // ==========================================

  const manejarPausa = () => {

    if (!decisionTomada) {
      return
    }

    guardarProgreso()
  }


  // ==========================================
  // FINALIZADO
  // ==========================================

  const manejarFinalizado = () => {

    if (!decisionTomada) {
      return
    }

    guardarProgreso()
  }


  // ==========================================
  // VOLVER
  // ==========================================

  const volverInicio = async () => {

    if (decisionTomada) {
      await guardarProgreso()
    }

    navigate('/')
  }


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (
      <div
        className="
          min-vh-100
          bg-black
          text-white
          d-flex
          justify-content-center
          align-items-center
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
            Cargando contenido...
          </p>

        </div>

      </div>
    )
  }


  // ==========================================
  // ERROR
  // ==========================================

  if (error) {

    return (
      <div
        className="
          min-vh-100
          bg-black
          text-white
          d-flex
          justify-content-center
          align-items-center
        "
      >

        <div className="text-center">

          <h2 className="mb-3">
            Error
          </h2>

          <p>
            {error}
          </p>

          <button
            className="btn btn-danger"
            onClick={() => navigate('/')}
          >
            Volver al inicio
          </button>

        </div>

      </div>
    )
  }


  if (!contenido) {
    return null
  }


  // ==========================================
  // PLAYER
  // ==========================================

  const hayVideo =
    Number(id) === 3 ||
    Boolean(contenido.video_url)


  return (
    <div
      className="
        min-vh-100
        bg-black
        text-white
        position-relative
      "
    >

      <div className="container py-4">

        <button
          className="
            btn
            btn-outline-light
            mb-4
          "
          onClick={volverInicio}
        >
          ← Volver
        </button>


        <h1 className="mb-2">
          {contenido.titulo}
        </h1>


        <p className="text-secondary">

          {contenido.genero}

          {' • '}

          {contenido.anio}

          {' • '}

          {contenido.duracion_min} min

        </p>


        {hayVideo ? (

          <div
            className="
              ratio
              ratio-16x9
              mt-4
              bg-black
            "
          >

            <video
              ref={videoRef}
              controls={decisionTomada}
              className="w-100"

              onPause={
                manejarPausa
              }

              onEnded={
                manejarFinalizado
              }
            >

              Tu navegador no soporta
              reproducción de video.

            </video>

          </div>

        ) : (

          <div
            className="
              alert
              alert-warning
              mt-4
            "
          >

            Este contenido todavía no tiene
            un video disponible.

          </div>

        )}

      </div>


      {/* =====================================
          MODAL CONTINUAR VIENDO
      ====================================== */}

      {mostrarReanudacion && (

        <div
          className="
            position-fixed
            top-0
            start-0
            w-100
            h-100
            d-flex
            justify-content-center
            align-items-center
          "

          style={{
            backgroundColor:
              'rgba(0, 0, 0, 0.88)',

            zIndex: 9999,

            backdropFilter:
              'blur(8px)'
          }}
        >

          <div
            className="
              text-center
              p-4
              p-md-5
              rounded-4
              shadow-lg
            "

            style={{
              background:
                'linear-gradient(145deg, #181818, #0d0d0d)',

              border:
                '1px solid rgba(255,255,255,0.12)',

              maxWidth:
                '520px',

              width:
                '90%'
            }}
          >

            <div
              className="
                text-danger
                fw-bold
                text-uppercase
                mb-2
              "
            >
              Stream Platform
            </div>


            <h2 className="fw-bold mb-3">
              ¿Continuar viendo?
            </h2>


            <p
              className="
                text-secondary
                fs-5
                mb-4
              "
            >

              Dejaste{' '}

              <strong className="text-white">
                {contenido.titulo}
              </strong>

              {' '}en{' '}

              <strong className="text-white">

                {formatearTiempo(
                  progresoGuardado
                )}

              </strong>.

            </p>


            <div
              className="
                d-grid
                gap-3
              "
            >

              <button
                className="
                  btn
                  btn-streaming
                  btn-lg
                "

                onClick={
                  continuarVideo
                }
              >

                ▶ Continuar desde{' '}

                {formatearTiempo(
                  progresoGuardado
                )}

              </button>


              <button
                className="
                  btn
                  btn-outline-light
                  btn-lg
                "

                onClick={
                  empezarDesdeInicio
                }
              >
                ↻ Empezar desde el inicio
              </button>


              <button
                className="
                  btn
                  btn-link
                  text-secondary
                  text-decoration-none
                "

                onClick={() =>
                  navigate('/')
                }
              >
                Volver al inicio
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}


export default Player