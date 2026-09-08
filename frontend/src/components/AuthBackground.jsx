import { useEffect, useMemo, useState } from 'react'


function AuthBackground({ children }) {

  // ==========================================
  // CARGAR AUTOMÁTICAMENTE TODAS LAS IMÁGENES
  // DE src/assets/hero/
  // ==========================================

  const imagenesImportadas = import.meta.glob(
    '../assets/hero/*.{jpg,jpeg,png,webp}',
    {
      eager: true,
      query: '?url',
      import: 'default'
    }
  )


  const imagenes = useMemo(
    () => Object.values(imagenesImportadas),
    []
  )


  const [imagenActual, setImagenActual] = useState(0)


  // ==========================================
  // CAMBIO AUTOMÁTICO
  // ==========================================

  useEffect(() => {

    if (imagenes.length <= 1) {
      return
    }


    const intervalo = setInterval(() => {

      setImagenActual((actual) => {

        if (actual === imagenes.length - 1) {
          return 0
        }

        return actual + 1
      })

    }, 5000)


    return () => clearInterval(intervalo)

  }, [imagenes.length])


  // Si todavía no existen imágenes
  const imagenFondo =
    imagenes.length > 0
      ? imagenes[imagenActual]
      : null


  return (

    <main className="auth-page">

      {/* IMAGEN DE FONDO */}
      {imagenFondo && (
        <div
          key={imagenFondo}
          className="auth-background"
          style={{
            backgroundImage: `url(${imagenFondo})`
          }}
        />
      )}


      {/* CAPA OSCURA */}
      <div className="auth-overlay" />


      {/* LOGIN O REGISTRO */}
      <div className="auth-content">
        {children}
      </div>

    </main>

  )
}


export default AuthBackground