import { useState, useEffect, FormEvent } from 'react'
import { supabase, User } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const ManageUsers = () => {
  const { isAdmin, user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // User form state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard/learn" replace />
  }

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('name')
        
        if (error) throw error
        
        if (data) {
          setUsers(data)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error('Failed to load users')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUsers()
  }, [])

  // User CRUD operations
  const openAddUserModal = () => {
    setUserName('')
    setUserEmail('')
    setUserPassword('')
    setUserRole('user')
    setEditingUserId(null)
    setIsUserModalOpen(true)
  }

  const openEditUserModal = (user: User) => {
    setUserName(user.name)
    setUserEmail(user.email)
    setUserPassword('') // Don't populate password for security
    setUserRole(user.role)
    setEditingUserId(user.id)
    setIsUserModalOpen(true)
  }

  const handleUserSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingUserId) {
        // Update existing user
        const updates: Partial<User> = {
          name: userName,
          email: userEmail,
          role: userRole,
        }
        
        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', editingUserId)
        
        if (error) throw error
        
        // Update local state
        setUsers(users.map(user => 
          user.id === editingUserId ? { ...user, ...updates } : user
        ))
        
        // If password was provided, update it
        if (userPassword) {
          // In a real app, you would need to handle this differently
          // This is a simplified example
          toast('Password changes would be handled in a real implementation')
        }

        toast.success('User updated successfully')
      } else {
        // Create new user
        // In a real app, you would need to:
        // 1. Create the auth user
        // 2. Then create the user record in your users table
        
        // This is a simplified example
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userEmail,
          password: userPassword,
        })
        
        if (authError) throw authError
        
        if (authData.user) {
          const newUser = {
            id: authData.user.id,
            name: userName,
            email: userEmail,
            role: userRole,
          }
          
          const { error: insertError } = await supabase
            .from('users')
            .insert(newUser)
          
          if (insertError) throw insertError
          
          // Update local state
          setUsers([...users, newUser])
          
          toast.success('User created successfully')
        }
      }
      
      // Close modal and reset form
      setIsUserModalOpen(false)
      setUserName('')
      setUserEmail('')
      setUserPassword('')
      setUserRole('user')
      setEditingUserId(null)
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error('Failed to save user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    // Don't allow deleting yourself
    if (userId === currentUser?.id) {
      toast.error('You cannot delete your own account')
      return
    }
    
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      // In a real app, you would need to:
      // 1. Delete the user from your users table
      // 2. Delete the auth user
      
      // This is a simplified example
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
      
      if (error) throw error
      
      // Update local state
      setUsers(users.filter(user => user.id !== userId))
      
      toast.success('User deleted successfully')
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <button
          onClick={openAddUserModal}
          className="btn btn-primary"
        >
          Add User
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-secondary">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditUserModal(user)}
                      className="text-primary hover:text-primary-dark mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className={`text-red-600 hover:text-red-900 ${
                        user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={user.id === currentUser?.id}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingUserId ? 'Edit User' : 'Add User'}
            </h2>
            
            <form onSubmit={handleUserSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    id="userName"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="userEmail"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="userPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUserId ? 'New Password (leave blank to keep current)' : 'Password'}
                  </label>
                  <input
                    id="userPassword"
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="input w-full"
                    required={!editingUserId}
                  />
                </div>
                
                <div>
                  <label htmlFor="userRole" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="userRole"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as 'admin' | 'user')}
                    className="input w-full"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingUserId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageUsers