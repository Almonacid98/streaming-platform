import { Routes, Route, Navigate } from 'react-router-dom'

// ==========================================
// VISTAS PRINCIPALES
// ==========================================

import Home from './views/Home'
import Login from './views/Login'
import Register from './views/Register'
import Player from './views/Player'
import ContentDetail from './views/ContentDetail'
import Catalog from './views/Catalog'
import WatchHistory from './views/WatchHistory'
import Profile from './views/Profile'
import MyList from './views/MyList'

// ==========================================
// PROTECCIÓN DE RUTAS
// ==========================================

import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import OnlyAdminRoute from './components/OnlyAdminRoute'

// ==========================================
// ADMINISTRACIÓN DE CONTENIDOS
// ==========================================

import AdminDashboard from './views/AdminDashboard'
import AdminContents from './views/AdminContents'
import AdminContentForm from './views/AdminContentForm'

// ==========================================
// ADMINISTRACIÓN DE EPISODIOS
// ==========================================

import AdminEpisodes from './views/AdminEpisodes'
import AdminEpisodeForm from './views/AdminEpisodeForm'

// ==========================================
// ADMINISTRACIÓN DE USUARIOS
// ==========================================

import AdminUsers from './views/AdminUsers'

function App() {
  return (
    <Routes>

      {/* =====================================
          AUTENTICACIÓN
      ===================================== */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* =====================================
          INICIO
      ===================================== */}

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      {/* =====================================
          CATÁLOGO
      ===================================== */}

      <Route
        path="/catalog"
        element={
          <ProtectedRoute>
            <Catalog />
          </ProtectedRoute>
        }
      />

      {/* =====================================
          DETALLE DE CONTENIDO
      ===================================== */}

      <Route
        path="/content/:id"
        element={
          <ProtectedRoute>
            <ContentDetail />
          </ProtectedRoute>
        }
      />

      {/* =====================================
          REPRODUCTOR DE PELÍCULAS
      ===================================== */}

      <Route
        path="/watch/:id"
        element={
          <ProtectedRoute>
            <Player />
          </ProtectedRoute>
        }
      />

      {/* =====================================
          REPRODUCTOR DE EPISODIOS
      ===================================== */}

      <Route
        path="/watch/:id/episode/:episodeId"
        element={
          <ProtectedRoute>
            <Player />
          </ProtectedRoute>
        }
      />

      {/* =====================================
          HISTORIAL
      ===================================== */}

      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <WatchHistory />
          </ProtectedRoute>
        }
      />

      {/* =====================================
          MI LISTA / FAVORITOS
      ===================================== */}

      <Route
        path="/my-list"
        element={
          <ProtectedRoute>
            <MyList />
          </ProtectedRoute>
        }
      />

      {/* =====================================
          PERFIL
      ===================================== */}

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* =====================================
          PANEL DE ADMINISTRACIÓN
      ===================================== */}

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* =====================================
          LISTADO DE CONTENIDOS
      ===================================== */}

      <Route
        path="/admin/content"
        element={
          <AdminRoute>
            <AdminContents />
          </AdminRoute>
        }
      />

      {/* =====================================
          CREAR CONTENIDO
      ===================================== */}

      <Route
        path="/admin/content/new"
        element={
          <AdminRoute>
            <AdminContentForm />
          </AdminRoute>
        }
      />

      {/* =====================================
          EDITAR CONTENIDO
      ===================================== */}

      <Route
        path="/admin/content/:id/edit"
        element={
          <AdminRoute>
            <AdminContentForm />
          </AdminRoute>
        }
      />

      {/* =====================================
          ADMINISTRAR EPISODIOS DE UNA SERIE
      ===================================== */}

      <Route
        path="/admin/series/:serieId/episodes"
        element={
          <AdminRoute>
            <AdminEpisodes />
          </AdminRoute>
        }
      />

      {/* =====================================
          CREAR EPISODIO
      ===================================== */}

      <Route
        path="/admin/series/:serieId/episodes/new"
        element={
          <AdminRoute>
            <AdminEpisodeForm />
          </AdminRoute>
        }
      />

      {/* =====================================
          EDITAR EPISODIO
      ===================================== */}

      <Route
        path="/admin/series/:serieId/episodes/:episodioId/edit"
        element={
          <AdminRoute>
            <AdminEpisodeForm />
          </AdminRoute>
        }
      />

      {/* =====================================
          ADMINISTRAR USUARIOS
          SOLO ADMINISTRADORES
      ===================================== */}

      <Route
        path="/admin/users"
        element={
          <OnlyAdminRoute>
            <AdminUsers />
          </OnlyAdminRoute>
        }
      />

      {/* =====================================
          RUTA NO ENCONTRADA
      ===================================== */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  )
}

export default App
