import { useState, useRef } from 'react'
import { validateFiles } from '../utils/fileProcessor'

export default function FileUpload({ onSubmit }) {
  const [jdFile, setJdFile] = useState(null)
  const [resumeFiles, setResumeFiles] = useState([])
  const [error, setError] = useState('')
  const [isJdDragging, setIsJdDragging] = useState(false)
  const [isResumeDragging, setIsResumeDragging] = useState(false)

  const jdInputRef = useRef(null)
  const resumeInputRef = useRef(null)

  const handleJdChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setJdFile(file)
      setError('')
    }
  }

  const handleResumeChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setResumeFiles(prev => [...prev, ...files])
      setError('')
    }
  }

  const removeResume = (index) => {
    setResumeFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeJd = () => {
    setJdFile(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    try {
      validateFiles(jdFile, resumeFiles)
      onSubmit(jdFile, resumeFiles)
    } catch (err) {
      setError(err.message)
    }
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Drag and Drop handlers
  const handleDragOver = (e, setDragState) => {
    e.preventDefault()
    setDragState(true)
  }

  const handleDragLeave = (setDragState) => {
    setDragState(false)
  }

  const handleJdDrop = (e) => {
    e.preventDefault()
    setIsJdDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setJdFile(file)
      setError('')
    }
  }

  const handleResumeDrop = (e) => {
    e.preventDefault()
    setIsResumeDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setResumeFiles(prev => [...prev, ...files])
      setError('')
    }
  }

  return (
    <div className="min-h-screen py-16 px-4 bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Upload Documents</h1>
          <p className="text-slate-500 font-medium">Upload your Job Description and Resumes for screening</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Description Card */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Job Description</h2>
            
            {!jdFile ? (
              <div
                onDragOver={(e) => handleDragOver(e, setIsJdDragging)}
                onDragLeave={() => handleDragLeave(setIsJdDragging)}
                onDrop={handleJdDrop}
                onClick={() => jdInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 ${
                  isJdDragging 
                    ? 'border-blue-500 bg-blue-50/30' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={jdInputRef}
                  onChange={handleJdChange}
                  accept=".txt,.pdf,.doc,.docx,image/*"
                  className="hidden"
                />
                <div className="bg-slate-50 p-4 rounded-full mb-4 text-slate-400 group-hover:text-slate-600 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="font-semibold text-slate-700 mb-1">Drag and drop your Job Description</p>
                <p className="text-sm text-slate-500 mb-3">or click to select file</p>
                <p className="text-xs text-slate-400 text-center">
                  Supported formats: TXT, PDF, DOC, DOCX, PNG, JPG, JPEG, GIF, BMP, WEBP (Max 20MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="bg-blue-100 text-blue-700 p-2.5 rounded-lg shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate" title={jdFile.name}>{jdFile.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatSize(jdFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeJd}
                  className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100/50 transition shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Resumes Card */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Resumes (Multiple)</h2>

            <div
              onDragOver={(e) => handleDragOver(e, setIsResumeDragging)}
              onDragLeave={() => handleDragLeave(setIsResumeDragging)}
              onDrop={handleResumeDrop}
              onClick={() => resumeInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 mb-6 ${
                isResumeDragging 
                  ? 'border-blue-500 bg-blue-50/30' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                ref={resumeInputRef}
                onChange={handleResumeChange}
                accept=".pdf,.docx,.doc,.txt,image/*"
                multiple
                className="hidden"
              />
              <div className="bg-slate-50 p-4 rounded-full mb-4 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="font-semibold text-slate-700 mb-1">Drag and drop resumes here</p>
              <p className="text-sm text-slate-500 mb-3">or click to select files</p>
              <p className="text-xs text-slate-400 text-center">
                Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, GIF, BMP, WEBP (Max 20MB per file)
              </p>
            </div>

            {/* List of uploaded resumes */}
            {resumeFiles.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {resumeFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between border border-slate-100 rounded-xl p-3.5 bg-slate-50/30 hover:bg-slate-50 transition">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="bg-green-100 text-green-700 p-2.5 rounded-lg shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate" title={file.name}>{file.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeResume(idx)}
                      className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100/50 transition shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-bounce">
              {error}
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={!jdFile || resumeFiles.length === 0}
            className={`w-full font-bold py-3.5 rounded-xl transition duration-200 shadow-md ${
              jdFile && resumeFiles.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg active:scale-99'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Start Screening
          </button>
        </form>
      </div>
    </div>
  )
}
