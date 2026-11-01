
import { Routes, Route, Navigate } from 'react-router-dom'

import Home from './views/Home'
import Login from './views/Login'
import Register from './views/Register'
import Player from './views/Player'
import ContentDetail from './views/ContentDetail'
import Catalog from './views/Catalog'
import WatchHistory from './views/WatchHistory'
import Profile from './views/Profile'
import MyList from './views/MyList'

import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

import AdminDashboard from './views/AdminDashboard'
import AdminContents from './views/AdminContents'
import AdminContentForm from './views/AdminContentForm'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={<ProtectedRoute><Home /></ProtectedRoute>}
      />

      <Route
        path="/catalog"
        element={<ProtectedRoute><Catalog /></ProtectedRoute>}
      />

      <Route
        path="/content/:id"
        element={<ProtectedRoute><ContentDetail /></ProtectedRoute>}
      />

      <Route
        path="/watch/:id"
        element={<ProtectedRoute><Player /></ProtectedRoute>}
      />

      <Route
        path="/watch/:id/episode/:episodeId"
        element={<ProtectedRoute><Player /></ProtectedRoute>}
      />

      <Route
        path="/history"
        element={<ProtectedRoute><WatchHistory /></ProtectedRoute>}
      />

      <Route
        path="/my-list"
        element={<ProtectedRoute><MyList /></ProtectedRoute>}
      />

      <Route
        path="/profile"
        element={<ProtectedRoute><Profile /></ProtectedRoute>}
      />

      <Route
        path="/admin"
        element={<AdminRoute><AdminDashboard /></AdminRoute>}
      />

      <Route
        path="/admin/content"
        element={<AdminRoute><AdminContents /></AdminRoute>}
      />

      <Route
        path="/admin/content/new"
        element={<AdminRoute><AdminContentForm /></AdminRoute>}
      />

      <Route
        path="/admin/content/:id/edit"
        element={<AdminRoute><AdminContentForm /></AdminRoute>}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
