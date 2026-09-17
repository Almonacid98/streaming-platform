import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  useNavigate,
  useSearchParams
} from 'react-router-dom'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ContentCard from '../components/ContentCard'


const API_URL = import.meta.env.VITE_API_URL


function Catalog() {

  const navigate = useNavigate()

  const [searchParams, setSearchParams] =
    useSearchParams()


  // ==========================================
  // FILTROS DESDE LA URL
  // ==========================================

  const search =
    searchParams.get('search') || ''

  const type =
    searchParams.get('tipo') || ''

  const genre =
    searchParams.get('genero') || ''


  // ==========================================
  // CONTENIDOS
  // ==========================================

  const [contents, setContents] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')


  // ==========================================
  // GÉNEROS DISPONIBLES
  // ==========================================

  const [availableGenres, setAvailableGenres] =
    useState([])


  // ==========================================
  // ACTUALIZAR FILTRO
  // ==========================================

  const updateFilter = (
    name,
    value
  ) => {

    const params =
      new URLSearchParams(
        searchParams
      )


    if (value) {

      params.set(
        name,
        value
      )

    } else {

      params.delete(
        name
      )
    }


    setSearchParams(
      params,
      {
        replace: true
      }
    )
  }


  // ==========================================
  // CONSTRUIR CONSULTA PARA LA API
  // ==========================================

  const apiQuery = useMemo(() => {

    const params =
      new URLSearchParams()


    if (search.trim()) {

      params.set(
        'search',
        search.trim()
      )
    }


    if (type) {

      params.set(
        'tipo',
        type
      )
    }


    if (genre) {

      params.set(
        'genero',
        genre
      )
    }


    return params.toString()

  }, [
    search,
    type,
    genre
  ])


  // ==========================================
  // CARGAR CONTENIDOS
  // ==========================================

  useEffect(() => {

    let active = true


    const loadContents = async () => {

      try {

        setLoading(true)
        setError('')


        const url =
          apiQuery
            ? `${API_URL}/contenidos/?${apiQuery}`
            : `${API_URL}/contenidos/`


        const response =
          await fetch(url)


        if (!response.ok) {

          throw new Error(
            'No se pudo cargar el catálogo.'
          )
        }


        const data =
          await response.json()


        if (!Array.isArray(data)) {

          throw new Error(
            'La respuesta del catálogo no es válida.'
          )
        }


        if (active) {

          setContents(data)
        }

      } catch (error) {

        console.error(
          'Error al cargar el catálogo:',
          error
        )


        if (active) {

          setError(
            error.message ||
            'Ocurrió un error al cargar el catálogo.'
          )
        }

      } finally {

        if (active) {

          setLoading(false)
        }
      }
    }


    loadContents()


    return () => {

      active = false
    }

  }, [apiQuery])


  // ==========================================
  // CARGAR GÉNEROS
  // ==========================================

  useEffect(() => {

    let active = true


    const loadGenres = async () => {

      try {

        const response =
          await fetch(
            `${API_URL}/contenidos/`
          )


        if (!response.ok) {
          return
        }


        const data =
          await response.json()


        if (!Array.isArray(data)) {
          return
        }


        const genres = [
          ...new Set(
            data
              .map(
                (content) =>
                  content.genero
              )
              .filter(Boolean)
          )
        ].sort(
          (a, b) =>
            a.localeCompare(b)
        )


        if (active) {

          setAvailableGenres(
            genres
          )
        }

      } catch (error) {

        console.error(
          'No se pudieron cargar los géneros:',
          error
        )
      }
    }


    loadGenres()


    return () => {

      active = false
    }

  }, [])


  // ==========================================
  // REPRODUCIR
  // ==========================================

  const playContent = (content) => {

    if (!content?.id) {
      return
    }


    navigate(
      `/watch/${content.id}`
    )
  }


  // ==========================================
  // VER DETALLE
  // ==========================================

  const viewContentDetail = (content) => {

    if (!content?.id) {
      return
    }


    navigate(
      `/content/${content.id}`
    )
  }


  // ==========================================
  // LIMPIAR TODOS LOS FILTROS
  // ==========================================

  const clearFilters = () => {

    setSearchParams(
      {},
      {
        replace: true
      }
    )
  }


  // ==========================================
  // RENDER
  // ==========================================

  return (

    <div className="min-vh-100 bg-dark text-white">

      <Navbar />


      <main className="container py-5">

        {/* =====================================
            ENCABEZADO
        ====================================== */}

        <section className="mb-5">

          <h1 className="fw-bold mb-2">
            Catálogo
          </h1>


          <p className="text-secondary mb-0">
            Explorá las películas y series
            disponibles en Stream Platform.
          </p>

        </section>


        {/* =====================================
            BUSCADOR Y FILTROS
        ====================================== */}

        <section className="catalog-filter-panel">

          {/* ENCABEZADO */}

          <div className="catalog-filter-header">

            <div>

              <span className="catalog-filter-eyebrow">
                STREAM PLATFORM
              </span>


              <h2 className="catalog-filter-title">
                ¿Qué querés ver?
              </h2>


              <p className="catalog-filter-subtitle">
                Buscá películas y series
                dentro de nuestro catálogo.
              </p>

            </div>

          </div>


          {/* =================================
              BUSCADOR
          ================================== */}

          <div className="catalog-search-wrapper">

            <span
              className="catalog-search-icon"
              aria-hidden="true"
            >
              ⌕
            </span>


            <input
              id="catalog-search"

              type="search"

              className="catalog-search-input"

              placeholder="Buscar películas, series o géneros..."

              value={search}

              onChange={(event) =>
                updateFilter(
                  'search',
                  event.target.value
                )
              }
            />


            {search && (

              <button
                type="button"

                className="catalog-search-clear"

                onClick={() =>
                  updateFilter(
                    'search',
                    ''
                  )
                }

                aria-label="Borrar búsqueda"

                title="Borrar búsqueda"
              >
                ×
              </button>

            )}

          </div>


          {/* =================================
              SELECTORES
          ================================== */}

          <div className="catalog-filter-controls">


            {/* TIPO */}

            <div className="catalog-filter-field">

              <label
                htmlFor="catalog-type"

                className="catalog-filter-label"
              >
                Tipo de contenido
              </label>


              <select
                id="catalog-type"

                className="catalog-filter-select"

                value={type}

                onChange={(event) =>
                  updateFilter(
                    'tipo',
                    event.target.value
                  )
                }
              >

                <option value="">
                  Todo el contenido
                </option>


                <option value="pelicula">
                  Películas
                </option>


                <option value="serie">
                  Series
                </option>

              </select>

            </div>


            {/* GÉNERO */}

            <div className="catalog-filter-field">

              <label
                htmlFor="catalog-genre"

                className="catalog-filter-label"
              >
                Género
              </label>


              <select
                id="catalog-genre"

                className="catalog-filter-select"

                value={genre}

                onChange={(event) =>
                  updateFilter(
                    'genero',
                    event.target.value
                  )
                }
              >

                <option value="">
                  Todos los géneros
                </option>


                {availableGenres.map(
                  (availableGenre) => (

                    <option
                      key={availableGenre}
                      value={availableGenre}
                    >
                      {availableGenre}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* LIMPIAR */}

            <div className="catalog-filter-action">

              <button
                type="button"

                className="catalog-clear-button"

                onClick={
                  clearFilters
                }

                disabled={
                  !search &&
                  !type &&
                  !genre
                }
              >

                <span aria-hidden="true">
                  ↻
                </span>

                Limpiar filtros

              </button>

            </div>

          </div>


          {/* =================================
              FILTROS ACTIVOS
          ================================== */}

          {(search || type || genre) && (

            <div className="catalog-active-filters">

              <span className="catalog-active-label">
                Filtros activos:
              </span>


              {/* BÚSQUEDA ACTIVA */}

              {search && (

                <button
                  type="button"

                  className="catalog-filter-chip"

                  onClick={() =>
                    updateFilter(
                      'search',
                      ''
                    )
                  }
                >

                  “{search}”

                  <span>
                    ×
                  </span>

                </button>

              )}


              {/* TIPO ACTIVO */}

              {type && (

                <button
                  type="button"

                  className="catalog-filter-chip"

                  onClick={() =>
                    updateFilter(
                      'tipo',
                      ''
                    )
                  }
                >

                  {
                    type === 'pelicula'
                      ? 'Películas'
                      : 'Series'
                  }

                  <span>
                    ×
                  </span>

                </button>

              )}


              {/* GÉNERO ACTIVO */}

              {genre && (

                <button
                  type="button"

                  className="catalog-filter-chip"

                  onClick={() =>
                    updateFilter(
                      'genero',
                      ''
                    )
                  }
                >

                  {genre}

                  <span>
                    ×
                  </span>

                </button>

              )}

            </div>

          )}

        </section>


        {/* =====================================
            CARGANDO
        ====================================== */}

        {loading && (

          <section className="py-5 text-center">

            <div
              className="
                spinner-border
                text-danger
                mb-3
              "

              role="status"
            >

              <span className="visually-hidden">
                Cargando...
              </span>

            </div>


            <p className="text-secondary">
              Cargando catálogo...
            </p>

          </section>

        )}


        {/* =====================================
            ERROR
        ====================================== */}

        {!loading && error && (

          <section className="py-5 text-center">

            <h2 className="h4 fw-bold mb-3">
              No pudimos cargar el catálogo
            </h2>


            <p className="text-secondary mb-4">
              {error}
            </p>


            <button
              type="button"

              className="btn btn-danger"

              onClick={() =>
                window.location.reload()
              }
            >
              Reintentar
            </button>

          </section>

        )}


        {/* =====================================
            SIN RESULTADOS
        ====================================== */}

        {!loading &&
          !error &&
          contents.length === 0 && (

          <section className="py-5 text-center">

            <h2 className="h4 fw-bold mb-3">
              No encontramos resultados
            </h2>


            <p className="text-secondary mb-4">
              Probá cambiando la búsqueda
              o los filtros seleccionados.
            </p>


            <button
              type="button"

              className="btn btn-outline-light"

              onClick={
                clearFilters
              }
            >
              Limpiar filtros
            </button>

          </section>

        )}


        {/* =====================================
            RESULTADOS
        ====================================== */}

        {!loading &&
          !error &&
          contents.length > 0 && (

          <section>

            {/* CABECERA RESULTADOS */}

            <div
              className="
                d-flex
                justify-content-between
                align-items-center
                mb-4
              "
            >

              <h2 className="h4 fw-bold mb-0">
                Resultados
              </h2>


              <span className="text-secondary">

                {contents.length}{' '}

                {
                  contents.length === 1
                    ? 'contenido'
                    : 'contenidos'
                }

              </span>

            </div>


            {/* GRID */}

            <div className="row g-4">

              {contents.map(
                (content) => (

                  <div
                    key={content.id}

                    className="
                      col-12
                      col-sm-6
                      col-lg-4
                      col-xl-3
                    "
                  >

                    <ContentCard

                      titulo={
                        content.titulo
                      }

                      tipo={
                        content.tipo
                      }

                      genero={
                        content.genero
                      }

                      descripcion={
                        content.descripcion ||
                        'Sin descripción disponible.'
                      }

                      imagen={
                        content.portada_url
                      }

                      videoUrl={
                        content.video_url
                      }

                      disponible={
                        Boolean(
                          content.id
                        )
                      }

                      onReproducir={() =>
                        playContent(
                          content
                        )
                      }

                      onVerDetalle={() =>
                        viewContentDetail(
                          content
                        )
                      }

                    />

                  </div>

                )
              )}

            </div>

          </section>

        )}

      </main>


      <Footer />

    </div>

  )
}


export default Catalog