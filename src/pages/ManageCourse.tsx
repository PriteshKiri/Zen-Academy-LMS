import { useState, useEffect, FormEvent } from 'react'
import { supabase, Module, Chapter } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const ManageCourse = () => {
  const { isAdmin } = useAuth()
  const [modules, setModules] = useState<Module[]>([])
  const [chapters, setChapters] = useState<Record<string, Chapter[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  
  // Module form state
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false)
  const [moduleTitle, setModuleTitle] = useState('')
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  
  // Chapter form state
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false)
  const [chapterTitle, setChapterTitle] = useState('')
  const [chapterYoutubeLink, setChapterYoutubeLink] = useState('')
  const [chapterStatus, setChapterStatus] = useState<'draft' | 'live'>('draft')
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard/learn" replace />
  }

  // Fetch modules and chapters
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .order('title')
        
        if (modulesError) throw modulesError
        
        if (modulesData) {
          setModules(modulesData)
          
          // Fetch chapters for each module
          const chaptersObj: Record<string, Chapter[]> = {}
          
          for (const module of modulesData) {
            const { data: chaptersData, error: chaptersError } = await supabase
              .from('chapters')
              .select('*')
              .eq('module_id', module.id)
              .order('title')
            
            if (chaptersError) throw chaptersError
            
            if (chaptersData) {
              chaptersObj[module.id] = chaptersData
            }
          }
          
          setChapters(chaptersObj)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load course data')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Module CRUD operations
  const openAddModuleModal = () => {
    setModuleTitle('')
    setEditingModuleId(null)
    setIsModuleModalOpen(true)
  }

  const openEditModuleModal = (module: Module) => {
    setModuleTitle(module.title)
    setEditingModuleId(module.id)
    setIsModuleModalOpen(true)
  }

  const handleModuleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingModuleId) {
        // Update existing module
        const { error } = await supabase
          .from('modules')
          .update({ title: moduleTitle })
          .eq('id', editingModuleId)
        
        if (error) throw error
        
        // Update local state
        setModules(modules.map(module => 
          module.id === editingModuleId ? { ...module, title: moduleTitle } : module
        ))
        
        toast.success('Module updated successfully')
      } else {
        // Create new module
        const { data, error } = await supabase
          .from('modules')
          .insert({ title: moduleTitle })
          .select()
        
        if (error) throw error
        
        if (data && data[0]) {
          // Update local state
          setModules([...modules, data[0]])
          setChapters({ ...chapters, [data[0].id]: [] })
        }
        
        toast.success('Module created successfully')
      }
      
      // Close modal and reset form
      setIsModuleModalOpen(false)
      setModuleTitle('')
      setEditingModuleId(null)
    } catch (error) {
      console.error('Error saving module:', error)
      toast.error('Failed to save module')
    }
  }

  // Chapter CRUD operations
  const openAddChapterModal = (moduleId: string) => {
    setChapterTitle('')
    setChapterYoutubeLink('')
    setChapterStatus('draft')
    setEditingChapterId(null)
    setSelectedModuleId(moduleId)
    setIsChapterModalOpen(true)
  }

  const openEditChapterModal = (chapter: Chapter) => {
    setChapterTitle(chapter.title)
    setChapterYoutubeLink(chapter.youtube_link)
    setChapterStatus(chapter.status)
    setEditingChapterId(chapter.id)
    setSelectedModuleId(chapter.module_id)
    setIsChapterModalOpen(true)
  }

  const handleChapterSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!selectedModuleId) return
    
    try {
      const chapterData = {
        title: chapterTitle,
        youtube_link: chapterYoutubeLink,
        status: chapterStatus,
        module_id: selectedModuleId,
      }
      
      if (editingChapterId) {
        // Update existing chapter
        const { error } = await supabase
          .from('chapters')
          .update(chapterData)
          .eq('id', editingChapterId)
        
        if (error) throw error
        
        // Update local state
        const updatedChapters = { ...chapters }
        updatedChapters[selectedModuleId] = updatedChapters[selectedModuleId].map(chapter => 
          chapter.id === editingChapterId ? { ...chapter, ...chapterData } : chapter
        )
        setChapters(updatedChapters)
        
        toast.success('Chapter updated successfully')
      } else {
        // Create new chapter
        const { data, error } = await supabase
          .from('chapters')
          .insert(chapterData)
          .select()
        
        if (error) throw error
        
        if (data && data[0]) {
          // Update local state
          const updatedChapters = { ...chapters }
          updatedChapters[selectedModuleId] = [...(updatedChapters[selectedModuleId] || []), data[0]]
          setChapters(updatedChapters)
        }
        
        toast.success('Chapter created successfully')
      }
      
      // Close modal and reset form
      setIsChapterModalOpen(false)
      setChapterTitle('')
      setChapterYoutubeLink('')
      setChapterStatus('draft')
      setEditingChapterId(null)
      setSelectedModuleId(null)
    } catch (error) {
      console.error('Error saving chapter:', error)
      toast.error('Failed to save chapter')
    }
  }

  const handleDeleteChapter = async (chapterId: string, moduleId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return
    
    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId)
      
      if (error) throw error
      
      // Update local state
      const updatedChapters = { ...chapters }
      updatedChapters[moduleId] = updatedChapters[moduleId].filter(chapter => chapter.id !== chapterId)
      setChapters(updatedChapters)
      
      toast.success('Chapter deleted successfully')
    } catch (error) {
      console.error('Error deleting chapter:', error)
      toast.error('Failed to delete chapter')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Course</h1>
        <button
          onClick={openAddModuleModal}
          className="btn btn-primary"
        >
          Add Module
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : modules.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500 mb-4">No modules have been created yet.</p>
          <button
            onClick={openAddModuleModal}
            className="btn btn-primary"
          >
            Create Your First Module
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {modules.map((module) => (
            <div key={module.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="flex justify-between items-center p-4 bg-secondary">
                <h2 className="text-lg font-medium text-gray-900">{module.title}</h2>
                <button
                  onClick={() => openEditModuleModal(module)}
                  className="text-gray-600 hover:text-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Chapters</h3>
                  <button
                    onClick={() => openAddChapterModal(module.id)}
                    className="flex items-center text-sm text-primary hover:text-primary-dark"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Chapter
                  </button>
                </div>
                
                {chapters[module.id]?.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {chapters[module.id].map((chapter) => (
                      <li key={chapter.id} className="py-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{chapter.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              Status: <span className={`font-medium ${chapter.status === 'live' ? 'text-green-600' : 'text-yellow-600'}`}>
                                {chapter.status === 'live' ? 'Live' : 'Draft'}
                              </span>
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditChapterModal(chapter)}
                              className="text-gray-600 hover:text-primary"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(chapter.id, module.id)}
                              className="text-gray-600 hover:text-red-500"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 py-2">No chapters added to this module yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Module Modal */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingModuleId ? 'Edit Module' : 'Add Module'}
            </h2>
            
            <form onSubmit={handleModuleSubmit}>
              <div className="mb-4">
                <label htmlFor="moduleTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Module Title
                </label>
                <input
                  id="moduleTitle"
                  type="text"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingModuleId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Chapter Modal */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingChapterId ? 'Edit Chapter' : 'Add Chapter'}
            </h2>
            
            <form onSubmit={handleChapterSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="chapterTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Chapter Title
                  </label>
                  <input
                    id="chapterTitle"
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    className="input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="youtubeLink" className="block text-sm font-medium text-gray-700 mb-1">
                    YouTube Link
                  </label>
                  <input
                    id="youtubeLink"
                    type="url"
                    value={chapterYoutubeLink}
                    onChange={(e) => setChapterYoutubeLink(e.target.value)}
                    className="input w-full"
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    value={chapterStatus}
                    onChange={(e) => setChapterStatus(e.target.value as 'draft' | 'live')}
                    className="input w-full"
                  >
                    <option value="draft">Draft</option>
                    <option value="live">Live</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsChapterModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingChapterId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageCourse