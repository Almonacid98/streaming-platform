
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Hls from 'hls.js'

import { useAuth } from '../context/AuthContext'
import PlayerControls from '../components/PlayerControls'
import '../components/PlayerControls.css'

function Player() {
  const { id, episodeId } = useParams()
  const isEpisode = Boolean(episodeId)
  const navigate = useNavigate()
  const { authFetch } = useAuth()
  const videoRef = useRef(null)

  const API_URL = import.meta.env.VITE_API_URL

  const [contenido, setContenido] = useState(null)
  const [episode, setEpisode] = useState(null)
  const [videoB2Url, setVideoB2Url] = useState(null)
  const [hlsPrivadoUrl, setHlsPrivadoUrl] = useState(null)
  const [subtitulosB2, setSubtitulosB2] = useState([])
  const [progresoGuardado, setProgresoGuardado] = useState(0)
  const [mostrarReanudacion, setMostrarReanudacion] = useState(false)
  const [decisionTomada, setDecisionTomada] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ==========================================
  // SUBTÍTULOS
  // ==========================================

  // Los subtítulos de B2 se obtienen desde Django para cualquier episodio.
  // Se mantiene la configuración local existente del episodio 1.
  const obtenerSubtitulos = () => {
    if (isEpisode && episode?.video_b2_key) {
      return subtitulosB2
    }

    if (Number(id) !== 5 || !isEpisode || Number(episodeId) !== 1) {
      return []
    }

    const baseUrl = 'http://localhost:8081/solo_leveling_ep1'
    const idiomas = [
      ['es_latino', 'es-419', 'Español (Latinoamérica)'],
      ['es', 'es', 'Español'],
      ['en', 'en', 'English'],
      ['pt_br', 'pt-BR', 'Português (Brasil)'],
      ['fr', 'fr', 'Français'],
      ['de', 'de', 'Deutsch'],
      ['it', 'it', 'Italiano'],
      ['ru', 'ru', 'Русский'],
      ['ar', 'ar', 'العربية']
    ]

    return idiomas.map(([archivo, srcLang, label], index) => ({
      src: `${baseUrl}/subtitles_${archivo}.vtt`,
      srcLang,
      label,
      default: index === 0
    }))
  }

  const subtitulos = obtenerSubtitulos()

  // ==========================================
  // FORMATEAR TIEMPO
  // ==========================================

  const formatearTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60)
    const segundosRestantes = Math.floor(segundos % 60)

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
    let blobCreado = null

    const cargarDatos = async () => {
      try {
        setLoading(true)
        setError('')
        setVideoB2Url(null)
        setHlsPrivadoUrl(null)
        setSubtitulosB2([])

        const responseContenido = await fetch(
          `${API_URL}/contenidos/${id}/`
        )

        if (!responseContenido.ok) {
          throw new Error('No se pudo cargar el contenido.')
        }

        const dataContenido = await responseContenido.json()

        const selectedEpisode = isEpisode
          ? (dataContenido.episodios || []).find(
              (item) => Number(item.id) === Number(episodeId)
            )
          : null

        if (isEpisode && !selectedEpisode) {
          throw new Error(
            'El episodio solicitado no existe en esta serie.'
          )
        }

        // Si el episodio está en B2, Django devuelve el manifiesto
        // con las URLs de los segmentos ya firmadas.
        let nuevoManifiesto = null
        let nuevosSubtitulos = []

        if (isEpisode && selectedEpisode.video_b2_key) {
          const respuestaHls = await authFetch(
            `${API_URL}/episodios/${episodeId}/play/`
          )

          if (!respuestaHls.ok) {
            throw new Error('No se pudo autorizar la reproducción HLS.')
          }

          const textoHls = await respuestaHls.text()
          if (!textoHls.trimStart().startsWith('#EXTM3U')) {
            throw new Error('Django no devolvió un manifiesto HLS válido.')
          }

          nuevoManifiesto = URL.createObjectURL(
            new Blob([textoHls], { type: 'application/vnd.apple.mpegurl' })
          )
          blobCreado = nuevoManifiesto

          const respuestaSubtitulos = await authFetch(
            `${API_URL}/episodios/${episodeId}/subtitulos/`
          )
          if (!respuestaSubtitulos.ok) {
            URL.revokeObjectURL(nuevoManifiesto)
            blobCreado = null
            throw new Error('No se pudieron obtener los subtítulos del episodio.')
          }
          nuevosSubtitulos = await respuestaSubtitulos.json()
        }

        // ======================================
        // URL FIRMADA DE BACKBLAZE B2
        // ======================================

        let b2Url = null

        if (!isEpisode && dataContenido.video_b2_key) {
          const responsePlay = await authFetch(
            `${API_URL}/contenidos/${id}/play/`
          )

          if (!responsePlay.ok) {
            throw new Error(
              'No se pudo obtener el video desde Backblaze B2.'
            )
          }

          const dataPlay = await responsePlay.json()
          b2Url = dataPlay.video_url
        }

        // ======================================
        // RECUPERAR PROGRESO
        // ======================================

        const responseVisualizaciones = await authFetch(
          `${API_URL}/visualizaciones/`
        )

        if (!responseVisualizaciones.ok) {
          throw new Error('No se pudo recuperar el progreso.')
        }

        const visualizaciones =
          await responseVisualizaciones.json()

        const items = Array.isArray(visualizaciones)
          ? visualizaciones
          : (visualizaciones.results || [])

        const visualizacion = items.find(
          (item) =>
            Number(item.contenido) === Number(id) &&
            (
              isEpisode
                ? Number(item.episodio) === Number(episodeId)
                : item.episodio == null
            )
        )

        const progreso = visualizacion
          ? Number(visualizacion.progreso_segundos) || 0
          : 0

        if (activo) {
          setContenido(dataContenido)
          setEpisode(selectedEpisode)
          setVideoB2Url(b2Url)
          setHlsPrivadoUrl(nuevoManifiesto)
          setSubtitulosB2(nuevosSubtitulos)
          setProgresoGuardado(progreso)
          setMostrarReanudacion(progreso > 0)
          setDecisionTomada(progreso === 0)
        }
      } catch (err) {
        console.error('Error al cargar el reproductor:', err)

        if (activo) {
          setError(
            err.message || 'No se pudo cargar el reproductor.'
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
      if (blobCreado) URL.revokeObjectURL(blobCreado)
    }
  }, [API_URL, id, episodeId, isEpisode, authFetch])

  // ==========================================
  // CONFIGURAR VIDEO: B2 / HLS / DIRECTO
  // ==========================================

  useEffect(() => {
    const video = videoRef.current

    if (!video || !contenido) {
      return
    }

    const hlsUrl = isEpisode
      ? (episode?.video_b2_key ? hlsPrivadoUrl : episode?.video_hls_url)
      : contenido.video_hls_url

    const videoUrl = isEpisode
      ? null
      : contenido.video_url

    // PRIORIDAD 1: BACKBLAZE B2

    if (videoB2Url) {
      video.src = videoB2Url

      return () => {
        video.pause()
        video.removeAttribute('src')
        video.load()
      }
    }

    // PRIORIDAD 2: HLS

    if (hlsUrl) {
      if (
        video.canPlayType('application/vnd.apple.mpegurl')
      ) {
        video.src = hlsUrl

        return () => {
          video.pause()
          video.removeAttribute('src')
          video.load()
        }
      }

      if (Hls.isSupported()) {
        const hls = new Hls()

        hls.loadSource(hlsUrl)
        hls.attachMedia(video)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('Manifiesto HLS cargado correctamente.')
        })

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('Error HLS:', data)

          if (data.fatal) {
            setError(
              'Ocurrió un error al reproducir el contenido HLS.'
            )
          }
        })

        return () => {
          hls.destroy()
        }
      }

      setError('Este navegador no soporta reproducción HLS.')
      return
    }

    // PRIORIDAD 3: VIDEO DIRECTO

    if (videoUrl) {
      video.src = videoUrl

      return () => {
        video.pause()
        video.removeAttribute('src')
        video.load()
      }
    }

    console.warn('El contenido no tiene video disponible.')
  }, [contenido, episode, isEpisode, videoB2Url, hlsPrivadoUrl])

  // ==========================================
  // GUARDAR PROGRESO
  // ==========================================

  const guardarProgreso = async (
    segundosPersonalizados = null
  ) => {
    const video = videoRef.current

    let segundos = segundosPersonalizados

    if (segundos === null) {
      if (!video) return
      segundos = Math.floor(video.currentTime)
    }

    segundos = Math.floor(Number(segundos))

    if (!Number.isFinite(segundos) || segundos < 0) {
      return
    }

    try {
      const response = await authFetch(
        `${API_URL}/visualizaciones/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contenido: Number(id),
            episodio: isEpisode ? Number(episodeId) : null,
            progreso_segundos: segundos
          })
        }
      )

      if (!response.ok) {
        console.error('No se pudo guardar el progreso.')
        return
      }

      setProgresoGuardado(segundos)
      console.log(`Progreso guardado: ${segundos} segundos`)
    } catch (err) {
      console.error('Error al guardar el progreso:', err)
    }
  }

  // ==========================================
  // CONTINUAR VIDEO
  // ==========================================

  const continuarVideo = async () => {
    const video = videoRef.current

    if (!video) return

    let tiempoContinuacion = progresoGuardado

    if (
      Number.isFinite(video.duration) &&
      tiempoContinuacion >= video.duration
    ) {
      tiempoContinuacion = 0
    }

    video.currentTime = tiempoContinuacion

    setMostrarReanudacion(false)
    setDecisionTomada(true)

    try {
      await video.play()
    } catch (err) {
      console.error('No se pudo iniciar el video:', err)
    }
  }

  // ==========================================
  // EMPEZAR DESDE EL INICIO
  // ==========================================

  const empezarDesdeInicio = async () => {
    const video = videoRef.current

    if (!video) return

    video.currentTime = 0

    setMostrarReanudacion(false)
    setDecisionTomada(true)

    await guardarProgreso(0)

    try {
      await video.play()
    } catch (err) {
      console.error('No se pudo iniciar el video:', err)
    }
  }

  // ==========================================
  // GUARDADO AUTOMÁTICO CADA 10 SEGUNDOS
  // ==========================================

  useEffect(() => {
    if (!contenido || !decisionTomada) {
      return
    }

    const intervalo = setInterval(() => {
      const video = videoRef.current

      if (video && !video.paused && !video.ended) {
        guardarProgreso()
      }
    }, 10000)

    return () => {
      clearInterval(intervalo)
    }
  }, [
    contenido,
    id,
    episodeId,
    decisionTomada,
    authFetch
  ])

  // ==========================================
  // PAUSA Y FINALIZACIÓN
  // ==========================================

  const manejarPausa = () => {
    if (!decisionTomada) return
    guardarProgreso()
  }

  const manejarFinalizado = () => {
    if (!decisionTomada) return
    guardarProgreso()
  }

  // ==========================================
  // VOLVER
  // ==========================================

  const volverInicio = async () => {
    if (decisionTomada) {
      await guardarProgreso()
    }

    navigate(isEpisode ? `/content/${id}` : '/')
  }

  // ==========================================
  // CARGANDO
  // ==========================================

  if (loading) {
    return (
      <div className="min-vh-100 bg-black text-white d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div
            className="spinner-border text-danger mb-3"
            role="status"
          >
            <span className="visually-hidden">
              Cargando...
            </span>
          </div>

          <p>Cargando contenido...</p>
        </div>
      </div>
    )
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="min-vh-100 bg-black text-white d-flex justify-content-center align-items-center">
        <div className="text-center">
          <h2 className="mb-3">Error</h2>
          <p>{error}</p>

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
  // COMPROBAR DISPONIBILIDAD
  // ==========================================

  const hayVideo = Boolean(
    videoB2Url ||
    hlsPrivadoUrl ||
    (
      isEpisode
        ? episode?.video_hls_url
        : contenido.video_hls_url
    ) ||
    (!isEpisode && contenido.video_url)
  )

  // ==========================================
  // REPRODUCTOR PERSONALIZADO
  // ==========================================

  return (
    <div className="min-vh-100 bg-black text-white position-relative">
      <div className="container py-4">
        <button
          className="btn btn-outline-light mb-4"
          onClick={volverInicio}
        >
          ← Volver
        </button>

        <h1 className="mb-2">
          {contenido.titulo}
          {episode
            ? ` — T${episode.temporada} E${episode.numero}: ${episode.titulo}`
            : ''}
        </h1>

        <p className="text-secondary">
          {contenido.genero}
          {' • '}
          {contenido.anio}
          {' • '}
          {episode
            ? episode.duracion_min
            : contenido.duracion_min} min
        </p>

        {hayVideo ? (
          <div className="sp-player-wrapper ratio ratio-16x9 mt-4">
            <video
              ref={videoRef}
              controls={false}
              crossOrigin="anonymous"
              className="w-100"
              playsInline
              onPause={manejarPausa}
              onEnded={manejarFinalizado}
            >
              {subtitulos.map((subtitulo) => (
                <track
                  key={subtitulo.src}
                  kind="subtitles"
                  src={subtitulo.src}
                  srcLang={subtitulo.srcLang}
                  label={subtitulo.label}
                  default={Boolean(subtitulo.default)}
                />
              ))}

              Tu navegador no soporta reproducción de video.
            </video>

            <PlayerControls
              videoRef={videoRef}
              enabled={decisionTomada}
            />
          </div>
        ) : (
          <div className="alert alert-warning mt-4">
            Este contenido todavía no tiene un video disponible.
          </div>
        )}
      </div>

      {/* =====================================
          MODAL CONTINUAR VIENDO
      ====================================== */}

      {mostrarReanudacion && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            zIndex: 9999,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div
            className="text-center p-4 p-md-5 rounded-4 shadow-lg"
            style={{
              background:
                'linear-gradient(145deg, #181818, #0d0d0d)',
              border:
                '1px solid rgba(255,255,255,0.12)',
              maxWidth: '520px',
              width: '90%'
            }}
          >
            <div className="text-danger fw-bold text-uppercase mb-2">
              Stream Platform
            </div>

            <h2 className="fw-bold mb-3">
              ¿Continuar viendo?
            </h2>

            <p className="text-secondary fs-5 mb-4">
              Dejaste{' '}
              <strong className="text-white">
                {contenido.titulo}
                {episode
                  ? ` — T${episode.temporada} E${episode.numero}`
                  : ''}
              </strong>
              {' '}en{' '}
              <strong className="text-white">
                {formatearTiempo(progresoGuardado)}
              </strong>.
            </p>

            <div className="d-grid gap-3">
              <button
                className="btn btn-streaming btn-lg"
                onClick={continuarVideo}
              >
                ▶ Continuar desde{' '}
                {formatearTiempo(progresoGuardado)}
              </button>

              <button
                className="btn btn-outline-light btn-lg"
                onClick={empezarDesdeInicio}
              >
                ↻ Empezar desde el inicio
              </button>

              <button
                className="btn btn-link text-secondary text-decoration-none"
                onClick={() =>
                  navigate(isEpisode ? `/content/${id}` : '/')
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