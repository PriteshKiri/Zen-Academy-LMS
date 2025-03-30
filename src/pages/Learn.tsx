import { useState, useEffect } from 'react'
import { supabase, Module, Chapter } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

const Learn = () => {
  const [modules, setModules] = useState<Module[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch modules
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const { data, error } = await supabase
          .from('modules')
          .select('*')
          .order('title')
        
        if (error) {
          throw error
        }
        
        if (data) {
          setModules(data)
          // Select first module by default if available
          if (data.length > 0 && !selectedModule) {
            setSelectedModule(data[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching modules:', error)
        toast.error('Failed to load modules')
      }
    }
    
    fetchModules()
  }, [])

  // Fetch chapters when selected module changes
  useEffect(() => {
    const fetchChapters = async () => {
      if (!selectedModule) return
      
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('chapters')
          .select('*')
          .eq('module_id', selectedModule)
          .eq('status', 'live') // Only show live chapters to users
          .order('title')
        
        if (error) {
          throw error
        }
        
        if (data) {
          setChapters(data)
          // Select first chapter by default if available
          if (data.length > 0 && (!selectedChapter || selectedChapter.module_id !== selectedModule)) {
            setSelectedChapter(data[0])
          } else if (data.length === 0) {
            setSelectedChapter(null)
          }
        }
      } catch (error) {
        console.error('Error fetching chapters:', error)
        toast.error('Failed to load chapters')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchChapters()
  }, [selectedModule])

  const handleModuleChange = (moduleId: string) => {
    setSelectedModule(moduleId)
  }

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter)
  }

  // Function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  // Find the current module title
  const currentModuleTitle = modules.find(m => m.id === selectedModule)?.title || ''

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-gray-500">
        {currentModuleTitle && selectedChapter ? (
          <div className="flex items-center">
            <span>{currentModuleTitle}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>{selectedChapter.title}</span>
          </div>
        ) : (
          <span>Select a module and chapter to start learning</span>
        )}
      </div>
      
      <div className="flex flex-1 gap-6">
        {/* Left side: Video player */}
        <div className="w-2/3 bg-gray-100 rounded-lg overflow-hidden">
          {selectedChapter ? (
            <div className="aspect-w-16 aspect-h-9 h-full">
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedChapter.youtube_link)}`}
                title={selectedChapter.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {isLoading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              ) : (
                <p>Select a chapter to start learning</p>
              )}
            </div>
          )}
        </div>
        
        {/* Right side: Module and chapter selection */}
        <div className="w-1/3 bg-white rounded-lg shadow p-4">
          <div className="mb-4">
            <label htmlFor="module-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Module
            </label>
            <select
              id="module-select"
              value={selectedModule || ''}
              onChange={(e) => handleModuleChange(e.target.value)}
              className="input w-full"
              disabled={isLoading}
            >
              {modules.length === 0 ? (
                <option value="">No modules available</option>
              ) : (
                modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Chapters</h3>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : chapters.length === 0 ? (
              <p className="text-gray-500 text-sm py-2">No chapters available for this module</p>
            ) : (
              <ul className="space-y-1">
                {chapters.map((chapter) => (
                  <li key={chapter.id}>
                    <button
                      onClick={() => handleChapterSelect(chapter)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedChapter?.id === chapter.id
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-secondary'
                      }`}
                    >
                      {chapter.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Learn