import { calculateCandidateScore } from './scoringEngine'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export async function screenResumes(jdText, resumeTexts, apiKey, model, onProgress) {
  try {
    const screeningPrompt = localStorage.getItem('screeningPrompt') || getDefaultPrompt()
    let completedCount = 0

    const candidates = []

    // Run resume screening sequentially to prevent concurrent rate limits or API errors
    for (let i = 0; i < resumeTexts.length; i++) {
      const resume = resumeTexts[i]
      try {
        const result = await analyzeResume(
          jdText,
          resume.text,
          screeningPrompt,
          apiKey,
          model,
          resume.name
        )
        candidates.push(result)
      } catch (error) {
        console.error(`Error screening ${resume.name}:`, error)
        candidates.push(createErrorCandidate(resume.name, error.message))
      }
      completedCount++
      if (onProgress) {
        onProgress(Math.round((completedCount / resumeTexts.length) * 100))
      }
    }

    return aggregateResults(candidates)
  } catch (error) {
    throw new Error(`Gemini API Error: ${error.message}`)
  }
}

async function analyzeResume(jdText, resumeText, prompt, apiKey, model, filename = '') {
  const jdParts = buildContentParts(jdText)
  const resumeParts = buildContentParts(resumeText)

  const userMessage = {
    role: 'user',
    parts: [
      { text: prompt },
      { text: '\n=== JOB DESCRIPTION ===\n' },
      ...jdParts,
      { text: '\n=== RESUME ===\n' },
      ...resumeParts
    ]
  }

  const response = await callGeminiAPI(userMessage, apiKey, model)
  return parseGeminiResponse(response, resumeText, filename)
}

function buildContentParts(content) {
  if (!content) return [{ text: '' }]
  try {
    const parsed = JSON.parse(content)
    if (parsed.type === 'image' && parsed.mimeType && parsed.base64) {
      return [{
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.base64
        }
      }]
    }
  } catch (e) {
    // Not JSON, treat as plain text
  }
  return [{ text: '\n' + content }]
}

async function callGeminiAPI(userMessage, apiKey, model) {
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`

  const generationConfig = {
    temperature: 0,
    topP: 0.95,
    maxOutputTokens: 8000,
    responseMimeType: "application/json",
    seed: 42
  }

  const payload = {
    contents: [{
      role: 'user',
      parts: userMessage.parts
    }],
    generationConfig
  }

  const maxAttempts = 4
  const timeoutMs = 120000 // 120 seconds

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}))
        const statusCode = response.status
        const errorMsg = errorJson.error?.message || `API error: ${statusCode} ${response.statusText}`
        
        // If rate limited or server error, we can retry with delay
        if ((statusCode === 429 || statusCode >= 500) && attempt < maxAttempts) {
          const delay = statusCode === 429 ? attempt * 15000 : attempt * 3000
          console.warn(`Gemini API returned status ${statusCode}. Retrying in ${delay / 1000}s (Attempt ${attempt}/${maxAttempts})...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        throw new Error(errorMsg)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      
      const isTimeout = error.name === 'AbortError'
      if ((isTimeout || error.message?.includes('fetch') || error.message?.includes('NetworkError')) && attempt < maxAttempts) {
        const delay = isTimeout ? 5000 : attempt * 4000
        console.warn(`Request failed/timed out (Attempt ${attempt}/${maxAttempts}). Retrying in ${delay / 1000}s...`, error.message)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      if (isTimeout) {
        throw new Error(`Request timed out after 120 seconds on attempt ${attempt}. The model might be overloaded, rate-limited, or slow to respond.`)
      }
      throw error
    }
  }
}

function repairJSON(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') return '{}'

  let cleaned = jsonString.trim()

  let inString = false
  let isEscaped = false
  const stack = []

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]

    if (isEscaped) {
      isEscaped = false
      continue
    }

    if (char === '\\') {
      isEscaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char)
      } else if (char === '}' || char === ']') {
        stack.pop()
      }
    }
  }

  // Case 1: We ended inside a string literal
  if (inString) {
    if (cleaned.endsWith('\\')) {
      cleaned = cleaned.slice(0, -1)
    }
    cleaned += '"'
  }

  // Case 2: Clean up incomplete trailing key/values outside strings
  while (true) {
    let original = cleaned

    // Remove trailing whitespace and commas
    cleaned = cleaned.replace(/,\s*$/, '')

    // Remove incomplete unquoted boolean/null/number values (e.g. : tr or : nu or : 12.)
    cleaned = cleaned.replace(/:\s*[a-zA-Z0-9_\-.]+$/, ':')

    // Remove incomplete key-value pairs (e.g. ,"key": or {"key":)
    cleaned = cleaned.replace(/,\s*"[^"]*"\s*:\s*$/, '')
    cleaned = cleaned.replace(/{\s*"[^"]*"\s*:\s*$/, '{')

    // Remove incomplete keys (e.g. ,"key" or {"key")
    cleaned = cleaned.replace(/,\s*"[^"]*"\s*$/, '')
    cleaned = cleaned.replace(/{\s*"[^"]*"\s*$/, '{')

    if (cleaned === original) {
      break
    }
  }

  // Re-verify the stack of open brackets/braces after cleaning
  const finalStack = []
  inString = false
  isEscaped = false

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]

    if (isEscaped) {
      isEscaped = false
      continue
    }

    if (char === '\\') {
      isEscaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (!inString) {
      if (char === '{' || char === '[') {
        finalStack.push(char)
      } else if (char === '}' || char === ']') {
        finalStack.pop()
      }
    }
  }

  // Close open structures in reverse order
  for (let i = finalStack.length - 1; i >= 0; i--) {
    const openChar = finalStack[i]
    if (openChar === '{') {
      cleaned += '}'
    } else if (openChar === '[') {
      cleaned += ']'
    }
  }

  return cleaned
}

function extractAndParseJSON(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty response from model')
  }

  let cleaned = text.trim()

  // Remove markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim()
  }

  // Strip leading conversational text before the actual JSON content begins
  const braceStart = cleaned.indexOf('{')
  const bracketStart = cleaned.indexOf('[')
  let start = -1
  if (braceStart !== -1 && bracketStart !== -1) {
    start = Math.min(braceStart, bracketStart)
  } else if (braceStart !== -1) {
    start = braceStart
  } else if (bracketStart !== -1) {
    start = bracketStart
  }

  if (start > 0) {
    cleaned = cleaned.substring(start)
  }

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    console.warn('Direct JSON parse failed, attempting auto-repair...', e.message)

    // Attempt to repair truncated JSON
    try {
      const repaired = repairJSON(cleaned)
      return JSON.parse(repaired)
    } catch (repairError) {
      console.warn('Auto-repair failed, trying bracket search fallback...', repairError.message)

      // Fallback: search for first '{' and last '}'
      const rawCleaned = text.trim()
      const rawStart = rawCleaned.indexOf('{')
      const rawEnd = rawCleaned.lastIndexOf('}')
      if (rawStart !== -1 && rawEnd !== -1 && rawEnd > rawStart) {
        const jsonSubstring = rawCleaned.substring(rawStart, rawEnd + 1)
        try {
          return JSON.parse(jsonSubstring)
        } catch (err) {
          console.warn('Fallback bracket match failed to parse:', err)
        }
      }
      throw new Error(`Failed to parse JSON response: ${e.message}`)
    }
  }
}

function resolveAnswer(rawAnswer, evidence) {
  // Trust the answer field directly
  // Do NOT override based on evidence text
  // Evidence is for display only, not for answer correction

  const answer = String(rawAnswer || '').toUpperCase().trim()

  if (answer === 'YES') return 'YES'
  if (answer === 'NO') return 'NO'
  if (answer === 'Y') return 'YES'
  if (answer === 'N') return 'NO'

  // Default to NO if unclear (conservative)
  return 'NO'
}

function normalizeResponseStructure(json, filename, resumeText) {
  const norm = {
    candidate: {
      name: json.candidate?.name || extractNameFromFilename(filename) || extractNameFromResume(resumeText) || 'Unknown Candidate',
      current_role: json.candidate?.current_role || json.candidate?.current_designation || 'Not Mentioned',
      total_experience_years: parseFloat(json.candidate?.total_experience_years || 0),
      current_location: json.candidate?.current_location || 'Not Mentioned',
      resume_quality: json.candidate?.resume_quality || json.resume_quality?.rating || 'FAIR',
      resume_quality_reason: json.candidate?.resume_quality_reason || json.resume_quality?.note || ''
    },
    jd_parsed: {
      role: json.jd_parsed?.role || json.jd?.role_title || 'Unknown Role',
      location: json.jd_parsed?.location || json.jd?.job_location || 'Not Mentioned'
    },
    mandatory_evaluation: [],
    skills_evaluation: [],
    responsibilities_evaluation: [],
    preferred_evaluation: [],
    verification_flags: json.verification_flags || json.resume_quality?.verification_flags || [],
    top_strengths: json.top_strengths || json.strengths || [],
    key_gaps: json.key_gaps || json.gaps || []
  }

  // Normalize mandatory requirements
  const rawMandatory = json.mandatory_evaluation || json.mandatory_parameters || []
  norm.mandatory_evaluation = rawMandatory.map((m, idx) => ({
    id: m.id || `M${idx + 1}`,
    requirement: m.requirement || m.parameter || 'Requirement description missing',
    tier: m.tier || 'STANDARD',
    answer: resolveAnswer(m.answer, m.evidence || m.resume_evidence),
    evidence: m.evidence || m.resume_evidence || ''
  }))

  // Normalize skills
  const rawSkills = json.skills_evaluation || json.skills || []
  norm.skills_evaluation = rawSkills.map((s, idx) => ({
    id: s.id || `S${idx + 1}`,
    skill: s.skill || s.parameter || 'Skill name missing',
    answer: resolveAnswer(s.answer, s.evidence || s.resume_evidence),
    evidence: s.evidence || s.resume_evidence || ''
  }))

  // Normalize responsibilities
  const rawResp = json.responsibilities_evaluation || json.responsibilities || []
  norm.responsibilities_evaluation = rawResp.map((r, idx) => ({
    id: r.id || `R${idx + 1}`,
    responsibility: r.responsibility || 'Responsibility description missing',
    answer: resolveAnswer(r.answer, r.evidence || r.resume_evidence),
    evidence: r.evidence || r.resume_evidence || ''
  }))

  // Normalize preferred requirements
  const rawPref = json.preferred_evaluation || json.preferred_parameters || []
  norm.preferred_evaluation = rawPref.map((p, idx) => ({
    id: p.id || `P${idx + 1}`,
    qualification: p.qualification || p.parameter || 'Qualification description missing',
    answer: resolveAnswer(p.answer, p.evidence || p.resume_evidence),
    evidence: p.evidence || p.resume_evidence || ''
  }))

  return norm
}

function parseGeminiResponse(response, resumeText, filename = '') {
  const candidate = response.candidates?.[0]
  const finishReason = candidate?.finishReason
  const content = candidate?.content?.parts?.[0]?.text

  if (finishReason && finishReason !== 'STOP') {
    console.warn(`Warning: Model finished generating with reason: ${finishReason}`)
    if (content) {
      console.warn(`Truncated response length: ${content.length} chars`)
      console.warn(`Truncated response snippet (first 800 chars):\n${content.substring(0, 800)}`)
      console.warn(`Truncated response snippet (last 800 chars):\n${content.substring(Math.max(0, content.length - 800))}`)
    }
    if (finishReason === 'MAX_TOKENS') {
      console.warn('The response was truncated because the model reached its maximum output limit (MAX_TOKENS). Proceeding with JSON auto-repair to salvage candidate details.')
    } else if (finishReason === 'SAFETY') {
      throw new Error('The request was blocked by safety filters (SAFETY).')
    } else if (finishReason === 'RECITATION') {
      throw new Error('The request was blocked due to recitation checks (RECITATION).')
    }
  }

  if (!content) {
    throw new Error('Empty response text from Gemini API')
  }

  const rawJson = extractAndParseJSON(content)
  const normalizedJson = normalizeResponseStructure(rawJson, filename, resumeText)

  // Use the deterministic scoring engine
  const scored = calculateCandidateScore(normalizedJson)

  return scored
}

function createErrorCandidate(name, errorMessage) {
  return {
    candidateName: name,
    currentRole: 'Error during analysis',
    experience: 0,
    location: 'N/A',
    resumeQuality: 'POOR',
    scoring: {
      mandatoryScore: '0/50',
      skillsScore: '0/30',
      respScore: '0/20',
      preferredBonus: '+0',
      rawScore: 0,
      capApplied: 'None',
      finalScore: 0
    },
    verdict: '🔴 ERROR',
    verdictCode: 'NOT_FIT',
    criticalMissing: [],
    importantMissing: [],
    topStrengths: [],
    keyGaps: [`Analysis failed: ${errorMessage}`],
    verificationFlags: [],
    recommendation: `Analysis failed: ${errorMessage}. Please check API key, model access, and internet connection, or try manual review.`,
    mandatoryDetail: [],
    skillsDetail: [],
    respDetail: [],
    preferredDetail: []
  }
}

function aggregateResults(candidates) {
  const results = {
    total: candidates.length,
    strongFit: 0,
    goodFit: 0,
    possibleFit: 0,
    notFit: 0,
    hardReject: 0,
    shortlisted: 0,
    candidates: candidates
  }

  for (const candidate of candidates) {
    const verdict = candidate.verdictCode || ''
    if (verdict === 'STRONG_FIT') {
      results.strongFit++
      results.shortlisted++
    } else if (verdict === 'GOOD_FIT') {
      results.goodFit++
      results.shortlisted++
    } else if (verdict === 'POSSIBLE_FIT') {
      results.possibleFit++
    } else if (verdict === 'HARD_REJECT') {
      results.hardReject++
    } else {
      results.notFit++
    }
  }

  return results
}

function extractNameFromFilename(filename) {
  if (!filename || typeof filename !== 'string') return ''
  let name = filename.replace(/\.[^/.]+$/, '')
  name = name
    .replace(/^(Resume|CV|Resume_|CV_)[\s_-]*/i, '')
    .replace(/[\s_-]+(Resume|CV|Resume|CV)$/i, '')
    .replace(/[\s_-]*\([^)]*\)$/, '')
    .replace(/^[\d\s_-]+/, '')
  name = name.replace(/[\s_-]+/g, ' ').trim()
  if (name.length >= 3 && name.length < 100 && !/^\d+$/.test(name)) {
    return name
  }
  return ''
}

function extractNameFromResume(resumeText) {
  if (!resumeText || typeof resumeText !== 'string') return ''
  const text = resumeText.trim().split('\n')[0]
  const patterns = [
    /^([A-Z][a-z]+(?: [A-Z][a-z]+)+)/,
    /^([A-Z][a-z]+ [A-Z][a-z]+)/,
    /^([A-Za-z\s]{3,50})(?:\s*[\n|-]|$)/
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const extracted = match[1].trim()
      if (extracted.length > 2 && extracted.length < 100 && !extracted.match(/^\d/)) {
        return extracted
      }
    }
  }
  return ''
}

function getDefaultPrompt() {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.toLocaleDateString('en-US', { month: 'long' })
  const currentDate = `${currentMonth} ${currentYear}`

  return `## SYSTEM INSTRUCTION

You are an EdTech Talent Acquisition Specialist for Narayana Group schools.

YOUR ONLY JOB:
1. Parse the Job Description → Extract requirements
2. Parse the Resume → Extract candidate facts
3. Answer YES or NO for each requirement
4. Provide evidence for each answer
5. Output VALID JSON ONLY

YOU DO NOT:
- Calculate scores
- Give verdicts
- Rank candidates
- Express opinions
- Generate recommendations

OUTPUT: Valid JSON only. No text before or after. No markdown fences.

---

## CRITICAL RULES

RULE 1 — ANSWER FORMAT:
  Every answer field = ONLY "YES" or "NO"
  Never: "MAYBE", "PARTIAL", "UNCLEAR", "POSSIBLY"

  CRITICAL — YOUR ANSWER MUST MATCH YOUR EVIDENCE:
  If your evidence concludes the candidate FAILS
  the requirement → answer MUST be "NO"
  If your evidence concludes the candidate PASSES
  the requirement → answer MUST be "YES"

  A contradiction where evidence says fail but
  answer = "YES" is a critical error. Never do this.

  Age example:
    Requirement: "Age below 50 years"
    Evidence: "DOB 10/10/1974, age is 52 as of ${currentDate}"
    Correct answer: "NO" ← evidence shows failure

  Experience example:
    Requirement: "Minimum 4 years as Principal"
    Evidence: "Principal at School A 2020-2023 (3yr) +
              School B 2023-present (${currentYear}-2023=Xyr).
              Total = X+3 years which meets requirement."
    Correct answer: "YES" ← evidence shows pass

  If ambiguous → "NO" (conservative default)

RULE 2 — EVIDENCE REQUIRED (For Mandatories Only):
  Evidence is ONLY required for the mandatory qualifications (mandatory_evaluation).
  YES evidence = Exact quote or paraphrase from resume (keep it under 1-2 sentences, be very concise)
  NO evidence = What is missing or not mentioned (be very concise)
  Do NOT include or generate any "evidence" field inside "skills_evaluation", "responsibilities_evaluation", or "preferred_evaluation".

RULE 3 — SEMANTIC MATCHING (for Skills/Responsibilities):
  Match by MEANING, not exact words.
  
  Equivalence examples:
    "Classroom Management" = "student handling" = "discipline management"
    "Digital Teaching Tools" = "Google Classroom" = "Smart Board" = "Zoom"
    "Leadership" = "team management" = "led team of X" = "staff management"
    "Communication" = "verbal/written communication" = "presentation skills"
    "Student Assessment" = "evaluation" = "testing" = "progress tracking"
    "Lesson Planning" = "curriculum planning" = "lesson design"
    "Budgeting" = "financial planning" = "resource allocation" = "cost management"
    "Stakeholder management" = "parent relations" = "community engagement"

  DECISION TREE — follow strictly in order:
  
  Step 1: Is the skill or direct synonym 
          explicitly written in the resume?
          → YES ✅
  
  Step 2: Is it clearly demonstrated through 
          a specific job responsibility or 
          achievement described in the resume?
          → YES ✅
  
  Step 3: Can you quote or paraphrase exact 
          resume text as evidence?
          → YES ✅
          
  Step 4: None of the above?
          → NO ❌

  NEVER answer YES based on:
  - Role assumption: "she was a Principal 
    so she must have done budgeting"
  - General inference: "all school leaders 
    handle parent relations"
  - Optimistic interpretation with no 
    resume text to back it up

  SELF-CHECK before answering each skill:
  "Can I quote specific resume text for this?"
  YES → answer YES
  NO  → answer NO

  If resume shows ANY direct equivalent 
  with quotable evidence → Answer YES.
  If not → Answer NO.

RULE 4 — MANDATORY MATCHING (Strict):
  For mandatory qualifications: EXACT match required
  "M.Sc. Physics" required:
    ✅ "M.Sc. Physics" = YES
    ❌ "M.Sc. Chemistry" = NO (wrong subject)
    ❌ "B.Sc. Physics" = NO (wrong level)
    ❌ "M.Sc." (no subject) = NO (subject not confirmed)
  
  "B.Ed." required:
    ✅ "B.Ed." = YES
    ✅ "Shiksha Shastri (B.Ed.)" = YES (equivalent)
    ✅ "B.T." = YES (equivalent)
    ❌ "D.El.Ed." = NO (different qualification)

RULE 5 — EXPERIENCE MATCHING:
  Check BOTH duration AND domain
  "2-10 years CBSE teaching":
    ✅ "PGT at CBSE school for 3 years" = YES (domain + duration match)
    ❌ "3 years at state board school" = NO (wrong board)
    ✅ "15 years CBSE teaching" = YES (above max is 
       fine — more experience = better for teaching 
       and admin roles. Only NO if JD explicitly 
       states a hard maximum with a reason.)
    ❌ "2 years teaching (board not mentioned)" = NO (board not confirmed)

  IMPORTANT — SUM ALL ROLES:
  If candidate held same role at multiple places,
  ADD all durations together for total.
  Example: Principal at School A (2 years) + 
           Principal at School B (3 years) = 5 years total.
  Never count only one role.
  If end date missing or says "present/current/till date/ongoing"
  → calculate to ${currentDate}.

  If only year given with no month (e.g. "2024")
  → assume June of that year to be conservative.

  Always show your full calculation in evidence:
  "School A: Jun 2020 - Mar 2023 = 2yr 9mo
   School B: Apr 2023 - ${currentDate} = Xyr Ymo
   TOTAL = X years Z months → meets/does not meet requirement"

RULE 5A — EXPERIENCE IN LEADERSHIP ROLES (M1-type checks):
  When the JD requires experience in a specific leadership role (Principal, Manager, Director, HOD, etc.), apply these rules strictly:

  QUALIFYING: The candidate's PRIMARY job title must match or be equivalent to the required role.
  Example: JD says "4 years as Principal" → resume must show "Principal" as the main title.

  NON-QUALIFYING — Do NOT count these toward the required leadership experience:
    - Any role where the leadership duty is listed as "additional work", "additional responsibility", or "in addition to" their primary role.
    - Any teaching title (PGT, TGT, Teacher, Lecturer, Faculty) even if they did coordination alongside it.
    - Support/admin titles that report TO the required role (e.g. Vice-, Deputy-, Assistant-, Coordinator-, Incharge-).
    - Titles from a different sector that do not map to school/org leadership (e.g. Registrar, Admission Head, Branch Manager — unless JD explicitly accepts these).

  RULE: When in doubt, ask:
    "Was this person's PRIMARY designation the required role, or did they do it on the side?"
    → Primary designation = YES (count it)
    → Side duty / additional work = NO (do not count it)

RULE 5B — CAREER TRAJECTORY CHECK (informational only, does not affect score or verdict):
  After evaluating all mandatory fields, check the candidate's CURRENT role (most recent/active position):

  IF the candidate's current role title is LOWER or DIFFERENT in seniority compared to the role being hired for:
  → Add this to Verification Flags:
    "Career note: Candidate's current role is [current title] at [current org]. Their last [required role] was [X time period] ago. Recommend verifying reason for role change and motivation to return to [required role type]."

  Examples of when to trigger this flag:
    - Hiring for Principal, candidate is currently a Teacher or Coordinator
    - Hiring for Senior Manager, candidate is currently an Executive
    - Hiring for HOD, candidate is currently a classroom teacher
    - Hiring for Director, candidate is currently a consultant or trainer

  Examples of when NOT to trigger:
    - Candidate is currently in the same or equivalent role (no demotion)
    - Candidate is currently at a higher role than what's being hired for
    - Candidate explicitly states in resume they are seeking a return to [role]

  This flag is purely for recruiter awareness. It does not reduce the score or change the verdict.

RULE 6 — TIER AUTO-DETECTION:
  Read JD language carefully:
  
  CRITICAL tier (hard blocker):
    Keywords: "mandatory", "must have", "required", "minimum X years",
              "essential", any explicit requirement with no qualifier
    
  IMPORTANT tier (score cap if missing):
    Keywords: "preferred", "highly desired", "should have", 
              "desirable", "strong"
    
  STANDARD tier (normal deduction if missing):
    Keywords: "added advantage", "nice to have", "additional",
              "bonus", "advantageous", just listed without qualifier

RULE 7 — AGE/GENDER/RELIGION:
  If JD explicitly states age limit → Evaluate age as a CRITICAL mandatory parameter.
  Current date for all calculations is ${currentDate}.
  Age = ${currentYear} - Birth Year.
  Experience end date "present" or "current" = ${currentDate}.
  Never evaluate gender, religion, caste, photo (even if in JD).

RULE 8 — LOCATION:
  Extract location from JD
  Report candidate location from resume
  Never affect scoring (code handles this)

---

## OUTPUT JSON STRUCTURE

\`\`\`json
{
  "jd_parsed": {
    "role": "string",
    "location": "string"
  },
  "candidate": {
    "name": "string",
    "current_role": "string",
    "total_experience_years": "number",
    "current_location": "string",
    "resume_quality": "GOOD | FAIR | POOR",
    "resume_quality_reason": "string"
  },
  "mandatory_evaluation": [
    {
      "id": "M1",
      "requirement": "string",
      "tier": "CRITICAL | IMPORTANT | STANDARD",
      "answer": "YES | NO",
      "evidence": "string"
    }
  ],
  "skills_evaluation": [
    {
      "id": "S1",
      "skill": "string",
      "answer": "YES | NO"
    }
  ],
  "responsibilities_evaluation": [
    {
      "id": "R1",
      "responsibility": "string",
      "answer": "YES | NO"
    }
  ],
  "preferred_evaluation": [
    {
      "id": "P1",
      "qualification": "string",
      "answer": "YES | NO"
    }
  ],
  "verification_flags": [
    "string (any ambiguous items needing human verification)"
  ],
  "top_strengths": [
    "string (specific strength with resume evidence)"
  ],
  "key_gaps": [
    "string (specific gap with JD requirement reference)"
  ]
}
\`\`\`
`
}
