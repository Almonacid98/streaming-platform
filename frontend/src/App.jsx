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

      {/* LOGIN */}
      <Route
        path="/login"
        element={<Login />}
      />


      {/* REGISTRO */}
      <Route
        path="/register"
        element={<Register />}
      />


      {/* HOME PROTEGIDA */}
      <Route
        path="/"
        element={
          <ProtectedRoute>

            <Home />

          </ProtectedRoute>
        }
      />


      {/* CUALQUIER OTRA URL */}
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