import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL
const MB = 1024 * 1024

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

const configuracionArchivos = {
  portada: {
    etiqueta: 'Portada',
    campo: 'portada',
    campoUrl: 'portada_url',
    ruta: 'subir-portada',
    extensiones: ['jpg', 'jpeg', 'png', 'webp'],
    accept: '.jpg,.jpeg,.png,.webp',
    maxMB: 10
  },
  hero: {
    etiqueta: 'Imagen Hero',
    campo: 'hero',
    campoUrl: 'hero_url',
    ruta: 'subir-hero',
    extensiones: ['jpg', 'jpeg', 'png', 'webp'],
    accept: '.jpg,.jpeg,.png,.webp',
    maxMB: 10
  },
  video: {
    etiqueta: 'Tráiler',
    campo: 'video',
    campoUrl: 'video_url',
    ruta: 'subir-video',
    extensiones: ['mp4', 'webm', 'mov'],
    accept: '.mp4,.webm,.mov',
    maxMB: 100
  }
}

const obtenerError = (data) => {
  if (typeof data?.detail === 'string') return data.detail
  if (typeof data?.error === 'string') return data.error

  if (data && typeof data === 'object' && Object.keys(data).length) {
    return Object.entries(data)
      .map(([campo, mensajes]) =>
        `${campo}: ${Array.isArray(mensajes) ? mensajes.join(', ') : mensajes}`
      )
      .join(' | ')
  }

  return 'No se pudo completar la operación.'
}

function AdminContentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario, authFetch } = useAuth()

  // Si falla la subida después de crear, conservamos el ID para reintentar
  // con PATCH sin crear otro contenido duplicado.
  const [idCreado, setIdCreado] = useState(null)
  const idContenido = id || idCreado
  const esEdicion = Boolean(idContenido)

  const [formulario, setFormulario] = useState(formularioInicial)
  const [archivos, setArchivos] = useState({ portada: null, hero: null, video: null })
  const [vistasPrevias, setVistasPrevias] = useState({ portada: '', hero: '', video: '' })
  const [loading, setLoading] = useState(Boolean(id))
  const [guardando, setGuardando] = useState(false)
  const [etapa, setEtapa] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    if (!id) return
    let activo = true

    const cargarContenido = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await authFetch(`${API_URL}/contenidos/${id}/`)
        if (!response.ok) {
          throw new Error(`No se pudo obtener el contenido (${response.status}).`)
        }
        const data = await response.json()
        const esAdmin = usuario?.is_superuser === true || usuario?.rol === 'admin'
        const esPropietario = usuario?.rol === 'creador' &&
          Number(data.creador?.id) === Number(usuario?.id)
        if (!esAdmin && !esPropietario) {
          throw new Error('No tenés permisos para editar este contenido.')
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
        if (activo) setError(err.message)
      } finally {
        if (activo) setLoading(false)
      }
    }

    cargarContenido()
    return () => { activo = false }
  }, [id, authFetch, usuario])

  // Liberar las URLs temporales de las vistas previas al cambiar/desmontar.
  useEffect(() => () => {
    Object.values(vistasPrevias).forEach((url) => {
      if (url) URL.revokeObjectURL(url)
    })
  }, [vistasPrevias])

  const actualizarCampo = (e) => {
    const { name, value } = e.target
    setFormulario((actual) => ({ ...actual, [name]: value }))
  }

  const seleccionarArchivo = (tipo, event) => {
    const archivo = event.target.files?.[0]
    if (!archivo) return

    const config = configuracionArchivos[tipo]
    const extension = archivo.name.split('.').pop()?.toLowerCase()
    if (!config.extensiones.includes(extension)) {
      setError(`${config.etiqueta}: formato no permitido.`)
      event.target.value = ''
      return
    }
    if (archivo.size > config.maxMB * MB) {
      setError(`${config.etiqueta}: el tamaño máximo es ${config.maxMB} MiB.`)
      event.target.value = ''
      return
    }
    if (!archivo.size) {
      setError(`${config.etiqueta}: el archivo está vacío.`)
      event.target.value = ''
      return
    }

    setError('')
    setAviso('')
    setArchivos((actual) => ({ ...actual, [tipo]: archivo }))
    setVistasPrevias((actual) => ({ ...actual, [tipo]: URL.createObjectURL(archivo) }))
  }

  const quitarSeleccion = (tipo) => {
    setArchivos((actual) => ({ ...actual, [tipo]: null }))
    setVistasPrevias((actual) => ({ ...actual, [tipo]: '' }))
    const control = document.getElementById(`archivo-${tipo}`)
    if (control) control.value = ''
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (guardando) return
    setError('')
    setAviso('')
    setGuardando(true)

    let contenidoId = idContenido
    let datosGuardados = false

    try {
      setEtapa('Guardando datos del contenido...')
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

      const url = contenidoId
        ? `${API_URL}/contenidos/${contenidoId}/`
        : `${API_URL}/contenidos/`

      const response = await authFetch(url, {
        method: contenidoId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(obtenerError(data))

      contenidoId = contenidoId || data.id
      if (!contenidoId) throw new Error('La API no devolvió el ID del contenido creado.')
      if (!id && !idCreado) setIdCreado(contenidoId)
      datosGuardados = true

      // Se sube cada archivo mediante su endpoint protegido con JWT.
      // NO fijar Content-Type: el navegador añade el boundary de FormData.
      for (const tipo of ['portada', 'hero', 'video']) {
        const archivo = archivos[tipo]
        if (!archivo) continue
        const config = configuracionArchivos[tipo]
        setEtapa(`Subiendo ${config.etiqueta.toLowerCase()} a Cloudinary...`)
        const body = new FormData()
        body.append(config.campo, archivo)
        const respuesta = await authFetch(
          `${API_URL}/contenidos/${contenidoId}/${config.ruta}/`,
          { method: 'POST', body }
        )
        const resultado = await respuesta.json().catch(() => ({}))
        if (!respuesta.ok) {
          throw new Error(`${config.etiqueta}: ${obtenerError(resultado)}`)
        }
        const nuevaUrl = resultado.contenido?.[config.campoUrl]
        if (nuevaUrl) {
          setFormulario((actual) => ({ ...actual, [config.campoUrl]: nuevaUrl }))
        }
        quitarSeleccion(tipo)
      }

      navigate('/admin/content', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al guardar contenido.')
      if (datosGuardados) {
        setAviso(
          `Los datos del contenido ${contenidoId} se guardaron, pero no se completaron todas las subidas. ` +
          'Podés volver a guardar para reintentar los archivos pendientes. No se creará otro contenido.'
        )
      }
    } finally {
      setEtapa('')
      setGuardando(false)
    }
  }

  const campo = (nombre, etiqueta, tipo = 'text', requerido = false) => (
    <div className="col-md-6" key={nombre}>
      <label htmlFor={nombre} className="form-label">{etiqueta}</label>
      <input
        id={nombre}
        name={nombre}
        type={tipo}
        className="form-control bg-black text-white border-secondary"
        value={formulario[nombre]}
        onChange={actualizarCampo}
        required={requerido}
        min={tipo === 'number' ? 0 : undefined}
        disabled={guardando}
      />
    </div>
  )

  const bloqueArchivo = (tipo) => {
    const config = configuracionArchivos[tipo]
    const vista = vistasPrevias[tipo] || formulario[config.campoUrl]
    return (
      <div className="col-12" key={tipo}>
        <div className="border border-secondary rounded p-3">
          <h5 className="mb-2">{config.etiqueta} — Cloudinary</h5>
          <p className="text-secondary small mb-2">
            {tipo === 'video' ? 'MP4, WEBM o MOV' : 'JPG, PNG o WEBP'} · Máximo {config.maxMB} MiB
          </p>
          {vista && (
            <div className="mb-3">
              {tipo === 'video' ? (
                <video src={vista} controls preload="metadata" style={{ maxWidth: '100%', maxHeight: 240 }} />
              ) : (
                <img src={vista} alt={`Vista previa de ${config.etiqueta}`} style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain' }} />
              )}
            </div>
          )}
          <label htmlFor={`archivo-${tipo}`} className="form-label">
            {archivos[tipo] ? 'Cambiar archivo seleccionado' : `Seleccionar ${config.etiqueta.toLowerCase()}`}
          </label>
          <input
            id={`archivo-${tipo}`}
            type="file"
            accept={config.accept}
            className="form-control bg-black text-white border-secondary"
            onChange={(e) => seleccionarArchivo(tipo, e)}
            disabled={guardando}
          />
          {archivos[tipo] && (
            <div className="d-flex flex-wrap gap-2 align-items-center mt-2">
              <span className="small text-info">
                Pendiente: {archivos[tipo].name} ({(archivos[tipo].size / MB).toFixed(1)} MiB)
              </span>
              <button type="button" className="btn btn-sm btn-outline-light" onClick={() => quitarSeleccion(tipo)} disabled={guardando}>
                Quitar selección
              </button>
            </div>
          )}
          <div className="text-secondary small mt-2">
            El archivo se sube cuando presionás «{esEdicion ? 'Guardar cambios' : 'Crear contenido'}».
            Si no seleccionás un archivo, se conserva la URL escrita arriba.
          </div>
        </div>
      </div>
    )
  }

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
          <h1 className="fw-bold">{esEdicion ? 'Editar contenido' : 'Nuevo contenido'}</h1>
          <Link to="/admin/content" className="btn btn-outline-light">Volver</Link>
        </div>

        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {aviso && <div className="alert alert-warning" role="status">{aviso}</div>}
        {idCreado && (
          <p className="small text-secondary">Contenido creado con ID {idCreado}. Las próximas operaciones actualizarán ese mismo registro.</p>
        )}

        <form onSubmit={guardar} className="row g-3">
          {campo('titulo', 'Título', 'text', true)}

          <div className="col-md-6">
            <label htmlFor="tipo" className="form-label">Tipo</label>
            <select id="tipo" name="tipo" className="form-select bg-black text-white border-secondary" value={formulario.tipo} onChange={actualizarCampo} disabled={guardando}>
              <option value="pelicula">Película</option>
              <option value="serie">Serie</option>
            </select>
          </div>

          {campo('genero', 'Género', 'text', true)}
          {campo('anio', 'Año', 'number', true)}
          {campo('duracion_min', 'Duración en minutos', 'number', true)}

          <div className="col-12">
            <label htmlFor="descripcion" className="form-label">Descripción</label>
            <textarea id="descripcion" name="descripcion" rows="4" className="form-control bg-black text-white border-secondary" value={formulario.descripcion} onChange={actualizarCampo} disabled={guardando} />
          </div>

          {campo('portada_url', 'URL de portada', 'url')}
          {campo('hero_url', 'URL de imagen Hero', 'url')}
          {campo('video_url', 'URL de preview / Cloudinary', 'url')}
          {campo('video_hls_url', 'URL de video HLS', 'url')}
          {campo('video_b2_key', 'Clave del video en Backblaze B2')}

          <div className="col-12 mt-4">
            <h2 className="h4 mb-1">Subir archivos a Cloudinary</h2>
            <p className="text-secondary small">Podés seleccionar archivos para reemplazar las URLs de portada, Hero y tráiler. Los archivos HLS de Backblaze B2 no se modifican.</p>
          </div>
          {bloqueArchivo('portada')}
          {bloqueArchivo('hero')}
          {bloqueArchivo('video')}

          {etapa && (
            <div className="col-12" role="status" aria-live="polite">
              <div className="d-flex gap-2 align-items-center text-info">
                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                <span>{etapa}</span>
              </div>
            </div>
          )}

          <div className="col-12 mt-4 d-flex flex-wrap gap-2">
            <button type="submit" className="btn btn-danger" disabled={guardando || (Boolean(id) && loading)}>
              {guardando ? 'Procesando...' : esEdicion ? 'Guardar cambios' : 'Crear contenido'}
            </button>
            <Link to="/admin/content" className="btn btn-outline-light">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminContentForm