import { useEffect, useRef } from 'react'

export default function CandidateDetailView({ candidate, jdLocation, onClose }) {
  const panelRef = useRef(null)

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!candidate) return null

  const getVerdictBgColor = (verdictCode) => {
    switch (verdictCode) {
      case 'STRONG_FIT': return 'bg-green-100 text-green-800'
      case 'GOOD_FIT': return 'bg-yellow-100 text-yellow-800'
      case 'POSSIBLE_FIT': return 'bg-orange-100 text-orange-800'
      case 'NOT_FIT':
      default:
        return 'bg-red-100 text-red-800'
    }
  }

  const getVerdictColor = (verdictCode) => {
    switch (verdictCode) {
      case 'STRONG_FIT': return 'text-green-600'
      case 'GOOD_FIT': return 'text-yellow-600'
      case 'POSSIBLE_FIT': return 'text-orange-600'
      case 'NOT_FIT':
      default:
        return 'text-red-600'
    }
  }

  const isLocationMismatch = () => {
    if (!jdLocation || !candidate.location) return false
    const jdLoc = jdLocation.toLowerCase().trim()
    const candLoc = candidate.location.toLowerCase().trim()
    return !candLoc.includes(jdLoc) && !jdLoc.includes(candLoc)
  }

  // Parse scores out of their formatted state (e.g., "45/50" -> 45)
  const getScoreVal = (strVal) => {
    if (!strVal) return 0
    return parseFloat(strVal.split('/')[0]) || 0
  }

  const parsePercent = (strVal, max) => {
    const val = getScoreVal(strVal)
    return Math.round((val / max) * 100)
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 z-40"
      />

      {/* Slide-out Panel */}
      <div 
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-[500px] max-w-[95vw] bg-white shadow-2xl border-l border-slate-100 flex flex-col z-50 animate-slide-in overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex flex-col shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-800 truncate" title={candidate.candidateName}>
                {candidate.candidateName}
              </h2>
              <p className="text-slate-500 font-medium text-sm truncate mt-1">
                {candidate.currentRole || 'Not Specified'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition shrink-0 ml-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className={`text-4xl font-extrabold tracking-tight ${getVerdictColor(candidate.verdictCode)}`}>
                <span>{candidate.scoring?.finalScore || 0}</span>
                {candidate.hasMandatoryFlag && (candidate.scoring?.finalScore || 0) >= 65 && (
                  <span 
                    title={candidate.missingMandatories.join(', ')}
                    style={{ cursor: 'pointer', marginLeft: '4px', fontSize: '0.8em' }}
                  >
                    ⚠️
                  </span>
                )}
                <span className="text-slate-300 text-lg font-bold">/100</span>
              </div>
              <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getVerdictBgColor(candidate.verdictCode)}`}>
                {candidate.verdictCode.replace('_', ' ')}
              </span>
            </div>

            <div className="flex-1 space-y-2">
              {/* Quals score bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>Quals</span>
                  <span className="text-slate-700">{candidate.scoring?.mandatoryScore}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${parsePercent(candidate.scoring?.mandatoryScore, 50)}%` }}
                  />
                </div>
              </div>

              {/* Skills score bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>Skills</span>
                  <span className="text-slate-700">{candidate.scoring?.skillsScore}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${parsePercent(candidate.scoring?.skillsScore, 30)}%` }}
                  />
                </div>
              </div>

              {/* Resp score bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>Resp.</span>
                  <span className="text-slate-700">{candidate.scoring?.respScore}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${parsePercent(candidate.scoring?.respScore, 20)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {candidate.hasMandatoryFlag && (candidate.scoring?.finalScore || 0) >= 65 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-850 flex items-start gap-2 shadow-sm font-semibold">
              <span className="shrink-0 text-base">⚠️</span>
              <div className="space-y-1">
                {candidate.missingMandatories.map((msg, idx) => (
                  <span key={idx} className="block text-yellow-900 leading-normal">{msg}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Overview */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Overview</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-slate-500">Experience</p>
                <p className="font-bold text-slate-800 mt-1">
                  {candidate.experience !== undefined && candidate.experience !== null ? `${candidate.experience} years` : 'Not Specified'}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-slate-500">Location</p>
                <div className="flex items-center space-x-1.5 mt-1">
                  <p className="font-bold text-slate-800 truncate" title={candidate.location}>
                    {candidate.location || 'Not Specified'}
                  </p>
                  {isLocationMismatch() && (
                    <span className="shrink-0 bg-orange-100 text-orange-700 border border-orange-200 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Relocation Reqd
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 col-span-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Resume Quality</p>
                    <p className="font-bold text-slate-800 mt-1">{candidate.resumeQuality || 'FAIR'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 text-right">Confidence</p>
                    <p className="font-bold text-slate-800 mt-1 text-right">
                      {candidate.verificationFlags?.length > 1 ? 'Low' : candidate.verificationFlags?.length === 1 ? 'Medium' : 'High'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mandatory Checklist */}
          {candidate.mandatoryDetail && candidate.mandatoryDetail.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mandatory Qualifications</h3>
              <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {candidate.mandatoryDetail.map((m, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50/20 text-sm space-y-1">
                    <div className="flex items-start justify-between space-x-2">
                      <div className="font-semibold text-slate-800 shrink-0 select-none">
                        {m.answer === 'YES' ? (
                          <span className="text-green-600 mr-2">✓</span>
                        ) : (
                          <span className="text-red-500 mr-2">✗</span>
                        )}
                      </div>
                      <div className="flex-1 font-semibold text-slate-700 leading-tight">
                        {m.requirement}
                      </div>
                      <div className="shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          m.tier === 'CRITICAL' 
                            ? 'bg-red-50 text-red-700 border-red-100' 
                            : m.tier === 'IMPORTANT' 
                              ? 'bg-orange-50 text-orange-700 border-orange-100'
                              : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          {m.tier}
                        </span>
                      </div>
                    </div>
                    {m.evidence && (
                      <p className="text-xs text-slate-500 italic pl-6 pt-0.5 leading-relaxed">
                        &ldquo;{m.evidence}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {candidate.topStrengths && candidate.topStrengths.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Strengths</h3>
              <ul className="space-y-2 text-sm text-slate-600 pl-1">
                {candidate.topStrengths.map((s, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-green-600 font-bold shrink-0 mt-0.5">✓</span>
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gaps */}
          {candidate.keyGaps && candidate.keyGaps.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gaps / Concerns</h3>
              <ul className="space-y-2 text-sm text-slate-600 pl-1">
                {candidate.keyGaps.map((g, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-red-500 font-bold shrink-0 mt-0.5">✗</span>
                    <span className="leading-relaxed">{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Verification Flags */}
          {candidate.verificationFlags && candidate.verificationFlags.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-yellow-800 uppercase tracking-wider flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Verification Flags
              </h3>
              <ul className="space-y-1 text-xs text-yellow-700 leading-normal pl-1 list-disc list-inside">
                {candidate.verificationFlags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestion Box / Next steps */}
          {candidate.recommendation && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3 shrink-0">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block">Recruiter Recommendation</span>
              <div className="bg-white rounded-lg border border-blue-100/50 p-4 shadow-sm">
                <span className="text-xs font-bold text-blue-600 block uppercase tracking-wider mb-1">Recommendation</span>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{candidate.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
