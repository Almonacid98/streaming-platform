import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL

function MyList() {
  const { authFetch } = useAuth()

  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState(null)

  // ==========================================
  // CARGAR MI LISTA (CON PAGINACIÓN)
  // ==========================================

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      let url = `${API_URL}/favoritos/`
      const todosLosFavoritos = []
      const paginasVisitadas = new Set()

      while (url) {
        if (paginasVisitadas.has(url)) {
          throw new Error(
            'Se detectó un problema con la paginación.'
          )
        }

        paginasVisitadas.add(url)

        const response = await authFetch(url)

        if (!response.ok) {
          throw new Error(
            'No se pudo cargar tu lista de favoritos.'
          )
        }

        const data = await response.json()

        if (Array.isArray(data)) {
          todosLosFavoritos.push(...data)
          url = null
        } else {
          if (!Array.isArray(data?.results)) {
            throw new Error(
              'La respuesta de favoritos no tiene el formato esperado.'
            )
          }

          todosLosFavoritos.push(...data.results)

          url = data.next
            ? new URL(data.next, url).toString()
            : null
        }
      }

      setFavorites(todosLosFavoritos)

    } catch (err) {
      console.error(
        'Error al cargar favoritos:',
        err
      )

      setError(
        err.message ||
        'Ocurrió un error al cargar Mi lista.'
      )

    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  // ==========================================
  // QUITAR DE MI LISTA
  // ==========================================

  const handleRemove = async (favoriteId) => {
    if (removingId !== null) return

    try {
      setRemovingId(favoriteId)
      setError('')

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

      setFavorites(previous =>
        previous.filter(
          favorite => favorite.id !== favoriteId
        )
      )

    } catch (err) {
      console.error(
        'Error al eliminar favorito:',
        err
      )

      setError(
        err.message ||
        'No se pudo actualizar Mi lista.'
      )

    } finally {
      setRemovingId(null)
    }
  }

  // ==========================================
  // FORMATEAR FECHA
  // ==========================================

  const formatDate = (date) => {
    if (!date) return ''

    return new Intl.DateTimeFormat(
      'es-AR',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    ).format(new Date(date))
  }

  // ==========================================
  // CARGANDO
  // ==========================================

  if (loading) {
    return (
      <div className="my-list-page">
        <Navbar />

        <main className="my-list-loading">
          <div className="text-center">
            <div
              className="spinner-border text-danger mb-3"
              role="status"
            >
              <span className="visually-hidden">
                Cargando...
              </span>
            </div>

            <p>Cargando tu lista...</p>
          </div>
        </main>

        <Footer />
        <MyListStyles />
      </div>
    )
  }

  // ==========================================
  // VISTA PRINCIPAL
  // ==========================================

  return (
    <div className="my-list-page">
      <Navbar />

      <main className="container my-list-container">

        {/* ENCABEZADO */}

        <header className="my-list-header">
          <div className="my-list-heading">
            <span className="my-list-eyebrow">
              STREAM PLATFORM
            </span>

            <h1>
              Mi <span>lista</span>
            </h1>

            <p>
              Guardá tus películas y series favoritas
              para encontrarlas cuando quieras.
            </p>
          </div>

          <div className="my-list-counter">
            <span className="counter-number">
              {favorites.length}
            </span>

            <span className="counter-label">
              {favorites.length === 1
                ? 'contenido guardado'
                : 'contenidos guardados'}
            </span>
          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div
            className="my-list-error"
            role="alert"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={loadFavorites}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* LISTA VACÍA */}

        {!error && favorites.length === 0 && (
          <section className="my-list-empty">
            <div className="empty-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-4-6 4V4.75Z" />
              </svg>
            </div>

            <h2>
              Todavía no tenés favoritos
            </h2>

            <p>
              Explorá nuestro catálogo y agregá las
              películas y series que quieras ver más adelante.
            </p>

            <Link
              to="/catalog"
              className="my-list-explore-button"
            >
              Explorar catálogo
              <span>→</span>
            </Link>
          </section>
        )}

        {/* TARJETAS */}

        {favorites.length > 0 && (
          <section className="my-list-grid">
            {favorites.map(favorite => {
              const content = favorite.contenido_detalle

              if (!content) return null

              const image =
                content.portada_url ||
                content.hero_url

              const isSeries =
                content.tipo === 'serie'

              return (
                <article
                  className="my-list-card"
                  key={favorite.id}
                >

                  {/* PORTADA */}

                  <Link
                    to={`/content/${content.id}`}
                    className="my-list-image-link"
                    aria-label={`Ver ${content.titulo}`}
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={`Portada de ${content.titulo}`}
                        className="my-list-image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="my-list-no-image">
                        <span>
                          {content.titulo}
                        </span>
                      </div>
                    )}

                    <div className="my-list-image-overlay" />

                    <span className="my-list-type">
                      {isSeries ? 'SERIE' : 'PELÍCULA'}
                    </span>

                    <span className="my-list-play">
                      ▶
                    </span>
                  </Link>

                  {/* INFORMACIÓN */}

                  <div className="my-list-card-body">
                    <div className="my-list-card-title-row">
                      <h2>
                        <Link to={`/content/${content.id}`}>
                          {content.titulo}
                        </Link>
                      </h2>

                      <button
                        type="button"
                        className="my-list-remove-icon"
                        onClick={() =>
                          handleRemove(favorite.id)
                        }
                        disabled={removingId !== null}
                        title="Quitar de Mi lista"
                        aria-label={`Quitar ${content.titulo}`}
                      >
                        {removingId === favorite.id ? (
                          <span className="mini-spinner" />
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="my-list-card-metadata">
                      {content.anio && (
                        <span>{content.anio}</span>
                      )}

                      {content.genero && (
                        <span>{content.genero}</span>
                      )}

                      {isSeries ? (
                        <span>
                          {content.episodios?.length || 0} episodios
                        </span>
                      ) : (
                        content.duracion_min > 0 && (
                          <span>
                            {content.duracion_min} min
                          </span>
                        )
                      )}
                    </div>

                    <p className="my-list-card-description">
                      {content.descripcion ||
                        'Sin descripción disponible.'}
                    </p>

                    <div className="my-list-card-footer">
                      <Link
                        to={`/content/${content.id}`}
                        className="my-list-detail-button"
                      >
                        Ver contenido
                        <span>→</span>
                      </Link>

                      <span className="my-list-date">
                        {formatDate(favorite.fecha_agregado)}
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {/* VOLVER AL CATÁLOGO */}

        {favorites.length > 0 && (
          <div className="my-list-bottom">
            <Link to="/catalog">
              ← Seguir explorando
            </Link>
          </div>
        )}

      </main>

      <Footer />
      <MyListStyles />
    </div>
  )
}

// ==========================================
// ESTILOS DE MI LISTA
// ==========================================

function MyListStyles() {
  return (
    <style>
      {`
        .my-list-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: #fff;
          background: #171717;
        }

        .my-list-container {
          flex: 1;
          padding-top: 65px;
          padding-bottom: 90px;
        }

        /* ENCABEZADO */

        .my-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          margin-bottom: 50px;
          padding-bottom: 30px;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }

        .my-list-eyebrow {
          color: #e84456;
          font-size: .78rem;
          font-weight: 850;
          letter-spacing: 3px;
        }

        .my-list-heading h1 {
          margin: 10px 0;
          font-size: clamp(2.6rem,5vw,4rem);
          font-weight: 900;
          letter-spacing: -2px;
        }

        .my-list-heading h1 span {
          color: #e84456;
        }

        .my-list-heading p {
          max-width: 550px;
          color: #aaa;
          line-height: 1.7;
          margin: 0;
        }

        .my-list-counter {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 125px;
          padding: 20px;
          background: #252525;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
        }

        .counter-number {
          color: #f05263;
          font-size: 2.2rem;
          font-weight: 900;
          line-height: 1.2;
        }

        .counter-label {
          color: #aaa;
          font-size: .75rem;
          text-align: center;
          margin-top: 5px;
        }

        /* CARGANDO */

        .my-list-loading {
          flex: 1;
          min-height: 65vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #aaa;
        }

        /* ERROR */

        .my-list-error {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 17px 20px;
          margin-bottom: 30px;
          color: #ffd7da;
          background: rgba(220,53,69,.12);
          border: 1px solid rgba(220,53,69,.35);
          border-radius: 9px;
        }

        .my-list-error button {
          color: #fff;
          background: #dc3545;
          border: 0;
          border-radius: 6px;
          padding: 8px 14px;
          font-weight: 700;
        }

        /* LISTA VACÍA */

        .my-list-empty {
          min-height: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 45px 20px;
          text-align: center;
          background: linear-gradient(145deg,#222,#1b1b1b);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 16px;
        }

        .empty-icon {
          width: 82px;
          height: 82px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 25px;
          color: #ed4558;
          background: rgba(220,53,69,.12);
          border: 1px solid rgba(220,53,69,.25);
          border-radius: 50%;
        }

        .empty-icon svg {
          width: 38px;
          height: 38px;
        }

        .my-list-empty h2 {
          font-size: 1.6rem;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .my-list-empty p {
          max-width: 500px;
          color: #aaa;
          line-height: 1.7;
          margin-bottom: 25px;
        }

        .my-list-explore-button {
          display: inline-flex;
          align-items: center;
          gap: 15px;
          padding: 13px 22px;
          color: #fff;
          background: #dc3545;
          border-radius: 7px;
          text-decoration: none;
          font-weight: 750;
          transition: all .2s ease;
        }

        .my-list-explore-button:hover {
          color: #fff;
          background: #bb2d3b;
          transform: translateY(-3px);
        }

        /* GRID */

        .my-list-grid {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 27px;
        }

        /* TARJETAS */

        .my-list-card {
          min-width: 0;
          overflow: hidden;
          background: #242424;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 12px;
          transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
        }

        .my-list-card:hover {
          transform: translateY(-5px);
          border-color: rgba(220,53,69,.5);
          box-shadow: 0 15px 35px rgba(0,0,0,.3);
        }

        /* IMÁGENES */

        .my-list-image-link {
          position: relative;
          display: block;
          overflow: hidden;
          height: 320px;
          background: #303030;
        }

        .my-list-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          transition: transform .45s ease;
        }

        .my-list-card:hover .my-list-image {
          transform: scale(1.06);
        }

        .my-list-no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 25px;
          color: #aaa;
          text-align: center;
          font-weight: 800;
        }

        .my-list-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0,0,0,.78),
            transparent 55%
          );
          pointer-events: none;
        }

        .my-list-type {
          position: absolute;
          top: 15px;
          left: 15px;
          padding: 7px 11px;
          color: #fff;
          background: rgba(220,53,69,.95);
          border-radius: 5px;
          font-size: .7rem;
          font-weight: 850;
          letter-spacing: 1px;
        }

        .my-list-play {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 55px;
          height: 55px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 4px;
          color: #fff;
          background: rgba(220,53,69,.92);
          border-radius: 50%;
          opacity: 0;
          transform: translate(-50%,-40%);
          transition: all .25s ease;
        }

        .my-list-card:hover .my-list-play {
          opacity: 1;
          transform: translate(-50%,-50%);
        }

        /* INFORMACIÓN */

        .my-list-card-body {
          padding: 20px;
        }

        .my-list-card-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .my-list-card-title-row h2 {
          min-width: 0;
          font-size: 1.15rem;
          font-weight: 850;
          line-height: 1.4;
          margin: 0;
        }

        .my-list-card-title-row h2 a {
          color: #fff;
          text-decoration: none;
          transition: color .2s ease;
        }

        .my-list-card-title-row h2 a:hover {
          color: #f05263;
        }

        /* ELIMINAR */

        .my-list-remove-icon {
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #aaa;
          background: #333;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 7px;
          transition: all .2s ease;
        }

        .my-list-remove-icon svg {
          width: 18px;
          height: 18px;
        }

        .my-list-remove-icon:hover:not(:disabled) {
          color: #fff;
          background: #dc3545;
          border-color: #dc3545;
        }

        .my-list-remove-icon:disabled {
          opacity: .5;
          cursor: wait;
        }

        .mini-spinner {
          width: 16px;
          height: 16px;
          display: block;
          border: 2px solid rgba(255,255,255,.25);
          border-top-color: #fff;
          border-radius: 50%;
          animation: favoriteSpin .7s linear infinite;
        }

        /* METADATOS */

        .my-list-card-metadata {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 13px;
        }

        .my-list-card-metadata span {
          color: #aaa;
          font-size: .75rem;
          padding: 5px 8px;
          background: #303030;
          border-radius: 4px;
        }

        /* DESCRIPCIÓN */

        .my-list-card-description {
          display: -webkit-box;
          overflow: hidden;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
          min-height: 66px;
          margin: 16px 0;
          color: #aaa;
          font-size: .88rem;
          line-height: 1.55;
        }

        /* PIE DE TARJETA */

        .my-list-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-top: 15px;
          border-top: 1px solid rgba(255,255,255,.08);
        }

        .my-list-detail-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #f05263;
          font-size: .87rem;
          font-weight: 800;
          text-decoration: none;
          transition: gap .2s ease;
        }

        .my-list-detail-button:hover {
          color: #ff8793;
          gap: 13px;
        }

        .my-list-date {
          color: #777;
          font-size: .72rem;
          text-align: right;
        }

        /* FINAL */

        .my-list-bottom {
          display: flex;
          justify-content: center;
          margin-top: 45px;
        }

        .my-list-bottom a {
          color: #aaa;
          text-decoration: none;
          font-weight: 650;
          transition: color .2s ease;
        }

        .my-list-bottom a:hover {
          color: #fff;
        }

        /* RESPONSIVE */

        @media (max-width: 991px) {
          .my-list-grid {
            grid-template-columns: repeat(2,minmax(0,1fr));
          }

          .my-list-image-link {
            height: 290px;
          }
        }

        @media (max-width: 575px) {
          .my-list-container {
            padding-top: 40px;
            padding-bottom: 60px;
          }

          .my-list-header {
            align-items: flex-start;
            flex-direction: column;
            margin-bottom: 30px;
          }

          .my-list-counter {
            flex-direction: row;
            justify-content: flex-start;
            gap: 12px;
            width: 100%;
            padding: 12px 16px;
          }

          .counter-number {
            font-size: 1.7rem;
          }

          .counter-label {
            margin: 0;
          }

          .my-list-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .my-list-image-link {
            height: 340px;
          }

          .my-list-error {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .my-list-page *,
          .my-list-page *::before,
          .my-list-page *::after {
            transition-duration: .01ms !important;
            animation-duration: .01ms !important;
          }
        }
      `}
    </style>
  )
}

export default MyList
