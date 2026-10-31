
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const API_URL = import.meta.env.VITE_API_URL

function ContentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [showEpisodes, setShowEpisodes] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadContent = async () => {
      try {
        setLoading(true)
        setError('')
        setShowEpisodes(false)

        const response = await fetch(
          `${API_URL}/contenidos/${id}/`
        )

        if (response.status === 404) {
          throw new Error(
            'El contenido solicitado no existe.'
          )
        }

        if (!response.ok) {
          throw new Error(
            'No se pudo cargar la información del contenido.'
          )
        }

        const data = await response.json()

        if (!cancelled) {
          setContent(data)

          const firstSeason = data.episodios?.length
            ? Math.min(
                ...data.episodios.map(
                  (episode) => episode.temporada
                )
              )
            : 1

          setSelectedSeason(firstSeason)
        }
      } catch (err) {
        console.error(
          'Error al cargar el contenido:',
          err
        )

        if (!cancelled) {
          setError(
            err.message ||
            'Ocurrió un error al cargar el contenido.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadContent()

    return () => {
      cancelled = true
    }
  }, [id])

  // Bloquear el desplazamiento del fondo y permitir
  // cerrar la ventana con la tecla Escape.
  useEffect(() => {
    if (!showEpisodes) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowEpisodes(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showEpisodes])

  const handleBack = () => {
    navigate('/')
  }

  const handlePlay = () => {
    navigate(`/watch/${id}`)
  }

  const handleEpisodePlay = (episodeId) => {
    setShowEpisodes(false)
    navigate(`/watch/${id}/episode/${episodeId}`)
  }

  const isSeries =
    content?.tipo?.toLowerCase() === 'serie'

  const episodes = content?.episodios || []

  const seasons = [
    ...new Set(
      episodes.map((episode) => episode.temporada)
    )
  ].sort((a, b) => a - b)

  const filteredEpisodes = episodes
    .filter(
      (episode) =>
        episode.temporada === selectedSeason
    )
    .sort((a, b) => a.numero - b.numero)

  const hasMovieVideo = Boolean(
    content?.video_b2_key ||
    content?.video_hls_url ||
    content?.video_url
  )

  const heroImage =
    content?.hero_url ||
    content?.portada_url

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white">
        <Navbar />

        <main className="min-vh-100 d-flex justify-content-center align-items-center">
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
        </main>

        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-vh-100 bg-dark text-white">
        <Navbar />

        <main className="container min-vh-100 d-flex justify-content-center align-items-center">
          <div className="text-center">
            <h2 className="mb-3">
              No pudimos cargar el contenido
            </h2>

            <p className="text-secondary mb-4">
              {error}
            </p>

            <button
              type="button"
              className="btn btn-danger"
              onClick={handleBack}
            >
              Volver al inicio
            </button>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  if (!content) {
    return null
  }

  return (
    <div className="min-vh-100 bg-dark text-white">
      <Navbar />

      <main>
        {/* HERO */}

        <section
          className="position-relative"
          style={{
            minHeight: '75vh',

            backgroundImage: heroImage
              ? `
                linear-gradient(
                  to right,
                  rgba(0, 0, 0, 0.95) 0%,
                  rgba(0, 0, 0, 0.78) 45%,
                  rgba(0, 0, 0, 0.35) 100%
                ),
                linear-gradient(
                  to top,
                  #212529 0%,
                  transparent 35%
                ),
                url("${heroImage}")
              `
              : 'none',

            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div
            className="container d-flex align-items-center"
            style={{
              minHeight: '75vh',
              paddingTop: '100px',
              paddingBottom: '80px'
            }}
          >
            <div style={{ maxWidth: '700px' }}>
              <button
                type="button"
                className="btn btn-outline-light btn-sm mb-4"
                onClick={handleBack}
              >
                ← Volver
              </button>

              <p className="text-danger fw-bold text-uppercase mb-2">
                {content.tipo || 'Contenido'}
              </p>

              <h1 className="display-3 fw-bold mb-3">
                {content.titulo}
              </h1>

              <div className="d-flex flex-wrap gap-3 text-light mb-4">
                {content.anio && (
                  <span>{content.anio}</span>
                )}

                {content.genero && (
                  <span>{content.genero}</span>
                )}

                {isSeries ? (
                  <span>
                    {seasons.length}{' '}
                    {seasons.length === 1
                      ? 'temporada'
                      : 'temporadas'}
                  </span>
                ) : (
                  content.duracion_min && (
                    <span>
                      {content.duracion_min} min
                    </span>
                  )
                )}
              </div>

              <p
                className="fs-5 text-light mb-4"
                style={{ lineHeight: '1.7' }}
              >
                {content.descripcion ||
                  'Este contenido todavía no tiene una descripción disponible.'}
              </p>

              {!isSeries && (
                <button
                  type="button"
                  className={
                    hasMovieVideo
                      ? 'btn btn-danger btn-lg px-4'
                      : 'btn btn-secondary btn-lg px-4'
                  }
                  onClick={handlePlay}
                  disabled={!hasMovieVideo}
                >
                  {hasMovieVideo
                    ? '▶ Reproducir'
                    : 'Video no disponible'}
                </button>
              )}

              {isSeries && (
                <button
                  type="button"
                  className="btn btn-danger btn-lg px-4"
                  onClick={() => setShowEpisodes(true)}
                >
                  Ver episodios
                </button>
              )}
            </div>
          </div>
        </section>

        {/* INFORMACIÓN */}

        <section className="container py-5">
          <div className="row g-4">
            {content.portada_url && (
              <div className="col-12 col-md-4 col-lg-3">
                <img
                  src={content.portada_url}
                  alt={`Portada de ${content.titulo}`}
                  className="img-fluid rounded shadow"
                  style={{
                    width: '100%',
                    maxHeight: '450px',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}

            <div
              className={
                content.portada_url
                  ? 'col-12 col-md-8 col-lg-9'
                  : 'col-12'
              }
            >
              <h2 className="fw-bold mb-4">
                Información
              </h2>

              <div className="mb-3">
                <span className="text-secondary">
                  Título:
                </span>{' '}
                <strong>{content.titulo}</strong>
              </div>

              <div className="mb-3">
                <span className="text-secondary">
                  Tipo:
                </span>{' '}
                <strong>{content.tipo}</strong>
              </div>

              <div className="mb-3">
                <span className="text-secondary">
                  Género:
                </span>{' '}
                <strong>{content.genero}</strong>
              </div>

              <div className="mb-3">
                <span className="text-secondary">
                  Año:
                </span>{' '}
                <strong>{content.anio}</strong>
              </div>

              {!isSeries && (
                <div className="mb-3">
                  <span className="text-secondary">
                    Duración:
                  </span>{' '}
                  <strong>
                    {content.duracion_min} minutos
                  </strong>
                </div>
              )}

              {isSeries && (
                <div className="mb-3">
                  <span className="text-secondary">
                    Episodios:
                  </span>{' '}
                  <strong>{episodes.length}</strong>
                </div>
              )}

              {content.creador?.username && (
                <div className="mb-3">
                  <span className="text-secondary">
                    Publicado por:
                  </span>{' '}
                  <strong>
                    {content.creador.username}
                  </strong>
                </div>
              )}

              <div className="mt-4">
                <h3 className="h5 fw-bold">
                  Descripción
                </h3>

                <p
                  className="text-light mb-0"
                  style={{ lineHeight: '1.7' }}
                >
                  {content.descripcion ||
                    'Sin descripción disponible.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* VENTANA FLOTANTE DE EPISODIOS */}

      {showEpisodes && isSeries && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowEpisodes(false)
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'episodesFadeIn 0.25s ease-out'
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="episodes-title"
            className="text-white shadow-lg"
            style={{
              width: '100%',
              maxWidth: '960px',
              maxHeight: '88vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background:
                'linear-gradient(145deg, #202020, #101010)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '20px',
              animation: 'episodesScaleIn 0.3s ease-out'
            }}
          >
            {/* CABECERA */}

            <div
              className="d-flex align-items-start justify-content-between gap-3 p-4"
              style={{
                borderBottom:
                  '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div>
                <p className="text-danger fw-bold text-uppercase small mb-2">
                  {content.titulo}
                </p>

                <h2
                  id="episodes-title"
                  className="fw-bold mb-1"
                >
                  Episodios
                </h2>

                <p className="text-secondary mb-0">
                  Elegí un capítulo para reproducir
                </p>
              </div>

              <button
                type="button"
                className="btn btn-outline-light rounded-circle flex-shrink-0"
                onClick={() => setShowEpisodes(false)}
                aria-label="Cerrar episodios"
                style={{
                  width: '42px',
                  height: '42px',
                  fontSize: '22px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* SELECTOR DE TEMPORADAS */}

            {seasons.length > 0 && (
              <div className="px-4 pt-4">
                <select
                  className="form-select bg-dark text-white border-secondary"
                  style={{ maxWidth: '220px' }}
                  value={selectedSeason}
                  onChange={(event) =>
                    setSelectedSeason(
                      Number(event.target.value)
                    )
                  }
                  aria-label="Seleccionar temporada"
                >
                  {seasons.map((season) => (
                    <option
                      key={season}
                      value={season}
                    >
                      Temporada {season}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* LISTA DE EPISODIOS */}

            <div
              className="p-4"
              style={{
                overflowY: 'auto',
                minHeight: 0,
                overscrollBehavior: 'contain'
              }}
            >
              {episodes.length === 0 ? (
                <p className="text-secondary mb-0">
                  Esta serie todavía no tiene episodios disponibles.
                </p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {filteredEpisodes.map((episode) => {
                    const hasEpisodeVideo = Boolean(
                      episode.video_b2_key ||
                      episode.video_hls_url
                    )

                    return (
                      <div
                        key={episode.id}
                        className="rounded-4 p-3"
                        style={{
                          backgroundColor: '#292929',
                          border:
                            '1px solid rgba(255,255,255,0.08)'
                        }}
                      >
                        <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">
                          {/* MINIATURA */}

                          <div
                            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: '160px',
                              height: '90px',
                              backgroundImage: content.portada_url
                                ? `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.55)), url("${content.portada_url}")`
                                : 'none',
                              backgroundColor: '#343a40',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          >
                            <span
                              className="fs-2 text-white"
                              aria-hidden="true"
                            >
                              ▶
                            </span>
                          </div>

                          {/* INFORMACIÓN */}

                          <div className="flex-grow-1">
                            <h3 className="h5 fw-bold mb-2">
                              {episode.numero}. {episode.titulo}
                            </h3>

                            <p className="text-secondary small mb-2">
                              Temporada {episode.temporada}
                              {' • '}
                              {episode.duracion_min} min
                            </p>

                            <p className="text-light mb-0">
                              {episode.descripcion ||
                                'Sin descripción disponible.'}
                            </p>
                          </div>

                          {/* REPRODUCIR */}

                          <div className="flex-shrink-0">
                            <button
                              type="button"
                              className={
                                hasEpisodeVideo
                                  ? 'btn btn-danger'
                                  : 'btn btn-secondary'
                              }
                              disabled={!hasEpisodeVideo}
                              onClick={() =>
                                handleEpisodePlay(episode.id)
                              }
                            >
                              {hasEpisodeVideo
                                ? '▶ Reproducir'
                                : 'No disponible'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ANIMACIONES */}

      <style>
        {`
          @keyframes episodesFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes episodesScaleIn {
            from {
              opacity: 0;
              transform: translateY(18px) scale(0.97);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            [role="dialog"] {
              animation: none !important;
            }
          }
        `}
      </style>
    </div>
  )
}

export default ContentDetail
