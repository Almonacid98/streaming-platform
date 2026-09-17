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


  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true)
        setError('')

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

        setContent(data)
      } catch (error) {
        console.error(
          'Error al cargar el contenido:',
          error
        )

        setError(
          error.message ||
          'Ocurrió un error al cargar el contenido.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [id])


  const handlePlay = () => {
    navigate(`/watch/${id}`)
  }


  const handleBack = () => {
    navigate('/')
  }


  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white">
        <Navbar />

        <main
          className="
            min-vh-100
            d-flex
            justify-content-center
            align-items-center
          "
        >
          <div className="text-center">
            <div
              className="spinner-border text-danger mb-3"
              role="status"
            >
              <span className="visually-hidden">
                Cargando...
              </span>
            </div>

            <p className="mb-0">
              Cargando contenido...
            </p>
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

        <main
          className="
            container
            min-vh-100
            d-flex
            justify-content-center
            align-items-center
          "
        >
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


  const heroImage =
    content.hero_url ||
    content.portada_url

  const hasVideo = Boolean(
    content.video_hls_url ||
    content.video_url
  )


  return (
    <div className="min-vh-100 bg-dark text-white">
      <Navbar />

      <main>
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
            className="
              container
              d-flex
              align-items-center
            "
            style={{
              minHeight: '75vh',
              paddingTop: '100px',
              paddingBottom: '80px'
            }}
          >
            <div
              style={{
                maxWidth: '700px'
              }}
            >
              <button
                type="button"
                className="
                  btn
                  btn-outline-light
                  btn-sm
                  mb-4
                "
                onClick={handleBack}
              >
                ← Volver
              </button>

              <p
                className="
                  text-danger
                  fw-bold
                  text-uppercase
                  mb-2
                "
              >
                {content.tipo || 'Contenido'}
              </p>

              <h1
                className="
                  display-3
                  fw-bold
                  mb-3
                "
              >
                {content.titulo}
              </h1>

              <div
                className="
                  d-flex
                  flex-wrap
                  gap-3
                  text-light
                  mb-4
                "
              >
                {content.anio && (
                  <span>
                    {content.anio}
                  </span>
                )}

                {content.genero && (
                  <span>
                    {content.genero}
                  </span>
                )}

                {content.duracion_min && (
                  <span>
                    {content.duracion_min} min
                  </span>
                )}
              </div>

              {content.descripcion ? (
                <p
                  className="
                    fs-5
                    text-light
                    mb-4
                  "
                  style={{
                    lineHeight: '1.7'
                  }}
                >
                  {content.descripcion}
                </p>
              ) : (
                <p className="text-secondary mb-4">
                  Este contenido todavía no tiene
                  una descripción disponible.
                </p>
              )}

              {hasVideo ? (
                <button
                  type="button"
                  className="
                    btn
                    btn-danger
                    btn-lg
                    px-4
                  "
                  onClick={handlePlay}
                >
                  ▶ Reproducir
                </button>
              ) : (
                <button
                  type="button"
                  className="
                    btn
                    btn-secondary
                    btn-lg
                    px-4
                  "
                  disabled
                >
                  Video no disponible
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="container py-5">
          <div className="row g-4">
            {content.portada_url && (
              <div className="col-12 col-md-4 col-lg-3">
                <img
                  src={content.portada_url}
                  alt={`Portada de ${content.titulo}`}
                  className="
                    img-fluid
                    rounded
                    shadow
                  "
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

                <strong>
                  {content.titulo}
                </strong>
              </div>

              <div className="mb-3">
                <span className="text-secondary">
                  Tipo:
                </span>{' '}

                <strong>
                  {content.tipo || 'No especificado'}
                </strong>
              </div>

              <div className="mb-3">
                <span className="text-secondary">
                  Género:
                </span>{' '}

                <strong>
                  {content.genero || 'No especificado'}
                </strong>
              </div>

              <div className="mb-3">
                <span className="text-secondary">
                  Año:
                </span>{' '}

                <strong>
                  {content.anio || 'No especificado'}
                </strong>
              </div>

              <div className="mb-3">
                <span className="text-secondary">
                  Duración:
                </span>{' '}

                <strong>
                  {content.duracion_min
                    ? `${content.duracion_min} minutos`
                    : 'No especificada'}
                </strong>
              </div>

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
                  style={{
                    lineHeight: '1.7'
                  }}
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
    </div>
  )
}

export default ContentDetail