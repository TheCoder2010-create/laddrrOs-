import os
import json
import uuid
import asyncio
from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from pymongo import MongoClient

load_dotenv()

app = FastAPI(title="AccountabilityOS API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

client = MongoClient(os.environ.get("MONGO_URL"))
db = client[os.environ.get("DB_NAME")]

# Collections
users_col = db["users"]
sessions_col = db["one_on_one_sessions"]
critical_cases_col = db["critical_cases"]
coaching_goals_col = db["coaching_goals"]
nets_sessions_col = db["nets_sessions"]
surveys_col = db["surveys"]
survey_responses_col = db["survey_responses"]
messages_col = db["messages"]
kpi_frameworks_col = db["kpi_frameworks"]
nominations_col = db["nominations"]
insights_col = db["insights"]

# ─── AI Service ───
from ai_service import (
    analyze_one_on_one, generate_briefing_packet, nets_simulate,
    nets_nudge, nets_scorecard, coaching_feedback, generate_survey_questions,
    analyze_survey, generate_scenario_suggestion, performance_chat,
    generate_leadership_pulse, summarize_leadership_pulse
)

# ─── Pydantic Models ───
class RoleUpdate(BaseModel):
    role: str

class FeedbackSubmission(BaseModel):
    session_id: Optional[str] = None
    employee_id: str
    employee_name: str
    meeting_location: str = "office"
    feedback_tone: int = 3
    reception_quality: int = 3
    growth_trajectory: str = "growing"
    stress_signs: list = []
    expressed_aspirations: str = ""
    appreciation_given: bool = False
    detailed_notes: str = ""
    transcript: str = ""
    daily_recording_url: str = ""

class NetsStartInput(BaseModel):
    scenario: str
    persona: str = "Team Lead"
    difficulty: str = "neutral"

class NetsChatInput(BaseModel):
    session_id: str
    message: str

class NetsNudgeInput(BaseModel):
    session_id: str

class CoachingGoalInput(BaseModel):
    title: str
    description: str
    source: str = "ai"
    start_date: str = ""
    target_end_date: str = ""
    resource: Optional[dict] = None

class GoalUpdateInput(BaseModel):
    progress: int
    notes: str = ""

class SurveyCreateInput(BaseModel):
    objective: str
    target_audience: list = []
    due_date: str = ""

class SurveyResponseInput(BaseModel):
    survey_id: str
    responses: list = []

class MessageActionInput(BaseModel):
    action: str
    response_text: str = ""
    private_notes: str = ""

class CriticalCaseActionInput(BaseModel):
    action: str
    response_text: str = ""
    private_notes: str = ""

class BriefingPacketInput(BaseModel):
    session_id: str
    employee_id: str

class PerformanceChatInput(BaseModel):
    message: str
    context: dict = {}

class ScenarioSuggestionInput(BaseModel):
    user_role: str = "employee"

class KPIFrameworkInput(BaseModel):
    methodology: str = "okr"
    review_frequency: str = "quarterly"
    tracking_level: str = "team"
    review_groups: list = []

class NominationInput(BaseModel):
    nominee_name: str
    nominee_id: str = ""
    target_role: str = ""
    program_type: str = "interviewer"

class CoachingDeclineInput(BaseModel):
    goal_id: str
    reason: str

class PulseQuestionInput(BaseModel):
    survey_id: str
    questions: dict = {}

class AssignCoachingInput(BaseModel):
    target_id: str
    target_name: str
    recommendation: str
    priority: str = "medium"

# ─── Seed Data ───
def seed_database():
    if users_col.count_documents({}) > 0:
        return
    employees = [
        {"user_id": "emp-001", "name": "Alex Rivera", "role": "employee", "team": "Engineering", "scores": {"overall": 78, "project_delivery": 82, "goal_completion": 74, "communication": 80}, "trends": {"overall": "up", "project_delivery": "up", "goal_completion": "stable", "communication": "up"}},
        {"user_id": "emp-002", "name": "Jordan Kim", "role": "employee", "team": "Engineering", "scores": {"overall": 85, "project_delivery": 88, "goal_completion": 82, "communication": 85}, "trends": {"overall": "up", "project_delivery": "up", "goal_completion": "up", "communication": "stable"}},
        {"user_id": "emp-003", "name": "Sam Patel", "role": "employee", "team": "Design", "scores": {"overall": 72, "project_delivery": 70, "goal_completion": 68, "communication": 78}, "trends": {"overall": "down", "project_delivery": "stable", "goal_completion": "down", "communication": "up"}},
        {"user_id": "emp-004", "name": "Casey Morgan", "role": "employee", "team": "Marketing", "scores": {"overall": 90, "project_delivery": 92, "goal_completion": 88, "communication": 90}, "trends": {"overall": "up", "project_delivery": "up", "goal_completion": "up", "communication": "up"}},
        {"user_id": "tl-001", "name": "Taylor Chen", "role": "team_lead", "team": "Engineering", "scores": {"overall": 83, "project_delivery": 85, "goal_completion": 80, "communication": 84}},
        {"user_id": "am-001", "name": "Morgan Blake", "role": "am", "team": "Operations"},
        {"user_id": "mgr-001", "name": "Dana Foster", "role": "manager", "team": "All"},
        {"user_id": "hr-001", "name": "Robin Hayes", "role": "hr_head", "team": "All"},
    ]
    users_col.insert_many(employees)

    # Seed some sessions
    sample_sessions = [
        {"session_id": str(uuid.uuid4()), "supervisor_id": "tl-001", "supervisor_name": "Taylor Chen", "employee_id": "emp-001", "employee_name": "Alex Rivera", "date": "2026-01-10T10:00:00Z", "status": "completed", "analysis": None, "meeting_location": "office"},
        {"session_id": str(uuid.uuid4()), "supervisor_id": "tl-001", "supervisor_name": "Taylor Chen", "employee_id": "emp-002", "employee_name": "Jordan Kim", "date": "2026-01-15T14:00:00Z", "status": "upcoming", "analysis": None, "meeting_location": "remote"},
        {"session_id": str(uuid.uuid4()), "supervisor_id": "tl-001", "supervisor_name": "Taylor Chen", "employee_id": "emp-003", "employee_name": "Sam Patel", "date": "2026-01-18T09:00:00Z", "status": "upcoming", "analysis": None, "meeting_location": "hybrid"},
    ]
    sessions_col.insert_many(sample_sessions)

    # Seed coaching goals
    sample_goals = [
        {"goal_id": str(uuid.uuid4()), "user_id": "tl-001", "title": "Improve Active Listening", "description": "Practice reflective listening in 1-on-1 meetings", "source": "ai", "status": "active", "progress": 35, "start_date": "2026-01-01", "target_end_date": "2026-03-01", "check_ins": [], "resource": {"type": "book", "title": "Just Listen", "author": "Mark Goulston"}, "created_at": datetime.now(timezone.utc).isoformat()},
        {"goal_id": str(uuid.uuid4()), "user_id": "emp-001", "title": "Public Speaking Confidence", "description": "Present in at least 2 team meetings per month", "source": "custom", "status": "active", "progress": 50, "start_date": "2025-12-15", "target_end_date": "2026-02-28", "check_ins": [], "resource": None, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    coaching_goals_col.insert_many(sample_goals)

    # Seed some insights
    sample_insights = [
        {"user_id": "emp-001", "insight": "Your communication scores improved 12% this quarter - keep leveraging structured agendas.", "created_at": datetime.now(timezone.utc).isoformat()},
        {"user_id": "emp-001", "insight": "Your supervisor noted strong problem-solving in the last sprint review.", "created_at": datetime.now(timezone.utc).isoformat()},
        {"user_id": "emp-001", "insight": "Consider asking for more cross-functional project opportunities to boost visibility.", "created_at": datetime.now(timezone.utc).isoformat()},
        {"user_id": "emp-002", "insight": "Consistent high performance in project delivery - you're in the top 15% of your team.", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    insights_col.insert_many(sample_insights)

seed_database()

# ─── Health ───
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "AccountabilityOS"}

# ─── Users & Roles ───
@app.get("/api/users")
def get_users():
    return list(users_col.find({}, {"_id": 0}))

@app.get("/api/users/{user_id}")
def get_user(user_id: str):
    user = users_col.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")
    return user

# ─── Dashboard Data ───
@app.get("/api/dashboard/{role}")
def get_dashboard(role: str):
    data = {"role": role}
    if role == "employee":
        data["employees"] = list(users_col.find({"role": "employee"}, {"_id": 0}))
        data["upcoming_meetings"] = list(sessions_col.find({"status": "upcoming"}, {"_id": 0}).limit(5))
        data["insights"] = list(insights_col.find({}, {"_id": 0}).limit(10))
    elif role == "team_lead":
        data["team_members"] = list(users_col.find({"role": "employee"}, {"_id": 0}))
        data["upcoming_meetings"] = list(sessions_col.find({"status": "upcoming"}, {"_id": 0}))
        data["recent_sessions"] = list(sessions_col.find({"status": "completed"}, {"_id": 0}).sort("date", -1).limit(5))
        data["pending_cases"] = list(critical_cases_col.find({"status": {"$ne": "resolved"}}, {"_id": 0}).limit(5))
    elif role == "am":
        data["team_leads"] = list(users_col.find({"role": "team_lead"}, {"_id": 0}))
        data["pending_cases"] = list(critical_cases_col.find({"current_level": {"$gte": 3}}, {"_id": 0}))
        data["pending_reviews"] = list(coaching_goals_col.find({"status": "pending_am_review"}, {"_id": 0}))
    elif role == "manager":
        data["all_users"] = list(users_col.find({}, {"_id": 0}))
        data["pending_cases"] = list(critical_cases_col.find({"current_level": {"$gte": 4}}, {"_id": 0}))
        data["frameworks"] = list(kpi_frameworks_col.find({}, {"_id": 0}))
        data["nominations"] = list(nominations_col.find({}, {"_id": 0}))
    elif role == "hr_head":
        data["all_users"] = list(users_col.find({}, {"_id": 0}))
        data["surveys"] = list(surveys_col.find({}, {"_id": 0}))
        data["pending_cases"] = list(critical_cases_col.find({"current_level": 5}, {"_id": 0}))
        data["org_health"] = {"total_employees": users_col.count_documents({"role": "employee"}), "active_surveys": surveys_col.count_documents({"status": "active"})}
    return data

# ─── 1-on-1 Sessions ───
@app.get("/api/one-on-one/sessions")
def get_sessions():
    return list(sessions_col.find({}, {"_id": 0}))

@app.post("/api/one-on-one/sessions")
def create_session(data: dict):
    session = {
        "session_id": str(uuid.uuid4()),
        "supervisor_id": data.get("supervisor_id", "tl-001"),
        "supervisor_name": data.get("supervisor_name", "Taylor Chen"),
        "employee_id": data.get("employee_id"),
        "employee_name": data.get("employee_name"),
        "date": data.get("date"),
        "status": "upcoming",
        "analysis": None,
        "meeting_location": data.get("meeting_location", "office"),
    }
    sessions_col.insert_one(session)
    session.pop("_id", None)
    return session

@app.get("/api/one-on-one/sessions/{session_id}")
def get_session(session_id: str):
    s = sessions_col.find_one({"session_id": session_id}, {"_id": 0})
    if not s:
        raise HTTPException(404, "Session not found")
    return s

# ─── Feedback & Analysis ───
@app.post("/api/one-on-one/feedback")
async def submit_feedback(data: FeedbackSubmission):
    sid = data.session_id or str(uuid.uuid4())
    session_data = {
        "session_id": sid,
        "employee_id": data.employee_id,
        "employee_name": data.employee_name,
        "meeting_location": data.meeting_location,
        "feedback_tone": data.feedback_tone,
        "reception_quality": data.reception_quality,
        "growth_trajectory": data.growth_trajectory,
        "stress_signs": data.stress_signs,
        "expressed_aspirations": data.expressed_aspirations,
        "appreciation_given": data.appreciation_given,
        "detailed_notes": data.detailed_notes,
        "transcript": data.transcript,
        "daily_recording_url": data.daily_recording_url,
        "status": "analyzing",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
    sessions_col.update_one({"session_id": sid}, {"$set": session_data}, upsert=True)

    # Get employee data for context
    employee = users_col.find_one({"user_id": data.employee_id}, {"_id": 0})
    goals = list(coaching_goals_col.find({"user_id": data.employee_id}, {"_id": 0}))

    try:
        analysis = await analyze_one_on_one(session_data, employee, goals)
        sessions_col.update_one({"session_id": sid}, {"$set": {"analysis": analysis, "status": "completed"}})

        # Save employee insights
        if analysis.get("employee_insights"):
            for insight_text in analysis["employee_insights"]:
                insights_col.insert_one({"user_id": data.employee_id, "insight": insight_text, "created_at": datetime.now(timezone.utc).isoformat()})

        # Create critical case if needed
        if analysis.get("critical_coaching_insight"):
            case = {
                "case_id": str(uuid.uuid4()),
                "session_id": sid,
                "insight": analysis["critical_coaching_insight"],
                "status": "pending_supervisor",
                "current_level": 1,
                "timeline": [{"timestamp": datetime.now(timezone.utc).isoformat(), "actor": "system", "action": "Critical insight detected by AI"}],
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            critical_cases_col.insert_one(case)

        # Create coaching recommendations
        if analysis.get("coaching_recommendations"):
            for rec in analysis["coaching_recommendations"]:
                goal = {
                    "goal_id": str(uuid.uuid4()),
                    "user_id": "tl-001",
                    "title": rec.get("title", ""),
                    "description": rec.get("description", ""),
                    "source": "ai",
                    "status": "pending",
                    "progress": 0,
                    "start_date": "",
                    "target_end_date": "",
                    "check_ins": [],
                    "resource": rec.get("recommended_resource"),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                coaching_goals_col.insert_one(goal)

        return {"session_id": sid, "status": "completed", "analysis": analysis}
    except Exception as e:
        sessions_col.update_one({"session_id": sid}, {"$set": {"status": "error", "error": str(e)}})
        return {"session_id": sid, "status": "error", "error": str(e)}

@app.post("/api/one-on-one/briefing-packet")
async def get_briefing_packet(data: BriefingPacketInput):
    sessions = list(sessions_col.find({"employee_id": data.employee_id}, {"_id": 0}).sort("date", -1).limit(10))
    employee = users_col.find_one({"user_id": data.employee_id}, {"_id": 0})
    goals = list(coaching_goals_col.find({"user_id": data.employee_id}, {"_id": 0}))
    packet = await generate_briefing_packet(sessions, employee, goals)
    return packet

# ─── Critical Cases ───
@app.get("/api/critical-cases")
def get_critical_cases():
    return list(critical_cases_col.find({}, {"_id": 0}))

@app.get("/api/critical-cases/{case_id}")
def get_critical_case(case_id: str):
    c = critical_cases_col.find_one({"case_id": case_id}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Case not found")
    return c

@app.post("/api/critical-cases/{case_id}/action")
def critical_case_action(case_id: str, data: CriticalCaseActionInput):
    case = critical_cases_col.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(404, "Case not found")
    
    timeline_entry = {"timestamp": datetime.now(timezone.utc).isoformat(), "actor": data.action, "action": data.action, "response": data.response_text, "private_notes": data.private_notes}
    
    status_map = {
        "supervisor_respond": "pending_employee",
        "employee_satisfied": "resolved",
        "employee_not_satisfied": "pending_am",
        "am_coach_supervisor": "pending_supervisor_retry",
        "am_address_directly": "pending_employee",
        "manager_review": "pending_hr",
        "hr_address": "pending_employee",
        "hr_final": "resolved",
    }
    
    new_status = status_map.get(data.action, case["status"])
    level_map = {"pending_supervisor": 1, "pending_employee": 2, "pending_am": 3, "pending_manager": 4, "pending_hr": 5}
    new_level = level_map.get(new_status, case.get("current_level", 1))
    
    critical_cases_col.update_one({"case_id": case_id}, {"$set": {"status": new_status, "current_level": new_level}, "$push": {"timeline": timeline_entry}})
    updated = critical_cases_col.find_one({"case_id": case_id}, {"_id": 0})
    return updated

# ─── Nets Practice Arena ───
@app.post("/api/nets/start")
def start_nets_session(data: NetsStartInput):
    session = {
        "session_id": str(uuid.uuid4()),
        "scenario": data.scenario,
        "persona": data.persona,
        "difficulty": data.difficulty,
        "messages": [],
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    nets_sessions_col.insert_one(session)
    session.pop("_id", None)
    return session

@app.post("/api/nets/chat")
async def nets_chat(data: NetsChatInput):
    session = nets_sessions_col.find_one({"session_id": data.session_id})
    if not session:
        raise HTTPException(404, "Session not found")
    
    session["messages"].append({"role": "user", "content": data.message, "timestamp": datetime.now(timezone.utc).isoformat()})
    
    ai_response = await nets_simulate(session["scenario"], session["persona"], session["difficulty"], session["messages"])
    session["messages"].append({"role": "ai", "content": ai_response, "timestamp": datetime.now(timezone.utc).isoformat()})
    
    nets_sessions_col.update_one({"session_id": data.session_id}, {"$set": {"messages": session["messages"]}})
    return {"response": ai_response, "messages": session["messages"]}

@app.post("/api/nets/nudge")
async def get_nets_nudge(data: NetsNudgeInput):
    session = nets_sessions_col.find_one({"session_id": data.session_id})
    if not session:
        raise HTTPException(404, "Session not found")
    nudge = await nets_nudge(session["messages"], session["scenario"])
    return nudge

@app.post("/api/nets/end")
async def end_nets_session(data: NetsNudgeInput):
    session = nets_sessions_col.find_one({"session_id": data.session_id})
    if not session:
        raise HTTPException(404, "Session not found")
    scorecard = await nets_scorecard(session["messages"], session["scenario"], session["persona"])
    nets_sessions_col.update_one({"session_id": data.session_id}, {"$set": {"status": "completed", "scorecard": scorecard}})
    return scorecard

@app.post("/api/nets/suggest-scenario")
async def suggest_scenario(data: ScenarioSuggestionInput):
    sessions = list(sessions_col.find({}, {"_id": 0}).sort("date", -1).limit(5))
    suggestion = await generate_scenario_suggestion(data.user_role, sessions)
    return suggestion

@app.get("/api/nets/sessions")
def get_nets_sessions():
    return list(nets_sessions_col.find({}, {"_id": 0}).sort("created_at", -1))

# ─── Coaching & Development ───
@app.get("/api/coaching/goals")
def get_coaching_goals(user_id: str = ""):
    query = {"user_id": user_id} if user_id else {}
    return list(coaching_goals_col.find(query, {"_id": 0}))

@app.post("/api/coaching/goals")
def create_coaching_goal(data: CoachingGoalInput):
    goal = {
        "goal_id": str(uuid.uuid4()),
        "user_id": "tl-001",
        "title": data.title,
        "description": data.description,
        "source": data.source,
        "status": "active",
        "progress": 0,
        "start_date": data.start_date,
        "target_end_date": data.target_end_date,
        "check_ins": [],
        "resource": data.resource,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    coaching_goals_col.insert_one(goal)
    goal.pop("_id", None)
    return goal

@app.put("/api/coaching/goals/{goal_id}/accept")
def accept_goal(goal_id: str, data: dict):
    coaching_goals_col.update_one({"goal_id": goal_id}, {"$set": {"status": "active", "start_date": data.get("start_date", ""), "target_end_date": data.get("target_end_date", "")}})
    return coaching_goals_col.find_one({"goal_id": goal_id}, {"_id": 0})

@app.put("/api/coaching/goals/{goal_id}/decline")
def decline_goal(goal_id: str, data: CoachingDeclineInput):
    coaching_goals_col.update_one({"goal_id": goal_id}, {"$set": {"status": "pending_am_review", "decline_reason": data.reason}})
    return coaching_goals_col.find_one({"goal_id": goal_id}, {"_id": 0})

@app.put("/api/coaching/goals/{goal_id}/update")
def update_goal_progress(goal_id: str, data: GoalUpdateInput):
    check_in = {"timestamp": datetime.now(timezone.utc).isoformat(), "progress": data.progress, "notes": data.notes}
    coaching_goals_col.update_one({"goal_id": goal_id}, {"$set": {"progress": data.progress}, "$push": {"check_ins": check_in}})
    return coaching_goals_col.find_one({"goal_id": goal_id}, {"_id": 0})

@app.post("/api/coaching/feedback")
async def get_coaching_feedback(data: dict):
    fb = await coaching_feedback(data.get("goal_description", ""), data.get("situation", ""), data.get("check_ins", []))
    return fb

@app.put("/api/coaching/goals/{goal_id}/am-review")
def am_review_goal(goal_id: str, data: dict):
    action = data.get("action", "approve_decline")
    if action == "uphold_ai":
        coaching_goals_col.update_one({"goal_id": goal_id}, {"$set": {"status": "active", "upheld_by_am": True}})
    else:
        coaching_goals_col.update_one({"goal_id": goal_id}, {"$set": {"status": "declined"}})
    return coaching_goals_col.find_one({"goal_id": goal_id}, {"_id": 0})

# ─── Goals & KPI Framework ───
@app.get("/api/kpi/frameworks")
def get_frameworks():
    return list(kpi_frameworks_col.find({}, {"_id": 0}))

@app.post("/api/kpi/frameworks")
def create_framework(data: KPIFrameworkInput):
    fw = {
        "framework_id": str(uuid.uuid4()),
        "methodology": data.methodology,
        "review_frequency": data.review_frequency,
        "tracking_level": data.tracking_level,
        "review_groups": data.review_groups,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    kpi_frameworks_col.insert_one(fw)
    fw.pop("_id", None)
    return fw

# ─── Manager's Lab ───
@app.get("/api/nominations")
def get_nominations():
    return list(nominations_col.find({}, {"_id": 0}))

@app.post("/api/nominations")
def create_nomination(data: NominationInput):
    nom = {
        "nomination_id": str(uuid.uuid4()),
        "nominee_name": data.nominee_name,
        "nominee_id": data.nominee_id or str(uuid.uuid4()),
        "target_role": data.target_role,
        "program_type": data.program_type,
        "status": "nominated",
        "pre_score": None,
        "post_score": None,
        "progress": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    nominations_col.insert_one(nom)
    nom.pop("_id", None)
    return nom

# ─── Org Health & Surveys ───
@app.get("/api/surveys")
def get_surveys():
    return list(surveys_col.find({}, {"_id": 0}))

@app.post("/api/surveys")
async def create_survey(data: SurveyCreateInput):
    questions = await generate_survey_questions(data.objective)
    survey = {
        "survey_id": str(uuid.uuid4()),
        "objective": data.objective,
        "target_audience": data.target_audience,
        "due_date": data.due_date,
        "questions": questions,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    surveys_col.insert_one(survey)
    survey.pop("_id", None)
    return survey

@app.put("/api/surveys/{survey_id}/deploy")
def deploy_survey(survey_id: str, data: dict = {}):
    selected = data.get("selected_questions", [])
    update = {"status": "active"}
    if selected:
        update["questions"] = selected
    surveys_col.update_one({"survey_id": survey_id}, {"$set": update})
    return surveys_col.find_one({"survey_id": survey_id}, {"_id": 0})

@app.post("/api/surveys/{survey_id}/respond")
def respond_to_survey(survey_id: str, data: SurveyResponseInput):
    response = {
        "response_id": str(uuid.uuid4()),
        "survey_id": survey_id,
        "responses": data.responses,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
    survey_responses_col.insert_one(response)
    response.pop("_id", None)
    return response

@app.post("/api/surveys/{survey_id}/analyze")
async def analyze_survey_results(survey_id: str):
    responses = list(survey_responses_col.find({"survey_id": survey_id}, {"_id": 0}))
    survey = surveys_col.find_one({"survey_id": survey_id}, {"_id": 0})
    result = await analyze_survey(survey, responses)
    surveys_col.update_one({"survey_id": survey_id}, {"$set": {"analysis": result}})
    return result

@app.post("/api/surveys/{survey_id}/leadership-pulse")
async def gen_leadership_pulse(survey_id: str):
    survey = surveys_col.find_one({"survey_id": survey_id}, {"_id": 0})
    if not survey or not survey.get("analysis"):
        raise HTTPException(400, "Survey must be analyzed first")
    pulse = await generate_leadership_pulse(survey["analysis"])
    surveys_col.update_one({"survey_id": survey_id}, {"$set": {"leadership_pulse": pulse}})
    return pulse

@app.post("/api/surveys/{survey_id}/send-pulse")
def send_pulse(survey_id: str, data: PulseQuestionInput):
    for role, questions in data.questions.items():
        for q in questions:
            msg = {
                "message_id": str(uuid.uuid4()),
                "type": "pulse_survey",
                "survey_id": survey_id,
                "target_role": role,
                "question": q,
                "response": None,
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            messages_col.insert_one(msg)
    return {"status": "sent"}

@app.post("/api/surveys/{survey_id}/final-analysis")
async def final_survey_analysis(survey_id: str):
    survey = surveys_col.find_one({"survey_id": survey_id}, {"_id": 0})
    pulse_responses = list(messages_col.find({"survey_id": survey_id, "status": "responded"}, {"_id": 0}))
    result = await summarize_leadership_pulse(survey.get("analysis", {}), pulse_responses)
    surveys_col.update_one({"survey_id": survey_id}, {"$set": {"final_analysis": result}})
    return result

# ─── Messages ───
@app.get("/api/messages")
def get_messages(role: str = ""):
    query = {"target_role": role} if role else {}
    return list(messages_col.find(query, {"_id": 0}))

@app.put("/api/messages/{message_id}/respond")
def respond_to_message(message_id: str, data: MessageActionInput):
    messages_col.update_one({"message_id": message_id}, {"$set": {"response": data.response_text, "status": "responded"}})
    return messages_col.find_one({"message_id": message_id}, {"_id": 0})

# ─── Insights ───
@app.get("/api/insights")
def get_insights(user_id: str = ""):
    query = {"user_id": user_id} if user_id else {}
    return list(insights_col.find(query, {"_id": 0}).sort("created_at", -1).limit(10))

# ─── Performance Chat ───
@app.post("/api/performance-chat")
async def perf_chat(data: PerformanceChatInput):
    result = await performance_chat(data.message, data.context)
    return result

# ─── Coaching Assignment ───
@app.post("/api/coaching/assign")
def assign_coaching(data: AssignCoachingInput):
    goal = {
        "goal_id": str(uuid.uuid4()),
        "user_id": data.target_id,
        "title": data.recommendation,
        "description": f"Assigned from Org Health analysis",
        "source": "org_health",
        "status": "active",
        "progress": 0,
        "start_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "target_end_date": "",
        "check_ins": [],
        "resource": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    coaching_goals_col.insert_one(goal)
    goal.pop("_id", None)
    return goal
