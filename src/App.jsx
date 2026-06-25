import { useState, useEffect } from 'react'
import ApiKeySetup from './components/ApiKeySetup'
import FileUpload from './components/FileUpload'
import ScreeningProgress from './components/ScreeningProgress'
import ResultsDashboard from './components/ResultsDashboard'
import { extractTextFromFile } from './utils/fileProcessor'
import { screenResumes } from './utils/geminiApi'

function App() {
  const [state, setState] = useState('setup')
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('gemini_api_key') || '')
  const [selectedModel, setSelectedModel] = useState(() => sessionStorage.getItem('gemini_selected_model') || 'gemini-3.5-flash')
  const [jdFile, setJdFile] = useState(null)
  const [resumeFiles, setResumeFiles] = useState([])
  const [screeningResults, setScreeningResults] = useState(null)
  const [screeningProgress, setScreeningProgress] = useState(0)
  const [screeningError, setScreeningError] = useState(null)

  // Clear API key on tab/window close (handled naturally by sessionStorage)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // No-op, sessionStorage is cleared when tab closes
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const handleApiKeySubmit = (key, model) => {
    setApiKey(key)
    sessionStorage.setItem('gemini_api_key', key)
    setSelectedModel(model)
    sessionStorage.setItem('gemini_selected_model', model)
    setScreeningError(null)
    setState('upload')
  }

  const handleFilesSubmit = (jd, resumes) => {
    setJdFile(jd)
    setResumeFiles(resumes)
    setState('screening')
    startScreening(jd, resumes)
  }

  const startScreening = async (jd, resumes) => {
    try {
      if (!apiKey || !apiKey.trim()) {
        throw new Error('API Key is missing or was reset. Please go back to the setup page and enter your key.')
      }
      setScreeningError(null)
      setScreeningProgress(0)

      // Step 1: Extract text from Job Description
      const jdText = await extractTextFromFile(jd)

      // Step 2: Extract text from all Resumes
      const resumeData = []
      for (let i = 0; i < resumes.length; i++) {
        const text = await extractTextFromFile(resumes[i])
        resumeData.push({
          text,
          name: resumes[i].name
        })
      }

      // Step 3: Run duplicate detection (optional validation step)
      // Done implicitly inside screening engine if desired, or just screen unique files.

      // Step 4: Call Gemini screening API
      const results = await screenResumes(
        jdText,
        resumeData,
        apiKey,
        selectedModel,
        (progressPercent) => setScreeningProgress(progressPercent)
      )

      setScreeningResults(results)
      setState('results')
    } catch (error) {
      console.error('Screening pipeline failed:', error)
      setScreeningError(error.message)
      alert('Error during screening: ' + error.message)
      setState('setup')
    }
  }

  const handleCancelScreening = () => {
    setState('upload')
    setScreeningProgress(0)
  }

  const handleStartOver = () => {
    setState('setup')
    setApiKey('')
    sessionStorage.removeItem('gemini_api_key')
    sessionStorage.removeItem('gemini_selected_model')
    setJdFile(null)
    setResumeFiles([])
    setScreeningResults(null)
    setScreeningProgress(0)
    setScreeningError(null)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {state === 'setup' && (
        <ApiKeySetup 
          onSubmit={handleApiKeySubmit} 
          initialApiKey={apiKey}
          initialModel={selectedModel}
        />
      )}
      {state === 'upload' && (
        <FileUpload onSubmit={handleFilesSubmit} />
      )}
      {state === 'screening' && (
        <ScreeningProgress
          progress={screeningProgress}
          onPause={handleCancelScreening}
          resumeFiles={resumeFiles}
        />
      )}
      {state === 'results' && (
        <ResultsDashboard
          results={screeningResults}
          jdFile={jdFile}
          resumeFiles={resumeFiles}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  )
}

export default App
