# Streaming-platform
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

- **Gestión de Usuarios:**  
  El sistema permite registrar y administrar los usuarios de la plataforma.  
  Cada usuario cuenta con información básica como nombre, correo electrónico y fecha de registro, lo que permite identificar quién interactúa con el sistema y mantener un historial de actividad dentro de la plataforma.

- **Gestión de Creadores de Contenido:**  
  La plataforma distingue entre usuarios que consumen contenido y creadores responsables de publicarlo.  
  Los creadores pueden registrar y administrar películas o series dentro del catálogo, permitiendo organizar quién es responsable de cada contenido disponible en la plataforma.

- **Catálogo de Contenido:**  
  El sistema permite almacenar y gestionar un catálogo de películas y series, incluyendo información como título, género, tipo de contenido y duración.  
  Cada contenido está asociado a un creador, lo que permite mantener una organización clara de quién publica cada elemento dentro de la plataforma.

- **Historial de Visualización:**  
  Se registra cada vez que un usuario visualiza un contenido.  
  Esto permite mantener un historial de visualizaciones que refleja la interacción de los usuarios con el catálogo, facilitando consultas como qué contenido fue visto, cuándo fue visualizado y qué usuarios lo consumieron.

- **Relaciones en Base de Datos:**  
  El sistema utiliza claves primarias y claves foráneas para establecer relaciones entre las diferentes entidades del modelo.  
  Esto garantiza la integridad de los datos y permite representar correctamente las relaciones entre usuarios, creadores, contenido y visualizaciones.

- **Consultas Relacionales:**  
  Gracias al uso de múltiples tablas relacionadas, el sistema permite realizar consultas que combinan información de distintas entidades mediante operaciones SQL como `JOIN`.  
  Esto facilita obtener información relevante como el historial de visualizaciones de un usuario, el contenido publicado por un creador o el contenido más visto dentro de la plataforma.

------------------------------------------------------------------------

# 🛠️ Tecnologías Utilizadas

-   **Lenguaje:** Python\ DEMO
-   **Base de Datos:** PostgreSQL\ DEMO
-   **Lenguaje de Consulta:** SQL\    DEMO
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
------------------------------------------------------------------------

## 🎬 Creadores

Representa a los usuarios responsables de **publicar o administrar contenido dentro de la plataforma**.  
Estos usuarios cumplen un rol similar a administradores o creadores de contenido que cargan películas o series al catálogo.

- `id_creador` (PK)
- `nombre`
- `email`

------------------------------------------------------------------------
# 🔗 Relaciones del Sistema

El modelo de datos implementa las siguientes relaciones:

- Un **creador puede publicar múltiples contenidos** dentro de la plataforma.
- Un **usuario puede visualizar múltiples contenidos**.
- Un **contenido puede ser visualizado por múltiples usuarios**.

La relación entre usuarios y contenido es **muchos a muchos** y se resuelve mediante la tabla **Visualizaciones**, que actúa como tabla intermedia registrando cada evento de visualización.
------------------------------------------------------------------------

# 🗺️ Diagrama Entidad‑Relación

A continuación se muestra el diagrama ER del sistema que representa las
entidades principales y sus relaciones.

![Diagrama ER del sistema](docs/er_diagram.png)
