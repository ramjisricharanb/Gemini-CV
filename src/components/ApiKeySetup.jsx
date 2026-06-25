import { useState } from 'react'
import { GEMINI_MODELS } from '../config/models'

export default function ApiKeySetup({ onSubmit, initialApiKey = '', initialModel = 'gemini-3.5-flash' }) {
  const [apiKey, setApiKey] = useState(initialApiKey)
  const [selectedModel, setSelectedModel] = useState(initialModel)
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!apiKey.trim()) {
      setError('Please enter your Gemini API key')
      return
    }
    if (apiKey.trim().length < 20) {
      setError('API key seems too short. Please check it.')
      return
    }
    setError('')
    onSubmit(apiKey.trim(), selectedModel)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight mb-2">
            HR Resume Screener
          </h1>
          <p className="text-slate-500 font-medium">
            Powered by Google Gemini AI
          </p>
        </div>

        {/* Setup Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* API Key Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter your API key"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showKey ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 14H10a4 4 0 002.454-7.303L13.7 9.4A1.992 1.992 0 0110 12h-.25L7.043 9.293a4 4 0 005.41 7.404z" />
                      <path fillRule="evenodd" d="M.458 10a9.954 9.954 0 003.35 4.581l1.418-1.417A8.01 8.01 0 012.458 10a8.017 8.017 0 017.542-5c1.471 0 2.857.397 4.053 1.09l1.464-1.463A9.972 9.972 0 0010 3C5.522 3 1.732 5.943.458 10z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Get your free API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">Google AI Studio</a>
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all text-slate-800"
              >
                {GEMINI_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} {model.latest ? '⭐ (Latest)' : ''}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Choose the Gemini model to use for screening
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-pulse">
                {error}
              </div>
            )}

            {/* Important Note */}
            <div className="bg-blue-50 border border-blue-100 px-4 py-3.5 rounded-xl text-sm text-blue-700 leading-relaxed">
              <strong>Note:</strong> Your API key will be cleared when you refresh the page. It is never saved.
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition duration-200 shadow-md hover:shadow-lg active:scale-98"
            >
              Continue to Upload
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500 leading-relaxed">
            <p>This is a frontend-only application. All processing is done securely in your browser.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
