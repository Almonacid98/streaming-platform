
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL

function EpisodesModal({ contentId, onClose }) {
  const navigate = useNavigate()

  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSeason, setSelectedSeason] = useState(1)

  useEffect(() => {
    if (!contentId) return

    let cancelled = false

    const loadEpisodes = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `${API_URL}/contenidos/${contentId}/`
        )

        if (!response.ok) {
          throw new Error(
            'No se pudieron cargar los episodios.'
          )
        }

        const data = await response.json()

        if (!cancelled) {
          setContent(data)

          const seasons = (data.episodios || []).map(
            (episode) => episode.temporada
          )

          setSelectedSeason(
            seasons.length ? Math.min(...seasons) : 1
          )
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadEpisodes()

    return () => {
      cancelled = true
    }
  }, [contentId])

  useEffect(() => {
    if (!contentId) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [contentId, onClose])

  if (!contentId) return null

  const episodes = content?.episodios || []

  const seasons = [
    ...new Set(episodes.map((episode) => episode.temporada))
  ].sort((a, b) => a - b)

  const filteredEpisodes = episodes
    .filter((episode) => episode.temporada === selectedSeason)
    .sort((a, b) => a.numero - b.numero)

  const playEpisode = (episodeId) => {
    onClose()
    navigate(`/watch/${contentId}/episode/${episodeId}`)
  }

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        animation: 'episodesFadeIn .25s ease'
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="episodes-modal-title"
        className="text-white shadow-lg"
        style={{
          width: '100%',
          maxWidth: '950px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'linear-gradient(145deg,#242424,#101010)',
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: '20px',
          animation: 'episodesScaleIn .3s ease'
        }}
      >
        <div
          className="d-flex justify-content-between align-items-start gap-3 p-4"
          style={{
            borderBottom: '1px solid rgba(255,255,255,.1)'
          }}
        >
          <div>
            <p className="text-danger fw-bold text-uppercase small mb-2">
              {content?.titulo || 'Stream Platform'}
            </p>

            <h2 id="episodes-modal-title" className="fw-bold mb-1">
              Episodios
            </h2>

            <p className="text-secondary mb-0">
              Elegí un capítulo para reproducir
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline-light rounded-circle flex-shrink-0"
            onClick={onClose}
            aria-label="Cerrar episodios"
            style={{
              width: 42,
              height: 42,
              fontSize: 22,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        <div
          className="p-4"
          style={{
            overflowY: 'auto',
            minHeight: 0,
            overscrollBehavior: 'contain'
          }}
        >
          {loading && (
            <div className="text-center py-5">
              <div
                className="spinner-border text-danger mb-3"
                role="status"
              />
              <p>Cargando episodios...</p>
            </div>
          )}

          {!loading && error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {seasons.length > 0 && (
                <select
                  className="form-select bg-dark text-white border-secondary mb-4"
                  style={{ maxWidth: '220px' }}
                  value={selectedSeason}
                  onChange={(event) =>
                    setSelectedSeason(Number(event.target.value))
                  }
                  aria-label="Seleccionar temporada"
                >
                  {seasons.map((season) => (
                    <option key={season} value={season}>
                      Temporada {season}
                    </option>
                  ))}
                </select>
              )}

              {episodes.length === 0 ? (
                <p className="text-secondary">
                  Esta serie todavía no tiene episodios disponibles.
                </p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {filteredEpisodes.map((episode) => {
                    const hasVideo = Boolean(
                      episode.video_b2_key ||
                      episode.video_hls_url
                    )

                    return (
                      <div
                        key={episode.id}
                        className="rounded-4 p-3"
                        style={{
                          background: '#292929',
                          border: '1px solid rgba(255,255,255,.08)'
                        }}
                      >
                        <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">
                          <div
                            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: 160,
                              height: 90,
                              backgroundColor: '#343a40',
                              backgroundImage: content.portada_url
                                ? `linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.6)),url("${content.portada_url}")`
                                : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          >
                            <span className="fs-2">▶</span>
                          </div>

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

                          <div className="flex-shrink-0">
                            <button
                              type="button"
                              className={
                                hasVideo
                                  ? 'btn btn-danger'
                                  : 'btn btn-secondary'
                              }
                              disabled={!hasVideo}
                              onClick={() => playEpisode(episode.id)}
                            >
                              {hasVideo
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
            </>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes episodesFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes episodesScaleIn {
            from {
              opacity: 0;
              transform: translateY(18px) scale(.97);
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

export default EpisodesModal
