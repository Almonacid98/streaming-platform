import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL

const formularioInicial = {
  titulo: '',
  tipo: 'pelicula',
  genero: '',
  anio: new Date().getFullYear(),
  duracion_min: 0,
  descripcion: '',
  portada_url: '',
  hero_url: '',
  video_url: '',
  video_hls_url: '',
  video_b2_key: ''
}

const obtenerError = (data) => {
  if (typeof data?.detail === 'string') return data.detail
  if (typeof data?.error === 'string') return data.error

  if (data && typeof data === 'object') {
    return Object.entries(data)
      .map(([campo, mensajes]) =>
        `${campo}: ${Array.isArray(mensajes) ? mensajes.join(', ') : mensajes}`
      )
      .join(' | ')
  }

  return 'No se pudo guardar el contenido.'
}

function AdminContentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario, authFetch } = useAuth()

  const esEdicion = Boolean(id)

  const [formulario, setFormulario] = useState(formularioInicial)
  const [loading, setLoading] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!esEdicion) return

    let activo = true

    const cargarContenido = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await authFetch(
          `${API_URL}/contenidos/${id}/`
        )

        if (!response.ok) {
          throw new Error(
            `No se pudo obtener el contenido (${response.status}).`
          )
        }

        const data = await response.json()

        const esAdmin =
          usuario?.is_superuser === true ||
          usuario?.rol === 'admin'

        const esPropietario =
          usuario?.rol === 'creador' &&
          Number(data.creador?.id) === Number(usuario?.id)

        if (!esAdmin && !esPropietario) {
          throw new Error(
            'No tenés permisos para editar este contenido.'
          )
        }

        if (activo) {
          setFormulario({
            titulo: data.titulo || '',
            tipo: data.tipo || 'pelicula',
            genero: data.genero || '',
            anio: data.anio ?? new Date().getFullYear(),
            duracion_min: data.duracion_min ?? 0,
            descripcion: data.descripcion || '',
            portada_url: data.portada_url || '',
            hero_url: data.hero_url || '',
            video_url: data.video_url || '',
            video_hls_url: data.video_hls_url || '',
            video_b2_key: data.video_b2_key || ''
          })
        }
      } catch (err) {
        if (activo) {
          setError(err.message)
        }
      } finally {
        if (activo) setLoading(false)
      }
    }

    cargarContenido()

    return () => {
      activo = false
    }
  }, [id, esEdicion, authFetch, usuario])

  const actualizarCampo = (e) => {
    const { name, value } = e.target

    setFormulario((actual) => ({
      ...actual,
      [name]: value
    }))
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)

    try {
      const payload = {
        ...formulario,
        anio: Number(formulario.anio),
        duracion_min: Number(formulario.duracion_min),
        portada_url: formulario.portada_url || null,
        hero_url: formulario.hero_url || null,
        video_url: formulario.video_url || null,
        video_hls_url: formulario.video_hls_url || null,
        video_b2_key: formulario.video_b2_key || null
      }

      const url = esEdicion
        ? `${API_URL}/contenidos/${id}/`
        : `${API_URL}/contenidos/`

      const response = await authFetch(url, {
        method: esEdicion ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(obtenerError(data))
      }

      navigate('/admin/content', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al guardar contenido.')
    } finally {
      setGuardando(false)
    }
  }

  const campo = (nombre, etiqueta, tipo = 'text', requerido = false) => (
    <div className="col-md-6" key={nombre}>
      <label htmlFor={nombre} className="form-label">
        {etiqueta}
      </label>
      <input
        id={nombre}
        name={nombre}
        type={tipo}
        className="form-control bg-black text-white border-secondary"
        value={formulario[nombre]}
        onChange={actualizarCampo}
        required={requerido}
        min={tipo === 'number' ? 0 : undefined}
      />
    </div>
  )

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-danger" role="status" />
          <p className="mt-3">Cargando contenido...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100 bg-dark text-white py-5">
      <div className="container" style={{ maxWidth: 950 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="fw-bold">
            {esEdicion ? 'Editar contenido' : 'Nuevo contenido'}
          </h1>

          <Link to="/admin/content" className="btn btn-outline-light">
            Volver
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={guardar} className="row g-3">
          {campo('titulo', 'Título', 'text', true)}

          <div className="col-md-6">
            <label htmlFor="tipo" className="form-label">
              Tipo
            </label>
            <select
              id="tipo"
              name="tipo"
              className="form-select bg-black text-white border-secondary"
              value={formulario.tipo}
              onChange={actualizarCampo}
            >
              <option value="pelicula">Película</option>
              <option value="serie">Serie</option>
            </select>
          </div>

          {campo('genero', 'Género', 'text', true)}
          {campo('anio', 'Año', 'number', true)}
          {campo('duracion_min', 'Duración en minutos', 'number', true)}

          <div className="col-12">
            <label htmlFor="descripcion" className="form-label">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows="4"
              className="form-control bg-black text-white border-secondary"
              value={formulario.descripcion}
              onChange={actualizarCampo}
            />
          </div>

          {campo('portada_url', 'URL de portada', 'url')}
          {campo('hero_url', 'URL de imagen Hero', 'url')}
          {campo('video_url', 'URL de preview / Cloudinary', 'url')}
          {campo('video_hls_url', 'URL de video HLS', 'url')}
          {campo('video_b2_key', 'Clave del video en Backblaze B2')}

          <div className="col-12 mt-4 d-flex gap-2">
            <button
              type="submit"
              className="btn btn-danger"
              disabled={guardando || (esEdicion && Boolean(error))}
            >
              {guardando
                ? 'Guardando...'
                : esEdicion
                  ? 'Guardar cambios'
                  : 'Crear contenido'}
            </button>

            <Link to="/admin/content" className="btn btn-outline-light">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminContentForm
