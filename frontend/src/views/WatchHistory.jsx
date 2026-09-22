import {
  useEffect,
  useRef,
  useState
} from 'react'

import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL


function HistoryPreview({
  title,
  imageUrl,
  videoUrl,
  onPreviewChange
}) {
  const videoRef = useRef(null)
  const timeoutRef = useRef(null)

  const [showPreview, setShowPreview] = useState(false)
  const [muted, setMuted] = useState(true)

  const startPreview = () => {
    if (!videoUrl) {
      return
    }

    clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      setShowPreview(true)
      onPreviewChange?.(true)
    }, 800)
  }

  const stopPreview = () => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = null

    const video = videoRef.current

    if (video) {
      video.pause()
      video.currentTime = 0
    }

    setShowPreview(false)
    setMuted(true)

    onPreviewChange?.(false)
  }

  const toggleSound = (event) => {
    event.stopPropagation()

    const newMutedState = !muted

    setMuted(newMutedState)

    if (videoRef.current) {
      videoRef.current.muted = newMutedState
    }
  }

  useEffect(() => {
    if (!showPreview) {
      return
    }

    const video = videoRef.current

    if (!video) {
      return
    }

    video.currentTime = 0

    const playPreview = async () => {
      try {
        await video.play()
      } catch (error) {
        console.error(
          'No se pudo reproducir el tráiler:',
          error
        )
      }
    }

    playPreview()
  }, [showPreview])

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      className={`history-preview ${
        showPreview
          ? 'history-preview-active'
          : ''
      }`}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
    >
      {!showPreview && (
        <>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Portada de ${title}`}
              className="history-preview-media"
            />
          ) : (
            <div className="history-preview-empty">
              Sin portada
            </div>
          )}

          {videoUrl && (
            <div className="history-preview-hint">
              ▶ Vista previa
            </div>
          )}
        </>
      )}

      {showPreview && videoUrl && (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            muted={muted}
            autoPlay
            playsInline
            preload="metadata"
            className="history-preview-media"
          />

          <div className="history-preview-gradient" />

          <div className="history-preview-label">
            <span>TRÁILER</span>
            <strong>{title}</strong>
          </div>

          <button
            type="button"
            className="history-preview-sound"
            onClick={toggleSound}
            title={
              muted
                ? 'Activar sonido'
                : 'Silenciar'
            }
            aria-label={
              muted
                ? 'Activar sonido'
                : 'Silenciar'
            }
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </>
      )}
    </div>
  )
}


function WatchHistory() {
  const navigate = useNavigate()
  const { authFetch } = useAuth()

  const [visualizaciones, setVisualizaciones] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [activePreview, setActivePreview] =
    useState(null)

  useEffect(() => {
    let active = true

    const loadHistory = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await authFetch(
          `${API_URL}/visualizaciones/`
        )

        if (!response.ok) {
          throw new Error(
            `No se pudo cargar el historial. Estado: ${response.status}`
          )
        }

        const data = await response.json()

        if (active) {
          setVisualizaciones(
            Array.isArray(data)
              ? data
              : data.results || []
          )
        }
      } catch (error) {
        console.error(
          'Error al cargar el historial:',
          error
        )

        if (active) {
          setError(
            'No pudimos cargar tu historial. Intentá nuevamente.'
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      active = false
    }
  }, [authFetch])

  const formatProgress = (seconds = 0) => {
    const totalSeconds =
      Number(seconds) || 0

    const hours =
      Math.floor(totalSeconds / 3600)

    const minutes =
      Math.floor(
        (totalSeconds % 3600) / 60
      )

    const remainingSeconds =
      Math.floor(totalSeconds % 60)

    if (hours > 0) {
      return `${hours} h ${minutes} min`
    }

    if (minutes > 0) {
      return (
        `${minutes} min ` +
        `${remainingSeconds} s`
      )
    }

    return `${remainingSeconds} s`
  }

  const viewDetail = (contentId) => {
    navigate(`/content/${contentId}`)
  }

  const continueWatching = (contentId) => {
    navigate(`/watch/${contentId}`)
  }

  const goHome = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <main className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="text-center">

          <div
            className="spinner-border text-danger mb-3"
            role="status"
          >
            <span className="visually-hidden">
              Cargando historial...
            </span>
          </div>

          <p className="mb-0">
            Cargando tu historial...
          </p>

        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-vh-100 bg-dark text-white d-flex align-items-center justify-content-center">
        <div className="container text-center">

          <h1 className="h3 mb-3">
            No pudimos cargar el historial
          </h1>

          <p className="text-secondary mb-4">
            {error}
          </p>

          <div className="d-flex justify-content-center gap-2">

            <button
              type="button"
              className="btn btn-streaming"
              onClick={() =>
                window.location.reload()
              }
            >
              Intentar nuevamente
            </button>

            <button
              type="button"
              className="btn btn-outline-light"
              onClick={goHome}
            >
              ← Volver al inicio
            </button>

          </div>

        </div>
      </main>
    )
  }

  return (
    <main className="min-vh-100 bg-dark text-white py-5">
      <div className="container">

        <section className="mb-5">

          <button
            type="button"
            className="btn btn-outline-light mb-4"
            onClick={goHome}
          >
            ← Volver al inicio
          </button>

          <span className="d-block text-danger fw-bold text-uppercase">
            Stream Platform
          </span>

          <h1 className="display-5 fw-bold mt-2 mb-2">
            Mi historial
          </h1>

          <p className="text-secondary mb-0">
            Revisá los contenidos que estuviste viendo.
          </p>

        </section>

        {visualizaciones.length === 0 ? (
          <section className="text-center py-5">

            <h2 className="h4 mb-3">
              Todavía no tenés historial
            </h2>

            <p className="text-secondary mb-4">
              Cuando reproduzcas algún contenido aparecerá acá.
            </p>

            <button
              type="button"
              className="btn btn-streaming"
              onClick={() =>
                navigate('/catalog')
              }
            >
              Explorar catálogo
            </button>

          </section>
        ) : (
          <section className="d-flex flex-column gap-4">

            {visualizaciones.map(
              (visualizacion) => {
                const content =
                  visualizacion.contenido_detalle

                if (!content) {
                  return null
                }

                return (
                  <article
                    key={visualizacion.id}
                    className={`history-card ${
                      activePreview === visualizacion.id
                        ? 'history-card-preview'
                        : ''
                    }`}
                  >
                    <div className="history-card-content">

                      <div className="history-card-preview-area">

                        <HistoryPreview
                          title={content.titulo}
                          imageUrl={
                            content.portada_url
                          }
                          videoUrl={
                            content.video_url
                          }
                          onPreviewChange={(active) =>
                            setActivePreview(
                              active
                                ? visualizacion.id
                                : null
                            )
                          }
                        />

                      </div>

                      <div className="history-card-info">

                        <div className="card-body h-100 d-flex flex-column p-4">

                          <div className="mb-3">

                            <span className="badge bg-danger mb-2">
                              {content.tipo}
                            </span>

                            <h2 className="card-title h3 mb-2">
                              {content.titulo}
                            </h2>

                            <p className="text-secondary mb-2">
                              {content.genero}
                              {' · '}
                              {content.anio}
                              {' · '}
                              {content.duracion_min}
                              {' min'}
                            </p>

                          </div>

                          {content.descripcion && (
                            <p className="card-text text-light">
                              {content.descripcion}
                            </p>
                          )}

                          <div className="mt-auto">

                            <p className="mb-3">
                              <strong>
                                Progreso guardado:
                              </strong>{' '}
                              {formatProgress(
                                visualizacion.progreso_segundos
                              )}
                            </p>

                            <div className="d-flex flex-wrap gap-2">

                              {(
                                content.video_hls_url ||
                                content.video_url
                              ) ? (
                                <button
                                  type="button"
                                  className="btn btn-streaming"
                                  onClick={() =>
                                    continueWatching(
                                      content.id
                                    )
                                  }
                                >
                                  ▶ Continuar viendo
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  disabled
                                >
                                  No disponible
                                </button>
                              )}

                              <button
                                type="button"
                                className="btn btn-outline-light"
                                onClick={() =>
                                  viewDetail(
                                    content.id
                                  )
                                }
                              >
                                Más información
                              </button>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>
                  </article>
                )
              }
            )}

          </section>
        )}

      </div>
    </main>
  )
}

export default WatchHistory