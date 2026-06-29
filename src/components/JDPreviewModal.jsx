import React, { useState } from 'react'
import './JDPreviewModal.css'

export default function JDPreviewModal({
  jdStructure,
  onConfirm,
  onCancel
}) {
  const [editedJD, setEditedJD] = useState(() => {
    return {
      role: jdStructure?.role || '',
      location: jdStructure?.location || '',
      qualifications: jdStructure?.qualifications || jdStructure?.mandatory_criteria || [],
      experience: jdStructure?.experience || [],
      skills: jdStructure?.skills || [],
      responsibilities: jdStructure?.responsibilities || [],
      preferences: jdStructure?.preferences || jdStructure?.preferred_criteria || []
    }
  })
  const [expandedSections, setExpandedSections] = useState({
    qualifications: true,
    experience: true,
    skills: true,
    responsibilities: true,
    preferences: false
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleArrayChange = (section, index, value) => {
    const updated = { ...editedJD }
    if (Array.isArray(updated[section])) {
      const current = updated[section][index]
      if (typeof current === 'object' && current !== null) {
        const textKey = 'requirement' in current ? 'requirement' :
          'qualification' in current ? 'qualification' :
            'skill' in current ? 'skill' :
              'responsibility' in current ? 'responsibility' :
                'text' in current ? 'text' :
                  'title' in current ? 'title' : null;
        if (textKey) {
          updated[section][index] = { ...current, [textKey]: value }
        } else {
          updated[section][index] = value
        }
      } else {
        updated[section][index] = value
      }
      setEditedJD(updated)
    }
  }

  const handleAddArrayItem = (section) => {
    const updated = { ...editedJD }
    if (Array.isArray(updated[section])) {
      updated[section].push('')
      setEditedJD(updated)
    }
  }

  const handleRemoveArrayItem = (section, index) => {
    const updated = { ...editedJD }
    if (Array.isArray(updated[section])) {
      updated[section].splice(index, 1)
      setEditedJD(updated)
    }
  }

  return (
    <div className="jd-preview-overlay">
      <div className="jd-preview-modal">
        <div className="jd-modal-header">
          <h2>Job Description - Preview & Verify</h2>
          <button
            className="jd-modal-close"
            onClick={onCancel}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="jd-modal-body">
          {/* QUALIFICATIONS SECTION */}
          <div className="jd-section">
            <button
              className="jd-section-header"
              onClick={() => toggleSection('qualifications')}
            >
              <span className="jd-section-icon">
                {expandedSections.qualifications ? '▼' : '▶'}
              </span>
              <h3>[MANDATORY] Qualifications & Requirements</h3>
            </button>

            {expandedSections.qualifications && (
              <div className="jd-section-content">
                {editedJD.qualifications && editedJD.qualifications.map((item, idx) => (
                  <div key={idx} className="jd-array-item">
                    <textarea
                      value={typeof item === 'string' ? item : (item?.requirement || JSON.stringify(item))}
                      onChange={(e) => handleArrayChange('qualifications', idx, e.target.value)}
                      placeholder="Enter qualification"
                      rows="2"
                    />
                    <button
                      className="jd-remove-btn"
                      onClick={() => handleRemoveArrayItem('qualifications', idx)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  className="jd-add-btn"
                  onClick={() => handleAddArrayItem('qualifications')}
                >
                  + Add Qualification
                </button>
              </div>
            )}
          </div>

          {/* EXPERIENCE SECTION */}
          <div className="jd-section">
            <button
              className="jd-section-header"
              onClick={() => toggleSection('experience')}
            >
              <span className="jd-section-icon">
                {expandedSections.experience ? '▼' : '▶'}
              </span>
              <h3>[MANDATORY] Experience Requirements</h3>
            </button>

            {expandedSections.experience && (
              <div className="jd-section-content">
                {editedJD.experience && editedJD.experience.map((item, idx) => (
                  <div key={idx} className="jd-array-item">
                    <textarea
                      value={typeof item === 'string' ? item : (item?.requirement || JSON.stringify(item))}
                      onChange={(e) => handleArrayChange('experience', idx, e.target.value)}
                      placeholder="Enter experience requirement"
                      rows="2"
                    />
                    <button
                      className="jd-remove-btn"
                      onClick={() => handleRemoveArrayItem('experience', idx)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  className="jd-add-btn"
                  onClick={() => handleAddArrayItem('experience')}
                >
                  + Add Experience Requirement
                </button>
              </div>
            )}
          </div>

          {/* SKILLS SECTION */}
          <div className="jd-section">
            <button
              className="jd-section-header"
              onClick={() => toggleSection('skills')}
            >
              <span className="jd-section-icon">
                {expandedSections.skills ? '▼' : '▶'}
              </span>
              <h3>[SCORING] Required Skills</h3>
            </button>

            {expandedSections.skills && (
              <div className="jd-section-content">
                {editedJD.skills && editedJD.skills.map((item, idx) => (
                  <div key={idx} className="jd-array-item">
                    <textarea
                      value={typeof item === 'string' ? item : (item?.skill || JSON.stringify(item))}
                      onChange={(e) => handleArrayChange('skills', idx, e.target.value)}
                      placeholder="Enter skill"
                      rows="2"
                    />
                    <button
                      className="jd-remove-btn"
                      onClick={() => handleRemoveArrayItem('skills', idx)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  className="jd-add-btn"
                  onClick={() => handleAddArrayItem('skills')}
                >
                  + Add Skill
                </button>
              </div>
            )}
          </div>

          {/* RESPONSIBILITIES SECTION */}
          <div className="jd-section">
            <button
              className="jd-section-header"
              onClick={() => toggleSection('responsibilities')}
            >
              <span className="jd-section-icon">
                {expandedSections.responsibilities ? '▼' : '▶'}
              </span>
              <h3>[SCORING] Key Responsibilities</h3>
            </button>

            {expandedSections.responsibilities && (
              <div className="jd-section-content">
                {editedJD.responsibilities && editedJD.responsibilities.map((item, idx) => (
                  <div key={idx} className="jd-array-item">
                    <textarea
                      value={typeof item === 'string' ? item : (item?.responsibility || JSON.stringify(item))}
                      onChange={(e) => handleArrayChange('responsibilities', idx, e.target.value)}
                      placeholder="Enter responsibility"
                      rows="2"
                    />
                    <button
                      className="jd-remove-btn"
                      onClick={() => handleRemoveArrayItem('responsibilities', idx)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  className="jd-add-btn"
                  onClick={() => handleAddArrayItem('responsibilities')}
                >
                  + Add Responsibility
                </button>
              </div>
            )}
          </div>

          {/* PREFERENCES SECTION (Collapsed by default) */}
          <div className="jd-section">
            <button
              className="jd-section-header"
              onClick={() => toggleSection('preferences')}
            >
              <span className="jd-section-icon">
                {expandedSections.preferences ? '▼' : '▶'}
              </span>
              <h3>[OPTIONAL] Preferred Qualifications</h3>
            </button>

            {expandedSections.preferences && (
              <div className="jd-section-content">
                {editedJD.preferences && editedJD.preferences.map((item, idx) => (
                  <div key={idx} className="jd-array-item">
                    <textarea
                      value={typeof item === 'string' ? item : (item?.qualification || JSON.stringify(item))}
                      onChange={(e) => handleArrayChange('preferences', idx, e.target.value)}
                      placeholder="Enter preference"
                      rows="2"
                    />
                    <button
                      className="jd-remove-btn"
                      onClick={() => handleRemoveArrayItem('preferences', idx)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  className="jd-add-btn"
                  onClick={() => handleAddArrayItem('preferences')}
                >
                  + Add Preference
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="jd-modal-footer">
          <button
            className="jd-btn-cancel"
            onClick={onCancel}
          >
            Edit JD Again
          </button>
          <button
            className="jd-btn-confirm"
            onClick={() => onConfirm(editedJD)}
          >
            Confirm & Screen Candidates
          </button>
        </div>
      </div>
    </div>
  )
}
