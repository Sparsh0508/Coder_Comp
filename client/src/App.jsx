import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import DashBoard from './pages/DashBoard'
import CodeEditor from './pages/CodeEditor'
import Problem from './pages/Problem'
import Matchmaking from './pages/Matchmaking'
import MatchRoom from './pages/MatchRoom'


// User Dashboard Component
const UserDashboard = () => {
  const { logout, user } = useAuth();
  return (
    <div className="text-center mt-32">
      <h1 className="text-5xl font-bold bg-gradient-to-br from-[#00d2ff] to-[#3a7bd5] bg-clip-text text-transparent mb-4">
        User Dashboard
      </h1>
      <p className="text-[#a0a0b0] text-xl">Welcome, {user?.username}! You are logged in as a <b>User</b>.</p>
      <button
        onClick={logout}
        className="mt-8 px-8 py-3 rounded-xl bg-gradient-to-br from-[#00d2ff] to-[#3a7bd5] text-white font-semibold shadow-[0_10px_15px_-3px_rgba(58,123,213,0.4)] hover:shadow-[0_20px_25px_-5px_rgba(58,123,213,0.5)] transition-all hover:-translate-y-1 hover:brightness-110"
      >
        Logout
      </button>
    </div>
  )
}

// Admin Dashboard Component
const AdminDashboard = () => {
  const { logout, user } = useAuth();
  return (
    <div className="text-center mt-32">
      <h1 className="text-5xl font-bold bg-gradient-to-br from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">
        Admin Dashboard
      </h1>
      <p className="text-[#a0a0b0] text-xl">Welcome, {user?.username}! You have <b>Admin</b> access.</p>
      <button
        onClick={logout}
        className="mt-8 px-8 py-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold shadow-[0_10px_15px_-3px_rgba(236,72,153,0.4)] hover:shadow-[0_20px_25px_-5px_rgba(236,72,153,0.5)] transition-all hover:-translate-y-1 hover:brightness-110"
      >
        Logout
      </button>
    </div>
  )
}

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"} />;
  }

  return children;
}

// Root redirect logic
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"} />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* <Route path="/editor/:id" element={<Problem  />} />  */}
          <Route path="/problem/:id" element={<Problem />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['user']}>
              <DashBoard />
            </ProtectedRoute>
          } />

          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" />} />
           <Route path="/matchmaking" element={<Matchmaking />} />
          <Route path="/match/:id" element={<MatchRoom />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
