function ContentCard({
  titulo,
  tipo,
  genero,
  descripcion,
  imagen
}) {

  return (
    <article className="streaming-card">

      <div className="streaming-card-image">

        <img
          src={imagen}
          alt={`Portada de ${titulo}`}
          loading="lazy"
        />

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

        <button className="btn btn-streaming w-100 mt-auto">
          ▶ Ver contenido
        </button>

      </div>

    </article>
  )
}

export default ContentCard