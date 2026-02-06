module.exports = {

"[project]/frontend/src/services/admin-service.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "addAdminLogEntry": (()=>addAdminLogEntry),
    "getAdminAuditLog": (()=>getAdminAuditLog),
    "getAllUsers": (()=>getAllUsers)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v4.js [app-ssr] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/backend/src/lib/role-mapping.ts [app-ssr] (ecmascript)");
'use client';
;
;
const ADMIN_LOG_KEY = 'admin_audit_log';
const getAdminLogFromStorage = ()=>{
    if ("TURBOPACK compile-time truthy", 1) return [];
    "TURBOPACK unreachable";
    const json = undefined;
};
const saveAdminLogToStorage = (log)=>{
    if ("TURBOPACK compile-time truthy", 1) return;
    "TURBOPACK unreachable";
};
const addAdminLogEntry = (actor, action, caseId)=>{
    const log = getAdminLogFromStorage();
    const newEntry = {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        timestamp: new Date().toISOString(),
        actor,
        action,
        caseId
    };
    log.unshift(newEntry);
    saveAdminLogToStorage(log);
};
async function getAdminAuditLog() {
    return getAdminLogFromStorage().sort((a, b)=>new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
async function getAllUsers() {
    const allUserRoles = Object.keys(__TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"]).filter((r)=>r !== 'Anonymous');
    return {
        all: allUserRoles
    };
}
}}),
"[project]/frontend/src/services/org-coaching-service.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "ORG_COACHING_KEY": (()=>ORG_COACHING_KEY),
    "assignCoachingFromOrgHealth": (()=>assignCoachingFromOrgHealth),
    "getOrgCoachingItems": (()=>getOrgCoachingItems)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v4.js [app-ssr] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$services$2f$admin$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/services/admin-service.ts [app-ssr] (ecmascript)");
'use client';
;
;
const ORG_COACHING_KEY = 'org_coaching_items_v1';
const getFromStorage = (key)=>{
    if ("TURBOPACK compile-time truthy", 1) return [];
    "TURBOPACK unreachable";
    const json = undefined;
};
const saveToStorage = (key, data)=>{
    if ("TURBOPACK compile-time truthy", 1) return;
    "TURBOPACK unreachable";
};
async function assignCoachingFromOrgHealth(recommendations, assignerRole) {
    const allItems = getFromStorage(ORG_COACHING_KEY);
    const now = new Date().toISOString();
    const newItems = recommendations.map((rec)=>({
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
            theme: rec.theme,
            recommendation: rec.recommendation,
            targetAudience: rec.targetAudience,
            status: 'Assigned',
            assignedAt: now,
            assignedBy: assignerRole
        }));
    // Add new items to the beginning of the list
    const updatedItems = [
        ...newItems,
        ...allItems
    ];
    saveToStorage(ORG_COACHING_KEY, updatedItems);
    // Log this action in the admin log
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$services$2f$admin$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addAdminLogEntry"])(assignerRole, `Assigned ${newItems.length} new coaching tasks from Org Health analysis.`);
}
async function getOrgCoachingItems() {
    return getFromStorage(ORG_COACHING_KEY).sort((a, b)=>new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
}
}}),
"[project]/frontend/src/services/feedback-service.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * @fileOverview A service for managing feedback submissions using sessionStorage.
 *
 * This service provides a simple, client-side persistent storage mechanism for feedback,
 * suitable for a prototype. It now includes custom event dispatching for same-tab updates.
 */ __turbopack_context__.s({
    "acknowledgeDeclinedRecommendation": (()=>acknowledgeDeclinedRecommendation),
    "addCoachingCheckIn": (()=>addCoachingCheckIn),
    "addCustomCoachingPlan": (()=>addCustomCoachingPlan),
    "assignPracticeScenario": (()=>assignPracticeScenario),
    "completePracticeScenario": (()=>completePracticeScenario),
    "escalateToManager": (()=>escalateToManager),
    "getActionItemsForEmployee": (()=>getActionItemsForEmployee),
    "getActiveCoachingPlansForUser": (()=>getActiveCoachingPlansForUser),
    "getAggregatedActionItems": (()=>getAggregatedActionItems),
    "getAiInterventionLog": (()=>getAiInterventionLog),
    "getAllFeedback": (()=>getAllFeedback),
    "getCompletedPracticeScenariosForUser": (()=>getCompletedPracticeScenariosForUser),
    "getDeclinedCoachingAreasForSupervisor": (()=>getDeclinedCoachingAreasForSupervisor),
    "getEscalationInsights": (()=>getEscalationInsights),
    "getFeedbackById": (()=>getFeedbackById),
    "getFeedbackFromStorage": (()=>getFeedbackFromStorage),
    "getManagerDevelopmentMapData": (()=>getManagerDevelopmentMapData),
    "getOneOnOneHistory": (()=>getOneOnOneHistory),
    "getPracticeScenariosAssignedByMe": (()=>getPracticeScenariosAssignedByMe),
    "getPracticeScenariosForUser": (()=>getPracticeScenariosForUser),
    "getReadinessPipelineData": (()=>getReadinessPipelineData),
    "getTeamActionItemStatus": (()=>getTeamActionItemStatus),
    "getTeamCoachingQualityIndex": (()=>getTeamCoachingQualityIndex),
    "getTeamGrowthHighlights": (()=>getTeamGrowthHighlights),
    "getTeamNetsScores": (()=>getTeamNetsScores),
    "getTeamPulse": (()=>getTeamPulse),
    "resolveFeedback": (()=>resolveFeedback),
    "reviewCoachingRecommendationDecline": (()=>reviewCoachingRecommendationDecline),
    "saveFeedback": (()=>saveFeedback),
    "saveFeedbackToStorage": (()=>saveFeedbackToStorage),
    "saveOneOnOneHistory": (()=>saveOneOnOneHistory),
    "submitAmCoachingNotes": (()=>submitAmCoachingNotes),
    "submitAmDirectResponse": (()=>submitAmDirectResponse),
    "submitEmployeeAcknowledgement": (()=>submitEmployeeAcknowledgement),
    "submitEmployeeFeedbackAcknowledgement": (()=>submitEmployeeFeedbackAcknowledgement),
    "submitFinalHrDecision": (()=>submitFinalHrDecision),
    "submitHrResolution": (()=>submitHrResolution),
    "submitManagerResolution": (()=>submitManagerResolution),
    "submitSupervisorInsightResponse": (()=>submitSupervisorInsightResponse),
    "submitSupervisorRetry": (()=>submitSupervisorRetry),
    "toggleActionItemStatus": (()=>toggleActionItemStatus),
    "updateCoachingProgress": (()=>updateCoachingProgress),
    "updateCoachingRecommendationStatus": (()=>updateCoachingRecommendationStatus),
    "updateOneOnOneHistoryItem": (()=>updateOneOnOneHistoryItem)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v4.js [app-ssr] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/role-mapping.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$services$2f$org$2d$coaching$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/services/org-coaching-service.ts [app-ssr] (ecmascript)");
;
;
;
// Helper function to generate a new ID format
const generateTrackingId = ()=>`Org-Ref-${Math.floor(100000 + Math.random() * 900000)}`;
const FEEDBACK_KEY = 'accountability_feedback_v3';
const ONE_ON_ONE_HISTORY_KEY = 'one_on_one_history_v3';
const CUSTOM_COACHING_PLANS_KEY = 'custom_coaching_plans_v1';
const PRACTICE_SCENARIOS_KEY = 'practice_scenarios_v1';
// ==========================================
// Mock Data Generation
// ==========================================
const getMockOneOnOneHistory = ()=>{
    const now = new Date();
    const leadName = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"]['Team Lead'].name;
    const employeeName = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"]['Employee'].name;
    return [
        {
            id: 'mock-1on1-1',
            supervisorName: leadName,
            employeeName: employeeName,
            date: new Date(now.setDate(now.getDate() - 14)).toISOString(),
            analysis: {
                supervisorSummary: 'Good session focusing on project blockers. Casey seems motivated but a bit overwhelmed.',
                employeeSummary: 'We discussed the current project challenges and set some clear priorities for the next two weeks.',
                employeeInsights: [
                    "You did a great job articulating the technical challenges you're facing."
                ],
                employeeSwotAnalysis: {
                    strengths: [
                        'Technical Skill'
                    ],
                    weaknesses: [
                        'Time Management'
                    ],
                    opportunities: [
                        'Lead a sub-feature'
                    ],
                    threats: [
                        'Potential burnout'
                    ]
                },
                leadershipScore: 7,
                effectivenessScore: 6,
                strengthsObserved: [
                    {
                        action: 'Active Listening',
                        example: "When Casey spoke, you summarized their points accurately."
                    }
                ],
                coachingRecommendations: [
                    {
                        id: 'rec-1',
                        area: 'Setting Clear Expectations',
                        recommendation: 'Try to define "done" more clearly for tasks.',
                        type: 'Article',
                        resource: 'How to Set Clear Expectations',
                        justification: 'Helps with alignment.',
                        status: 'pending',
                        auditTrail: [],
                        checkIns: [],
                        progress: 0
                    }
                ],
                actionItems: [
                    {
                        id: 'ai-1',
                        owner: 'Employee',
                        task: 'Draft the API spec for the new feature',
                        status: 'completed',
                        completedAt: new Date(now.getDate() - 10).toISOString()
                    }
                ],
                missedSignals: [
                    "Casey mentioned working late twice, which could be a sign of workload issues you didn't explore."
                ],
                criticalCoachingInsight: {
                    summary: "Employee mentioned 'feeling pretty burned out' and supervisor did not explore this critical signal.",
                    reason: "Signs of burnout, if left unaddressed, can lead to decreased productivity, low morale, and attrition. It's critical to address these signals proactively.",
                    severity: 'high',
                    status: 'open'
                },
                biasFairnessCheck: {
                    flag: false
                },
                localizationCompliance: {
                    applied: false
                },
                legalDataCompliance: {
                    piiOmitted: false,
                    privacyRequest: false
                }
            }
        },
        {
            id: 'mock-1on1-2',
            supervisorName: leadName,
            employeeName: employeeName,
            date: new Date(now.setDate(now.getDate() - 7)).toISOString(),
            analysis: {
                supervisorSummary: 'Follow-up session. Casey has made progress on the API spec. We talked about career growth.',
                employeeSummary: 'We reviewed your progress and discussed your interest in taking on more leadership responsibilities.',
                employeeInsights: [
                    "It's great that you're thinking about your long-term career goals."
                ],
                employeeSwotAnalysis: {
                    strengths: [
                        'Proactive'
                    ],
                    weaknesses: [
                        'Public Speaking'
                    ],
                    opportunities: [
                        'Mentor a new hire'
                    ],
                    threats: [
                        'Impatience with process'
                    ]
                },
                leadershipScore: 8,
                effectivenessScore: 8,
                strengthsObserved: [
                    {
                        action: 'Coaching',
                        example: "You asked good, open-ended questions about Casey's career goals."
                    }
                ],
                coachingRecommendations: [
                    {
                        id: 'rec-2',
                        area: 'Delegation',
                        recommendation: 'Consider delegating the next non-critical bug fix to a junior dev.',
                        type: 'Book',
                        resource: 'The One Minute Manager',
                        justification: 'Frees you up for high-level tasks.',
                        status: 'pending',
                        auditTrail: [],
                        checkIns: [],
                        progress: 0
                    }
                ],
                actionItems: [
                    {
                        id: 'ai-2',
                        owner: 'Supervisor',
                        task: 'Identify a low-risk task for Casey to lead.',
                        status: 'pending'
                    }
                ],
                missedSignals: [],
                biasFairnessCheck: {
                    flag: false
                },
                localizationCompliance: {
                    applied: false
                },
                legalDataCompliance: {
                    piiOmitted: false,
                    privacyRequest: false
                }
            }
        }
    ];
};
const getMockPracticeScenarios = ()=>{
    const now = new Date();
    const leadName = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"]['Team Lead'].name;
    const employeeName = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"]['Employee'].name;
    return [
        {
            id: 'mock-score-1',
            assignedBy: 'System',
            assignedTo: 'Team Lead',
            scenario: 'Practice starting a conversation with a report who you suspect is feeling burned out.',
            persona: 'Employee',
            status: 'completed',
            assignedAt: new Date(new Date().setDate(now.getDate() - 10)).toISOString(),
            dueDate: new Date(new Date().setDate(now.getDate() - 5)).toISOString(),
            completedAt: new Date(new Date().setDate(now.getDate() - 4)).toISOString(),
            analysis: {
                scores: {
                    clarity: 8.5,
                    empathy: 7.0,
                    assertiveness: 9.0,
                    overall: 8.2
                },
                strengths: [
                    "You started the conversation clearly and directly.",
                    "Good use of 'I' statements to own your perspective."
                ],
                gaps: [
                    "Could have acknowledged their point of view before restating the goal.",
                    "The closing felt a bit abrupt."
                ],
                annotatedConversation: [
                    {
                        role: 'model',
                        content: "Hey, you wanted to chat?"
                    },
                    {
                        role: 'user',
                        content: "Yes, I wanted to discuss some feedback regarding your communication in team meetings.",
                        annotation: "Great start. This is clear and sets the stage without being alarming.",
                        type: 'positive'
                    },
                    {
                        role: 'model',
                        content: "Oh? I thought I was being clear. What's the issue?"
                    },
                    {
                        role: 'user',
                        content: "You need to be less dismissive of others' ideas.",
                        annotation: "This could be perceived as an attack. Try framing it from your perspective, e.g., 'I\'ve noticed that when others share ideas, the conversation sometimes moves on before we can fully explore them.'",
                        type: 'negative'
                    }
                ]
            }
        },
        {
            id: 'mock-score-2',
            assignedBy: 'AM',
            assignedTo: 'Team Lead',
            scenario: 'Negotiating a deadline extension for the Q3 project with a senior manager.',
            persona: 'Manager',
            status: 'completed',
            assignedAt: new Date(new Date().setDate(now.getDate() - 7)).toISOString(),
            dueDate: new Date(new Date().setDate(now.getDate() - 2)).toISOString(),
            completedAt: new Date(new Date().setDate(now.getDate() - 1)).toISOString(),
            analysis: {
                scores: {
                    clarity: 7.0,
                    empathy: 8.0,
                    assertiveness: 6.5,
                    overall: 7.2
                },
                strengths: [
                    "Excellent job explaining the 'why' behind the delay.",
                    "You remained calm and professional throughout."
                ],
                gaps: [
                    "A specific proposed new deadline would have been more assertive.",
                    "You agreed to the first counter-offer without exploring other options."
                ],
                annotatedConversation: [
                    {
                        role: 'model',
                        content: "We really can't move that deadline, it will impact the whole roadmap."
                    },
                    {
                        role: 'user',
                        content: "I understand it's difficult, and I appreciate the pressure we're under.",
                        annotation: "Good empathy. This validates their concern before you present your own.",
                        type: 'positive'
                    }
                ]
            }
        }
    ];
};
// ==========================================
// Generic Storage Helpers
// ==========================================
const getFromStorage = (key)=>{
    if ("TURBOPACK compile-time truthy", 1) return [];
    "TURBOPACK unreachable";
    let json;
};
const saveToStorage = (key, data)=>{
    if ("TURBOPACK compile-time truthy", 1) return;
    "TURBOPACK unreachable";
};
async function assignPracticeScenario(assignedBy, assignedTo, scenario, persona, dueDate) {
    const allScenarios = getFromStorage(PRACTICE_SCENARIOS_KEY);
    const newScenario = {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        assignedBy,
        assignedTo,
        scenario,
        persona,
        status: 'pending',
        assignedAt: new Date().toISOString(),
        dueDate: dueDate.toISOString()
    };
    allScenarios.unshift(newScenario);
    saveToStorage(PRACTICE_SCENARIOS_KEY, allScenarios);
    if (assignedBy !== 'System') {
        const allFeedback = getFeedbackFromStorage();
        const assignerName = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"][assignedBy]?.name || assignedBy;
        const notification = {
            trackingId: `NETS-${newScenario.id}`,
            subject: `New Practice Scenario Assigned`,
            message: `${assignerName} has assigned you a new practice scenario in the Nets arena: "${scenario}"`,
            submittedAt: new Date(),
            criticality: 'Low',
            status: 'Pending Acknowledgement',
            assignedTo: [
                assignedTo
            ],
            viewed: false,
            auditTrail: [
                {
                    event: 'Notification Created',
                    timestamp: new Date(),
                    actor: 'System',
                    details: `Automated notification for Nets practice scenario assignment.`
                }
            ]
        };
        allFeedback.unshift(notification);
        saveFeedbackToStorage(allFeedback);
    }
}
async function getPracticeScenariosForUser(userRole) {
    const allScenarios = getFromStorage(PRACTICE_SCENARIOS_KEY);
    return allScenarios.filter((s)=>s.assignedTo === userRole && s.status === 'pending');
}
function getCompletedPracticeScenariosForUser(userRole) {
    const allScenarios = getFromStorage(PRACTICE_SCENARIOS_KEY);
    return allScenarios.filter((s)=>s.assignedTo === userRole && s.status === 'completed');
}
async function getPracticeScenariosAssignedByMe(assignerRole) {
    const allScenarios = getFromStorage(PRACTICE_SCENARIOS_KEY);
    return allScenarios.filter((s)=>s.assignedBy === assignerRole);
}
async function completePracticeScenario(input, assignedScenarioId) {
    const response = await fetch('/api/ai/analyze-nets-conversation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze Nets conversation.');
    }
    const analysis = await response.json();
    const allScenarios = getFromStorage(PRACTICE_SCENARIOS_KEY);
    if (assignedScenarioId) {
        const scenarioIndex = allScenarios.findIndex((s)=>s.id === assignedScenarioId);
        if (scenarioIndex !== -1) {
            allScenarios[scenarioIndex].status = 'completed';
            allScenarios[scenarioIndex].completedAt = new Date().toISOString();
            allScenarios[scenarioIndex].analysis = analysis;
        }
    } else {
        const userRole = Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"]).find((u)=>u.name === 'Casey Day')?.role || 'Employee';
        const newCompletedScenario = {
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
            assignedBy: 'System',
            assignedTo: userRole,
            scenario: input.scenario,
            persona: input.persona,
            status: 'completed',
            assignedAt: new Date().toISOString(),
            dueDate: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            analysis: analysis
        };
        allScenarios.unshift(newCompletedScenario);
    }
    saveToStorage(PRACTICE_SCENARIOS_KEY, allScenarios);
    return analysis;
}
async function getOneOnOneHistory() {
    const history = getFromStorage(ONE_ON_ONE_HISTORY_KEY);
    return history.sort((a, b)=>new Date(b.date).getTime() - new Date(a.date).getTime());
}
async function getDeclinedCoachingAreasForSupervisor(supervisorName) {
    const history = await getOneOnOneHistory();
    const declinedAreas = new Set();
    history.forEach((item)=>{
        if (item.supervisorName === supervisorName) {
            item.analysis.coachingRecommendations.forEach((rec)=>{
                // A recommendation is officially declined only after the manager acknowledges it,
                // or if the AM approved the decline and it's pending manager acknowledgement.
                if (rec.status === 'declined' || rec.status === 'pending_manager_acknowledgement') {
                    declinedAreas.add(rec.area);
                }
            });
        }
    });
    return Array.from(declinedAreas);
}
async function getActiveCoachingPlansForUser(userNameOrRole) {
    const userName = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"][userNameOrRole]?.name || userNameOrRole;
    const userRole = Object.keys(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"]).find((r)=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"][r].name === userName) || userNameOrRole;
    const history = await getOneOnOneHistory();
    const customPlans = getFromStorage(CUSTOM_COACHING_PLANS_KEY);
    const orgPlans = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$services$2f$org$2d$coaching$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getOrgCoachingItems"])();
    const activePlans = [];
    // Add plans from 1-on-1 history
    history.forEach((item)=>{
        const isUserInvolved = item.supervisorName === userName || item.employeeName === userName;
        if (isUserInvolved) {
            item.analysis.coachingRecommendations.forEach((rec)=>{
                if (rec.status === 'accepted') {
                    // The person who owns the plan is the supervisor from that 1-on-1
                    if (item.supervisorName === userName) {
                        activePlans.push({
                            historyId: item.id,
                            rec
                        });
                    }
                }
            });
        }
    });
    // Add custom self-directed plans
    customPlans.forEach((rec)=>{
        const planOwnerName = rec.auditTrail?.[0]?.actor;
        if (planOwnerName === userName && rec.status === 'accepted') {
            activePlans.push({
                historyId: null,
                rec
            });
        }
    });
    // Add plans from Org Health coaching
    orgPlans.forEach((item)=>{
        if (item.status === 'Assigned' || item.status === 'In Progress') {
            const audience = item.targetAudience;
            const isForAll = audience.startsWith('All ');
            const targetRole = isForAll ? audience.replace('All ', '') : audience;
            if (audience === userName || isForAll && userRole === targetRole) {
                // Transform OrgCoachingItem to CoachingRecommendation format
                const transformedRec = {
                    id: item.id,
                    area: item.theme,
                    recommendation: item.recommendation,
                    type: 'Other',
                    resource: 'Organizational Initiative',
                    justification: 'This goal was assigned based on a recent org-wide health analysis.',
                    status: 'accepted',
                    progress: 0,
                    startDate: item.assignedAt,
                    endDate: new Date(new Date(item.assignedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    auditTrail: [
                        {
                            event: "Goal Assigned from Org Health",
                            actor: item.assignedBy,
                            timestamp: item.assignedAt,
                            details: `Theme: ${item.theme}`
                        }
                    ]
                };
                activePlans.push({
                    historyId: null,
                    rec: transformedRec
                });
            }
        }
    });
    return activePlans;
}
async function saveOneOnOneHistory(item) {
    const history = await getOneOnOneHistory();
    const newHistoryItem = {
        ...item,
        id: generateTrackingId(),
        assignedTo: []
    };
    history.unshift(newHistoryItem);
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, history);
    return newHistoryItem;
}
async function updateOneOnOneHistoryItem(updatedItem) {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex((h)=>h.id === updatedItem.id);
    if (index !== -1) {
        allHistory[index] = updatedItem;
        saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
    }
}
async function toggleActionItemStatus(historyId, actionItemId) {
    const allHistory = await getOneOnOneHistory();
    const historyIndex = allHistory.findIndex((h)=>h.id === historyId);
    if (historyIndex === -1) return;
    const item = allHistory[historyIndex];
    if (!item.analysis.actionItems) return;
    const actionItemIndex = item.analysis.actionItems.findIndex((a)=>a.id === actionItemId);
    if (actionItemIndex === -1) return;
    const actionItem = item.analysis.actionItems[actionItemIndex];
    if (actionItem.status === 'pending') {
        actionItem.status = 'completed';
        actionItem.completedAt = new Date().toISOString();
    } else {
        actionItem.status = 'pending';
        actionItem.completedAt = undefined;
    }
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}
async function submitSupervisorInsightResponse(historyId, response) {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex((h)=>h.id === historyId);
    if (index !== -1 && allHistory[index].analysis.criticalCoachingInsight) {
        const item = allHistory[index];
        item.analysis.criticalCoachingInsight.supervisorResponse = response;
        item.analysis.criticalCoachingInsight.status = 'pending_employee_acknowledgement';
        if (!item.analysis.criticalCoachingInsight.auditTrail) {
            item.analysis.criticalCoachingInsight.auditTrail = [];
        }
        item.analysis.criticalCoachingInsight.auditTrail.push({
            event: 'Responded',
            timestamp: new Date(),
            actor: item.supervisorName,
            details: response
        });
        saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
    } else {
        throw new Error("Could not find history item or critical insight to update.");
    }
}
async function submitEmployeeAcknowledgement(historyId, acknowledgement, comments, previousStatus) {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex((h)=>h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
        throw new Error("Could not find history item or critical insight to update.");
    }
    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight;
    const fullAcknowledgement = `${acknowledgement}${comments ? ` "${comments}"` : ''}`;
    insight.employeeAcknowledgement = fullAcknowledgement;
    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: 'Acknowledged',
        timestamp: new Date(),
        actor: item.employeeName,
        details: fullAcknowledgement
    });
    const wasAmResponse = insight.auditTrail?.some((e)=>e.event === 'AM Responded to Employee');
    const wasRetry = insight.auditTrail?.some((e)=>e.event === 'Supervisor Retry Action');
    const wasManagerAction = insight.auditTrail?.some((e)=>e.event === 'Manager Resolution');
    const wasHrAction = insight.auditTrail?.some((e)=>e.event === 'HR Resolution');
    const currentAssignees = new Set(item.assignedTo || []);
    if (acknowledgement === "The concern was fully addressed to my satisfaction.") {
        insight.status = 'resolved';
        item.assignedTo = Array.from(currentAssignees); // Keep current assignees for history
    } else if (wasHrAction) {
        insight.status = 'pending_final_hr_action';
        currentAssignees.add('HR Head');
        item.assignedTo = Array.from(currentAssignees);
    } else if (wasManagerAction) {
        insight.status = 'pending_hr_review';
        currentAssignees.add('HR Head');
        item.assignedTo = Array.from(currentAssignees);
    } else if (wasRetry || wasAmResponse) {
        insight.status = 'pending_manager_review';
        currentAssignees.add('Manager');
        item.assignedTo = Array.from(currentAssignees);
    } else {
        insight.status = 'pending_am_review';
        currentAssignees.add('AM');
        item.assignedTo = Array.from(currentAssignees);
    }
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}
async function submitAmCoachingNotes(historyId, actor, notes) {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex((h)=>h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
        throw new Error("Could not find history item or critical insight to update.");
    }
    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight;
    insight.status = 'pending_supervisor_retry';
    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: 'AM Coaching Notes',
        timestamp: new Date(),
        actor: actor,
        details: notes
    });
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}
async function submitAmDirectResponse(historyId, actor, notes) {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex((h)=>h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
        throw new Error("Could not find history item or critical insight to update.");
    }
    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight;
    // Send back to employee for acknowledgement
    insight.status = 'pending_employee_acknowledgement';
    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: 'AM Responded to Employee',
        timestamp: new Date(),
        actor: actor,
        details: notes
    });
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}
async function escalateToManager(historyId, actor, notes) {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex((h)=>h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
        throw new Error("Could not find history item or critical insight to update.");
    }
    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight;
    insight.status = 'pending_manager_review';
    const currentAssignees = new Set(item.assignedTo || []);
    currentAssignees.add('Manager');
    item.assignedTo = Array.from(currentAssignees);
    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: 'Escalated by AM',
        timestamp: new Date(),
        actor: actor,
        details: `Case escalated to Manager for direct intervention. Notes: ${notes}`
    });
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}
async function submitSupervisorRetry(historyId, retryNotes) {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex((h)=>h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
        throw new Error("Could not find history item or critical insight to update.");
    }
    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight;
    // Reset for the next acknowledgement round
    insight.status = 'pending_employee_acknowledgement';
    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: 'Supervisor Retry Action',
        timestamp: new Date(),
        actor: item.supervisorName,
        details: retryNotes
    });
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}
async function submitManagerResolution(historyId, actor, notes) {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex((h)=>h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
        throw new Error("Could not find history item or critical insight to update.");
    }
    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight;
    // Send back to employee for acknowledgement
    insight.status = 'pending_employee_acknowledgement';
    // Don't unassign, keep in manager's view
    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: 'Manager Resolution',
        timestamp: new Date(),
        actor: actor,
        details: notes
    });
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}
async function submitHrResolution(historyId, actor, notes) {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex((h)=>h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
        throw new Error("Could not find history item or critical insight to update.");
    }
    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight;
    // Send back to employee for one last acknowledgement
    insight.status = 'pending_employee_acknowledgement';
    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: 'HR Resolution',
        timestamp: new Date(),
        actor: actor,
        details: notes
    });
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}
async function submitFinalHrDecision(historyId, actor, decision, notes) {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex((h)=>h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
        throw new Error("Could not find history item or critical insight to update.");
    }
    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight;
    // This is the end of the line. Mark as resolved.
    insight.status = 'resolved';
    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: decision,
        timestamp: new Date(),
        actor: actor,
        details: notes
    });
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}
async function updateCoachingRecommendationStatus(recommendationId, status, data) {
    let allHistory = await getOneOnOneHistory();
    const historyIndex = allHistory.findIndex((h)=>h.id === data?.historyId);
    if (historyIndex === -1) throw new Error("History item not found.");
    const item = allHistory[historyIndex];
    const recIndex = item.analysis.coachingRecommendations.findIndex((rec)=>rec.id === recommendationId);
    if (recIndex === -1) throw new Error("Coaching recommendation not found.");
    const recommendation = item.analysis.coachingRecommendations[recIndex];
    const supervisorName = item.supervisorName;
    // Initialize audit trail if it doesn't exist
    if (!recommendation.auditTrail) {
        recommendation.auditTrail = [];
    }
    if (status === 'accepted') {
        recommendation.status = 'accepted';
        recommendation.startDate = data?.startDate;
        recommendation.endDate = data?.endDate;
        recommendation.progress = 0; // Initialize progress
        recommendation.auditTrail.push({
            event: 'Recommendation Accepted',
            actor: supervisorName,
            timestamp: new Date().toISOString(),
            details: `Plan set from ${data?.startDate ? new Date(data.startDate).toLocaleDateString() : 'N/A'} to ${data?.endDate ? new Date(data.endDate).toLocaleDateString() : 'N/A'}.`
        });
        // Create notification for AM and Manager
        const allFeedback = getFeedbackFromStorage();
        const notification = {
            trackingId: generateTrackingId(),
            subject: `Development Plan Started by ${supervisorName}`,
            message: `${supervisorName} has accepted a coaching recommendation and started a new development plan for the area: "${recommendation.area}".\n\n**Recommendation:** ${recommendation.recommendation}\n**Resource:** ${recommendation.type} - "${recommendation.resource}"\n**Timeline:** ${data?.startDate ? new Date(data.startDate).toLocaleDateString() : 'N/A'} to ${data?.endDate ? new Date(data.endDate).toLocaleDateString() : 'NA'}.`,
            submittedAt: new Date(),
            criticality: 'Low',
            status: 'Pending Acknowledgement',
            assignedTo: [
                'AM',
                'Manager'
            ],
            viewed: false,
            auditTrail: [
                {
                    event: 'Notification Created',
                    timestamp: new Date(),
                    actor: 'System',
                    details: `Automated notification for accepted coaching plan by ${supervisorName}.`
                }
            ]
        };
        allFeedback.unshift(notification);
        saveFeedbackToStorage(allFeedback);
    } else if (status === 'declined') {
        recommendation.status = 'pending_am_review';
        recommendation.rejectionReason = data?.reason;
        recommendation.auditTrail.push({
            event: 'Recommendation Declined by Supervisor',
            actor: supervisorName,
            timestamp: new Date().toISOString(),
            details: `Reason: ${data?.reason}`
        });
    }
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}
async function addCustomCoachingPlan(actor, data) {
    const supervisorName = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"][actor]?.name;
    if (!supervisorName) throw new Error("Invalid actor role provided.");
    const allCustomPlans = getFromStorage(CUSTOM_COACHING_PLANS_KEY);
    const newCustomRecommendation = {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        area: data.area,
        recommendation: `Custom goal added by user: ${data.resource}`,
        example: "N/A (user-added goal)",
        type: "Other",
        resource: data.resource,
        justification: "This is a self-directed development goal.",
        status: "accepted",
        rejectionReason: undefined,
        auditTrail: [
            {
                event: "Custom Goal Created",
                actor: supervisorName,
                timestamp: new Date().toISOString(),
                details: "User added a new self-directed development goal."
            }
        ],
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        progress: 0,
        checkIns: []
    };
    allCustomPlans.unshift(newCustomRecommendation);
    saveToStorage(CUSTOM_COACHING_PLANS_KEY, allCustomPlans);
}
async function updateCoachingProgress(historyId, recommendationId, progress) {
    if (historyId) {
        // It's a recommendation from a 1-on-1
        let allHistory = await getOneOnOneHistory();
        const historyIndex = allHistory.findIndex((h)=>h.id === historyId);
        if (historyIndex === -1) throw new Error("History item not found.");
        const item = allHistory[historyIndex];
        const recIndex = item.analysis.coachingRecommendations.findIndex((rec)=>rec.id === recommendationId);
        if (recIndex === -1) throw new Error("Coaching recommendation not found.");
        const recommendation = item.analysis.coachingRecommendations[recIndex];
        recommendation.progress = progress;
        saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
    } else {
        // It's a custom plan
        let allCustomPlans = getFromStorage(CUSTOM_COACHING_PLANS_KEY);
        const recIndex = allCustomPlans.findIndex((rec)=>rec.id === recommendationId);
        if (recIndex !== -1) {
            allCustomPlans[recIndex].progress = progress;
            saveToStorage(CUSTOM_COACHING_PLANS_KEY, allCustomPlans);
        } else {
            // It might be an org coaching plan
            let orgPlans = getFromStorage('org_coaching_items_v1'); // Use literal key
            const orgPlanIndex = orgPlans.findIndex((p)=>p.id === recommendationId);
            if (orgPlanIndex !== -1) {
                // There's no progress field on OrgCoachingItem, so this is a conceptual no-op for now
                // In a real app, you'd update its status.
                console.log(`Updating progress for org plan ${recommendationId} - currently a no-op.`);
            } else {
                throw new Error("Custom or Org coaching plan not found.");
            }
        }
    }
}
async function addCoachingCheckIn(historyId, recommendationId, notes) {
    const newCheckIn = {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        date: new Date().toISOString(),
        notes: notes
    };
    if (historyId) {
        let allHistory = await getOneOnOneHistory();
        const historyIndex = allHistory.findIndex((h)=>h.id === historyId);
        if (historyIndex === -1) throw new Error("History item not found.");
        const item = allHistory[historyIndex];
        const recIndex = item.analysis.coachingRecommendations.findIndex((rec)=>rec.id === recommendationId);
        if (recIndex === -1) throw new Error("Coaching recommendation not found.");
        const recommendation = item.analysis.coachingRecommendations[recIndex];
        if (!recommendation.checkIns) recommendation.checkIns = [];
        recommendation.checkIns.push(newCheckIn);
        saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
    } else {
        let allCustomPlans = getFromStorage(CUSTOM_COACHING_PLANS_KEY);
        const recIndex = allCustomPlans.findIndex((rec)=>rec.id === recommendationId);
        if (recIndex !== -1) {
            const recommendation = allCustomPlans[recIndex];
            if (!recommendation.checkIns) recommendation.checkIns = [];
            recommendation.checkIns.push(newCheckIn);
            saveToStorage(CUSTOM_COACHING_PLANS_KEY, allCustomPlans);
        } else {
            let orgPlans = getFromStorage('org_coaching_items_v1');
            const orgPlanIndex = orgPlans.findIndex((p)=>p.id === recommendationId);
            if (orgPlanIndex !== -1) {
                // Org plans don't have check-ins in this model, so this is a conceptual no-op.
                // In a real app, we might log this differently.
                console.log(`Adding check-in for org plan ${recommendationId} - currently a no-op.`);
            } else {
                throw new Error("Custom or Org coaching plan not found.");
            }
        }
    }
}
async function reviewCoachingRecommendationDecline(historyId, recommendationId, amActor, approved, amNotes) {
    let allHistory = await getOneOnOneHistory();
    const historyIndex = allHistory.findIndex((h)=>h.id === historyId);
    if (historyIndex === -1) throw new Error("History item not found.");
    const item = allHistory[historyIndex];
    const recIndex = item.analysis.coachingRecommendations.findIndex((rec)=>rec.id === recommendationId);
    if (recIndex === -1) throw new Error("Coaching recommendation not found.");
    const recommendation = item.analysis.coachingRecommendations[recIndex];
    if (!recommendation.auditTrail) {
        recommendation.auditTrail = [];
    }
    if (approved) {
        recommendation.status = 'pending_manager_acknowledgement'; // Escalate to manager for FYI
        recommendation.auditTrail.push({
            event: "Decline Approved by AM",
            actor: amActor,
            timestamp: new Date().toISOString(),
            details: `AM approved decline. Notes: ${amNotes}`
        });
    } else {
        recommendation.status = 'accepted';
        recommendation.progress = 0;
        const now = new Date();
        const endDate = new Date(new Date().setDate(now.getDate() + 30)); // Default 30 day timeline
        recommendation.startDate = now.toISOString();
        recommendation.endDate = endDate.toISOString();
        recommendation.auditTrail.push({
            event: "Decline Denied by AM",
            actor: amActor,
            timestamp: new Date().toISOString(),
            details: `AM upheld AI recommendation and created a mandatory development plan. Notes: ${amNotes}`
        });
    }
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}
async function acknowledgeDeclinedRecommendation(historyId, recommendationId, managerActor) {
    let allHistory = await getOneOnOneHistory();
    const historyIndex = allHistory.findIndex((h)=>h.id === historyId);
    if (historyIndex === -1) throw new Error("History item not found.");
    const item = allHistory[historyIndex];
    const recIndex = item.analysis.coachingRecommendations.findIndex((rec)=>rec.id === recommendationId);
    if (recIndex === -1) throw new Error("Coaching recommendation not found.");
    const recommendation = item.analysis.coachingRecommendations[recIndex];
    recommendation.status = 'declined'; // Final status
    if (!recommendation.auditTrail) {
        recommendation.auditTrail = [];
    }
    recommendation.auditTrail.push({
        event: "Manager Acknowledged Declined Recommendation",
        actor: managerActor,
        timestamp: new Date().toISOString(),
        details: "Manager acknowledged the AM's approval of the decline. This recommendation is now closed."
    });
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}
const getFeedbackFromStorage = ()=>{
    const feedback = getFromStorage(FEEDBACK_KEY);
    return feedback.map((c)=>({
            ...c,
            submittedAt: new Date(c.submittedAt),
            auditTrail: c.auditTrail?.map((a)=>({
                    ...a,
                    timestamp: new Date(a.timestamp)
                }))
        }));
};
const saveFeedbackToStorage = (feedback)=>{
    saveToStorage(FEEDBACK_KEY, feedback);
};
async function getAllFeedback() {
    return getFeedbackFromStorage();
}
async function getFeedbackById(trackingId) {
    const allFeedback = await getAllFeedback();
    return allFeedback.find((f)=>f.trackingId === trackingId) || null;
}
async function saveFeedback(feedback, append = false) {
    if (append) {
        const existingFeedback = getFeedbackFromStorage();
        saveFeedbackToStorage([
            ...feedback,
            ...existingFeedback
        ]);
    } else {
        saveFeedbackToStorage(feedback);
    }
}
async function resolveFeedback(trackingId, actor, resolution) {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex((f)=>f.trackingId === trackingId);
    if (feedbackIndex === -1) return;
    const feedback = allFeedback[feedbackIndex];
    // For general notifications and leadership pulses, we'll mark them as 'Closed' to keep them in history.
    if (feedback.status === 'Pending Acknowledgement' || feedback.status === 'Pending Manager Action') {
        feedback.status = 'Closed';
    } else {
        feedback.status = 'Resolved';
    }
    feedback.resolution = resolution;
    // We keep assignedTo so we can filter by who acknowledged it in history views.
    // feedback.assignedTo = []; 
    feedback.auditTrail?.push({
        event: 'Acknowledged',
        timestamp: new Date(),
        actor,
        details: resolution,
        isPublic: true
    });
    saveFeedbackToStorage(allFeedback);
}
async function submitEmployeeFeedbackAcknowledgement(trackingId, accepted, comments) {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex((f)=>f.trackingId === trackingId);
    if (feedbackIndex === -1) return;
    const item = allFeedback[feedbackIndex];
    const actor = item.submittedBy || 'Anonymous';
    const relevantEvents = [
        'Resolution Submitted',
        'HR Resolution Submitted',
        'HR Responded to Retaliation Claim',
        'Manager Resolution'
    ];
    const lastResponderEvent = item.auditTrail?.slice().reverse().find((e)=>relevantEvents.includes(e.event));
    const lastResponder = lastResponderEvent?.actor;
    const currentAssignees = new Set(item.assignedTo || []);
    if (accepted) {
        item.status = 'Resolved';
        item.resolution = item.supervisorUpdate;
        item.auditTrail?.push({
            event: 'Employee Accepted Resolution',
            timestamp: new Date(),
            actor: actor,
            details: `Resolution accepted.${comments ? ` "${comments}"` : ''}`
        });
        item.auditTrail?.push({
            event: 'Resolved',
            timestamp: new Date(),
            actor: actor,
            details: 'Case resolved after employee acknowledgment.'
        });
    } else {
        const escalationDetails = `Resolution not accepted.${comments ? ` "${comments}"` : ''}`;
        let nextAssignee = undefined;
        let nextStatus = 'Pending Manager Action';
        const lastResponderRole = Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"]).find((u)=>u.name === lastResponder)?.role || lastResponder;
        if (item.criticality === 'Retaliation Claim' || lastResponderEvent?.event === 'HR Resolution Submitted' || lastResponderRole === 'HR Head') {
            item.status = 'Final Disposition Required';
            currentAssignees.add('HR Head');
            item.auditTrail?.push({
                event: 'Final Disposition Required',
                timestamp: new Date(),
                actor: 'System',
                details: 'Employee rejected HR resolution. Final disposition is required from HR Head.'
            });
        } else if (lastResponderRole === 'Team Lead') {
            nextAssignee = 'AM';
            nextStatus = 'Pending Manager Action';
        } else if (lastResponderRole === 'AM') {
            nextAssignee = 'Manager';
            nextStatus = 'Pending Manager Action';
        } else if (lastResponderRole === 'Manager') {
            nextAssignee = 'HR Head';
            nextStatus = 'Pending HR Action';
        }
        if (nextAssignee) {
            item.status = nextStatus;
            currentAssignees.add(nextAssignee);
            item.auditTrail?.push({
                event: 'Employee Escalated Concern',
                timestamp: new Date(),
                actor: actor,
                details: `Concern escalated to ${nextAssignee}. ${escalationDetails}`
            });
        }
    }
    item.assignedTo = Array.from(currentAssignees);
    saveFeedbackToStorage(allFeedback);
}
async function getAggregatedActionItems(role) {
    const allItems = [];
    const currentUserName = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"][role]?.name;
    if (!currentUserName) return [];
    // 1. From 1-on-1s
    const history = await getOneOnOneHistory();
    history.forEach((h)=>{
        if (h.analysis.actionItems) {
            h.analysis.actionItems.forEach((ai)=>{
                const ownerRole = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRoleByName"])(ai.owner);
                if (ownerRole === role && ai.status === 'pending') {
                    allItems.push({
                        ...ai,
                        sourceType: '1-on-1',
                        source: `1-on-1 with ${h.supervisorName === currentUserName ? h.employeeName : h.supervisorName}`,
                        dueDate: new Date(new Date(h.date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
                    });
                }
            });
        }
    });
    // 2. From Coaching Plans
    const coachingPlans = await getActiveCoachingPlansForUser(role);
    coachingPlans.forEach((plan)=>{
        allItems.push({
            id: `coach-${plan.rec.id}`,
            owner: role,
            task: `Continue working on coaching goal: ${plan.rec.area}`,
            status: 'pending',
            sourceType: 'Coaching',
            source: `Plan: ${plan.rec.resource}`,
            dueDate: plan.rec.endDate
        });
    });
    // In a real app, you would also fetch from training programs etc.
    // For now, this is a good start.
    return allItems.sort((a, b)=>new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime());
}
async function getActionItemsForEmployee(employeeName) {
    const allItems = [];
    const employeeRole = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRoleByName"])(employeeName);
    // From 1-on-1s
    const history = await getOneOnOneHistory();
    history.forEach((h)=>{
        if (h.employeeName === employeeName && h.analysis.actionItems) {
            h.analysis.actionItems.forEach((ai)=>{
                // Show all items, not just pending
                allItems.push({
                    ...ai,
                    sourceType: '1-on-1',
                    source: `1-on-1 with ${h.supervisorName}`,
                    dueDate: new Date(new Date(h.date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
                });
            });
        }
    });
    // From Coaching Plans (if the employee can have them)
    if (employeeRole) {
        const coachingPlans = await getActiveCoachingPlansForUser(employeeRole);
        coachingPlans.forEach((plan)=>{
            allItems.push({
                id: `coach-${plan.rec.id}`,
                owner: employeeRole,
                task: `Work on coaching goal: ${plan.rec.area}`,
                status: 'pending',
                sourceType: 'Coaching',
                source: `Plan: ${plan.rec.resource}`,
                dueDate: plan.rec.endDate
            });
        });
    }
    return allItems.sort((a, b)=>{
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.dueDate || 0).getTime() - new Date(a.dueDate || 0).getTime();
    });
}
async function getTeamPulse() {
    const history = await getOneOnOneHistory();
    const recentRatings = history.slice(0, 20) // Look at the last 20 1-on-1s for the pulse
    .map((h)=>parseInt(h.analysis.employeeSwotAnalysis?.opportunities[0] || h.analysis.leadershipScore.toString(), 10)) // Using SWOT as a proxy for growthRating
    .filter((r)=>!isNaN(r));
    if (recentRatings.length === 0) return 3.5; // Default pulse if no data
    const average = recentRatings.reduce((sum, current)=>sum + current, 0) / recentRatings.length;
    return average;
}
async function getTeamActionItemStatus(supervisorRole) {
    const history = await getOneOnOneHistory();
    const supervisorName = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"][supervisorRole]?.name;
    const teamMembers = {};
    const now = new Date();
    history.forEach((item)=>{
        // Find sessions where the current user was the supervisor
        if (item.supervisorName === supervisorName) {
            const employeeName = item.employeeName;
            if (!teamMembers[employeeName]) {
                teamMembers[employeeName] = {
                    open: 0,
                    overdue: 0
                };
            }
            item.analysis.actionItems?.forEach((action)=>{
                if (action.status === 'pending') {
                    teamMembers[employeeName].open++;
                    // Mock due date is 1 week after the 1-on-1
                    const dueDate = new Date(new Date(item.date).getTime() + 7 * 24 * 60 * 60 * 1000);
                    if (now > dueDate) {
                        teamMembers[employeeName].overdue++;
                    }
                }
            });
        }
    });
    return teamMembers;
}
async function getTeamGrowthHighlights(supervisorRole) {
    const history = await getOneOnOneHistory();
    const supervisorName = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"][supervisorRole]?.name;
    const growthMap = {};
    history.filter((item)=>item.supervisorName === supervisorName).sort((a, b)=>new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort oldest to newest
    .forEach((item)=>{
        const employeeName = item.employeeName;
        if (!growthMap[employeeName]) {
            growthMap[employeeName] = [];
        }
        growthMap[employeeName].push(item.analysis.effectivenessScore);
    });
    const highlights = Object.entries(growthMap).map(([employeeName, scores])=>{
        if (scores.length < 2) return {
            employeeName,
            growth: 0
        };
        const latestScore = scores[scores.length - 1];
        const previousScore = scores[scores.length - 2];
        return {
            employeeName,
            growth: latestScore - previousScore
        };
    }).filter((item)=>item.growth > 0).sort((a, b)=>b.growth - a.growth).slice(0, 3); // Get top 3 growers
    return highlights;
}
async function getTeamNetsScores(supervisorRole) {
    const allPractice = getFromStorage(PRACTICE_SCENARIOS_KEY);
    const supervisorName = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"][supervisorRole]?.name;
    const allHistory = await getOneOnOneHistory();
    // Simple hierarchy: Team Lead manages Employee
    const teamMemberRoles = [];
    if (supervisorRole === 'Team Lead') {
        teamMemberRoles.push('Employee');
    }
    const teamScores = {};
    allPractice.forEach((practice)=>{
        if (teamMemberRoles.includes(practice.assignedTo) && practice.status === 'completed' && practice.analysis) {
            const memberName = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"][practice.assignedTo]?.name;
            if (!teamScores[memberName]) {
                teamScores[memberName] = {
                    totalScore: 0,
                    count: 0
                };
            }
            teamScores[memberName].totalScore += practice.analysis.scores.overall;
            teamScores[memberName].count++;
        }
    });
    const result = {};
    for(const memberName in teamScores){
        result[memberName] = {
            average: teamScores[memberName].totalScore / teamScores[memberName].count,
            sessions: teamScores[memberName].count
        };
    }
    return result;
}
async function getAiInterventionLog(role) {
    const history = await getOneOnOneHistory();
    const log = [];
    const SLA_HOURS = 48;
    history.forEach((item)=>{
        if (item.analysis.criticalCoachingInsight) {
            const insight = item.analysis.criticalCoachingInsight;
            const creationEvent = insight.auditTrail?.find((e)=>e.event === 'Critical Insight Identified');
            const responseEvent = insight.auditTrail?.find((e)=>e.event === 'Responded');
            if (creationEvent) {
                let responseStatus = 'Unresolved';
                if (responseEvent) {
                    const creationTime = new Date(creationEvent.timestamp).getTime();
                    const responseTime = new Date(responseEvent.timestamp).getTime();
                    const diffHours = (responseTime - creationTime) / (1000 * 60 * 60);
                    responseStatus = diffHours <= SLA_HOURS ? 'Timely' : 'Delayed';
                }
                log.push({
                    id: item.id,
                    date: item.date,
                    summary: insight.summary,
                    employeeName: item.employeeName,
                    responseStatus: responseStatus
                });
            }
        }
    });
    return log.slice(0, 5); // Return latest 5
}
async function getManagerDevelopmentMapData(amRole) {
    const history = await getOneOnOneHistory();
    const teamLeadRole = 'Team Lead'; // AM manages Team Leads
    const teamLeadName = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"][teamLeadRole].name;
    const leadScores = history.filter((item)=>item.supervisorName === teamLeadName).map((item)=>({
            date: new Date(item.date),
            score: item.analysis.leadershipScore
        })).sort((a, b)=>a.date.getTime() - b.date.getTime());
    if (leadScores.length < 2) {
        return [
            {
                name: teamLeadName,
                role: teamLeadRole,
                leadershipScore: leadScores[0]?.score || 5,
                trajectory: 'stable'
            }
        ];
    }
    const latestScore = leadScores[leadScores.length - 1].score;
    const previousScore = leadScores[leadScores.length - 2].score;
    let trajectory = 'stable';
    if (latestScore > previousScore) trajectory = 'positive';
    if (latestScore < previousScore) trajectory = 'negative';
    return [
        {
            name: teamLeadName,
            role: teamLeadRole,
            leadershipScore: latestScore,
            trajectory: trajectory
        }
    ];
}
async function getTeamCoachingQualityIndex(amRole) {
    const history = await getOneOnOneHistory();
    const qualityMap = {};
    history.forEach((item)=>{
        // For AM, we're looking at their direct reports, the Team Leads
        const supervisorName = item.supervisorName;
        if (!qualityMap[supervisorName]) {
            qualityMap[supervisorName] = {
                totalScore: 0,
                count: 0
            };
        }
        qualityMap[supervisorName].totalScore += item.analysis.effectivenessScore;
        qualityMap[supervisorName].count++;
    });
    return Object.entries(qualityMap).map(([teamLeadName, data])=>({
            teamLeadName,
            qualityScore: data.totalScore / data.count * 10,
            totalSessions: data.count
        })).filter((item)=>item.teamLeadName === __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"]['Team Lead'].name); // Only show Team Lead for this demo
}
async function getReadinessPipelineData(amRole) {
    // This is heavily mocked as it requires complex logic
    return {
        employeeToLead: 65,
        leadToAm: 40
    };
}
async function getEscalationInsights(amRole) {
    // This is mocked based on common HR themes
    return [
        {
            theme: 'Lack of Clarity in Feedback',
            recommendation: 'Reinforce STAR method training for giving specific, behavioral feedback.',
            count: 3
        },
        {
            theme: 'Unaddressed Career Growth Signals',
            recommendation: 'Coach leads to proactively ask about career aspirations in every 1-on-1.',
            count: 2
        }
    ];
}
}}),
"[project]/frontend/src/services/interviewer-lab-service.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * @fileOverview A service for managing Interviewer Lab nominations and progress.
 */ __turbopack_context__.s({
    "completeModule": (()=>completeModule),
    "getNominationForUser": (()=>getNominationForUser),
    "getNominationsForManager": (()=>getNominationsForManager),
    "nominateUser": (()=>nominateUser),
    "saveLessonResult": (()=>saveLessonResult),
    "savePostAssessment": (()=>savePostAssessment),
    "savePreAssessment": (()=>savePreAssessment)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v4.js [app-ssr] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/backend/src/lib/role-mapping.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$services$2f$feedback$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/services/feedback-service.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const INTERVIEWER_LAB_KEY = 'interviewer_lab_nominations_v4'; // Incremented version
// ==========================================
// Generic Storage Helpers
// ==========================================
const getFromStorage = (key)=>{
    if ("TURBOPACK compile-time truthy", 1) return [];
    "TURBOPACK unreachable";
    const json = undefined;
};
const saveToStorage = (key, data)=>{
    if ("TURBOPACK compile-time truthy", 1) return;
    "TURBOPACK unreachable";
};
const getInitialModules = ()=>[
        {
            id: 'm1',
            title: "Interview Foundations",
            description: "Learn the fundamentals of conducting a structured and professional interview.",
            duration: 30,
            isCompleted: false,
            lessons: [
                {
                    id: 'l1-1',
                    title: 'Why Structured Interviews Matter',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '👋 Coach Intro',
                            content: "Most managers think they’re great at interviewing.\n\nBut research says otherwise: unstructured interviews are only about 20% predictive of job success. That’s barely better than flipping a coin.\n\nThe problem? Unstructured interviews:\n- Drift into small talk and gut feelings.\n- Let unconscious bias creep in.\n- Miss important, consistent evaluation points.\n\nSo how do world-class companies solve this? With structured interviews. Think of them as your playbook for fair, consistent, high-quality hiring."
                        },
                        {
                            type: 'script',
                            title: '📊 Teaching Moment',
                            content: "Structured interviews double predictive accuracy — about 40% predictive. That might not sound like much, but in hiring, it’s massive.\n\nHere’s an analogy:\n\nImagine you’re scouting athletes. If you let each coach ask random questions, one might ask about diet, another about favorite music. Results are all over the place.\n\nBut if everyone runs the same timed sprint test, you can compare apples to apples.\n\nThat’s the essence of structure: same test, fairer results, better hires."
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: "Let me share a quick story.\n\nA retail company once let managers run their own unstructured interviews. The result? High turnover, inconsistent hiring, and even a lawsuit around discriminatory questioning.\n\nWhen they switched to structured interviews — same questions, standardized scoring — turnover dropped by 25% and legal risk disappeared.\n\nLesson: Structure isn’t bureaucracy. It’s protection + performance."
                        },
                        {
                            type: 'quiz_mcq',
                            question: "Which of these is a proven benefit of structured interviews?",
                            options: [
                                "They allow managers to improvise fully.",
                                "They ensure fairness and reduce legal risk.",
                                "They focus on casual conversation.",
                                "They guarantee every candidate accepts an offer."
                            ],
                            correctAnswer: "They ensure fairness and reduce legal risk.",
                            feedback: {
                                correct: "Exactly! Fairness and compliance are the backbone of structured interviews.",
                                incorrect: "Not quite. Improvisation and small talk can feel nice, but they don’t predict performance or protect you legally. The right answer is B."
                            }
                        },
                        {
                            type: 'journal',
                            prompt: "Now, let’s apply this.\n\nThink of a time you were in an interview — either giving it or sitting as a candidate.\n\nWas it structured or unstructured?\n\nHow did it feel — fair, consistent, or random?\n\nWhat did you learn about the effectiveness of that style?\n\nWrite 2–3 sentences in your notes. This reflection primes your brain to connect the concept to real experience."
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: "Here’s what I want you to remember:\n\nUnstructured = random, risky, biased.\n\nStructured = fair, consistent, predictive.\n\nCompanies that use structured interviews not only hire better, they protect themselves legally and build trust with candidates.\n\nYour role as an interviewer is not just to ‘chat.’ It’s to create a reliable system that helps your team win. Structure is that system."
                        },
                        {
                            type: 'journal',
                            prompt: "Want to go deeper? Try this optional stretch activity:\n\nWrite down 3 interview questions you’ve asked (or been asked).\n\nAsk yourself: Could these be standardized and asked to every candidate?\n\nHow would that change fairness and consistency?\n\nBring these to our next lesson — we’ll build on them."
                        }
                    ]
                },
                {
                    id: 'l1-2',
                    title: 'Core Principles of Structured Interviewing',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: "Structured interviews aren’t just about asking the same questions. They’re built on 3 principles:\n\nConsistency — ask the same core questions.\n\nRelevance — questions tied to the job role.\n\nScoring — rate answers against clear criteria."
                        },
                        {
                            type: 'script',
                            title: '📊 Teaching Moment / Analogy',
                            content: "Think of it like refereeing a game.\n\nEvery player follows the same rules.\nScores are based on agreed standards.\n\nThat’s how you keep the game — and the hiring process — fair."
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: "A financial services firm introduced structured scoring rubrics. Managers reported more confidence in hiring decisions because they had objective data to back them up."
                        },
                        {
                            type: 'quiz_mcq',
                            question: "Which principle ensures fairness across candidates?",
                            options: [
                                "Consistency",
                                "Small talk",
                                "Improvisation",
                                "Intuition"
                            ],
                            correctAnswer: "Consistency",
                            feedback: {
                                correct: "Yes! Consistency = fairness.",
                                incorrect: "The answer is A. Consistency is the foundation of fairness."
                            }
                        },
                        {
                            type: 'journal',
                            prompt: "Which of these principles do you personally find hardest: consistency, relevance, or scoring? Why?"
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: "Consistency makes it fair. Relevance makes it useful. Scoring makes it actionable."
                        },
                        {
                            type: 'journal',
                            prompt: "🚀 Stretch Activity\n\nPick one job in your team. Write 2 consistent, relevant questions you could ask every candidate for that role."
                        }
                    ]
                },
                {
                    id: 'l1-3',
                    title: 'Designing Structured Interview Questions',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: "Not all questions are created equal. Structured interviews rely on behavioral (‘Tell me about a time…’) and situational (‘What would you do if…’) questions. These dig into real skills, not just surface-level talk."
                        },
                        {
                            type: 'script',
                            title: '📊 Teaching Moment / Analogy',
                            content: "Think of it like testing a driver. Asking ‘Are you good at driving?’ is useless. Making them take a road test shows you the truth.\n\nGood questions = road test for skills."
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: "A tech company replaced vague questions (‘What’s your greatest strength?’) with behavioral ones (‘Tell me about a time you solved a tough bug’). Result: much stronger signal about candidate skills."
                        },
                        {
                            type: 'quiz_mcq',
                            question: "Which of these is a behavioral interview question?",
                            options: [
                                "What’s your favorite movie?",
                                "Tell me about a time you led a difficult project.",
                                "Do you consider yourself detail-oriented?",
                                "How would you feel about working weekends?"
                            ],
                            correctAnswer: "Tell me about a time you led a difficult project.",
                            feedback: {
                                correct: "Correct — behavioral questions use past experiences as evidence.",
                                incorrect: "The answer is B. Behavioral questions start with ‘Tell me about a time…’"
                            }
                        },
                        {
                            type: 'journal',
                            prompt: "Think of a role you hire for. What’s one strong behavioral question you could use?"
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: "Structured interviews use job-relevant, evidence-based questions. Behavior predicts future behavior."
                        },
                        {
                            type: 'journal',
                            prompt: "🚀 Stretch Activity\n\nWrite one behavioral and one situational question for your next role. Save them for your question bank."
                        }
                    ]
                },
                {
                    id: 'l1-4',
                    title: 'Scoring and Evaluation Rubrics',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: "Even the best questions fail without clear scoring. Structured interviews use rubrics: 1–5 scales with defined behaviors at each level."
                        },
                        {
                            type: 'script',
                            title: '📊 Teaching Moment / Analogy',
                            content: "Imagine grading an essay without a rubric. One teacher gives it an A, another a C. That’s chaos. A rubric makes evaluation fair and repeatable."
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: "A healthcare company trained managers to use 1–5 rubrics. Result: interviewer agreement went up 40%. That means less debate, faster decisions."
                        },
                        {
                            type: 'quiz_mcq',
                            question: "Why are rubrics important?",
                            options: [
                                "They allow gut-based scoring",
                                "They reduce subjectivity",
                                "They replace job descriptions",
                                "They guarantee a perfect hire"
                            ],
                            correctAnswer: "They reduce subjectivity",
                            feedback: {
                                correct: "Exactly — rubrics reduce subjectivity.",
                                incorrect: "The answer is B. Rubrics keep scoring consistent and fair."
                            }
                        },
                        {
                            type: 'journal',
                            prompt: "Think about the last time you scored a candidate. Did you have a clear rubric, or did you rely on gut feel?"
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: "Rubrics = fairness + reliability. They turn vague answers into measurable data."
                        },
                        {
                            type: 'journal',
                            prompt: "🚀 Stretch Activity\n\nDesign a 1–5 scoring rubric for one interview question. Write what ‘1’ looks like, what ‘5’ looks like, and fill in the middle."
                        }
                    ]
                },
                {
                    id: 'l1-5',
                    title: 'Reducing Bias in Hiring',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: "Bias creeps in when interviews are unstructured. Structured interviews help — but only if you stay disciplined. Bias isn’t always obvious; it’s often unconscious."
                        },
                        {
                            type: 'script',
                            title: '📊 Teaching Moment / Analogy',
                            content: "Think of it like a GPS. Without structure, you drift off course without noticing. Structure = a route that keeps you honest."
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: "A consulting firm trained managers to stick to structured questions and scoring. Over 18 months, their gender balance in new hires improved by 20% — not by lowering the bar, but by reducing bias."
                        },
                        {
                            type: 'quiz_mcq',
                            question: "Which practice reduces bias in interviews?",
                            options: [
                                "Asking every candidate different questions",
                                "Sticking to structured questions and rubrics",
                                "Relying on first impressions",
                                "Letting gut feel decide"
                            ],
                            correctAnswer: "Sticking to structured questions and rubrics",
                            feedback: {
                                correct: "Yes — consistency and rubrics reduce bias.",
                                incorrect: "The correct answer is B. Structure keeps bias out."
                            }
                        },
                        {
                            type: 'journal',
                            prompt: "Think of a time when bias — yours or someone else’s — may have influenced a hiring decision. How could structure have reduced it?"
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: "Bias is sneaky. Structure protects against it by forcing consistency and fairness. That’s how you build diverse, high-performing teams."
                        },
                        {
                            type: 'journal',
                            prompt: "🚀 Stretch Activity\n\nReview your last interview notes. Did you evaluate everyone against the same criteria, or were impressions creeping in? Rewrite your notes with a structured rubric lens."
                        }
                    ]
                }
            ]
        },
        {
            id: 'm2',
            title: "Behavioral Interviewing Mastery",
            description: "Master the STAR method to effectively probe for behavioral examples.",
            duration: 40,
            isCompleted: false,
            lessons: [
                {
                    id: 'l2-1',
                    title: 'Introduction to Behavioral Interviewing',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Behavioral interviews are built on one principle: Past behavior predicts future performance. Asking candidates how they handled situations in the past is far more reliable than asking what they might do.\n\nIn this module, we’ll learn to ask, evaluate, and score behavioral questions consistently.'
                        },
                        {
                            type: 'script',
                            title: '📊 Teaching Moment / Analogy',
                            content: 'Think of it like a flight simulator. You want to see how someone actually responds in realistic scenarios — not just what they say they would do.'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'A software firm switched from hypotheticals (‘What would you do?’) to behavioral questions (‘Tell me about a time you resolved a customer complaint’). They found predictive validity improved — employees who performed well in the interview excelled on the job.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'Why are behavioral interviews effective?',
                            options: [
                                'They are more fun than structured interviews',
                                'Past behavior predicts future performance',
                                'They allow improvisation',
                                'They focus mainly on small talk'
                            ],
                            correctAnswer: 'Past behavior predicts future performance',
                            feedback: {
                                correct: 'Correct! Evidence-based questions = better prediction.',
                                incorrect: 'The answer is B. Behavioral questions are based on real past behavior.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Think of a recent interview you conducted. Did you ask any behavioral questions? What was the outcome?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Behavioral interviewing isn’t optional. It’s the backbone of predicting on-the-job success.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nList 2 behavioral questions for a role you hire often. Keep them job-relevant and open-ended.'
                        }
                    ]
                },
                {
                    id: 'l2-2',
                    title: 'STAR Method for Structured Answers',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'The STAR method breaks down answers into:\n\nSituation — context\nTask — responsibilities or challenge\nAction — what they did\nResult — the outcome\n\nUsing STAR ensures candidates give complete, measurable answers.'
                        },
                        {
                            type: 'script',
                            title: '📊 Teaching Moment / Analogy',
                            content: 'Think of STAR like a recipe: you need all four ingredients to bake the perfect cake. Missing one? You won’t get a full picture.'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'A retail manager used STAR to evaluate candidates. Before STAR, answers were vague and hard to compare. After STAR, evaluation became consistent, and candidate comparisons were objective.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'Which part of STAR explains what the candidate did?',
                            options: [
                                'Situation',
                                'Task',
                                'Action',
                                'Result'
                            ],
                            correctAnswer: 'Action',
                            feedback: {
                                correct: 'Yes! Action = what the candidate actually did.',
                                incorrect: 'The correct answer is C. Action is the steps they took to address the task.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Pick one past candidate’s answer. Could it be rewritten in STAR format? Try rewriting it briefly.'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'STAR = structured, complete, and comparable answers. Always look for all four parts.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nWrite one behavioral question. Create a sample STAR answer for scoring practice.'
                        }
                    ]
                },
                {
                    id: 'l2-3',
                    title: 'Probing Techniques',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Candidates often give short or incomplete answers. That’s where probing comes in. Probing ensures you get the full story without leading or biasing them.'
                        },
                        {
                            type: 'script',
                            title: '📊 Teaching Moment / Analogy',
                            content: 'Think of probing like peeling an onion. Each layer you uncover reveals deeper insights. But be gentle — you don’t want to confuse or pressure the candidate.'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'A tech interviewer asked: ‘Tell me about a time you led a project.’ Candidate gave a brief overview. The interviewer probed: ‘What specifically did you do to motivate your team?’ This revealed leadership behaviors not in the resume.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'Which is an example of an effective probe?',
                            options: [
                                '“So you did everything yourself, right?”',
                                '“Can you explain exactly what steps you took?”',
                                '“Was it hard?”',
                                '“Do you think that was good?”'
                            ],
                            correctAnswer: '“Can you explain exactly what steps you took?”',
                            feedback: {
                                correct: 'Correct — probes should uncover specifics without leading.',
                                incorrect: 'The correct answer is B. Ask for concrete details, not yes/no answers.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Think of a time you asked a question and got a short answer. How could you have probed to get a full STAR response?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Probing = complete answers. Practice asking ‘What exactly did you do?’ or ‘How did you handle that challenge?’”'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nWrite 2 probing questions for each behavioral question in your candidate bank.'
                        }
                    ]
                },
                {
                    id: 'l2-4',
                    title: 'Evaluating STAR Responses',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Once you have a STAR answer, you need to score it objectively. Focus on:\n\nRelevance: Does it match the job requirements?\nDepth: Does it show real skill and ownership?\nOutcome: Did it produce measurable results?'
                        },
                        {
                            type: 'script',
                            title: '📊 Teaching Moment / Analogy',
                            content: 'Think of scoring like judging a competition. Judges follow clear criteria to make fair, comparable evaluations.'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'A finance firm created a rubric for STAR responses. Each answer was rated 1–5 for relevance, action, and result. Consistency improved and managers trusted the data.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'Which element is not a scoring criterion for STAR answers?',
                            options: [
                                'Relevance',
                                'Depth',
                                'Outcome',
                                'Candidate’s personality color preference'
                            ],
                            correctAnswer: 'Candidate’s personality color preference',
                            feedback: {
                                correct: 'Correct. Personal traits unrelated to job performance should not affect scoring.',
                                incorrect: 'The answer is D. Focus on relevant skills, actions, and results.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Review your last STAR evaluation. Did you use all three scoring dimensions? Note one way to improve your scoring next time.'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Scoring STAR responses objectively ensures fair, data-driven decisions.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nTake a sample STAR answer. Score it 1–5 for relevance, depth, and outcome. Compare your scores with a peer or team rubric.'
                        }
                    ]
                },
                {
                    id: 'l2-5',
                    title: 'Practice, Feedback, and Continuous Improvement',
                    type: 'practice',
                    isCompleted: false,
                    steps: [],
                    practiceScenario: {
                        persona: 'Candidate',
                        scenario: "This is a practice session for behavioral interviewing. Ask the AI candidate, 'Tell me about a time you had to handle a difficult stakeholder.' Your goal is to get a complete STAR answer, probing effectively for details.",
                        difficulty: 'neutral'
                    }
                }
            ]
        },
        {
            id: 'm3',
            title: "Bias Awareness & Mitigation",
            description: "Learn to identify and reduce unconscious bias in the hiring process.",
            duration: 30,
            isCompleted: false,
            lessons: [
                {
                    id: 'l3-1',
                    title: 'Understanding Bias in Interviews',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Bias is a natural human tendency. In interviews, unconscious bias can distort your judgment, favor some candidates, or disadvantage others. Recognizing bias is the first step to reducing it.'
                        },
                        {
                            type: 'script',
                            title: '📊 Teaching Moment / Analogy',
                            content: 'Think of bias like colored glasses. If you don’t notice the tint, everything you see is slightly skewed. Removing or adjusting those glasses gives a clearer, fairer view.'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'A tech company found interviewers favored candidates from their own alma mater. After bias awareness training, interviewers consciously evaluated candidates based on competencies, not backgrounds.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'What is unconscious bias?',
                            options: [
                                'Intentional discrimination',
                                'Automatic, unintentional mental shortcuts',
                                'Strict adherence to rules',
                                'Following the STAR method'
                            ],
                            correctAnswer: 'Automatic, unintentional mental shortcuts',
                            feedback: {
                                correct: 'Correct! Unconscious biases happen without awareness but still influence decisions.',
                                incorrect: 'The answer is B. Bias is often invisible and automatic, not intentional.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Recall your last interview. Can you identify any moments where bias may have influenced your judgment?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Bias is inevitable, but awareness and structured methods help reduce its impact.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nWrite down 2 biases you think might affect your interviews and 1 strategy to mitigate each.'
                        }
                    ]
                },
                {
                    id: 'l3-2',
                    title: 'Common Interview Biases',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Let’s explore the biases most likely to appear in interviews and how to counter them.'
                        },
                        {
                            type: 'script',
                            title: '📊 Bias Breakdown',
                            content: "Confirmation Bias\n\nDefinition: Seeking info that confirms your first impression.\nMitigation: Follow a structured question set and score each answer objectively.\n\nHalo/Horn Effect\n\nDefinition: One positive/negative trait dominates your judgment.\nMitigation: Evaluate competencies individually.\n\nSimilarity Bias\n\nDefinition: Favoring candidates with similar backgrounds or interests.\nMitigation: Focus on job-relevant criteria, not personal similarities.\n\nRecency Bias\n\nDefinition: Giving disproportionate weight to the last candidate.\nMitigation: Take notes and review previous candidates before scoring.\n\nAffinity Bias\n\nDefinition: Favoring those who share your opinions or personality.\nMitigation: Use objective metrics and a scoring rubric."
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'Which bias occurs when one strong trait influences all judgments?',
                            options: [
                                'Confirmation',
                                'Halo/Horn',
                                'Recency',
                                'Similarity'
                            ],
                            correctAnswer: 'Halo/Horn',
                            feedback: {
                                correct: 'Correct! The halo/horn effect makes one trait dominate perception.',
                                incorrect: 'The answer is B. Evaluate each competency independently.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Identify a bias you think is most common in your interviews. How have you unintentionally allowed it to affect your judgment?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Recognizing common biases is the first step; applying structured mitigation strategies ensures fairness.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nPick one bias. Write a short strategy for counteracting it in every interview you conduct this week.'
                        }
                    ]
                },
                {
                    id: 'l3-3',
                    title: 'Structural Bias Mitigation Techniques',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Structure is your best defense against bias. The more consistent and objective your process, the less influence bias has.'
                        },
                        {
                            type: 'script',
                            title: '📊 Teaching Moment / Analogy',
                            content: 'Imagine a scale. Bias is like uneven weights. Structured interviews balance the scale.'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'A sales organization implemented standard scoring rubrics and identical question sets. After six months, employee diversity and performance metrics improved significantly.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'Which is a structural bias mitigation technique?',
                            options: [
                                'Using different questions for each candidate',
                                'Blind resume reviews',
                                'Relying on gut feeling',
                                'Asking personal questions'
                            ],
                            correctAnswer: 'Blind resume reviews',
                            feedback: {
                                correct: 'Correct! Blind reviews and structured rubrics reduce bias.',
                                incorrect: 'The answer is B. Objective, standardized methods counter bias effectively.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Which structural change can you implement immediately to reduce bias in your interviews?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Structure = fairness. Standardized questions and scoring rubrics reduce unconscious bias influence.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nCreate a simple scoring rubric for one of your commonly asked behavioral questions.'
                        }
                    ]
                },
                {
                    id: 'l3-4',
                    title: 'Real-Time Bias Interruption Techniques',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Even with structure, bias can creep in. Real-time techniques help you pause and reset during interviews.'
                        },
                        {
                            type: 'script',
                            title: '📊 Techniques',
                            content: "Self-Check: Ask, ‘Am I favoring this candidate based on irrelevant factors?’\n\nPause & Reflect: Take a 5-second mental pause before scoring.\n\nObjective Notes: Record quotes or behaviors before giving a rating.\n\nUse Comparisons: Evaluate candidates against competency benchmarks, not each other."
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'During a panel interview, one interviewer realized they were favoring a candidate with similar hobbies. They paused, reviewed the scoring rubric, and corrected their evaluation.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'What is the best immediate action if you notice bias creeping in?',
                            options: [
                                'Ignore it',
                                'Pause and check the rubric',
                                'Ask the candidate personal questions',
                                'Score based on gut feeling'
                            ],
                            correctAnswer: 'Pause and check the rubric',
                            feedback: {
                                correct: 'Correct! Pause and review your rubric or notes to counter bias immediately.',
                                incorrect: 'The answer is B. Conscious reflection mitigates bias impact.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Think of a bias you notice in yourself. How will you pause and interrupt it in future interviews?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Bias interruption is about awareness and action — a conscious habit.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nDuring your next interview, note any moments you consciously applied a bias interruption technique.'
                        }
                    ]
                },
                {
                    id: 'l3-5',
                    title: 'Continuous Improvement and Accountability',
                    type: 'practice',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Bias awareness isn’t one-off. Continuous improvement and accountability help maintain fair interviewing practices.'
                        },
                        {
                            type: 'script',
                            title: '📊 Strategies',
                            content: 'Peer Review: Regularly review each other’s interview notes.\n\nCalibration Meetings: Compare scores across interviewers and align standards.\n\nFeedback Loops: Incorporate feedback from candidates and hiring teams.\n\nSelf-Reflection Journals: Record and review your interviews to spot patterns.'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'A consulting firm implemented quarterly calibration sessions. Interviewers became more aligned, consistent scoring increased, and hiring outcomes improved.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'Which action supports continuous bias mitigation?',
                            options: [
                                'Occasional reminders only',
                                'Peer review and calibration',
                                'Relying on memory',
                                'Ignoring feedback'
                            ],
                            correctAnswer: 'Peer review and calibration',
                            feedback: {
                                correct: 'Correct! Continuous checks and accountability prevent bias drift.',
                                incorrect: 'The answer is B. Regular calibration and feedback are essential.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'What one accountability mechanism will you implement immediately to track your own bias reduction?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Bias mitigation is a journey. Structure, reflection, and peer accountability create lasting fairness.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nSet up a bi-weekly review with a peer to discuss scoring alignment and bias reflections.'
                        }
                    ]
                }
            ]
        },
        {
            id: 'm4',
            title: "Legal Compliance Essentials",
            description: "Understand the legal boundaries of interviewing.",
            duration: 35,
            isCompleted: false,
            lessons: [
                {
                    id: 'l4-1',
                    title: 'Introduction to Legal Compliance',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Legal compliance in interviews isn’t just about avoiding lawsuits — it ensures fairness, protects candidates, and upholds your organization’s reputation. Understanding the law helps you focus on evaluating talent objectively.'
                        },
                        {
                            type: 'script',
                            title: '📊 Teaching Moment / Analogy',
                            content: 'Think of legal compliance as the boundaries on a sports field. The rules don’t stop the game; they make it fair and structured.'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'An organization faced legal scrutiny when an interviewer asked candidates about marital status. After training, all interviewers followed structured questions and compliance checklists, reducing risk and increasing fairness.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'Why is legal compliance critical in interviews?',
                            options: [
                                'To avoid fines and lawsuits',
                                'To ensure fair evaluation and protect candidates',
                                'To limit hiring flexibility',
                                'Both A & B'
                            ],
                            correctAnswer: 'Both A & B',
                            feedback: {
                                correct: 'Correct! Legal compliance protects both the organization and the candidates, while promoting fairness.',
                                incorrect: 'The answer is D. Compliance ensures fairness and reduces legal risk.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Think about any interview you conducted or participated in. Were all questions compliant with legal standards?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Understanding compliance is the foundation. Every question you ask must focus on job-relevant criteria.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nList 3 topics you should never ask a candidate about during an interview. Think about alternatives you could use instead.'
                        }
                    ]
                },
                {
                    id: 'l4-2',
                    title: 'Protected Characteristics',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Federal and local laws protect candidates from discrimination based on certain characteristics. Awareness is the first step to ensuring compliance.'
                        },
                        {
                            type: 'script',
                            title: '📊 Protected Characteristics',
                            content: 'Race / Color\n\nReligion\n\nSex / Gender / Pregnancy / Sexual Orientation\n\nNational Origin\n\nAge (40+)\n\nDisability\n\nGenetic Information'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'A manager asked a candidate about their childcare arrangements. This violated federal guidance. After training, managers learned to focus only on availability and job requirements.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'Which question is legally compliant?',
                            options: [
                                'Are you planning to have children soon?',
                                'Are you authorized to work in the country?',
                                'What is your spouse’s job?',
                                'How old are you?'
                            ],
                            correctAnswer: 'Are you authorized to work in the country?',
                            feedback: {
                                correct: 'Correct! Focus only on job-relevant information.',
                                incorrect: 'The answer is B. Questions about family, age, or spouse are prohibited.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Identify 2 questions you’ve asked in the past that could risk discrimination. How can you reframe them to be compliant?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Protected characteristics must never influence hiring decisions. Always focus on job-related skills and qualifications.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nWrite compliant alternatives for 3 common non-compliant questions.'
                        }
                    ]
                },
                {
                    id: 'l4-3',
                    title: 'Prohibited Questions & Safe Alternatives',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Some questions may seem harmless but are legally risky. Learn safe alternatives to assess the same competencies.'
                        },
                        {
                            type: 'script',
                            title: '📊 Categories & Examples',
                            content: "Personal / Family\n\nProhibited: Marital status, childcare plans\nSafe Alternative: “Are you available to work the required schedule?”\n\nAge / Physical Characteristics\n\nProhibited: Age, height, weight\nSafe Alternative: “Can you perform the essential functions of this role with or without reasonable accommodation?”\n\nBackground / Origin\n\nProhibited: Nationality, accent, religion\nSafe Alternative: “Are you legally authorized to work in this country?”\n\nHealth / Disability\n\nProhibited: Questions about disabilities or health history\nSafe Alternative: Focus on ability to perform job functions, e.g., “This role requires lifting 20 lbs. Can you perform this task with or without reasonable accommodation?”"
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'Which is a safe interview question?',
                            options: [
                                'What religion do you practice?',
                                'Are you legally allowed to work here?',
                                'How tall are you?',
                                'Are you married?'
                            ],
                            correctAnswer: 'Are you legally allowed to work here?',
                            feedback: {
                                correct: 'Correct! Always ask about legal work eligibility or job-related abilities.',
                                incorrect: 'The answer is B. Avoid any questions about personal characteristics.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Review your current interview guide. Are there any prohibited questions? Replace them with job-relevant alternatives.'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Always ask questions that measure ability and qualifications — not personal attributes.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nCreate a mini cheat sheet of 5 prohibited questions and their compliant alternatives.'
                        }
                    ]
                },
                {
                    id: 'l4-4',
                    title: 'Documentation and Record-Keeping',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Documentation is your safeguard. Objective, consistent records protect the organization and provide defensible hiring decisions.'
                        },
                        {
                            type: 'script',
                            title: '📊 Best Practices',
                            content: 'Record every question asked\n\nTake detailed, job-relevant notes on candidate responses\n\nUse consistent scoring rubrics\n\nDocument final hiring decisions and rationale\n\nRetain records as required by law'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'After an audit, an organization’s well-documented interviews protected them from an EEOC complaint. Notes included structured question responses and objective scoring.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'What should interview notes focus on?',
                            options: [
                                'Candidate’s personal background',
                                'Job-relevant skills and behaviors',
                                'Gut feeling impressions',
                                'Off-topic comments'
                            ],
                            correctAnswer: 'Job-relevant skills and behaviors',
                            feedback: {
                                correct: 'Correct! Notes must be objective and job-focused.',
                                incorrect: 'The answer is B. Avoid documenting personal characteristics or opinions.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Examine your note-taking habits. Are you consistently recording objective, job-relevant information?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Good documentation ensures fairness, legal compliance, and audit readiness.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nRevise your current interview template to include structured sections for questions, candidate responses, and scoring.'
                        }
                    ]
                },
                {
                    id: 'l4-5',
                    title: 'Practical Application and Scenarios',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Let’s apply compliance knowledge in real-world interview scenarios.'
                        },
                        {
                            type: 'script',
                            title: '📖 Scenario 1',
                            content: "Situation: A candidate mentions they are pregnant.\nQuestion: How should you respond?\n\n✅ Focus on role requirements, not personal circumstances.\n\nCompliant Response: “Can you perform the essential functions of this role?”"
                        },
                        {
                            type: 'script',
                            title: '📖 Scenario 2',
                            content: "Situation: A candidate has a foreign accent.\nQuestion: How should you assess them?\n\n✅ Focus on communication ability as required by the role.\n\nCompliant Response: “Please provide an example of a complex task you explained to a team member.”"
                        },
                        {
                            type: 'script',
                            title: '📖 Scenario 3',
                            content: "Situation: You notice a candidate went to the same school as you.\nQuestion: Should this affect scoring?\n\n❌ No. Focus only on skills and competencies, not shared background."
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'If a candidate shares personal information, what’s the best approach?',
                            options: [
                                'Ask follow-up personal questions',
                                'Focus on job-relevant abilities',
                                'Let it influence scoring',
                                'Ignore all responses'
                            ],
                            correctAnswer: 'Focus on job-relevant abilities',
                            feedback: {
                                correct: 'Correct! Personal information should not affect your evaluation.',
                                incorrect: 'The answer is B. Keep assessment objective and compliant.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Write down 1 challenging scenario you’ve faced or could face. How will you ensure your response is compliant?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Practice makes compliance automatic. Use structured questions, focus on role requirements, and document consistently.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nCreate 3 mock interview questions that are fully legally compliant and evaluate the same competencies as your previous non-compliant questions.'
                        }
                    ]
                }
            ]
        },
        {
            id: 'm5',
            title: "Mock Interviewing and Feedback Systems",
            description: "Practice conducting interviews and providing structured feedback.",
            duration: 30,
            isCompleted: false,
            lessons: [
                {
                    id: 'l5-1',
                    title: 'Introduction to Mock Interviews',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Mock interviews are practice opportunities where you can refine your skills, receive feedback, and simulate real interview conditions without risk. They’re the fastest way to learn structured interviewing and avoid common mistakes.'
                        },
                        {
                            type: 'script',
                            title: '📊 Teaching Moment',
                            content: 'Think of a mock interview as a rehearsal before the performance — like athletes running drills before the big game. Mistakes here become learning opportunities, not consequences.'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'An organization implemented regular mock interviews for new interviewers. Within a month, they noticed a 30% improvement in structured questioning and evaluation consistency.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'What is the main purpose of a mock interview?',
                            options: [
                                'To make candidates nervous',
                                'To practice and improve interviewing skills',
                                'To replace real interviews',
                                'To test candidate knowledge'
                            ],
                            correctAnswer: 'To practice and improve interviewing skills',
                            feedback: {
                                correct: 'Correct! Mock interviews are for skill development and feedback.',
                                incorrect: 'The answer is B. They simulate real interviews for learning, not evaluation.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Have you ever practiced interviewing before a real session? What was challenging?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Mock interviews allow mistakes in a safe environment. Use them to develop consistency, clarity, and confidence.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nIdentify 3 aspects of your interview style you want to improve during mock sessions.'
                        }
                    ]
                },
                {
                    id: 'l5-2',
                    title: 'Preparing a Mock Interview',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Preparation is key to a productive mock interview. Define roles, select scenarios, and set evaluation criteria before starting.'
                        },
                        {
                            type: 'script',
                            title: '📊 Steps to Prepare',
                            content: 'Assign Roles: Interviewer, candidate, observer(s)\n\nSelect Scenario: Choose realistic job scenarios relevant to the role\n\nDevelop Questions: Include both behavioral and technical questions\n\nSet Evaluation Criteria: Use structured rubrics aligned with STAR method and legal compliance'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'Before mock interviews, an interviewer prepared a role-specific scenario and scoring sheet. Feedback afterward was specific, actionable, and helped the interviewer correct mistakes immediately.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'What is the first step in preparing a mock interview?',
                            options: [
                                'Conduct the interview',
                                'Assign roles and select scenarios',
                                'Give feedback',
                                'Review candidate resumes'
                            ],
                            correctAnswer: 'Assign roles and select scenarios',
                            feedback: {
                                correct: 'Correct! Role assignment and scenario selection set the stage for effective practice.',
                                incorrect: 'The answer is B. Preparation ensures the session is focused and productive.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Think about the last mock interview you conducted. Did you follow a structured preparation process?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Always invest time in preparation. A well-structured session ensures actionable feedback and learning.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nCreate a short scenario and set of questions for your next mock interview.'
                        }
                    ]
                },
                {
                    id: 'l5-3',
                    title: 'Conducting the Mock Interview',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'During the session, follow structured guidelines and maintain a realistic interview environment. Focus on asking, listening, and documenting.'
                        },
                        {
                            type: 'script',
                            title: '📊 Key Guidelines',
                            content: 'Follow Structure: Opening, middle, closing phases\n\nBehavioral Focus: Ask STAR-based questions\n\nActive Listening: Paraphrase, probe, take notes\n\nTime Management: Keep interview within planned duration\n\nProfessionalism: Treat candidate as in real interview'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'During a mock session, an interviewer asked consistent questions and documented responses. Observers noted improvement in follow-up questioning and feedback clarity.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'Which practice is essential during a mock interview?',
                            options: [
                                'Skip preparation',
                                'Focus on personal opinions about candidate',
                                'Follow structured questions and evaluate objectively',
                                'Rush through questions'
                            ],
                            correctAnswer: 'Follow structured questions and evaluate objectively',
                            feedback: {
                                correct: 'Correct! Stick to structured questioning and objective evaluation.',
                                incorrect: 'The answer is C. Personal opinions or shortcuts reduce learning effectiveness.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'During mock interviews, do you find it easier to stick to structured questions or improvise? How does this impact feedback?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Treat mock interviews as real sessions to practice rigor, clarity, and objective evaluation.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nRun a 10-minute mock interview with a colleague using a prepared scenario. Focus on following the STAR method.'
                        }
                    ]
                },
                {
                    id: 'l5-4',
                    title: 'Providing Feedback',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Feedback is the learning engine of mock interviews. It must be specific, balanced, actionable, and timely.'
                        },
                        {
                            type: 'script',
                            title: '📊 Feedback Characteristics',
                            content: 'Specific: Focus on concrete behaviors\n\nActionable: Give clear guidance for improvement\n\nBalanced: Highlight strengths and areas for growth\n\nTimely: Deliver immediately after the session'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'After a mock interview, peer feedback highlighted excellent questioning but weak probing. The interviewer improved significantly in the next session.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'Which feedback is effective?',
                            options: [
                                '“You were fine.”',
                                '“Your questions were clear, but you need to probe deeper for details.”',
                                '“You could do better.”',
                                '“Don’t be nervous next time.”'
                            ],
                            correctAnswer: '“Your questions were clear, but you need to probe deeper for details.”',
                            feedback: {
                                correct: 'Correct! Feedback should be specific and actionable.',
                                incorrect: 'The answer is B. General comments aren’t helpful for learning.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Think about feedback you’ve received in the past. Was it actionable or vague? How could it have been improved?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Feedback transforms practice into real skill development. Always be specific, actionable, and constructive.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nObserve a peer mock interview and write 3 actionable feedback points.'
                        }
                    ]
                },
                {
                    id: 'l5-5',
                    title: 'Self-Assessment and Reflection',
                    type: 'practice',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Reflection solidifies learning. After each mock interview, assess yourself, identify gaps, and plan next steps.'
                        },
                        {
                            type: 'script',
                            title: '📊 Self-Assessment Steps',
                            content: 'Review Notes: Compare your questions and evaluation to the rubric\n\nIdentify Strengths: Note what went well\n\nSpot Gaps: Identify missed opportunities or mistakes\n\nPlan Improvement: Set actionable goals for next session'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'An interviewer used a self-assessment checklist after every mock session. Over 4 weeks, their structured questioning improved and feedback became more precise.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'What is the main purpose of self-assessment after a mock interview?',
                            options: [
                                'To criticize yourself harshly',
                                'To reflect, learn, and plan improvement',
                                'To record candidate details',
                                'To reduce interview time'
                            ],
                            correctAnswer: 'To reflect, learn, and plan improvement',
                            feedback: {
                                correct: 'Correct! Reflection and planning enhance skill development.',
                                incorrect: 'The answer is B. Self-assessment is about improving performance, not blaming.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'After your next mock interview, write down 2 things you did well and 2 things to improve.'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Self-assessment turns each practice into measurable growth. Combine this with peer feedback for maximum impact.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nCreate a personal improvement plan with 3 goals for your next 3 mock interviews.'
                        }
                    ]
                }
            ]
        },
        {
            id: 'm6',
            title: "Leadership Through Interviewing",
            description: "Frame interviewing as a core leadership competency.",
            duration: 30,
            isCompleted: false,
            lessons: [
                {
                    id: 'l6-1',
                    title: 'Interviewing as a Leadership Skill',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Effective interviewing is a critical leadership competency. The way you conduct interviews reflects your ability to evaluate talent, make decisions, and influence organizational outcomes.'
                        },
                        {
                            type: 'script',
                            title: '📊 Teaching Moment',
                            content: 'Leaders who master interviewing consistently select high-performing teams, identify gaps early, and model organizational values through behavior.'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'A TL who mastered structured interviewing noticed her team’s hiring quality improved. She was able to make better decisions, mentor others, and reduce turnover by 15%.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'Why is interviewing considered a leadership skill?',
                            options: [
                                'It lets you ask tough questions',
                                'It reflects your ability to assess talent, make decisions, and influence outcomes',
                                'It is only about hiring',
                                'It allows you to test candidates’ knowledge'
                            ],
                            correctAnswer: 'It reflects your ability to assess talent, make decisions, and influence outcomes',
                            feedback: {
                                correct: 'Correct! Interviewing is a reflection of leadership and decision-making capabilities.',
                                incorrect: 'The answer is B. Leadership includes guiding hiring and team development through interviews.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Think about a leader you admire. How do they approach hiring and interviews? What leadership qualities do they demonstrate?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Interviewing hones your communication skills, which are essential for leadership. Clear, concise, and inclusive communication creates trust and ensures accurate evaluation.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nWrite down 2 ways you can demonstrate leadership during interviews beyond asking questions.'
                        }
                    ]
                },
                {
                    id: 'l6-2',
                    title: 'Strategic Thinking in Interviewing',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Interviews are not isolated events—they are part of broader organizational strategy. Leaders align hiring decisions with long-term business goals.'
                        },
                        {
                            type: 'script',
                            title: '📊 Key Points',
                            content: 'Understand Organizational Needs: Know the skills, culture, and gaps\n\nAlign Candidate Capabilities: Hire talent that supports strategic objectives\n\nPlan for Growth: Consider how candidates can evolve into future roles\n\nIntegrate Feedback Loops: Use interview data to refine hiring strategies'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'A hiring manager analyzed past interviews and realized candidates with certain competencies consistently excelled. By integrating this insight, the team improved project delivery speed.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'What is a strategic approach to interviewing?',
                            options: [
                                'Asking random questions',
                                'Aligning candidate capabilities with organizational objectives',
                                'Only focusing on cultural fit',
                                'Speeding up the hiring process'
                            ],
                            correctAnswer: 'Aligning candidate capabilities with organizational objectives',
                            feedback: {
                                correct: 'Correct! Strategic interviewing ensures hires support organizational goals.',
                                incorrect: 'The answer is B. Leadership requires connecting hiring to broader strategy.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Reflect on your current team: Are you hiring for immediate needs only, or long-term growth?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Self-reflection solidifies learning. After each mock interview, assess yourself, identify gaps, and plan next steps.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nCreate a simple mapping of a candidate’s skills to potential organizational goals for practice.'
                        }
                    ]
                },
                {
                    id: 'l6-3',
                    title: 'Emotional Intelligence in Interviewing',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Emotional intelligence (EQ) is crucial during interviews. Leaders with high EQ read candidates, manage dynamics, and create inclusive environments.'
                        },
                        {
                            type: 'script',
                            title: '📊 Key Points',
                            content: 'Self-Awareness: Monitor your own biases and emotions\n\nEmpathy: Understand candidates’ perspectives\n\nSocial Skills: Facilitate smooth interactions\n\nConflict Management: Navigate challenging candidate scenarios'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'During a tough interview, a TL noticed a candidate was nervous. By acknowledging it and adjusting their tone, the candidate performed better, giving more accurate insights.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'How does emotional intelligence enhance interviewing?',
                            options: [
                                'Helps you intimidate candidates',
                                'Supports understanding, empathy, and smooth interactions',
                                'Makes interviews faster',
                                'Allows you to skip structured questions'
                            ],
                            correctAnswer: 'Supports understanding, empathy, and smooth interactions',
                            feedback: {
                                correct: 'Correct! EQ helps leaders interpret candidate responses and maintain professionalism.',
                                incorrect: 'The answer is B. Emotional intelligence is about understanding, not control.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Think about a time when you or someone else demonstrated empathy in a professional conversation. How did it affect the outcome?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Leadership is a journey. Interviews are both an assessment of others and a mirror for your own development. Reflection turns each session into growth.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nDuring your next interview, practice one EQ skill (e.g., active listening or empathy) and note its impact.'
                        }
                    ]
                },
                {
                    id: 'l6-4',
                    title: 'Communication Excellence',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Interviewing hones your communication skills, which are essential for leadership. Clear, concise, and inclusive communication creates trust and ensures accurate evaluation.'
                        },
                        {
                            type: 'script',
                            title: '📊 Key Guidelines',
                            content: 'Active Listening: Pay full attention and paraphrase responses\n\nClear Questioning: Avoid ambiguity; use role-relevant examples\n\nInclusive Language: Ensure candidates feel valued\n\nProfessional Representation: Model organization’s values through tone and behavior'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'A TL noticed candidates misunderstood a question. By rephrasing clearly and inclusively, candidate responses became more informative, improving decision-making.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'Effective communication in interviewing includes:',
                            options: [
                                'Speaking as much as possible',
                                'Active listening, clear questions, and inclusive language',
                                'Using technical jargon',
                                'Rapid-fire questioning'
                            ],
                            correctAnswer: 'Active listening, clear questions, and inclusive language',
                            feedback: {
                                correct: 'Correct! Communication is key to understanding candidates accurately.',
                                incorrect: 'The answer is B. Leadership communication fosters clarity and fairness.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'During your last interview, how well did you listen and communicate? Where could you improve?'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Leadership is a journey. Interviews are both an assessment of others and a mirror for your own development. Reflection turns each session into growth.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nPractice rephrasing a technical question into simple, inclusive language for clarity.'
                        }
                    ]
                },
                {
                    id: 'l6-5',
                    title: 'Self-Reflection and Continuous Improvement',
                    type: 'standard',
                    isCompleted: false,
                    steps: [
                        {
                            type: 'script',
                            title: '🎙️ Coach Intro',
                            content: 'Leadership is a journey. Interviews are both an assessment of others and a mirror for your own development. Reflection turns each session into growth.'
                        },
                        {
                            type: 'script',
                            title: '📊 Self-Reflection Steps',
                            content: 'Assess Decisions: Were your judgments fair, consistent, and aligned with strategy?\n\nIdentify Strengths: Where did you communicate or lead effectively?\n\nSpot Improvement Areas: What skills need more practice (e.g., EQ, STAR questioning)?\n\nSet Goals: Create a plan to enhance leadership through interviewing'
                        },
                        {
                            type: 'script',
                            title: '📖 Mini-Case',
                            content: 'A TL reviewed notes after each interview and tracked recurring patterns in decision-making. Over time, their judgment improved, and they became a mentor for peers.'
                        },
                        {
                            type: 'quiz_mcq',
                            question: 'Why is self-reflection critical for leadership in interviewing?',
                            options: [
                                'To feel guilty about mistakes',
                                'To learn, improve, and model leadership behavior',
                                'To skip feedback sessions',
                                'To evaluate candidates faster'
                            ],
                            correctAnswer: 'To learn, improve, and model leadership behavior',
                            feedback: {
                                correct: 'Correct! Reflection transforms practice into growth.',
                                incorrect: 'The answer is B. It’s about improving your leadership and interviewing skills.'
                            }
                        },
                        {
                            type: 'journal',
                            prompt: 'Write down 2 behaviors from today’s interview practice that reflect leadership, and 2 you want to improve.'
                        },
                        {
                            type: 'script',
                            title: '📌 Coach Wrap-Up',
                            content: 'Leadership is a journey. Interviews are both an assessment of others and a mirror for your own development. Reflection turns each session into growth.'
                        },
                        {
                            type: 'journal',
                            prompt: '🚀 Stretch Activity\n\nCreate a personal development plan for interviewing skills to enhance leadership over the next month.'
                        }
                    ]
                }
            ]
        }
    ];
async function nominateUser(managerRole, nomineeRole, targetRole) {
    const allNominations = getFromStorage(INTERVIEWER_LAB_KEY);
    const now = new Date().toISOString();
    const initialModules = getInitialModules();
    const newNomination = {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        nominatedBy: managerRole,
        nominee: nomineeRole,
        targetInterviewRole: targetRole,
        status: 'Pre-assessment pending',
        modules: initialModules,
        modulesTotal: initialModules.length,
        modulesCompleted: 0,
        certified: false,
        lastUpdated: now,
        nominatedAt: now
    };
    allNominations.unshift(newNomination);
    saveToStorage(INTERVIEWER_LAB_KEY, allNominations);
    // Create a notification for the nominated user
    const managerName = __TURBOPACK__imported__module__$5b$project$5d2f$backend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"][managerRole]?.name || managerRole;
    const notification = {
        trackingId: `IL-NOM-${newNomination.id}`,
        subject: `You've been nominated for Interviewer Training!`,
        message: `Congratulations! ${managerName} has nominated you for the Laddrr Interviewer Lab, a program designed to help you become a more effective and confident interviewer.\n\nThis training will help you:\n- Conduct structured, fair, and legally compliant interviews.\n- Master behavioral interviewing techniques like the STAR method.\n- Identify and mitigate unconscious bias.\n\nTo get started, please navigate to the "Interviewer Lab" section from the main sidebar and complete your pre-assessment.`,
        submittedAt: now,
        criticality: 'Low',
        status: 'Pending Acknowledgement',
        assignedTo: [
            nomineeRole
        ],
        viewed: false,
        auditTrail: [
            {
                event: 'Notification Created',
                timestamp: now,
                actor: 'System',
                details: `Automated notification for Interviewer Lab nomination.`
            }
        ]
    };
    const allFeedback = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$services$2f$feedback$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getFeedbackFromStorage"])();
    allFeedback.unshift(notification);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$services$2f$feedback$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveFeedbackToStorage"])(allFeedback);
    return newNomination;
}
async function getNominationsForManager(managerRole) {
    const allNominations = getFromStorage(INTERVIEWER_LAB_KEY);
    return allNominations.filter((n)=>n.nominatedBy === managerRole).sort((a, b)=>new Date(b.nominatedAt).getTime() - new Date(a.nominatedAt).getTime());
}
async function getNominationForUser(userRole) {
    const allNominations = getFromStorage(INTERVIEWER_LAB_KEY);
    return allNominations.find((n)=>n.nominee === userRole) || null;
}
async function savePreAssessment(nominationId, analysis) {
    const allNominations = getFromStorage(INTERVIEWER_LAB_KEY);
    const index = allNominations.findIndex((n)=>n.id === nominationId);
    if (index !== -1) {
        allNominations[index].scorePre = analysis.overallScore;
        allNominations[index].analysisPre = analysis;
        allNominations[index].status = 'In Progress';
        allNominations[index].lastUpdated = new Date().toISOString();
        saveToStorage(INTERVIEWER_LAB_KEY, allNominations);
    }
}
async function savePostAssessment(nominationId, analysis) {
    const allNominations = getFromStorage(INTERVIEWER_LAB_KEY);
    const index = allNominations.findIndex((n)=>n.id === nominationId);
    if (index !== -1) {
        const nomination = allNominations[index];
        nomination.scorePost = analysis.overallScore;
        nomination.analysisPost = analysis;
        nomination.lastUpdated = new Date().toISOString();
        // Certification Logic: Must show at least 15% improvement
        const preScore = nomination.scorePre || 0;
        const postScore = nomination.scorePost;
        const improvement = preScore > 0 ? (postScore - preScore) / preScore * 100 : 100;
        if (postScore >= 75 && improvement >= 15) {
            nomination.status = 'Certified';
            nomination.certified = true;
        } else {
            nomination.status = 'Retry Needed';
        }
        saveToStorage(INTERVIEWER_LAB_KEY, allNominations);
    }
}
async function completeModule(nominationId, moduleId) {
    const allNominations = getFromStorage(INTERVIEWER_LAB_KEY);
    const index = allNominations.findIndex((n)=>n.id === nominationId);
    if (index === -1) {
        throw new Error("Nomination not found.");
    }
    const nomination = allNominations[index];
    const moduleIndex = nomination.modules.findIndex((m)=>m.id === moduleId);
    if (moduleIndex !== -1 && !nomination.modules[moduleIndex].isCompleted) {
        nomination.modules[moduleIndex].isCompleted = true;
        nomination.modulesCompleted = nomination.modules.filter((m)=>m.isCompleted).length;
        nomination.lastUpdated = new Date().toISOString();
        if (nomination.modulesCompleted === nomination.modulesTotal) {
            nomination.status = 'Post-assessment pending';
        }
        saveToStorage(INTERVIEWER_LAB_KEY, allNominations);
    }
    return nomination;
}
async function saveLessonResult(nominationId, moduleId, lessonId, result) {
    const allNominations = getFromStorage(INTERVIEWER_LAB_KEY);
    const nominationIndex = allNominations.findIndex((n)=>n.id === nominationId);
    if (nominationIndex === -1) return;
    const moduleIndex = allNominations[nominationIndex].modules.findIndex((m)=>m.id === moduleId);
    if (moduleIndex === -1) return;
    const lessonIndex = allNominations[nominationIndex].modules[moduleIndex].lessons.findIndex((l)=>l.id === lessonId);
    if (lessonIndex === -1) return;
    allNominations[nominationIndex].modules[moduleIndex].lessons[lessonIndex].isCompleted = true;
    allNominations[nominationIndex].modules[moduleIndex].lessons[lessonIndex].result = result;
    saveToStorage(INTERVIEWER_LAB_KEY, allNominations);
}
}}),
"[project]/frontend/src/services/leadership-service.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "LEADERSHIP_COACHING_KEY": (()=>LEADERSHIP_COACHING_KEY),
    "completeLeadershipLesson": (()=>completeLeadershipLesson),
    "getFromStorage": (()=>getFromStorage),
    "getLeadershipNominationsForManager": (()=>getLeadershipNominationsForManager),
    "getNominationForUser": (()=>getNominationForUser),
    "getNominationsForMentor": (()=>getNominationsForMentor),
    "nominateForLeadership": (()=>nominateForLeadership),
    "saveLeadershipLessonAnswer": (()=>saveLeadershipLessonAnswer),
    "saveToStorage": (()=>saveToStorage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v4.js [app-ssr] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/role-mapping.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$services$2f$feedback$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/services/feedback-service.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const LEADERSHIP_COACHING_KEY = 'leadership_coaching_nominations_v5';
const getModulesForEmployeeToLead = ()=>[
        {
            id: 'm1',
            title: 'Building Personal Leadership Presence',
            description: 'Learn to show up as someone others trust, respect, and want to follow.',
            isCompleted: false,
            lessons: [
                {
                    id: 'l1-0',
                    title: 'What is Leadership Presence?',
                    isCompleted: false,
                    steps: [
                        {
                            id: 's1-0-1',
                            type: 'script',
                            content: `<h4>What is Leadership Presence and Why Does It Matter?</h4><p>Imagine walking into a meeting where Sarah, a software developer, quietly takes her seat in the back. When the project hits a roadblock, she doesn't speak up even though she knows the solution. Compare this to Marcus, also a developer, who enters the same meeting, makes eye contact with colleagues, and when the roadblock emerges, he leans forward and says, "I've seen this issue before. Here's what worked for our team last time, and here's what we learned to avoid."</p><p class="mt-4">Both Sarah and Marcus have the same technical skills. The difference? Marcus has developed <strong>leadership presence</strong>—the ability to show up as someone others trust, respect, and want to follow, even when he has no formal authority.</p><p class="mt-4">Leadership presence isn't about being the loudest person in the room or having a commanding personality. It's about developing four core qualities that make people think, "I trust this person's judgment" and "I want to hear what they have to say."</p>`
                        },
                        {
                            id: 's1-0-2',
                            type: 'quiz_mcq',
                            question: 'According to the text, what is the best definition of leadership presence?',
                            options: [
                                'Having a commanding personality and being the loudest in the room.',
                                'The ability to show up in a way that inspires trust and respect from others.',
                                'Having the most technical skill and experience on the team.',
                                'Always having the correct answer to every problem.'
                            ],
                            correctAnswer: 'The ability to show up in a way that inspires trust and respect from others.',
                            feedback: {
                                correct: "Correct! Leadership presence is about how you project credibility and earn trust, regardless of your official title.",
                                incorrect: "Not quite. The key to leadership presence is inspiring trust and respect, which is more than just personality or technical skill."
                            }
                        }
                    ]
                },
                {
                    id: 'l1-1',
                    title: 'Pillar 1: Authenticity',
                    isCompleted: false,
                    steps: [
                        {
                            id: 's1-1-1',
                            type: 'script',
                            content: `<h4>Pillar 1: Authenticity - Being Real Without Being Raw</h4><p>Authenticity means bringing your genuine self to work while maintaining professionalism. It's not about sharing every personal detail or emotion—it's about aligning your values with your actions consistently.</p><p class="mt-4 font-semibold">What authentic leadership looks like:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li>When you make a mistake, you own it immediately: "I missed that deadline because I underestimated the complexity. Here's my plan to prevent this in the future."</li><li>You share credit generously: "This success happened because Maria caught the critical bug and Tom stayed late to help test the fix."</li><li>You admit when you don't know something: "I'm not familiar with that technology stack. Can you walk me through how it would work?"</li></ul><p class="mt-4 font-semibold">What authentic leadership does NOT look like:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li>Oversharing personal problems: "I'm having marriage issues and that's why I've been distracted"</li><li>Being brutally honest without consideration: "That idea is terrible and won't work"</li><li>Using authenticity as an excuse for unprofessional behavior: "That's just who I am" when someone gives you feedback</li></ul>`
                        },
                        {
                            id: 's1-1-2',
                            type: 'quiz_mcq',
                            question: 'A colleague praises you for a project you completed with a lot of help from a teammate. What is the most authentic response?',
                            options: [
                                'Say "Thanks, I worked really hard on it."',
                                'Say "Thanks, but it was all [teammate\'s name]."',
                                'Say "Thanks! [Teammate\'s name] and I made a great team on this. Their work on the data model was critical."',
                                'Say nothing to avoid making it awkward.'
                            ],
                            correctAnswer: 'Say "Thanks! [Teammate\'s name] and I made a great team on this. Their work on the data model was critical."',
                            feedback: {
                                correct: "Excellent! This response is authentic because it accepts the praise gracefully while generously and specifically sharing credit.",
                                incorrect: "While well-intentioned, the best answer is to share credit specifically. It acknowledges your role while highlighting your teammate's contribution, which is a key leadership behavior."
                            }
                        }
                    ]
                },
                {
                    id: 'l1-2',
                    title: 'Pillar 2: Consistency',
                    isCompleted: false,
                    steps: [
                        {
                            id: 's1-2-1',
                            type: 'script',
                            content: `<h4>Pillar 2: Consistency - Becoming Predictably Reliable</h4><p>Consistency means people know what to expect from you. They trust that your mood won't dramatically affect your decision-making, that you'll follow through on commitments, and that you'll apply the same standards fairly to everyone.</p><p class="mt-4 font-semibold">Building consistency in daily interactions:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li><strong>Morning routine example:</strong> Instead of rushing into work, take two minutes to check in with your team. "Good morning, everyone. Any obstacles I can help remove today?" This signals you care about both people and results.</li><li><strong>Decision-making consistency:</strong> When evaluating ideas, use the same criteria every time. "Let's check this against our goals: Does it align with the project? Do we have resources? What's the risk?"</li><li><strong>Follow-through consistency:</strong> If you say "I'll get back to you by Friday," do it. If you can't, communicate that on Thursday.</li></ul><p class="mt-4"><strong>The compound effect of consistency:</strong> People start coming to you for reliable information, then for your opinion, and eventually, they see you as leadership material because they trust your judgment.</p>`
                        },
                        {
                            id: 's1-2-2',
                            type: 'quiz_mcq',
                            question: 'You promised a colleague you would review their document by end of day, but an urgent issue came up. What is the best demonstration of consistency?',
                            options: [
                                'Ignore the commitment and hope they forget.',
                                'Send them a message saying "Sorry, can\'t do it today."',
                                'Work late to finish the review, even if it means doing a poor job.',
                                'Proactively message them before the deadline, explain the situation, and propose a new, specific timeline (e.g., "by 10 AM tomorrow").'
                            ],
                            correctAnswer: 'Proactively message them before the deadline, explain the situation, and propose a new, specific timeline (e.g., "by 10 AM tomorrow").',
                            feedback: {
                                correct: "Perfect. Consistency isn't about being perfect; it's about being reliably communicative and managing expectations.",
                                incorrect: "The best choice is proactive communication. Reliability comes from managing commitments, even when you have to adjust them."
                            }
                        }
                    ]
                },
                {
                    id: 'l1-3',
                    title: 'Pillar 3: Composure',
                    isCompleted: false,
                    steps: [
                        {
                            id: 's1-3-1',
                            type: 'script',
                            content: `<h4>Pillar 3: Composure - Staying Calm When Others Can't</h4><p>Composure isn't about suppressing emotions. It's about managing your emotional responses so you can think clearly during stressful situations.</p><p class="mt-4 font-semibold">Practical composure techniques:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li><strong>The 3-breath technique:</strong> When stress rises, take three slow, deep breaths before responding. This engages your rational brain.</li><li><strong>The clarifying question:</strong> Instead of reacting to bad news, ask a question like, "Help me understand what you mean by that?" This buys you thinking time.</li><li><strong>The emotional labeling technique:</strong> Internally acknowledge your emotion without being controlled by it: "I'm feeling frustrated. Let me focus on what we can control."</li></ul><p class="mt-4 font-semibold">Composure in action example:</p><p>The situation: A major bug will delay a launch. The client is furious, and teammates are blaming each other.</p><p><em>Poor response:</em> "This is a disaster! How did we miss this?"</p><p><em>Composed response:</em> "This is a serious issue. Let's focus on three things: First, a plan to fix the bug. Second, how to communicate with the client. Third, what we can learn to prevent this."</p>`
                        },
                        {
                            id: 's1-3-2',
                            type: 'quiz_mcq',
                            question: 'In a tense meeting, a colleague criticizes your work. What is the best first response to demonstrate composure?',
                            options: [
                                'Immediately defend your work and point out their flaws.',
                                'Take a slow breath and ask, "Can you help me understand which part is most concerning to you?"',
                                'Say nothing and shut down.',
                                'Tell them they are being unprofessional.'
                            ],
                            correctAnswer: 'Take a slow breath and ask, "Can you help me understand which part is most concerning to you?"',
                            feedback: {
                                correct: "Exactly. This response combines the pause (breath) with a clarifying question, de-escalating the situation and gathering information.",
                                incorrect: "The most composed response is to pause and ask a clarifying question. This prevents an emotional reaction and shifts the focus to problem-solving."
                            }
                        }
                    ]
                },
                {
                    id: 'l1-4',
                    title: 'Pillar 4: Connection',
                    isCompleted: false,
                    steps: [
                        {
                            id: 's1-4-1',
                            type: 'script',
                            content: `<h4>Pillar 4: Connection - Building Bridges, Not Walls</h4><p>Connection is about making others feel heard, valued, and understood. It's the skill that transforms individual contributors into leaders that others want to follow.</p><p class="mt-4 font-semibold">Building connection through active listening:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li><strong>Level 1 - Passive listening:</strong> You're quiet, but your mind is preparing your response.</li><li><strong>Level 2 - Active listening:</strong> You're focused on understanding, asking clarifying questions, and reflecting back what you heard.</li><li><strong>Level 3 - Empathetic listening:</strong> You're not just hearing words, but understanding the emotions and motivations behind them.</li></ul><p class="mt-4 font-semibold">Building connection through recognition:</p><p><em>Generic:</em> "Good job."</p><p><em>Specific:</em> "Your decision to add automated testing caught three bugs. That attention to quality made a real difference."</p><p><em>Development-focused:</em> "The way you explained that complex concept to the sales team showed real leadership. That skill will serve you well."</p>`
                        },
                        {
                            id: 's1-4-2',
                            type: 'quiz_mcq',
                            question: 'A junior team member successfully completes their first solo project. Which form of recognition best demonstrates the "Connection" pillar?',
                            options: [
                                'A quick "good job" in team chat.',
                                'Mentioning their success in the weekly team meeting.',
                                '"The way you managed the project timeline and communicated risks was exactly what we look for in future leaders on this team. Great work."',
                                'Giving them an even harder project next time.'
                            ],
                            correctAnswer: '"The way you managed the project timeline and communicated risks was exactly what we look for in future leaders on this team. Great work."',
                            feedback: {
                                correct: "Yes. This feedback is specific, ties their actions to valued leadership behaviors, and encourages future growth.",
                                incorrect: "Specific, development-focused feedback is the most powerful way to build connection and motivate your colleagues."
                            }
                        }
                    ]
                },
                {
                    id: 'l1-5',
                    title: 'Synthesis: Putting It All Together',
                    isCompleted: false,
                    startDate: undefined,
                    steps: [
                        {
                            id: 's1-5-1',
                            type: 'synthesis',
                            title: 'Daily Practices to Build Leadership Presence',
                            intro: "Leadership presence isn't about perfecting each pillar in isolation—it's about integrating them into a consistent way of showing up. The following is a guided 8-week plan to help you build these skills daily. Each week, focus on the assigned tasks.",
                            weeklyPractices: [
                                {
                                    id: 'w1-2',
                                    startWeek: 1,
                                    endWeek: 2,
                                    focus: 'Authenticity Focus',
                                    tasks: [
                                        "Practice admitting when you don't know something in low-stakes situations.",
                                        "Give credit to others at least once per day.",
                                        "When you make a mistake, own it immediately and share what you learned."
                                    ]
                                },
                                {
                                    id: 'w3-4',
                                    startWeek: 3,
                                    endWeek: 4,
                                    focus: 'Consistency Focus',
                                    tasks: [
                                        "Track three commitments you make each day and whether you keep them.",
                                        "Use the same decision-making criteria for similar situations.",
                                        "Develop a standard way of responding to common requests."
                                    ]
                                },
                                {
                                    id: 'w5-6',
                                    startWeek: 5,
                                    endWeek: 6,
                                    focus: 'Composure Focus',
                                    tasks: [
                                        "Practice the 3-breath technique during routine conversations.",
                                        "When someone shares bad news, pause and ask a clarifying question before reacting.",
                                        "Start meetings with a brief moment to center yourself."
                                    ]
                                },
                                {
                                    id: 'w7-8',
                                    startWeek: 7,
                                    endWeek: 8,
                                    focus: 'Connection Focus',
                                    tasks: [
                                        "Ask one genuine question about each person you work with each day.",
                                        "Practice level 3 listening in at least one conversation daily.",
                                        "Give specific, development-focused recognition to colleagues."
                                    ]
                                }
                            ],
                            outro: "Signs of growth include: people seeking your input more often, feeling more confident in meetings, and your influence growing even without a formal title."
                        }
                    ]
                },
                {
                    id: 'l1-6',
                    title: 'Activity: Self-Discovery',
                    isCompleted: false,
                    steps: [
                        {
                            id: 's1-6-1',
                            type: 'activity',
                            content: `<h4>Part A: Authenticity Assessment</h4><p>Think about your last work week. For each situation below, write what you actually did and what a more authentic response might have looked like:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li>Someone praised you for work that involved others.</li><li>You were asked about something you weren’t sure about.</li><li>You made an error that affected others.</li></ul>`
                        },
                        {
                            id: 's1-6-2',
                            type: 'activity',
                            content: `<h4>Part B: Composure Practice</h4><p>List your top 3 work stress triggers, the physical signs you notice, your usual reaction, and a more composed response you could try for each.</p>`
                        },
                        {
                            id: 's1-6-3',
                            type: 'activity',
                            content: `<h4>Part C: Connection Experiment</h4><p>Choose three colleagues and practice Level 2 listening (active listening), Level 3 listening (empathetic listening), and specific recognition. Note your observations and their responses for each person.</p>`
                        }
                    ]
                },
                {
                    id: 'l1-7',
                    title: 'Practice Scenario: The Project Conflict',
                    isCompleted: false,
                    type: 'practice',
                    steps: [
                        {
                            id: 's1-7-1',
                            type: 'practice',
                            scenario: {
                                persona: 'Team Lead',
                                difficulty: 'strict',
                                scenario: `You’re part of a six-person project team. In a meeting, Elena says: "James, your dashboard design doesn’t make sense. It’s going to confuse users." James fires back: "Well maybe if the requirements had been clear, I wouldn’t have designed it this way!" The tension is rising. You need to intervene to de-escalate the conflict and refocus the team.`
                            }
                        }
                    ]
                }
            ]
        }
    ];
const getFromStorage = (key)=>{
    if ("TURBOPACK compile-time truthy", 1) return [];
    "TURBOPACK unreachable";
    const json = undefined;
};
const saveToStorage = (key, data)=>{
    if ("TURBOPACK compile-time truthy", 1) return;
    "TURBOPACK unreachable";
};
const getMockLeadershipData = ()=>{
    const modules = getModulesForEmployeeToLead();
    const mockNomination = {
        id: 'mock-lead-1',
        nominatedBy: 'Manager',
        nomineeRole: 'Team Lead',
        targetRole: 'AM',
        mentorRole: 'Manager',
        status: 'InProgress',
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
        modules: modules.map((m, i)=>({
                ...m,
                isCompleted: i < 0
            })),
        modulesCompleted: 0,
        currentModuleId: 'm1',
        certified: false,
        lastUpdated: new Date().toISOString()
    };
    return [
        mockNomination
    ];
};
async function nominateForLeadership(managerRole, nomineeRole, targetRole, mentorRole) {
    const allNominations = getFromStorage(LEADERSHIP_COACHING_KEY);
    const now = new Date().toISOString();
    const initialModules = getModulesForEmployeeToLead();
    const newNomination = {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        nominatedBy: managerRole,
        nomineeRole,
        targetRole: targetRole,
        mentorRole: mentorRole,
        status: 'InProgress',
        startDate: now,
        modules: initialModules.map((m)=>({
                ...m,
                lessons: m.lessons.map((l)=>({
                        ...l,
                        userInputs: {}
                    })) // Initialize userInputs
            })),
        modulesCompleted: 0,
        currentModuleId: initialModules[0].id,
        certified: false,
        lastUpdated: now
    };
    allNominations.unshift(newNomination);
    saveToStorage(LEADERSHIP_COACHING_KEY, allNominations);
    // Create a notification for the nominated user
    const managerName = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$role$2d$mapping$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roleUserMapping"][managerRole]?.name || managerRole;
    const notification = {
        trackingId: `LD-NOM-${newNomination.id}`,
        subject: `You've been enrolled in the Leadership Development Program!`,
        message: `Congratulations! ${managerName} has enrolled you in the Leadership Development Program.\n\nThis program is designed to help you grow from a subject matter expert into an effective leader. You can track your progress and access modules in the "Leadership" section.`,
        submittedAt: new Date(now),
        criticality: 'Low',
        status: 'Pending Acknowledgement',
        assignedTo: [
            nomineeRole
        ],
        viewed: false,
        auditTrail: [
            {
                event: 'Notification Created',
                timestamp: new Date(now),
                actor: 'System',
                details: `Automated notification for Leadership Program enrollment.`
            }
        ]
    };
    const allFeedback = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$services$2f$feedback$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getFeedbackFromStorage"])();
    allFeedback.unshift(notification);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$services$2f$feedback$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveFeedbackToStorage"])(allFeedback);
    return newNomination;
}
async function getLeadershipNominationsForManager(managerRole) {
    const allNominations = getFromStorage(LEADERSHIP_COACHING_KEY);
    return allNominations.filter((n)=>n.nominatedBy === managerRole).sort((a, b)=>new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}
async function getNominationForUser(userRole) {
    const allNominations = getFromStorage(LEADERSHIP_COACHING_KEY);
    return allNominations.find((n)=>n.nomineeRole === userRole) || null;
}
async function getNominationsForMentor(mentorRole) {
    const allNominations = getFromStorage(LEADERSHIP_COACHING_KEY);
    return allNominations.filter((n)=>n.mentorRole === mentorRole);
}
async function completeLeadershipLesson(nominationId, moduleId, lessonId) {
    const nominations = getFromStorage(LEADERSHIP_COACHING_KEY);
    const nomIndex = nominations.findIndex((n)=>n.id === nominationId);
    if (nomIndex === -1) return;
    const nomination = nominations[nomIndex];
    const modIndex = nomination.modules.findIndex((m)=>m.id === moduleId);
    if (modIndex === -1) return;
    const lessonIndex = nomination.modules[modIndex].lessons.findIndex((l)=>l.id === lessonId);
    if (lessonIndex !== -1) {
        nomination.modules[modIndex].lessons[lessonIndex].isCompleted = true;
    }
    // Check if module is complete
    const module = nomination.modules[modIndex];
    const allLessonsCompleted = module.lessons.every((l)=>l.isCompleted);
    if (allLessonsCompleted && !module.isCompleted) {
        module.isCompleted = true;
        nomination.modulesCompleted = nomination.modules.filter((m)=>m.isCompleted).length;
        // Unlock next module
        const nextModule = nomination.modules[modIndex + 1];
        if (nextModule) {
            nomination.currentModuleId = nextModule.id;
        } else {
            // All modules completed
            nomination.status = 'Completed';
        }
    }
    nomination.lastUpdated = new Date().toISOString();
    saveToStorage(LEADERSHIP_COACHING_KEY, nominations);
}
async function saveLeadershipLessonAnswer(nominationId, lessonId, stepId, answer) {
    const nominations = getFromStorage(LEADERSHIP_COACHING_KEY);
    const nomIndex = nominations.findIndex((n)=>n.id === nominationId);
    if (nomIndex === -1) return;
    const nomination = nominations[nomIndex];
    // Find the correct lesson across all modules
    let lesson;
    for (const module of nomination.modules){
        lesson = module.lessons.find((l)=>l.id === lessonId);
        if (lesson) break;
    }
    if (lesson) {
        if (!lesson.userInputs) {
            lesson.userInputs = {};
        }
        lesson.userInputs[stepId] = answer;
        nomination.lastUpdated = new Date().toISOString();
        saveToStorage(LEADERSHIP_COACHING_KEY, nominations);
    } else {
        console.error(`Lesson with ID ${lessonId} not found in nomination ${nominationId}`);
    }
}
}}),

};

//# sourceMappingURL=frontend_src_services_978be138._.js.map