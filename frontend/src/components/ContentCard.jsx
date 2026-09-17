import {
  useEffect,
  useRef,
  useState
} from 'react'


function ContentCard({
  titulo,
  tipo,
  genero,
  descripcion,
  imagen,
  videoUrl,
  onReproducir,
  onVerDetalle,
  disponible = false
}) {

  const videoRef = useRef(null)
  const timeoutRef = useRef(null)

  const [mostrarPreview, setMostrarPreview] =
    useState(false)

  const [muteado, setMuteado] =
    useState(true)


  // ==========================================
  // INICIAR PREVIEW DESPUÉS DE 2 SEGUNDOS
  // ==========================================

  const iniciarPreview = () => {

    if (!videoUrl) {
      return
    }

    clearTimeout(timeoutRef.current)

    timeoutRef.current =
      setTimeout(() => {

        setMostrarPreview(true)

      }, 2000)
  }


  // ==========================================
  // DETENER PREVIEW
  // ==========================================

  const detenerPreview = () => {

    clearTimeout(timeoutRef.current)

    timeoutRef.current = null


    const video =
      videoRef.current


    if (video) {

      video.pause()
      video.currentTime = 0
    }


    setMostrarPreview(false)

    // La próxima preview empieza muteada
    setMuteado(true)
  }


  // ==========================================
  // REPRODUCIR VIDEO PREVIEW
  // ==========================================

  useEffect(() => {

    if (!mostrarPreview) {
      return
    }


    const video =
      videoRef.current


    if (!video) {
      return
    }


    video.currentTime = 0


    const reproducir = async () => {

      try {

        await video.play()

      } catch (error) {

        console.log(
          'No se pudo iniciar la preview:',
          error
        )
      }
    }


    reproducir()

  }, [mostrarPreview])


  // ==========================================
  // MUTEAR / DESMUTEAR
  // ==========================================

  const cambiarSonido = (event) => {

    event.stopPropagation()

    const nuevoEstado =
      !muteado


    setMuteado(
      nuevoEstado
    )


    if (videoRef.current) {

      videoRef.current.muted =
        nuevoEstado
    }
  }


  // ==========================================
  // LIMPIEZA
  // ==========================================

  useEffect(() => {

    return () => {

      clearTimeout(
        timeoutRef.current
      )

    }

  }, [])


  return (

    <article
      className="streaming-card"

      onMouseEnter={
        iniciarPreview
      }

      onMouseLeave={
        detenerPreview
      }
    >

      <div
        className="
          streaming-card-image
          position-relative
        "
      >

        {/* =====================================
            PORTADA
        ====================================== */}

        {!mostrarPreview && (

          <img
            src={imagen}
            alt={`Portada de ${titulo}`}
            loading="lazy"
          />

        )}


        {/* =====================================
            VIDEO PREVIEW
        ====================================== */}

        {mostrarPreview && videoUrl && (

          <>

            <video
              ref={videoRef}

              src={videoUrl}

              muted={muteado}

              autoPlay
              playsInline

              preload="metadata"

              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />


            {/* BOTÓN SONIDO */}

            <button
              type="button"

              onClick={
                cambiarSonido
              }

              title={
                muteado
                  ? 'Activar sonido'
                  : 'Silenciar'
              }

              aria-label={
                muteado
                  ? 'Activar sonido'
                  : 'Silenciar'
              }

              style={{
                position: 'absolute',
                right: '12px',
                bottom: '12px',

                width: '42px',
                height: '42px',

                borderRadius: '50%',

                border:
                  '1px solid rgba(255,255,255,0.7)',

                background:
                  'rgba(0,0,0,0.65)',

                color: 'white',

                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',

                fontSize: '18px',

                zIndex: 10,

                cursor: 'pointer'
              }}
            >

              {muteado
                ? '🔇'
                : '🔊'
              }

            </button>

          </>

        )}


        <span className="streaming-card-type">
          {tipo}
        </span>

      </div>


      <div className="streaming-card-body">

        <h5 className="streaming-card-title">
          {titulo}
        </h5>


        <span className="streaming-card-genre">
          {genero}
        </span>


        <p className="streaming-card-description">
          {descripcion}
        </p>


        {/* =====================================
            ACCIONES
        ====================================== */}

        <div
          className="
            d-flex
            flex-column
            gap-2
            mt-auto
          "
        >

          {disponible ? (

            <button
              type="button"

              className="
                btn
                btn-streaming
                w-100
              "

              onClick={
                onReproducir
              }
            >
              ▶ Reproducir
            </button>

          ) : (

            <button
              type="button"

              className="
                btn
                btn-secondary
                w-100
              "

              disabled
            >
              Próximamente
            </button>

          )}


          {onVerDetalle && (

            <button
              type="button"

              className="
                btn
                btn-outline-light
                w-100
              "

              onClick={
                onVerDetalle
              }
            >
              Más información
            </button>

          )}

        </div>

      </div>

    </article>
  )
}


export default ContentCard