import {
  Routes,
  Route,
  Navigate
} from 'react-router-dom'

import Home from './views/Home'
import Login from './views/Login'
import Register from './views/Register'
import Player from './views/Player'
import ContentDetail from './views/ContentDetail'
import Catalog from './views/Catalog'
import WatchHistory from './views/WatchHistory'
import Profile from './views/Profile'

import ProtectedRoute from './components/ProtectedRoute'


function App() {
  return (
    <Routes>

      {/* Rutas públicas */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />


      {/* Inicio */}

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />


      {/* Catálogo */}

      <Route
        path="/catalog"
        element={
          <ProtectedRoute>
            <Catalog />
          </ProtectedRoute>
        }
      />


      {/* Detalle de contenido */}

      <Route
        path="/content/:id"
        element={
          <ProtectedRoute>
            <ContentDetail />
          </ProtectedRoute>
        }
      />


      {/* Reproductor */}

      <Route
        path="/watch/:id"
        element={
          <ProtectedRoute>
            <Player />
          </ProtectedRoute>
        }
      />


      {/* Historial */}

      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <WatchHistory />
          </ProtectedRoute>
        }
      />


      {/* Perfil */}

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />


      {/* Ruta no encontrada */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  )
}

export default App