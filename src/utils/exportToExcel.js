import * as XLSX from 'xlsx'

export function exportResultsToExcel(results, jdFile, resumeFiles) {
  if (!results || !results.candidates) {
    alert('No results to export')
    return
  }

  const candidates = results.candidates || []

  // Create workbook
  const wb = XLSX.utils.book_new()

  // ===== SHEET 1: SUMMARY =====
  const summaryData = [
    ['SCREENING SUMMARY REPORT'],
    [],
    ['Job Title', jdFile?.name?.replace(/\.[^/.]+$/, '') || 'Job'],
    ['Total Resumes Screened', candidates.length],
    ['Screening Date', new Date().toLocaleDateString()],
    [],
    ['VERDICT DISTRIBUTION'],
    ['Strong Fit', results.strongFit || 0],
    ['Good Fit', results.goodFit || 0],
    ['Possible Fit', results.possibleFit || 0],
    ['Not Fit', results.notFit || 0],
    ['Hard Reject', results.hardReject || 0],
    ['Shortlisted (Verdict Strong or Good)', results.shortlisted || 0],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

  // ===== SHEET 2: RANKED CANDIDATES =====
  const rankedData = [
    ['RANKED CANDIDATES LIST'],
    [],
    ['Rank', 'Candidate Name', 'Score', 'Verdict', 'Current Role', 'Experience', 'Location', 'Resume Quality', 'Cap Applied', 'Recommendation']
  ]

  const sortedCandidates = [...candidates].sort((a, b) => (b.scoring.finalScore || 0) - (a.scoring.finalScore || 0))
  sortedCandidates.forEach((candidate, index) => {
    rankedData.push([
      index + 1,
      candidate.candidateName || 'Unknown',
      candidate.scoring.finalScore || 0,
      candidate.verdict || 'N/A',
      candidate.currentRole || 'N/A',
      candidate.experience !== undefined && candidate.experience !== null ? `${candidate.experience} years` : 'N/A',
      candidate.location || 'N/A',
      candidate.resumeQuality || 'N/A',
      candidate.scoring.capApplied || 'None',
      candidate.recommendation || 'N/A'
    ])
  })

  const rankedSheet = XLSX.utils.aoa_to_sheet(rankedData)
  rankedSheet['!cols'] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 8 },
    { wch: 18 },
    { wch: 25 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
    { wch: 50 }
  ]
  XLSX.utils.book_append_sheet(wb, rankedSheet, 'Ranked Candidates')

  // ===== SHEET 3: DETAILED SCORES =====
  const detailedData = [
    ['DETAILED SCORING REPORT'],
    [],
    ['Candidate Name', 'Qualifications Score', 'Skills Score', 'Experience Score', 'Preferred Bonus', 'Raw Score', 'Final Score', 'Cap Applied']
  ]

  sortedCandidates.forEach(candidate => {
    detailedData.push([
      candidate.candidateName || 'Unknown',
      candidate.scoring.mandatoryScore || '0/50',
      candidate.scoring.skillsScore || '0/30',
      candidate.scoring.respScore || '0/20',
      candidate.scoring.preferredBonus || '+0',
      candidate.scoring.rawScore || 0,
      candidate.scoring.finalScore || 0,
      candidate.scoring.capApplied || 'None'
    ])
  })

  const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData)
  detailedSheet['!cols'] = [
    { wch: 25 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 25 }
  ]
  XLSX.utils.book_append_sheet(wb, detailedSheet, 'Detailed Scores')

  // ===== SHEET 4: STRENGTHS & GAPS =====
  const analysisData = [
    ['CANDIDATE ANALYSIS - STRENGTHS & GAPS'],
    []
  ]

  sortedCandidates.forEach(candidate => {
    analysisData.push([])
    analysisData.push([candidate.candidateName || 'Unknown', `Score: ${candidate.scoring.finalScore}`, `Verdict: ${candidate.verdict}`])
    analysisData.push(['TOP STRENGTHS'])
    if (candidate.topStrengths && candidate.topStrengths.length > 0) {
      candidate.topStrengths.forEach(strength => {
        analysisData.push(['', '✓', strength])
      })
    } else {
      analysisData.push(['', '', 'No strengths recorded'])
    }
    analysisData.push(['KEY GAPS'])
    if (candidate.keyGaps && candidate.keyGaps.length > 0) {
      candidate.keyGaps.forEach(gap => {
        analysisData.push(['', '✕', gap])
      })
    } else {
      analysisData.push(['', '', 'No critical gaps identified'])
    }
    analysisData.push(['CRITICAL MISSING'])
    if (candidate.criticalMissing && candidate.criticalMissing.length > 0) {
      candidate.criticalMissing.forEach(qual => {
        analysisData.push(['', '!', qual])
      })
    } else {
      analysisData.push(['', '', 'None'])
    }
    analysisData.push(['IMPORTANT MISSING'])
    if (candidate.importantMissing && candidate.importantMissing.length > 0) {
      candidate.importantMissing.forEach(qual => {
        analysisData.push(['', '!', qual])
      })
    } else {
      analysisData.push(['', '', 'None'])
    }
    if (candidate.verificationFlags && candidate.verificationFlags.length > 0) {
      analysisData.push(['VERIFICATION FLAGS'])
      candidate.verificationFlags.forEach(flag => {
        analysisData.push(['', '?', flag])
      })
    }
  })

  const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData)
  analysisSheet['!cols'] = [{ wch: 25 }, { wch: 3 }, { wch: 70 }]
  XLSX.utils.book_append_sheet(wb, analysisSheet, 'Analysis')

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0]
  const jobTitle = jdFile?.name?.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_') || 'Screening'
  const filename = `${jobTitle}_Screening_${timestamp}.xlsx`

  // Write file
  XLSX.writeFile(wb, filename)
}
