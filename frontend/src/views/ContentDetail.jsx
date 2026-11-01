import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL

function ContentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { authFetch } = useAuth()

  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [showEpisodes, setShowEpisodes] = useState(false)
  const [favoriteId, setFavoriteId] = useState(null)
  const [favoritesLoading, setFavoritesLoading] = useState(true)
  const [favoriteSaving, setFavoriteSaving] = useState(false)
  const [favoriteError, setFavoriteError] = useState('')

  // ==========================================
  // CARGAR CONTENIDO
  // ==========================================

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
                  episode => episode.temporada
                )
              )
            : 1

          setSelectedSeason(firstSeason)
        }
      } catch (err) {
        console.error('Error al cargar el contenido:', err)

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

  // ==========================================
  // CONSULTAR FAVORITOS
  // ==========================================

  useEffect(() => {
    let cancelled = false

    const loadFavorite = async () => {
      setFavoritesLoading(true)
      setFavoriteError('')
      setFavoriteId(null)

      try {
        const response = await authFetch(
          `${API_URL}/favoritos/`
        )

        if (!response.ok) {
          throw new Error(
            'No se pudo consultar Mi lista.'
          )
        }

        const data = await response.json()

        const favorites = Array.isArray(data)
          ? data
          : data.results || []

        const found = favorites.find(
          item => Number(item.contenido) === Number(id)
        )

        if (!cancelled) {
          setFavoriteId(found?.id ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          setFavoriteError(
            err.message ||
            'Error al consultar Mi lista.'
          )
        }
      } finally {
        if (!cancelled) {
          setFavoritesLoading(false)
        }
      }
    }

    loadFavorite()

    return () => {
      cancelled = true
    }
  }, [id, authFetch])

  // ==========================================
  // AGREGAR / QUITAR DE MI LISTA
  // ==========================================

  const handleToggleFavorite = async () => {
    if (favoritesLoading || favoriteSaving) return

    setFavoriteSaving(true)
    setFavoriteError('')

    try {
      if (favoriteId !== null) {
        const response = await authFetch(
          `${API_URL}/favoritos/${favoriteId}/`,
          {
            method: 'DELETE'
          }
        )

        if (!response.ok) {
          throw new Error(
            'No se pudo quitar el contenido de Mi lista.'
          )
        }

        setFavoriteId(null)

      } else {
        const response = await authFetch(
          `${API_URL}/favoritos/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contenido: Number(id)
            })
          }
        )

        if (!response.ok) {
          throw new Error(
            'No se pudo agregar el contenido a Mi lista.'
          )
        }

        const favorite = await response.json()

        setFavoriteId(favorite.id)
      }

    } catch (err) {
      setFavoriteError(
        err.message ||
        'Ocurrió un error al actualizar Mi lista.'
      )
    } finally {
      setFavoriteSaving(false)
    }
  }

  // ==========================================
  // CONTROL DE VENTANA DE EPISODIOS
  // ==========================================

  useEffect(() => {
    if (!showEpisodes) return

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        setShowEpisodes(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow

      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [showEpisodes])

  // ==========================================
  // NAVEGACIÓN
  // ==========================================

  const handleBack = () => {
    navigate('/')
  }

  const handlePlay = () => {
    navigate(`/watch/${id}`)
  }

  const handleEpisodePlay = episodeId => {
    setShowEpisodes(false)

    navigate(`/watch/${id}/episode/${episodeId}`)
  }

  // ==========================================
  // INFORMACIÓN DEL CONTENIDO
  // ==========================================

  const isSeries =
    content?.tipo?.toLowerCase() === 'serie'

  const episodes = content?.episodios || []

  const seasons = [
    ...new Set(
      episodes.map(episode => episode.temporada)
    )
  ].sort((a, b) => a - b)

  const filteredEpisodes = episodes
    .filter(
      episode => episode.temporada === selectedSeason
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

  // ==========================================
  // CARGANDO
  // ==========================================

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

  // ==========================================
  // ERROR
  // ==========================================

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

  if (!content) return null

  // ==========================================
  // VISTA PRINCIPAL
  // ==========================================

  return (
    <div className="min-vh-100 bg-dark text-white">
      <Navbar />

      <main>

        {/* =====================================
            HERO
        ====================================== */}

        <section
          className="content-hero position-relative"
          style={{
            backgroundImage: heroImage
              ? `
                linear-gradient(
                  to right,
                  rgba(0,0,0,.96) 0%,
                  rgba(0,0,0,.78) 48%,
                  rgba(0,0,0,.28) 100%
                ),
                linear-gradient(
                  to top,
                  #212529 0%,
                  transparent 50%
                ),
                url("${heroImage}")
              `
              : 'none'
          }}
        >

          <div className="container content-hero-container">

            <div className="content-hero-information">

              <button
                type="button"
                className="content-back-button"
                onClick={handleBack}
              >
                <span>←</span>
                Volver
              </button>

              <div className="content-category">
                {content.tipo || 'Contenido'}
              </div>

              <h1 className="content-title">
                {content.titulo}
              </h1>

              <div className="content-metadata">

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

              <p className="content-description">
                {content.descripcion ||
                  'Este contenido todavía no tiene una descripción disponible.'}
              </p>

              {/* =================================
                  BOTONES PRINCIPALES
              ================================== */}

              <div className="content-actions">

                {!isSeries ? (

                  <button
                    type="button"
                    className="content-play-button"
                    onClick={handlePlay}
                    disabled={!hasMovieVideo}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>

                    {hasMovieVideo
                      ? 'Reproducir'
                      : 'Video no disponible'}
                  </button>

                ) : (

                  <button
                    type="button"
                    className="content-play-button"
                    onClick={() => setShowEpisodes(true)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <path d="M8 9h8M8 13h8M8 17h5" />
                    </svg>

                    Ver episodios
                  </button>

                )}

                {/* MI LISTA */}

                <button
                  type="button"
                  className={`favorite-action ${
                    favoriteId !== null ? 'is-saved' : ''
                  }`}
                  onClick={handleToggleFavorite}
                  disabled={favoritesLoading || favoriteSaving}
                  aria-pressed={favoriteId !== null}
                  title={
                    favoriteId !== null
                      ? 'Quitar de Mi lista'
                      : 'Agregar a Mi lista'
                  }
                >

                  {favoritesLoading || favoriteSaving ? (

                    <span className="favorite-spinner" />

                  ) : (

                    <svg
                      className="favorite-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {favoriteId !== null ? (
                        <path d="M5 12.5 9.2 17 19 7" />
                      ) : (
                        <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-4-6 4V4.75Z" />
                      )}
                    </svg>

                  )}

                  <span>
                    {favoritesLoading
                      ? 'Comprobando...'
                      : favoriteSaving
                        ? 'Actualizando...'
                        : favoriteId !== null
                          ? 'En mi lista'
                          : 'Mi lista'}
                  </span>

                  {favoriteId !== null && !favoriteSaving && (
                    <span className="favorite-check">
                      ✓
                    </span>
                  )}

                </button>

              </div>

              {/* ERROR DE FAVORITOS */}

              {favoriteError && (
                <div
                  className="favorite-error"
                  role="alert"
                >
                  <span>!</span>
                  {favoriteError}
                </div>
              )}

            </div>
          </div>
        </section>

        {/* =====================================
            INFORMACIÓN DEL CONTENIDO
        ====================================== */}

        <section className="container content-information">

          <div className="row g-5">

            {content.portada_url && (
              <div className="col-12 col-md-4 col-lg-3">
                <div className="content-poster-wrapper">
                  <img
                    src={content.portada_url}
                    alt={`Portada de ${content.titulo}`}
                    className="content-poster"
                  />
                </div>
              </div>
            )}

            <div
              className={
                content.portada_url
                  ? 'col-12 col-md-8 col-lg-9'
                  : 'col-12'
              }
            >

              <div className="information-heading">
                <span className="information-line" />
                <h2>Información</h2>
              </div>

              <div className="information-grid">

                <div className="information-item">
                  <span>Título</span>
                  <strong>{content.titulo}</strong>
                </div>

                <div className="information-item">
                  <span>Tipo</span>
                  <strong>{content.tipo}</strong>
                </div>

                <div className="information-item">
                  <span>Género</span>
                  <strong>{content.genero}</strong>
                </div>

                <div className="information-item">
                  <span>Año</span>
                  <strong>{content.anio}</strong>
                </div>

                {!isSeries && (
                  <div className="information-item">
                    <span>Duración</span>
                    <strong>
                      {content.duracion_min} minutos
                    </strong>
                  </div>
                )}

                {isSeries && (
                  <div className="information-item">
                    <span>Episodios</span>
                    <strong>{episodes.length}</strong>
                  </div>
                )}

                {content.creador?.username && (
                  <div className="information-item">
                    <span>Publicado por</span>
                    <strong>
                      {content.creador.username}
                    </strong>
                  </div>
                )}

              </div>

              <div className="content-description-section">

                <h3>Sinopsis</h3>

                <p>
                  {content.descripcion ||
                    'Sin descripción disponible.'}
                </p>

              </div>

            </div>
          </div>
        </section>

      </main>

      <Footer />

      {/* =======================================
          VENTANA FLOTANTE DE EPISODIOS
      ======================================== */}

      {showEpisodes && isSeries && (

        <div
          role="presentation"
          className="episodes-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setShowEpisodes(false)
            }
          }}
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="episodes-title"
            className="episodes-modal"
          >

            {/* CABECERA */}

            <div className="episodes-header">

              <div>
                <p className="episodes-series-title">
                  {content.titulo}
                </p>

                <h2 id="episodes-title">
                  Episodios
                </h2>

                <p className="episodes-subtitle">
                  Elegí un capítulo para reproducir
                </p>
              </div>

              <button
                type="button"
                className="episodes-close"
                onClick={() => setShowEpisodes(false)}
                aria-label="Cerrar episodios"
              >
                ×
              </button>

            </div>

            {/* TEMPORADAS */}

            {seasons.length > 0 && (

              <div className="episodes-season">

                <label htmlFor="season-selector">
                  Temporada
                </label>

                <select
                  id="season-selector"
                  value={selectedSeason}
                  onChange={event =>
                    setSelectedSeason(
                      Number(event.target.value)
                    )
                  }
                >
                  {seasons.map(season => (
                    <option key={season} value={season}>
                      Temporada {season}
                    </option>
                  ))}
                </select>

              </div>

            )}

            {/* EPISODIOS */}

            <div className="episodes-list">

              {episodes.length === 0 ? (

                <div className="episodes-empty">
                  <span>▤</span>
                  <p>
                    Esta serie todavía no tiene episodios disponibles.
                  </p>
                </div>

              ) : (

                <div className="d-flex flex-column gap-3">

                  {filteredEpisodes.map(episode => {

                    const hasEpisodeVideo = Boolean(
                      episode.video_b2_key ||
                      episode.video_hls_url
                    )

                    return (

                      <article
                        key={episode.id}
                        className="episode-card"
                      >

                        <div className="episode-thumbnail">

                          {content.portada_url && (
                            <img
                              src={content.portada_url}
                              alt=""
                            />
                          )}

                          <span>▶</span>

                        </div>

                        <div className="episode-information">

                          <h3>
                            {episode.numero}. {episode.titulo}
                          </h3>

                          <p className="episode-metadata">
                            Temporada {episode.temporada}
                            {' • '}
                            {episode.duracion_min} min
                          </p>

                          <p className="episode-description">
                            {episode.descripcion ||
                              'Sin descripción disponible.'}
                          </p>

                        </div>

                        <button
                          type="button"
                          className="episode-play-button"
                          disabled={!hasEpisodeVideo}
                          onClick={() =>
                            handleEpisodePlay(episode.id)
                          }
                        >
                          {hasEpisodeVideo
                            ? '▶ Reproducir'
                            : 'No disponible'}
                        </button>

                      </article>

                    )
                  })}

                </div>

              )}

            </div>

          </div>

        </div>

      )}

      {/* =======================================
          ESTILOS
      ======================================== */}

      <style>
        {`

          /* HERO */

          .content-hero {
            min-height: 78vh;
            background-size: cover;
            background-position: center;
            background-color: #151515;
            display: flex;
            align-items: center;
            position: relative;
          }

          .content-hero-container {
            min-height: 78vh;
            display: flex;
            align-items: center;
            padding-top: 110px;
            padding-bottom: 90px;
          }

          .content-hero-information {
            max-width: 720px;
            width: 100%;
          }

          /* VOLVER */

          .content-back-button {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            padding: 9px 17px;
            margin-bottom: 30px;
            color: #fff;
            background: rgba(255,255,255,.07);
            border: 1px solid rgba(255,255,255,.22);
            border-radius: 7px;
            font-size: .9rem;
            font-weight: 600;
            transition: all .2s ease;
          }

          .content-back-button:hover {
            background: rgba(255,255,255,.16);
            transform: translateX(-3px);
          }

          /* CATEGORÍA */

          .content-category {
            display: inline-block;
            color: #ff5364;
            font-size: .85rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 12px;
          }

          /* TÍTULO */

          .content-title {
            font-size: clamp(2.5rem, 6vw, 4.7rem);
            font-weight: 900;
            line-height: 1.05;
            letter-spacing: -1.5px;
            margin-bottom: 24px;
            color: #fff;
            text-shadow: 0 4px 20px rgba(0,0,0,.4);
          }

          /* METADATOS */

          .content-metadata {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 12px;
            margin-bottom: 25px;
            color: #e0e0e0;
            font-size: .95rem;
          }

          .content-metadata span {
            padding: 6px 12px;
            background: rgba(255,255,255,.1);
            border: 1px solid rgba(255,255,255,.08);
            border-radius: 5px;
          }

          /* SINOPSIS */

          .content-description {
            max-width: 650px;
            color: #dedede;
            font-size: 1.08rem;
            line-height: 1.8;
            margin-bottom: 30px;
          }

          /* BOTONES */

          .content-actions {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 14px;
            margin-top: 30px;
          }

          .content-play-button,
          .favorite-action {
            min-height: 56px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 0 26px;
            border-radius: 8px;
            font-size: .98rem;
            font-weight: 750;
            letter-spacing: .2px;
            cursor: pointer;
            transition:
              transform .22s ease,
              background .22s ease,
              border-color .22s ease,
              box-shadow .22s ease;
          }

          .content-play-button svg {
            width: 21px;
            height: 21px;
          }

          /* REPRODUCIR */

          .content-play-button {
            color: #fff;
            background: linear-gradient(135deg,#f04455,#c91f35);
            border: 1px solid #e73549;
            box-shadow: 0 7px 22px rgba(220,53,69,.22);
          }

          .content-play-button:hover:not(:disabled) {
            background: linear-gradient(135deg,#ff5263,#dc263c);
            transform: translateY(-3px);
            box-shadow: 0 12px 28px rgba(220,53,69,.35);
          }

          .content-play-button:active:not(:disabled) {
            transform: translateY(-1px);
          }

          .content-play-button:disabled {
            opacity: .5;
            cursor: not-allowed;
            box-shadow: none;
          }

          /* MI LISTA */

          .favorite-action {
            position: relative;
            color: #fff;
            background: rgba(20,20,20,.72);
            border: 1px solid rgba(255,255,255,.35);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }

          .favorite-action:hover:not(:disabled) {
            background: rgba(255,255,255,.13);
            border-color: #fff;
            transform: translateY(-3px);
            box-shadow: 0 8px 22px rgba(0,0,0,.25);
          }

          .favorite-action.is-saved {
            background: linear-gradient(
              135deg,
              rgba(220,53,69,.28),
              rgba(125,20,35,.3)
            );
            border: 1px solid #dc3545;
            box-shadow:
              inset 0 0 0 1px rgba(220,53,69,.1),
              0 5px 20px rgba(220,53,69,.12);
          }

          .favorite-action.is-saved:hover:not(:disabled) {
            background: linear-gradient(
              135deg,
              rgba(220,53,69,.42),
              rgba(125,20,35,.4)
            );
            border-color: #ff6878;
          }

          .favorite-action:disabled {
            opacity: .7;
            cursor: wait;
          }

          .favorite-icon {
            width: 22px;
            height: 22px;
            flex: 0 0 22px;
          }

          .favorite-check {
            color: #ff6575;
            font-size: .85rem;
            margin-left: 2px;
          }

          /* CARGA */

          .favorite-spinner {
            width: 19px;
            height: 19px;
            border: 2px solid rgba(255,255,255,.25);
            border-top-color: #fff;
            border-radius: 50%;
            animation: favoriteSpin .7s linear infinite;
          }

          @keyframes favoriteSpin {
            to {
              transform: rotate(360deg);
            }
          }

          /* ERROR */

          .favorite-error {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            max-width: 560px;
            margin-top: 18px;
            padding: 12px 16px;
            color: #ffd7da;
            background: rgba(220,53,69,.12);
            border: 1px solid rgba(220,53,69,.4);
            border-radius: 8px;
            font-size: .9rem;
          }

          .favorite-error span {
            width: 21px;
            height: 21px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            color: #fff;
            background: #dc3545;
            font-weight: 800;
          }

          /* INFORMACIÓN */

          .content-information {
            padding-top: 65px;
            padding-bottom: 90px;
          }

          .content-poster-wrapper {
            overflow: hidden;
            border-radius: 13px;
            background: #292929;
            box-shadow: 0 12px 35px rgba(0,0,0,.4);
          }

          .content-poster {
            display: block;
            width: 100%;
            max-height: 470px;
            object-fit: cover;
            transition: transform .4s ease;
          }

          .content-poster-wrapper:hover .content-poster {
            transform: scale(1.035);
          }

          .information-heading {
            display: flex;
            align-items: center;
            gap: 13px;
            margin-bottom: 30px;
          }

          .information-heading h2 {
            font-size: 1.8rem;
            font-weight: 800;
            margin: 0;
          }

          .information-line {
            width: 5px;
            height: 32px;
            border-radius: 5px;
            background: #dc3545;
          }

          .information-grid {
            display: grid;
            grid-template-columns: repeat(2,minmax(0,1fr));
            gap: 15px;
          }

          .information-item {
            display: flex;
            flex-direction: column;
            gap: 7px;
            padding: 17px 19px;
            background: #292d31;
            border: 1px solid rgba(255,255,255,.06);
            border-radius: 9px;
          }

          .information-item span {
            color: #999;
            font-size: .85rem;
          }

          .information-item strong {
            color: #fff;
            font-size: .98rem;
          }

          .content-description-section {
            margin-top: 35px;
            padding-top: 27px;
            border-top: 1px solid rgba(255,255,255,.1);
          }

          .content-description-section h3 {
            font-size: 1.2rem;
            font-weight: 800;
            margin-bottom: 15px;
          }

          .content-description-section p {
            color: #c7c7c7;
            line-height: 1.85;
            font-size: 1rem;
            margin: 0;
          }

          /* VENTANA DE EPISODIOS */

          .episodes-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0,0,0,.82);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            animation: episodesFadeIn .22s ease-out;
          }

          .episodes-modal {
            width: 100%;
            max-width: 960px;
            max-height: 88vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            color: #fff;
            background: linear-gradient(145deg,#222,#101010);
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 18px;
            box-shadow: 0 25px 80px rgba(0,0,0,.65);
            animation: episodesScaleIn .25s ease-out;
          }

          .episodes-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            padding: 26px;
            border-bottom: 1px solid rgba(255,255,255,.1);
          }

          .episodes-series-title {
            color: #f04a5b;
            font-size: .82rem;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 8px;
          }

          .episodes-header h2 {
            font-size: 1.8rem;
            font-weight: 850;
            margin-bottom: 6px;
          }

          .episodes-subtitle {
            color: #999;
            margin: 0;
            font-size: .9rem;
          }

          .episodes-close {
            width: 43px;
            height: 43px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            color: #fff;
            background: #303030;
            border: 1px solid rgba(255,255,255,.15);
            border-radius: 50%;
            font-size: 25px;
            transition: all .2s ease;
          }

          .episodes-close:hover {
            color: #fff;
            background: #dc3545;
            border-color: #dc3545;
            transform: rotate(90deg);
          }

          /* TEMPORADAS */

          .episodes-season {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 22px 26px 0;
          }

          .episodes-season label {
            color: #aaa;
            font-size: .82rem;
            font-weight: 700;
          }

          .episodes-season select {
            max-width: 240px;
            padding: 11px 14px;
            color: #fff;
            background: #292929;
            border: 1px solid #555;
            border-radius: 7px;
          }

          .episodes-season select:focus {
            border-color: #dc3545;
            outline: none;
            box-shadow: 0 0 0 3px rgba(220,53,69,.15);
          }

          /* LISTA */

          .episodes-list {
            overflow-y: auto;
            min-height: 0;
            padding: 24px 26px 28px;
            overscroll-behavior: contain;
          }

          .episodes-empty {
            padding: 45px 15px;
            text-align: center;
            color: #999;
          }

          .episodes-empty span {
            display: block;
            color: #dc3545;
            font-size: 2.5rem;
            margin-bottom: 12px;
          }

          .episode-card {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 16px;
            background: #292929;
            border: 1px solid rgba(255,255,255,.07);
            border-radius: 11px;
            transition: border-color .2s ease, transform .2s ease;
          }

          .episode-card:hover {
            border-color: rgba(220,53,69,.55);
            transform: translateY(-2px);
          }

          .episode-thumbnail {
            position: relative;
            width: 155px;
            height: 90px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            overflow: hidden;
            background: #343a40;
            border-radius: 8px;
          }

          .episode-thumbnail img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: .55;
          }

          .episode-thumbnail span {
            position: relative;
            z-index: 1;
            color: #fff;
            font-size: 1.8rem;
            text-shadow: 0 2px 8px #000;
          }

          .episode-information {
            flex: 1;
            min-width: 0;
          }

          .episode-information h3 {
            font-size: 1.05rem;
            font-weight: 750;
            margin-bottom: 8px;
          }

          .episode-metadata {
            color: #999;
            font-size: .83rem;
            margin-bottom: 8px;
          }

          .episode-description {
            color: #ccc;
            font-size: .88rem;
            line-height: 1.5;
            margin: 0;
          }

          .episode-play-button {
            flex-shrink: 0;
            padding: 11px 17px;
            color: #fff;
            background: #dc3545;
            border: 1px solid #dc3545;
            border-radius: 7px;
            font-size: .85rem;
            font-weight: 700;
            transition: all .2s ease;
          }

          .episode-play-button:hover:not(:disabled) {
            background: #bb2d3b;
            transform: translateY(-2px);
          }

          .episode-play-button:disabled {
            background: #454545;
            border-color: #454545;
            color: #999;
            cursor: not-allowed;
          }

          /* ANIMACIONES */

          @keyframes episodesFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes episodesScaleIn {
            from {
              opacity: 0;
              transform: translateY(15px) scale(.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          /* RESPONSIVE */

          @media (max-width: 767.98px) {

            .content-hero,
            .content-hero-container {
              min-height: 85vh;
            }

            .content-hero-container {
              padding-top: 100px;
              padding-bottom: 65px;
            }

            .content-title {
              font-size: 2.7rem;
            }

            .content-description {
              font-size: .98rem;
            }

            .content-actions {
              align-items: stretch;
            }

            .content-play-button,
            .favorite-action {
              flex: 1 1 100%;
              min-height: 52px;
            }

            .information-grid {
              grid-template-columns: 1fr;
            }

            .episode-card {
              flex-direction: column;
              align-items: stretch;
            }

            .episode-thumbnail {
              width: 100%;
              height: 170px;
            }

            .episode-play-button {
              width: 100%;
            }

            .episodes-modal {
              max-height: 92vh;
            }

            .episodes-header {
              padding: 20px;
            }

            .episodes-list {
              padding: 18px;
            }

            .episodes-season {
              padding: 18px 20px 0;
            }
          }

          @media (max-width: 400px) {

            .content-title {
              font-size: 2.25rem;
            }

            .content-metadata {
              gap: 7px;
              font-size: .82rem;
            }

            .content-metadata span {
              padding: 5px 8px;
            }

          }

          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: .01ms !important;
              transition-duration: .01ms !important;
            }
          }

        `}
      </style>

    </div>
  )
}

export default ContentDetail
