export default function ScreeningProgress({ progress, onPause, resumeFiles }) {
  // Approximate active file index based on progress percent
  const fileIndex = Math.min(
    Math.floor((progress / 100) * resumeFiles.length),
    resumeFiles.length - 1
  )
  const currentFile = resumeFiles[fileIndex]

  return (
    <div className="min-h-screen py-16 px-4 bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-8 text-center">
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="relative flex items-center justify-center w-20 h-20 bg-blue-50 text-blue-600 rounded-full animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Screening Candidates</h2>
          <p className="text-slate-500 font-medium text-sm">Evaluating resumes against your Job Description</p>
        </div>

        {/* Progress details */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-semibold text-slate-600">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1 flex justify-between">
            <span>Processing {fileIndex + 1} of {resumeFiles.length}</span>
            <span>Estimated time: {Math.max(1, Math.round((resumeFiles.length - fileIndex) * 3))}s left</span>
          </div>
        </div>

        {/* Active Item Card */}
        {currentFile && (
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex items-center space-x-3 text-left">
            <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-700 text-xs truncate">Analyzing Resume</p>
              <p className="text-sm font-semibold text-slate-800 truncate mt-0.5" title={currentFile.name}>
                {currentFile.name}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <button
          onClick={onPause}
          className="w-full border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold py-2.5 rounded-xl transition duration-150 active:scale-99"
        >
          Cancel Screening
        </button>
      </div>
    </div>
  )
}
