import { useState, useMemo } from 'react'
import { exportResultsToExcel } from '../utils/exportToExcel'
import CandidateDetailView from './CandidateDetailView'

export default function ResultsDashboard({ results, jdFile, resumeFiles, onStartOver }) {
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-800">No Results</h1>
          <p className="text-slate-500">Screening results are not available</p>
          <button
            onClick={onStartOver}
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  const candidates = results.candidates || []

  // Immediate Shortlist - Strong + Good Fit (or score >= 65) sorted descending
  const shortlistCandidates = useMemo(() => {
    return candidates
      .filter(c => c.verdictCode === 'STRONG_FIT' || c.verdictCode === 'GOOD_FIT')
      .sort((a, b) => b.scoring.finalScore - a.scoring.finalScore)
  }, [candidates])

  // Sort all candidates by score descending for the distribution list
  const distributionCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.scoring.finalScore - a.scoring.finalScore)
  }, [candidates])

  // Filter candidates based on selected filter and search term
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      // Filter by search name
      const matchesSearch = candidate.candidateName.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false

      // Filter by status code
      if (filterType === 'all') return true
      if (filterType === 'NOT_FIT') {
        return candidate.verdictCode === 'NOT_FIT' || candidate.verdictCode === 'HARD_REJECT'
      }
      return candidate.verdictCode === filterType
    })
  }, [candidates, filterType, searchTerm])

  // Sort filtered candidates by score descending always
  const sortedCandidates = useMemo(() => {
    return [...filteredCandidates].sort((a, b) => b.scoring.finalScore - a.scoring.finalScore)
  }, [filteredCandidates])

  const getJobTitle = () => {
    if (!jdFile?.name) return 'Candidate'
    return jdFile.name
      .replace(/\.(pdf|doc|docx|txt|png|jpg|jpeg|gif|bmp|webp)$/i, '')
      .replace(/^(JD|JobDescription|Job_Description|Job_Desc|JD_)[\s_-]*/i, '')
      .replace(/[\s_-]*(JD|JobDescription|Job_Description|Job_Desc|JD)$/i, '')
      .replace(/^[\d\s_-]+/, '')
      .replace(/[\s_-]+/g, ' ')
      .trim()
  }

  const getVerdictBgColor = (verdictCode) => {
    switch (verdictCode) {
      case 'STRONG_FIT': return 'bg-green-50 text-green-700 border-green-200'
      case 'GOOD_FIT': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'POSSIBLE_FIT': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'NOT_FIT':
      default:
        return 'bg-red-50 text-red-700 border-red-200'
    }
  }

  const getVerdictColor = (verdictCode) => {
    switch (verdictCode) {
      case 'STRONG_FIT': return 'text-green-600'
      case 'GOOD_FIT': return 'text-yellow-600'
      case 'POSSIBLE_FIT': return 'text-orange-600'
      case 'NOT_FIT':
      default:
        return 'text-red-500'
    }
  }

  const getVerdictBarColor = (verdictCode) => {
    switch (verdictCode) {
      case 'STRONG_FIT': return 'bg-green-500'
      case 'GOOD_FIT': return 'bg-yellow-500'
      case 'POSSIBLE_FIT': return 'bg-orange-500'
      case 'NOT_FIT':
      default:
        return 'bg-red-500'
    }
  }

  const isLocationMismatch = (location) => {
    if (!results.candidates?.[0]?.llmOutput?.jd_parsed?.location || !location) return false
    const jdLoc = results.candidates[0].llmOutput.jd_parsed.location.toLowerCase().trim()
    const candLoc = location.toLowerCase().trim()
    return !candLoc.includes(jdLoc) && !jdLoc.includes(candLoc)
  }

  const getScoreVal = (strVal) => {
    if (!strVal) return 0
    return parseFloat(strVal.split('/')[0]) || 0
  }

  const parsePercent = (strVal, max) => {
    const val = getScoreVal(strVal)
    return Math.round((val / max) * 100)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 sm:px-8 py-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {getJobTitle()} — Candidate Screening Dashboard
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 font-medium">
              {results.candidates?.[0]?.llmOutput?.jd_parsed?.role || 'Job Description'} | Narayana Group
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Screening Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => exportResultsToExcel(results, jdFile, resumeFiles)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition duration-150 shadow-md hover:shadow-lg active:scale-98 flex items-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to Excel
            </button>
            <button
              onClick={onStartOver}
              className="bg-white hover:bg-slate-100 text-slate-800 font-bold px-4 py-2.5 rounded-xl transition duration-150 shadow-md active:scale-98 text-sm"
            >
              Start Over
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8 space-y-8">
        
        {/* Stats Row */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-5 border-t-4 border-slate-400 shadow-sm text-center">
            <div className="text-3xl font-extrabold text-slate-800">{results.total || 0}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Screened</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border-t-4 border-green-500 shadow-sm text-center">
            <div className="text-3xl font-extrabold text-green-600">{results.strongFit || 0}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Strong Fit</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border-t-4 border-yellow-500 shadow-sm text-center">
            <div className="text-3xl font-extrabold text-yellow-600">{results.goodFit || 0}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Good Fit</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border-t-4 border-orange-500 shadow-sm text-center">
            <div className="text-3xl font-extrabold text-orange-600">{results.possibleFit || 0}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Possible Fit</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border-t-4 border-purple-500 shadow-sm text-center">
            <div className="text-3xl font-extrabold text-purple-600">{results.shortlisted || 0}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Shortlisted</div>
            {results.shortlisted > 0 && (
              <div className="text-[10px] font-bold text-slate-400 mt-2 bg-purple-50 px-2 py-0.5 rounded inline-block">
                Avg Score: {(shortlistCandidates.reduce((sum, c) => sum + c.scoring.finalScore, 0) / shortlistCandidates.length).toFixed(1)}
              </div>
            )}
          </div>
        </section>

        {/* Immediate Shortlist Table */}
        <section className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-yellow-500 text-lg">★</span>
            <h2 className="text-base font-bold text-blue-900 uppercase tracking-wider">IMMEDIATE SHORTLIST — Top Candidates for Interview</h2>
          </div>

          {shortlistCandidates.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white shadow-sm">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-50/60 border-b border-blue-100">
                    <th className="text-left py-3 px-4 font-bold text-blue-900 text-xs tracking-wider uppercase">RANK</th>
                    <th className="text-left py-3 px-4 font-bold text-blue-900 text-xs tracking-wider uppercase">NAME</th>
                    <th className="text-left py-3 px-4 font-bold text-blue-900 text-xs tracking-wider uppercase">SCORE</th>
                    <th className="text-left py-3 px-4 font-bold text-blue-900 text-xs tracking-wider uppercase">VERDICT</th>
                    <th className="text-left py-3 px-4 font-bold text-blue-900 text-xs tracking-wider uppercase">KEY ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {shortlistCandidates.map((candidate, index) => (
                    <tr
                      key={index}
                      className="border-b border-blue-50 hover:bg-blue-50/40 cursor-pointer transition"
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <td className="py-3.5 px-4 font-extrabold text-blue-600">#{index + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{candidate.candidateName}</td>
                      <td className={`py-3.5 px-4 font-extrabold text-base ${getVerdictColor(candidate.verdictCode)}`}>
                        <span>{candidate.scoring.finalScore}</span>
                        {candidate.hasMandatoryFlag && candidate.scoring.finalScore >= 65 && (
                          <span 
                            title={candidate.missingMandatories.join(', ')}
                            style={{ cursor: 'pointer', marginLeft: '4px', fontSize: '0.8em' }}
                          >
                            ⚠️
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getVerdictBgColor(candidate.verdictCode)}`}>
                          {candidate.verdictCode.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs truncate max-w-xs" title={candidate.recommendation}>
                        {candidate.recommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-white border border-blue-100 rounded-xl">
              <p className="text-slate-400 font-semibold text-sm">No shortlisted candidates identified (Strong or Good Fit)</p>
            </div>
          )}
        </section>

        {/* Score Distribution Bar Chart */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider mb-6">Score Distribution — All Candidates</h2>
          <div className="space-y-3.5">
            {distributionCandidates.map((candidate, index) => (
              <div 
                key={index} 
                className="flex items-center gap-4 hover:bg-slate-50 p-2 rounded-xl transition cursor-pointer group"
                onClick={() => setSelectedCandidate(candidate)}
              >
                <div className="w-40 text-xs font-semibold text-slate-600 truncate group-hover:text-blue-600 group-hover:font-bold transition" title={candidate.candidateName}>
                  {candidate.candidateName}
                </div>
                <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden shadow-inner group-hover:shadow-md transition">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getVerdictBarColor(candidate.verdictCode)}`}
                    style={{ width: `${(candidate.scoring.finalScore / 100) * 100}%` }}
                  />
                </div>
                <div className="w-12 text-right text-xs font-extrabold text-slate-700">
                  <span>{candidate.scoring.finalScore}</span>
                  {candidate.hasMandatoryFlag && candidate.scoring.finalScore >= 65 && (
                    <span 
                      title={candidate.missingMandatories.join(', ')}
                      style={{ cursor: 'pointer', marginLeft: '4px', fontSize: '0.8em' }}
                    >
                      ⚠️
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'STRONG_FIT', label: 'Strong Fit' },
                { value: 'GOOD_FIT', label: 'Good Fit' },
                { value: 'POSSIBLE_FIT', label: 'Possible Fit' },
                { value: 'NOT_FIT', label: 'Not Fit' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-150 ${
                    filterType === filter.value
                      ? 'bg-slate-800 text-white border-transparent shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name…"
                className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent text-sm w-full md:w-56"
              />
            </div>
          </div>
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-50">
            <span>All Candidates</span>
            <span className="text-slate-500">Showing {sortedCandidates.length} of {candidates.length}</span>
          </div>
        </section>

        {/* Candidate Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sortedCandidates.length > 0 ? (
            sortedCandidates.map((candidate, index) => (
              <div
                key={index}
                onClick={() => setSelectedCandidate(candidate)}
                className="bg-white border-l-4 border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                style={{
                  borderLeftColor: 
                    candidate.verdictCode === 'STRONG_FIT' ? '#10b981' :
                    candidate.verdictCode === 'GOOD_FIT' ? '#eab308' :
                    candidate.verdictCode === 'POSSIBLE_FIT' ? '#f97316' :
                    '#ef4444'
                }}
              >
                <div className="space-y-4">
                  {/* Top line */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 text-base truncate" title={candidate.candidateName}>
                        {candidate.candidateName}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 truncate mt-1">
                        {candidate.currentRole || 'Not Specified'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-2xl font-extrabold flex items-center ${getVerdictColor(candidate.verdictCode)}`}>
                        <span>{candidate.scoring.finalScore}</span>
                        {candidate.hasMandatoryFlag && candidate.scoring.finalScore >= 65 && (
                          <span 
                            title={candidate.missingMandatories.join(', ')}
                            style={{ cursor: 'pointer', marginLeft: '4px', fontSize: '0.8em' }}
                          >
                            ⚠️
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">SCORE</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getVerdictBgColor(candidate.verdictCode)}`}>
                      {candidate.verdictCode.replace('_', ' ')}
                    </span>
                    {candidate.experience !== undefined && candidate.experience !== null && (
                      <span className="bg-slate-50 text-slate-600 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {candidate.experience} Yrs
                      </span>
                    )}
                    {candidate.location && (
                      <span className="bg-slate-50 text-slate-600 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider truncate max-w-[100px]" title={candidate.location}>
                        {candidate.location}
                      </span>
                    )}
                    {isLocationMismatch(candidate.location) && (
                      <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Relocation Reqd
                      </span>
                    )}
                  </div>

                  {/* Score progress bars */}
                  <div className="space-y-2 border-t border-slate-50 pt-4">
                    {/* Quals */}
                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-0.5">
                        <span>Qualifications</span>
                        <span className="text-slate-700 font-bold">{candidate.scoring.mandatoryScore}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-purple-600 h-full rounded-full"
                          style={{ width: `${parsePercent(candidate.scoring.mandatoryScore, 60)}%` }}
                        />
                      </div>
                    </div>

                    {/* Skills */}
                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-0.5">
                        <span>Skills</span>
                        <span className="text-slate-700 font-bold">{candidate.scoring.skillsScore}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-cyan-500 h-full rounded-full"
                          style={{ width: `${parsePercent(candidate.scoring.skillsScore, 30)}%` }}
                        />
                      </div>
                    </div>

                    {/* Responsibilities */}
                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-0.5">
                        <span>Responsibilities</span>
                        <span className="text-slate-700 font-bold">{candidate.scoring.respScore}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${parsePercent(candidate.scoring.respScore, 10)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* View Details button */}
                <button className="mt-5 w-full bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-bold py-2 rounded-xl transition duration-150 border border-slate-150 uppercase tracking-widest shrink-0">
                  View Details
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-16 col-span-3 bg-white border border-slate-150 rounded-2xl">
              <p className="text-slate-400 font-semibold text-base">No candidates match your filters and search criteria</p>
            </div>
          )}
        </section>

      </main>

      {/* Slide-out Detail View */}
      {selectedCandidate && (
        <CandidateDetailView
          candidate={selectedCandidate}
          jdLocation={results.candidates?.[0]?.llmOutput?.jd_parsed?.location}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  )
}
