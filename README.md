# streaming-platform
![Status](https://img.shields.io/badge/Status-En%20Desarrollo-green)
![Tech](https://img.shields.io/badge/Stack-Python%20%7C%20PostgreSQL%20%7C%20SQL-blue)

**Streaming Service System** es una aplicación diseñada para gestionar
un catálogo de contenido audiovisual como **películas y series**,
permitiendo registrar usuarios y almacenar las visualizaciones que
realizan dentro de la plataforma.

El objetivo del proyecto es modelar y gestionar la información de un
**servicio de streaming simplificado**, similar en concepto a
plataformas como Netflix o Prime Video, pero enfocado en demostrar
conceptos fundamentales de **bases de datos relacionales, modelado de
entidades y operaciones CRUD**.

El sistema permite mantener un registro del contenido disponible, los
usuarios registrados y las interacciones entre ambos mediante el
historial de visualizaciones.

------------------------------------------------------------------------

# 🚀 Características Principales

-   **Gestión de Usuarios:** Registro y administración de usuarios
    dentro del sistema.
-   **Catálogo de Contenido:** Administración de películas y series
    disponibles en la plataforma.
-   **Historial de Visualización:** Registro de qué contenido ha visto
    cada usuario.
-   **Relaciones en Base de Datos:** Implementación de claves primarias
    y foráneas para modelar las relaciones entre entidades.
-   **Consultas Relacionales:** Posibilidad de consultar información
    combinando múltiples tablas (JOIN).

------------------------------------------------------------------------

# 🛠️ Tecnologías Utilizadas

-   **Lenguaje:** Python\
-   **Base de Datos:** PostgreSQL\
-   **Lenguaje de Consulta:** SQL\
-   **Modelado:** Diagrama Entidad-Relación (ER)

------------------------------------------------------------------------

# 📐 Modelo de Datos

El sistema se basa en **tres entidades principales**:

## 👤 Usuarios

Representa a las personas registradas en la plataforma.

-   `id_usuario` (PK)
-   `nombre`
-   `email`
-   `fecha_registro`

------------------------------------------------------------------------

## 🎥 Contenido

Almacena el catálogo de películas y series disponibles.

-   `id_contenido` (PK)
-   `titulo`
-   `tipo` (película o serie)
-   `genero`
-   `año`
-   `duracion_min`

------------------------------------------------------------------------

## ▶ Visualizaciones

Relaciona a los usuarios con el contenido que han visto.

-   `id_visualizacion` (PK)
-   `id_usuario` (FK)
-   `id_contenido` (FK)
-   `fecha_visualizacion`

------------------------------------------------------------------------

# 🔗 Relaciones del Sistema

El modelo de datos implementa las siguientes relaciones:

-   Un **usuario puede visualizar múltiples contenidos**.
-   Un **contenido puede ser visualizado por múltiples usuarios**.

Esta relación **muchos a muchos** se resuelve mediante la tabla
**Visualizaciones**, que actúa como tabla intermedia registrando cada
evento de visualización.

------------------------------------------------------------------------

# 📂 Estructura del Proyecto

    .
    ├── db/
    │   ├── schema.sql
    │   └── queries.sql
    │
    ├── src/
    │   ├── main.py
    │   ├── user_service.py
    │   ├── content_service.py
    │   └── view_service.py
    │
    ├── docs/
    │   └── er_diagram.puml
    │
    └── README.md

------------------------------------------------------------------------

# 📋 Funcionalidades del Sistema

## Gestión de usuarios

-   Registrar nuevos usuarios
-   Consultar usuarios registrados

## Gestión de contenido

-   Agregar películas o series al catálogo
-   Consultar el catálogo disponible

## Registro de visualizaciones

-   Registrar cuando un usuario ve un contenido
-   Consultar el historial de visualización de un usuario

------------------------------------------------------------------------

# 📊 Ejemplos de consultas

## Ver catálogo de contenido

``` sql
SELECT * FROM contenido;
```

## Ver historial de visualización de un usuario

``` sql
SELECT u.nombre, c.titulo, v.fecha_visualizacion
FROM visualizaciones v
JOIN usuarios u ON v.id_usuario = u.id_usuario
JOIN contenido c ON v.id_contenido = c.id_contenido;
```

## Contenido más visto

``` sql
SELECT titulo, COUNT(*) as vistas
FROM visualizaciones
JOIN contenido ON visualizaciones.id_contenido = contenido.id_contenido
GROUP BY titulo
ORDER BY vistas DESC;
```

------------------------------------------------------------------------

# 🧠 Objetivo Académico

Este proyecto fue desarrollado con fines educativos para practicar y
demostrar conocimientos fundamentales en:

-   Modelado de bases de datos relacionales
-   Uso de claves primarias y foráneas
-   Diseño de esquemas de base de datos
-   Consultas SQL con múltiples tablas
-   Organización de proyectos de software

El sistema representa una versión simplificada de un servicio de
streaming, enfocada en comprender cómo se estructuran y relacionan los
datos dentro de una aplicación real.