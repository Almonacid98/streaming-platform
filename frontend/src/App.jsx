import {
  Routes,
  Route,
  Navigate
} from 'react-router-dom'

import Home from './views/Home'
import Login from './views/Login'
import Register from './views/Register'

import ProtectedRoute from './components/ProtectedRoute'


function App() {
  return (
    <Routes>

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

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