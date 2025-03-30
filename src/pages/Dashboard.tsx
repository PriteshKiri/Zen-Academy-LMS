import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/Sidebar'
import Learn from './Learn'
import Settings from './Settings'
import ManageCourse from './ManageCourse'
import ManageUsers from './ManageUsers'

const Dashboard = () => {
  const { user, isAdmin, signOut, isLoading } = useAuth()
  const navigate = useNavigate()

  // If not logged in, redirect to login
  if (!isLoading && !user) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-secondary">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <h1 className="text-2xl font-bold text-gray-900">Zen Academy</h1>
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 overflow-auto bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route path="learn" element={<Learn />} />
              <Route path="settings" element={<Settings />} />
              {isAdmin && (
                <>
                  <Route path="manage-course" element={<ManageCourse />} />
                  <Route path="manage-users" element={<ManageUsers />} />
                </>
              )}
              <Route path="/" element={<Navigate to="learn" replace />} />
              <Route path="*" element={<Navigate to="learn" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard