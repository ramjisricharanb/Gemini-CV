// ============================================================
// OPTION C SCORING ENGINE
// 100% DETERMINISTIC - NO LLM INVOLVEMENT IN SCORING
// All scores calculated by pure mathematics
// ============================================================

// ============================================================
// SECTION 1: CONSTANTS
// ============================================================

const WEIGHTS = {
    MANDATORY: 60,
    SKILLS: 30,
    RESPONSIBILITIES: 10,
};



const VERDICT_THRESHOLDS = {
    STRONG_FIT: 80,
    GOOD_FIT: 65,
    POSSIBLE_FIT: 45,
};

// ============================================================
// SECTION 2: MAIN SCORING FUNCTION (100% DETERMINISTIC)
// ============================================================

function calculateCandidateScore(llmOutput) {
    const mandatory = llmOutput.mandatory_evaluation;
    const skills = llmOutput.skills_evaluation;
    const responsibilities = llmOutput.responsibilities_evaluation;
    const preferred = llmOutput.preferred_evaluation || [];

    // ----------------------------------------------------------
    // STEP 1: Classify missing mandatory items by tier
    // ----------------------------------------------------------
    const criticalMissing = mandatory.filter(
        (m) => m.tier === "CRITICAL" && m.answer === "NO"
    );
    const importantMissing = mandatory.filter(
        (m) => m.tier === "IMPORTANT" && m.answer === "NO"
    );



    // ----------------------------------------------------------
    // STEP 3: Calculate raw section scores
    // ----------------------------------------------------------

    // Mandatory Score (out of 50)
    const mandatoryYes = mandatory.filter((m) => m.answer === "YES").length;
    const mandatoryTotal = mandatory.length;
    const mandatoryScore =
        mandatoryTotal > 0
            ? (mandatoryYes / mandatoryTotal) * WEIGHTS.MANDATORY
            : 0;

    // Skills Score (out of 30)
    const skillsYes = skills.filter((s) => s.answer === "YES").length;
    const skillsTotal = skills.length;
    const skillsScore =
        skillsTotal > 0 ? (skillsYes / skillsTotal) * WEIGHTS.SKILLS : 0;

    // Responsibilities Score (out of 20)
    const respYes = responsibilities.filter((r) => r.answer === "YES").length;
    const respTotal = responsibilities.length;
    const respScore =
        respTotal > 0 ? (respYes / respTotal) * WEIGHTS.RESPONSIBILITIES : 0;

    // Preferred Bonus (max +10)
    const preferredYes = preferred.filter((p) => p.answer === "YES").length;
    const preferredBonus = Math.min(preferredYes * 2, 10);

    // Raw total before caps
    let rawScore = mandatoryScore + skillsScore + respScore + preferredBonus;

    // ----------------------------------------------------------
    // STEP 4: Apply tier caps (deterministic rules)
    // ----------------------------------------------------------
    const capApplied = null;

    const finalScore = parseFloat(rawScore.toFixed(1));

    // ----------------------------------------------------------
    // STEP 5: Determine verdict (pure logic, no LLM)
    // ----------------------------------------------------------
    let verdict;

    if (criticalMissing.length >= 2) {
        verdict = "HARD_REJECT";
    } else if (finalScore >= VERDICT_THRESHOLDS.STRONG_FIT) {
        verdict = "STRONG_FIT";
    } else if (finalScore >= VERDICT_THRESHOLDS.GOOD_FIT) {
        verdict = "GOOD_FIT";
    } else if (finalScore >= VERDICT_THRESHOLDS.POSSIBLE_FIT) {
        verdict = "POSSIBLE_FIT";
    } else {
        verdict = "NOT_FIT";
    }

    // ----------------------------------------------------------
    // STEP 6: Build and return result
    // ----------------------------------------------------------
    return buildResult({
        candidateName: llmOutput.candidate.name,
        mandatoryScore: parseFloat(mandatoryScore.toFixed(1)),
        skillsScore: parseFloat(skillsScore.toFixed(1)),
        respScore: parseFloat(respScore.toFixed(1)),
        preferredBonus,
        rawScore: parseFloat(
            (mandatoryScore + skillsScore + respScore + preferredBonus).toFixed(1)
        ),
        finalScore,
        capApplied,
        verdict,
        criticalMissing,
        importantMissing,
        llmOutput,
    });
}

// ============================================================
// SECTION 3: BUILD RESULT OBJECT
// ============================================================

function buildResult(params) {
    const {
        candidateName,
        mandatoryScore,
        skillsScore,
        respScore,
        preferredBonus,
        rawScore,
        finalScore,
        capApplied,
        verdict,
        criticalMissing,
        importantMissing,
        llmOutput,
    } = params;

    const verdictEmoji = {
        STRONG_FIT: "🟢 STRONG FIT",
        GOOD_FIT: "🟡 GOOD FIT",
        POSSIBLE_FIT: "🟠 POSSIBLE FIT",
        NOT_FIT: "🔴 NOT FIT",
        HARD_REJECT: "⛔ HARD REJECT",
    };

    // Generate recommendation (code-based, not LLM)
    const recommendation = generateRecommendation(
        verdict,
        criticalMissing,
        importantMissing,
        llmOutput
    );

    // Dynamic warning banner computation:
    // 1. Failed mandatory fields (answer === "NO") format: "Missing: [requirement]"
    // 2. Verification flags (representing low confidence passed fields) format: "Verify: [flag]"
    // 3. Fails shown first, then low-confidence.
    const failedMandatories = criticalMissing.concat(importantMissing).map((m) => m.requirement);
    const verificationFlags = llmOutput.verification_flags || [];
    const missingMandatories = [];

    if (failedMandatories.length > 0) {
        failedMandatories.forEach((f) => {
            missingMandatories.push(`Missing: ${f}`);
        });
        verificationFlags.forEach((flag) => {
            const cleanFlag = flag.replace(/^verify:\s*/i, "").replace(/^verify before proceeding:\s*/i, "");
            missingMandatories.push(`Verify before proceeding: ${cleanFlag}`);
        });
    } else if (verificationFlags.length > 0) {
        verificationFlags.forEach((flag) => {
            const cleanFlag = flag.replace(/^verify:\s*/i, "").replace(/^verify before proceeding:\s*/i, "");
            missingMandatories.push(`Verify: ${cleanFlag}`);
        });
    }

    const hasMandatoryFlag = missingMandatories.length > 0;

    return {
        candidateName,
        currentRole: llmOutput.candidate.current_role,
        experience: llmOutput.candidate.total_experience_years,
        location: llmOutput.candidate.current_location,
        resumeQuality: llmOutput.candidate.resume_quality,

        scoring: {
            mandatoryScore: `${mandatoryScore}/${WEIGHTS.MANDATORY}`,
            skillsScore: `${skillsScore}/${WEIGHTS.SKILLS}`,
            respScore: `${respScore}/${WEIGHTS.RESPONSIBILITIES}`,
            preferredBonus: `+${preferredBonus}`,
            rawScore,
            capApplied: capApplied || "None",
            finalScore,
        },

        verdict: verdictEmoji[verdict],
        verdictCode: verdict,

        criticalMissing: criticalMissing.map((m) => m.requirement),
        importantMissing: importantMissing.map((m) => m.requirement),

        topStrengths: llmOutput.top_strengths,
        keyGaps: llmOutput.key_gaps,
        verificationFlags: llmOutput.verification_flags,
        
        hasMandatoryFlag,
        missingMandatories,

        recommendation,

        // Full detail for UI
        mandatoryDetail: llmOutput.mandatory_evaluation,
        skillsDetail: llmOutput.skills_evaluation,
        respDetail: llmOutput.responsibilities_evaluation,
        preferredDetail: llmOutput.preferred_evaluation,
    };
}

// ============================================================
// SECTION 4: RECOMMENDATION ENGINE (CODE-BASED, NOT LLM)
// ============================================================

function generateRecommendation(verdict, criticalMissing, importantMissing, llmOutput) {
    const name = llmOutput.candidate.name;
    const strengths = llmOutput.top_strengths || [];
    const gaps = llmOutput.key_gaps || [];
    const flags = llmOutput.verification_flags || [];

    const topStrength = strengths[0] || "strong profile";
    const topGap = gaps[0] || "";
    const topFlag = flags[0] || "";

    const criticalReqs = criticalMissing.map((m) => m.requirement || m);
    const importantReqs = importantMissing.map((m) => m.requirement || m);

    switch (verdict) {
        case "STRONG_FIT":
            if (flags.length > 0) {
                return `Strong candidate. Schedule interview and verify: ${topFlag}. ${topStrength}.`;
            }
            return `Strong candidate. Proceed to interview. All requirements met. ${topStrength}.`;

        case "GOOD_FIT":
            if (importantReqs.length > 0) {
                return `Good profile. Schedule screening call to verify ${importantReqs.join(
                    ", "
                )}. ${topStrength}. Address gap: ${topGap}.`;
            }
            return `Good candidate. Schedule screening call. ${topStrength}. Verify: ${topFlag}.`;

        case "POSSIBLE_FIT":
            if (criticalReqs.length === 1) {
                return `Possible fit but missing critical requirement: ${criticalReqs[0]}. Screening call recommended to verify if experience can substitute. ${topStrength}.`;
            }
            return `Possible fit. Screening call needed to assess ${topGap}. ${topStrength}.`;

        case "NOT_FIT":
            return `Do not proceed. Key gaps: ${gaps.slice(0, 2).join("; ")}.`;

        case "HARD_REJECT":
            return `Hard reject. Missing ${criticalReqs.length} critical requirements: ${criticalReqs.join(
                ", "
            )}. Not viable for this role.`;

        default:
            return "Unable to determine recommendation.";
    }
}

// ============================================================
// SECTION 5: BATCH PROCESSING
// ============================================================

function processBatch(llmOutputArray) {
    // Calculate scores for all candidates
    const results = llmOutputArray.map((llmOutput) =>
        calculateCandidateScore(llmOutput)
    );

    // Sort by finalScore descending (deterministic sort)
    results.sort((a, b) => b.scoring.finalScore - a.scoring.finalScore);

    // Add rank
    results.forEach((r, i) => (r.rank = i + 1));

    // Generate batch summary
    const summary = generateBatchSummary(results);

    return { results, summary };
}

// ============================================================
// SECTION 6: BATCH SUMMARY GENERATOR
// ============================================================

function generateBatchSummary(rankedResults) {
    const total = rankedResults.length;

    const distribution = {
        strongFit: rankedResults.filter((r) => r.verdictCode === "STRONG_FIT"),
        goodFit: rankedResults.filter((r) => r.verdictCode === "GOOD_FIT"),
        possibleFit: rankedResults.filter((r) => r.verdictCode === "POSSIBLE_FIT"),
        notFit: rankedResults.filter((r) => r.verdictCode === "NOT_FIT"),
        hardReject: rankedResults.filter((r) => r.verdictCode === "HARD_REJECT"),
    };

    const avgScore =
        rankedResults.length > 0
            ? parseFloat(
                (
                    rankedResults.reduce((sum, r) => sum + r.scoring.finalScore, 0) /
                    rankedResults.length
                ).toFixed(1)
            )
            : 0;

    const immediateShortlist = [
        ...distribution.strongFit,
        ...distribution.goodFit,
    ];

    const screeningCall = distribution.possibleFit;

    const doNotProceed = [
        ...distribution.notFit,
        ...distribution.hardReject,
    ];

    return {
        totalCandidates: total,
        averageScore: avgScore,
        distribution: {
            strongFit: distribution.strongFit.length,
            goodFit: distribution.goodFit.length,
            possibleFit: distribution.possibleFit.length,
            notFit: distribution.notFit.length,
            hardReject: distribution.hardReject.length,
        },
        immediateShortlist: immediateShortlist.map((r) => ({
            name: r.candidateName,
            score: r.scoring.finalScore,
            verdict: r.verdict,
            resumeQuality: r.resumeQuality,
            recommendation: r.recommendation,
        })),
        screeningCall: screeningCall.map((r) => ({
            name: r.candidateName,
            score: r.scoring.finalScore,
            verdict: r.verdict,
            recommendation: r.recommendation,
        })),
        doNotProceed: doNotProceed.map((r) => ({
            name: r.candidateName,
            score: r.scoring.finalScore,
            verdict: r.verdict,
            reason: r.recommendation,
        })),
    };
}

// ============================================================
// SECTION 7: DUPLICATE DETECTION (CODE-BASED)
// ============================================================

async function detectDuplicates(resumeTexts) {
    // Use SubtleCrypto (browser) or crypto (Node.js)
    const hashResume = async (text) => {
        const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
        const encoder = new TextEncoder();
        const data = encoder.encode(normalized);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    };

    const seen = new Map(); // hash → first occurrence index
    const duplicates = [];
    const unique = [];

    for (let i = 0; i < resumeTexts.length; i++) {
        const hash = await hashResume(resumeTexts[i].text);

        if (seen.has(hash)) {
            duplicates.push({
                index: i,
                name: resumeTexts[i].name,
                duplicateOf: seen.get(hash),
                hash,
            });
        } else {
            seen.set(hash, i);
            unique.push({ ...resumeTexts[i], hash });
        }
    }

    return {
        total: resumeTexts.length,
        unique: unique.length,
        duplicatesFound: duplicates.length,
        duplicates,
        uniqueResumes: unique,
    };
}

// ============================================================
// SECTION 8: COMPLETE EXAMPLE USAGE
// ============================================================

/*
USAGE IN YOUR APP:

1. Call Gemini API with OPTION_C_GEMINI_PROMPT
   → Pass JD + Resume text
   → Get JSON response

2. Parse JSON response

3. Call calculateCandidateScore(llmOutput)
   → Get deterministic score + verdict

4. For batch: Call processBatch(llmOutputArray)
   → Get ranked results + batch summary

EXAMPLE:

// Single candidate:
const llmJSON = await callGeminiAPI(jdText, resumeText);
const result = calculateCandidateScore(llmJSON);
console.log(result.scoring.finalScore); // Always same for same resume
console.log(result.verdict);            // Always same for same resume

// Batch:
const allLLMOutputs = await Promise.all(
  resumes.map(r => callGeminiAPI(jdText, r.text))
);
const { results, summary } = processBatch(allLLMOutputs);
console.log(summary); // Ranked shortlist, distribution, recommendations
*/

// ============================================================
// SECTION 9: VERIFICATION TEST
// ============================================================

function verifyDeterminism(result1, result2) {
    const same =
        result1.scoring.finalScore === result2.scoring.finalScore &&
        result1.verdictCode === result2.verdictCode;

    console.log("=== DETERMINISM VERIFICATION ===");
    console.log(`Run 1: Score=${result1.scoring.finalScore}, Verdict=${result1.verdictCode}`);
    console.log(`Run 2: Score=${result2.scoring.finalScore}, Verdict=${result2.verdictCode}`);
    console.log(`Result: ${same ? "✅ IDENTICAL (deterministic)" : "❌ DIFFERENT (bug found!)"}`);

    return same;
}

// ============================================================
// EXPORTS
// ============================================================

export {
    calculateCandidateScore,
    processBatch,
    detectDuplicates,
    verifyDeterminism,
    WEIGHTS,
    VERDICT_THRESHOLDS,
};