
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const API_URL = import.meta.env.VITE_API_URL

const formatTime = (value) => {
  const seconds = Math.max(0, Math.floor(Number(value) || 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remaining = seconds % 60

  if (hours > 0) {
    return `${hours} h ${minutes} min`
  }

  if (minutes > 0) {
    return `${minutes} min ${remaining} s`
  }

  return `${remaining} s`
}

const formatDate = (value) => {
  if (!value) return 'Fecha no disponible'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible'
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function WatchHistory() {
  const navigate = useNavigate()
  const { authFetch } = useAuth()

  const fetchRef = useRef(authFetch)
  fetchRef.current = authFetch

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState(null)
  const [filter, setFilter] = useState('todos')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true

    async function loadHistory() {
      setLoading(true)
      setError('')

      try {
        let url = `${API_URL}/visualizaciones/`
        const collected = []
        const visited = new Set()

        // Recorremos todas las páginas del historial.
        // Así no perdemos episodios antiguos por paginación.
        while (url) {
          if (visited.has(url)) {
            throw new Error('Se detectó un problema de paginación.')
          }

          visited.add(url)

          const response = await fetchRef.current(url)

          if (!response.ok) {
            throw new Error('No se pudo consultar el historial.')
          }

          const data = await response.json()

          if (Array.isArray(data)) {
            collected.push(...data)
            url = null
          } else {
            collected.push(...(data.results || []))
            url = data.next
              ? new URL(data.next, url).href
              : null
          }

          if (!active) return
        }

        // Si hubiera registros repetidos, conservamos
        // el de actualización más reciente.
        const unique = new Map()

        const ordered = collected.sort((a, b) =>
          new Date(b.fecha_visualizacion || 0) -
          new Date(a.fecha_visualizacion || 0)
        )

        for (const item of ordered) {
          const key = item.episodio != null
            ? `episode-${item.episodio}`
            : `content-${item.contenido}`

          if (!unique.has(key)) {
            unique.set(key, item)
          }
        }

        if (active) {
          setHistory([...unique.values()])
        }
      } catch (err) {
        console.error('Error al cargar historial:', err)

        if (active) {
          setError(
            err.message || 'No se pudo cargar el historial.'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadHistory()

    return () => {
      active = false
    }
  }, [reload])

  const removeHistory = async (id) => {
    if (removingId !== null) return

    const confirmed = window.confirm(
      '¿Querés quitar esta reproducción de tu historial?'
    )

    if (!confirmed) return

    setRemovingId(id)
    setError('')

    try {
      const response = await fetchRef.current(
        `${API_URL}/visualizaciones/${id}/`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('No se pudo eliminar la reproducción.')
      }

      setHistory((previous) =>
        previous.filter((item) => item.id !== id)
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setRemovingId(null)
    }
  }

  const isSeries = (item) =>
    item.contenido_detalle?.tipo === 'serie'

  const filtered = history.filter((item) => {
    if (filter === 'peliculas') return !isSeries(item)
    if (filter === 'series') return isSeries(item)
    return true
  })

  const continueWatching = (item) => {
    const contentId = item.contenido_detalle?.id || item.contenido

    if (isSeries(item)) {
      const episodeId =
        item.episodio_detalle?.id || item.episodio

      if (episodeId) {
        navigate(`/watch/${contentId}/episode/${episodeId}`)
      } else {
        navigate(`/content/${contentId}`)
      }

      return
    }

    navigate(`/watch/${contentId}`)
  }

  return (
    <div className="history-page">
      <Navbar />

      <main className="container history-container">
        <div className="history-heading">
          <div>
            <span className="history-eyebrow">
              STREAM PLATFORM
            </span>

            <h1>
              Mi <span>historial</span>
            </h1>

            <p>
              Retomá tus películas y episodios exactamente
              donde los dejaste.
            </p>
          </div>

          <div className="history-total">
            <strong>{history.length}</strong>
            <small>
              {history.length === 1
                ? 'reproducción'
                : 'reproducciones'}
            </small>
          </div>
        </div>

        <div className="history-toolbar">
          <div className="history-filters">
            {[
              ['todos', 'Todos'],
              ['peliculas', 'Películas'],
              ['series', 'Series']
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filter === value ? 'selected' : ''}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="history-refresh"
            onClick={() => setReload((value) => value + 1)}
            disabled={loading}
          >
            ↻ Actualizar
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
            <button
              type="button"
              className="btn btn-sm btn-outline-light ms-3"
              onClick={() => setReload((value) => value + 1)}
            >
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <div className="history-empty">
            <div
              className="spinner-border text-danger"
              role="status"
            >
              <span className="visually-hidden">Cargando</span>
            </div>
            <p>Cargando reproducciones...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">▶</div>
            <h2>No hay reproducciones para mostrar</h2>
            <p>
              Cuando reproduzcas películas o episodios,
              aparecerán acá.
            </p>
            <Link to="/catalog" className="history-primary">
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="history-grid">
            {filtered.map((item) => {
              const content = item.contenido_detalle
              if (!content) return null

              const series = isSeries(item)
              const episode = item.episodio_detalle
              const hasEpisode = Boolean(episode || item.episodio)

              const durationMinutes = series
                ? episode?.duracion_min
                : content.duracion_min

              const durationSeconds =
                Number(durationMinutes || 0) * 60

              const progress =
                Number(item.progreso_segundos || 0)

              const percentage = durationSeconds > 0
                ? Math.min(
                    100,
                    Math.max(0, (progress / durationSeconds) * 100)
                  )
                : 0

              const completed =
                durationSeconds > 0 &&
                progress >= durationSeconds - 30

              const available = series
                ? hasEpisode && Boolean(
                    episode?.video_b2_key ||
                    episode?.video_hls_url
                  )
                : Boolean(
                    content.video_b2_key ||
                    content.video_hls_url ||
                    content.video_url
                  )

              const image =
                content.portada_url || content.hero_url

              return (
                <article className="history-card" key={item.id}>
                  <div className="history-poster">
                    {image ? (
                      <img
                        src={image}
                        alt={`Portada de ${content.titulo}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="history-image-empty">
                        {content.titulo}
                      </div>
                    )}

                    <span className="history-type">
                      {series ? 'SERIE' : 'PELÍCULA'}
                    </span>

                    <div className="history-poster-gradient" />
                  </div>

                  <div className="history-card-body">
                    <div className="history-card-top">
                      <div>
                        <h2>{content.titulo}</h2>

                        {series ? (
                          <div className="history-episode">
                            {hasEpisode ? (
                              <>
                                <strong>
                                  {episode
                                    ? `Temporada ${episode.temporada} · Episodio ${episode.numero}`
                                    : `Episodio #${item.episodio}`}
                                </strong>

                                {episode?.titulo && (
                                  <span>{episode.titulo}</span>
                                )}
                              </>
                            ) : (
                              <span className="history-warning">
                                Registro antiguo sin episodio identificado
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="history-metadata">
                            {content.genero} · {content.anio}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        className="history-remove"
                        title="Quitar del historial"
                        aria-label={`Quitar ${content.titulo} del historial`}
                        onClick={() => removeHistory(item.id)}
                        disabled={removingId !== null}
                      >
                        {removingId === item.id ? '…' : '×'}
                      </button>
                    </div>

                    <div className="history-progress-section">
                      <div className="history-progress-labels">
                        <span>
                          {completed
                            ? 'Reproducción finalizada'
                            : 'Progreso de reproducción'}
                        </span>

                        <strong>
                          {durationSeconds > 0
                            ? `${Math.round(percentage)}%`
                            : '—'}
                        </strong>
                      </div>

                      <div
                        className="history-progress-track"
                        role="progressbar"
                        aria-label="Progreso de reproducción"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(percentage)}
                      >
                        <div
                          className="history-progress-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="history-time">
                        <span>{formatTime(progress)}</span>
                        <span>
                          {durationSeconds > 0
                            ? formatTime(durationSeconds)
                            : 'Duración no disponible'}
                        </span>
                      </div>
                    </div>

                    <p className="history-date">
                      Última reproducción: {formatDate(item.fecha_visualizacion)}
                    </p>

                    <div className="history-actions">
                      <button
                        type="button"
                        className="history-primary"
                        onClick={() => continueWatching(item)}
                        disabled={!available}
                      >
                        {available
                          ? completed
                            ? '↻ Volver a reproducir'
                            : '▶ Continuar viendo'
                          : 'No disponible'}
                      </button>

                      <Link
                        to={`/content/${content.id}`}
                        className="history-secondary"
                      >
                        Más información
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      <Footer />

      <style>{`
        .history-page {
          min-height: 100vh;
          background: #151515;
          color: #fff;
          display: flex;
          flex-direction: column;
        }

        .history-container {
          flex: 1;
          padding-top: 55px;
          padding-bottom: 85px;
        }

        .history-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          padding-bottom: 30px;
          border-bottom: 1px solid #333;
        }

        .history-eyebrow {
          font-size: .76rem;
          font-weight: 800;
          color: #f05263;
          letter-spacing: 3px;
        }

        .history-heading h1 {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 900;
          letter-spacing: -2px;
          margin: 10px 0;
        }

        .history-heading h1 span {
          color: #e84456;
        }

        .history-heading p {
          color: #aaa;
          margin: 0;
          line-height: 1.6;
        }

        .history-total {
          min-width: 120px;
          padding: 18px;
          border: 1px solid #393939;
          border-radius: 12px;
          background: #252525;
          text-align: center;
          display: flex;
          flex-direction: column;
        }

        .history-total strong {
          font-size: 2rem;
          color: #f05263;
        }

        .history-total small {
          color: #aaa;
        }

        .history-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
          margin: 28px 0;
        }

        .history-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .history-filters button,
        .history-refresh {
          background: #272727;
          border: 1px solid #393939;
          border-radius: 7px;
          color: #ccc;
          padding: 10px 17px;
          font-weight: 700;
          cursor: pointer;
        }

        .history-filters button.selected {
          background: #dc3545;
          color: #fff;
          border-color: #dc3545;
        }

        .history-refresh:hover,
        .history-filters button:hover {
          border-color: #e84456;
          color: #fff;
        }

        .history-grid {
          display: grid;
          gap: 22px;
        }

        .history-card {
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          background: #242424;
          border: 1px solid #363636;
          border-radius: 14px;
          overflow: hidden;
          transition: border-color .2s ease, transform .2s ease;
        }

        .history-card:hover {
          border-color: rgba(232,68,86,.65);
          transform: translateY(-2px);
        }

        .history-poster {
          position: relative;
          min-height: 270px;
          background: #303030;
        }

        .history-poster img {
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0;
          object-fit: cover;
        }

        .history-image-empty {
          height: 100%;
          min-height: 270px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px;
          color: #aaa;
        }

        .history-type {
          position: absolute;
          z-index: 1;
          top: 14px;
          left: 14px;
          padding: 6px 10px;
          border-radius: 5px;
          background: #dc3545;
          font-size: .7rem;
          font-weight: 850;
          letter-spacing: 1px;
        }

        .history-poster-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 70%, #242424);
          pointer-events: none;
        }

        .history-card-body {
          padding: 25px 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-width: 0;
        }

        .history-card-top {
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .history-card-top h2 {
          font-size: 1.5rem;
          font-weight: 850;
          margin-bottom: 8px;
        }

        .history-metadata {
          color: #aaa;
          margin: 0;
        }

        .history-episode {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .history-episode strong {
          color: #f05263;
        }

        .history-episode span {
          color: #ccc;
        }

        .history-warning {
          color: #f8bb69 !important;
        }

        .history-remove {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          border: 1px solid #484848;
          background: #333;
          color: #ddd;
          border-radius: 7px;
          font-size: 1.5rem;
          line-height: 1;
        }

        .history-remove:hover:not(:disabled) {
          background: #dc3545;
          border-color: #dc3545;
          color: #fff;
        }

        .history-progress-section {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .history-progress-labels,
        .history-time {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: .85rem;
          color: #aaa;
        }

        .history-progress-labels strong {
          color: #fff;
        }

        .history-progress-track {
          width: 100%;
          height: 7px;
          background: #414141;
          border-radius: 99px;
          overflow: hidden;
        }

        .history-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #bb2636, #f05263);
          border-radius: inherit;
        }

        .history-date {
          color: #929292;
          font-size: .83rem;
          margin: 0;
        }

        .history-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: auto;
        }

        .history-primary,
        .history-secondary {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          padding: 11px 17px;
          border-radius: 7px;
          font-size: .9rem;
          font-weight: 750;
          text-decoration: none;
          border: 1px solid transparent;
        }

        .history-primary {
          background: #dc3545;
          color: #fff;
        }

        .history-primary:hover:not(:disabled) {
          background: #b92c3a;
          color: #fff;
        }

        .history-primary:disabled {
          background: #555;
          cursor: not-allowed;
        }

        .history-secondary {
          color: #eee;
          border-color: #666;
          background: transparent;
        }

        .history-secondary:hover {
          color: #fff;
          background: #373737;
        }

        .history-empty {
          min-height: 350px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 15px;
          text-align: center;
          padding: 35px;
          border: 1px solid #333;
          border-radius: 14px;
          background: #202020;
        }

        .history-empty h2 {
          font-size: 1.4rem;
        }

        .history-empty p {
          color: #aaa;
        }

        .history-empty-icon {
          font-size: 2.5rem;
          color: #e84456;
        }

        @media (max-width: 700px) {
          .history-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .history-total {
            width: 100%;
          }

          .history-card {
            grid-template-columns: 1fr;
          }

          .history-poster {
            height: 230px;
            min-height: 230px;
          }

          .history-poster img {
            object-position: center 35%;
          }

          .history-poster-gradient {
            background: linear-gradient(0deg, #242424, transparent 60%);
          }

          .history-card-body {
            padding: 20px;
          }

          .history-toolbar {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}

export default WatchHistory
