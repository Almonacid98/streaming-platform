import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL

const inicial = {
  temporada: 1,
  numero: 1,
  titulo: '',
  descripcion: '',
  duracion_min: 0,
  video_b2_key: '',
  video_hls_url: ''
}

function AdminEpisodeForm() {
  const { serieId, episodioId } = useParams()
  const navigate = useNavigate()
  const { usuario, authFetch } = useAuth()

  const esEdicion = Boolean(episodioId)

  const [form, setForm] = useState(inicial)
  const [serie, setSerie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true

    const cargar = async () => {
      try {
        const serieResponse = await authFetch(
          `${API_URL}/contenidos/${serieId}/`
        )

        if (!serieResponse.ok) {
          throw new Error('No se pudo obtener la serie.')
        }

        const serieData = await serieResponse.json()

        if (serieData.tipo !== 'serie') {
          throw new Error('El contenido no es una serie.')
        }

        const autorizado =
          usuario?.is_superuser === true ||
          usuario?.rol === 'admin' ||
          (
            usuario?.rol === 'creador' &&
            Number(serieData.creador?.id) === Number(usuario?.id)
          )

        if (!autorizado) {
          throw new Error('No tenés permisos sobre esta serie.')
        }

        if (activo) setSerie(serieData)

        if (esEdicion) {
          const response = await authFetch(
            `${API_URL}/episodios/${episodioId}/`
          )

          if (!response.ok) {
            throw new Error('No se pudo obtener el episodio.')
          }

          const episodio = await response.json()

          if (Number(episodio.serie) !== Number(serieId)) {
            throw new Error('El episodio no pertenece a esta serie.')
          }

          if (activo) {
            setForm({
              temporada: episodio.temporada,
              numero: episodio.numero,
              titulo: episodio.titulo,
              descripcion: episodio.descripcion || '',
              duracion_min: episodio.duracion_min,
              video_b2_key: episodio.video_b2_key || '',
              video_hls_url: episodio.video_hls_url || ''
            })
          }
        }
      } catch (err) {
        if (activo) setError(err.message)
      } finally {
        if (activo) setLoading(false)
      }
    }

    cargar()

    return () => {
      activo = false
    }
  }, [serieId, episodioId, esEdicion, authFetch, usuario])

  const cambiar = (e) => {
    const { name, value } = e.target
    setForm((actual) => ({
      ...actual,
      [name]: value
    }))
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!serie) return

    setGuardando(true)
    setError('')

    try {
      const payload = {
        ...form,
        serie: Number(serieId),
        temporada: Number(form.temporada),
        numero: Number(form.numero),
        duracion_min: Number(form.duracion_min),
        video_b2_key: form.video_b2_key || null,
        video_hls_url: form.video_hls_url || null
      }

      const url = esEdicion
        ? `${API_URL}/episodios/${episodioId}/`
        : `${API_URL}/episodios/`

      const response = await authFetch(url, {
        method: esEdicion ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const detalle = Object.entries(data)
          .map(([campo, mensaje]) =>
            `${campo}: ${Array.isArray(mensaje) ? mensaje.join(', ') : mensaje}`
          )
          .join(' | ')

        throw new Error(detalle || 'No se pudo guardar el episodio.')
      }

      navigate(`/admin/series/${serieId}/episodes`)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const input = (name, label, type = 'text', required = false) => (
    <div className="col-md-6" key={name}>
      <label className="form-label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className="form-control bg-black text-white border-secondary"
        value={form[name]}
        onChange={cambiar}
        required={required}
        min={type === 'number' ? (name === 'duracion_min' ? 0 : 1) : undefined}
      />
    </div>
  )

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white p-5 text-center">
        <div className="spinner-border text-danger" role="status" />
        <p>Cargando formulario...</p>
      </div>
    )
  }

  return (
    <div className="min-vh-100 bg-dark text-white py-5">
      <div className="container" style={{ maxWidth: 900 }}>
        <Link
          to={`/admin/series/${serieId}/episodes`}
          className="btn btn-outline-light mb-4"
        >
          Volver a episodios
        </Link>

        <h1>{esEdicion ? 'Editar episodio' : 'Nuevo episodio'}</h1>
        <p className="text-white-50">{serie?.titulo}</p>

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {serie && (
          <form className="row g-3" onSubmit={guardar}>
            {input('temporada', 'Temporada', 'number', true)}
            {input('numero', 'Número de episodio', 'number', true)}
            {input('titulo', 'Título', 'text', true)}
            {input('duracion_min', 'Duración en minutos', 'number', true)}

            <div className="col-12">
              <label htmlFor="descripcion" className="form-label">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                className="form-control bg-black text-white border-secondary"
                rows="4"
                value={form.descripcion}
                onChange={cambiar}
              />
            </div>

            {input('video_b2_key', 'Ruta del video en Backblaze B2')}
            {input('video_hls_url', 'URL del video HLS', 'url')}

            <div className="col-12 mt-4">
              <button
                type="submit"
                className="btn btn-danger"
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar episodio'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default AdminEpisodeForm
