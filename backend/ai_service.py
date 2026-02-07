import os
import json
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

API_KEY = os.environ.get("EMERGENT_LLM_KEY")

def _make_chat(system_message: str, session_id: str = "default"):
    chat = LlmChat(api_key=API_KEY, session_id=session_id, system_message=system_message)
    chat.with_model("gemini", "gemini-2.5-flash")
    return chat

def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    try:
        return json.loads(text.strip())
    except:
        return {"raw": text}


async def analyze_one_on_one(session_data: dict, employee: dict, goals: list) -> dict:
    chat = _make_chat(
        "You are an expert HR analyst AI. Analyze 1-on-1 meeting data and provide comprehensive feedback. Always respond with valid JSON only.",
        f"analysis-{session_data.get('session_id', 'x')}"
    )
    prompt = f"""Analyze this 1-on-1 meeting and return a JSON object with these exact keys:
- supervisor_summary (string, 2-3 sentences)
- employee_summary (string, 2-3 sentences)
- leadership_score (number 1-10)
- effectiveness_score (number 1-10)
- swot_analysis (object with keys: strengths, weaknesses, opportunities, threats - each array of strings)
- strengths_observed (array of objects with keys: action, example)
- coaching_recommendations (array of objects with keys: title, description, recommended_resource with type/title/author)
- action_items (array of objects with keys: task, owner (supervisor/employee), due_date, priority)
- missed_signals (array of objects with keys: signal, context, suggested_follow_up)
- critical_coaching_insight (null or object with keys: summary, reason_for_criticality, severity, suggested_immediate_action)
- employee_insights (array of 3-4 short insight strings for the employee)

Meeting Data:
Employee: {employee.get('name', 'Unknown')} - {employee.get('team', '')}
Scores: {json.dumps(employee.get('scores', {{}}))}
Location: {session_data.get('meeting_location', 'office')}
Feedback Tone: {session_data.get('feedback_tone', 3)}/5
Reception Quality: {session_data.get('reception_quality', 3)}/5
Growth Trajectory: {session_data.get('growth_trajectory', 'growing')}
Stress Signs: {json.dumps(session_data.get('stress_signs', []))}
Aspirations: {session_data.get('expressed_aspirations', 'None mentioned')}
Appreciation Given: {session_data.get('appreciation_given', False)}
Notes: {session_data.get('detailed_notes', 'No notes')}
Transcript: {session_data.get('transcript', 'No transcript')}
Active Goals: {json.dumps([g.get('title', '') for g in goals])}

Return ONLY valid JSON."""

    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    return _parse_json(response)


async def generate_briefing_packet(sessions: list, employee: dict, goals: list) -> dict:
    chat = _make_chat(
        "You are an HR briefing assistant. Generate concise meeting preparation packets. Always respond with valid JSON.",
        "briefing"
    )
    prompt = f"""Generate a briefing packet for an upcoming 1-on-1 meeting. Return JSON with:
- for_supervisor (object with: key_discussion_points (array), critical_items_summary (string), suggested_questions (array), coaching_goal_opportunities (array))
- for_employee (object with: motivational_summary (string), suggested_talking_points (array), progress_highlights (array))
- last_sessions_summary (string)
- action_items_breakdown (object with: pending (array), completed (array))

Employee: {json.dumps(employee or {{}})}
Recent Sessions: {json.dumps(sessions[:3] if sessions else [])}
Active Goals: {json.dumps([{{"title": g.get("title"), "progress": g.get("progress")}} for g in goals])}

Return ONLY valid JSON."""

    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    return _parse_json(response)


async def nets_simulate(scenario: str, persona: str, difficulty: str, messages: list) -> str:
    difficulty_traits = {
        "friendly": "warm, supportive, agreeable, understanding",
        "neutral": "professional, fair, balanced, objective",
        "challenging": "skeptical, questioning, pushing back moderately",
        "strict": "demanding, direct, critical, high standards"
    }
    traits = difficulty_traits.get(difficulty, "professional, balanced")
    
    chat = _make_chat(
        f"""You are simulating a {persona} with a {difficulty} demeanor.
Your personality traits: {traits}
Scenario: {scenario}
Stay in character. Respond realistically (2-4 sentences). Do not break character or provide meta-commentary.
Do not use asterisks or formatting. Speak naturally as this person would.""",
        f"nets-{id(messages)}"
    )
    
    history_text = "\n".join([f"{'User' if m['role']=='user' else persona}: {m['content']}" for m in messages[:-1]]) if len(messages) > 1 else ""
    latest = messages[-1]["content"] if messages else scenario
    
    prompt = f"""Previous conversation:
{history_text}

User just said: {latest}

Respond in character as the {persona}. Keep it to 2-4 sentences."""
    
    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    return response


async def nets_nudge(messages: list, scenario: str) -> dict:
    chat = _make_chat(
        "You are a communication coach providing helpful hints. Respond with JSON only.",
        "nudge"
    )
    convo = "\n".join([f"{'User' if m['role']=='user' else 'Other'}: {m['content']}" for m in messages])
    prompt = f"""Based on this practice conversation, provide a nudge to help the user. Return JSON with:
- nudge (string, 2-3 sentence hint)
- specific_suggestion (string, one concrete thing to try next)

Scenario: {scenario}
Conversation so far:
{convo}

Return ONLY valid JSON."""

    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    return _parse_json(response)


async def nets_scorecard(messages: list, scenario: str, persona: str) -> dict:
    chat = _make_chat(
        "You are an expert communication evaluator. Analyze practice conversations and provide detailed scorecards. Respond with JSON only.",
        "scorecard"
    )
    convo = "\n".join([f"{'User' if m['role']=='user' else persona}: {m['content']}" for m in messages])
    prompt = f"""Evaluate this practice conversation and return a JSON scorecard with:
- scores (object with: clarity (1-10), empathy (1-10), assertiveness (1-10), overall (1-10))
- strengths (array of strings)
- gaps (array of strings)
- annotated_conversation (array of objects with: turn (number), speaker (user/ai), message (string), feedback (object with type positive/negative and comment, or null))
- key_takeaways (array of strings)
- practice_recommendations (array of strings)

Scenario: {scenario}
Persona: {persona}
Conversation:
{convo}

Return ONLY valid JSON."""

    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    return _parse_json(response)


async def coaching_feedback(goal_description: str, situation: str, check_ins: list) -> dict:
    chat = _make_chat(
        "You are a professional development coach. Provide actionable feedback. Respond with JSON only.",
        "coaching-fb"
    )
    prompt = f"""Provide coaching feedback for this development goal. Return JSON with:
- feedback (string, 2-3 paragraphs)
- specific_advice (array of strings)
- resource_suggestions (array of strings)

Goal: {goal_description}
Situation: {situation}
Check-in History: {json.dumps(check_ins)}

Return ONLY valid JSON."""

    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    return _parse_json(response)


async def generate_survey_questions(objective: str) -> list:
    chat = _make_chat(
        "You are an organizational psychologist specializing in workplace surveys. Respond with JSON only.",
        "survey-gen"
    )
    prompt = f"""Generate 8-10 survey questions for this objective. Return a JSON array of objects, each with:
- question (string)
- justification (string)
- question_type (text/scale/multiple_choice)

Objective: {objective}

Return ONLY a valid JSON array."""

    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    result = _parse_json(response)
    return result if isinstance(result, list) else result.get("questions", [result])


async def analyze_survey(survey: dict, responses: list) -> dict:
    chat = _make_chat(
        "You are an organizational analytics expert. Analyze anonymous survey results. Respond with JSON only.",
        "survey-analysis"
    )
    prompt = f"""Analyze these anonymous survey responses. Return JSON with:
- overall_sentiment (positive/neutral/negative/mixed)
- sentiment_score (1-10)
- key_themes (array of objects with: theme, frequency, representative_quotes)
- initial_recommendations (array of strings)
- areas_of_concern (array of strings)

Survey Objective: {survey.get('objective', '')}
Questions: {json.dumps(survey.get('questions', []))}
Responses: {json.dumps(responses)}

Return ONLY valid JSON."""

    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    return _parse_json(response)


async def generate_leadership_pulse(analysis: dict) -> dict:
    chat = _make_chat(
        "You are an HR leadership consultant. Generate targeted pulse survey questions. Respond with JSON only.",
        "pulse-gen"
    )
    prompt = f"""Based on this survey analysis, generate leadership pulse questions. Return JSON with:
- team_lead_questions (array of strings)
- am_questions (array of strings)
- manager_questions (array of strings)

Analysis: {json.dumps(analysis)}

Return ONLY valid JSON."""

    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    return _parse_json(response)


async def summarize_leadership_pulse(original_analysis: dict, pulse_responses: list) -> dict:
    chat = _make_chat(
        "You are a senior HR strategist. Synthesize survey and leadership responses into actionable plans. Respond with JSON only.",
        "pulse-summary"
    )
    prompt = f"""Synthesize the original survey analysis with leadership pulse responses. Return JSON with:
- coaching_recommendations (array of objects with: recommendation, target_audience, priority, rationale)
- root_causes (array of strings)
- quick_wins (array of strings)
- long_term_initiatives (array of strings)

Original Analysis: {json.dumps(original_analysis)}
Leadership Responses: {json.dumps(pulse_responses)}

Return ONLY valid JSON."""

    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    return _parse_json(response)


async def generate_scenario_suggestion(user_role: str, recent_sessions: list) -> dict:
    chat = _make_chat(
        "You are a professional development advisor. Suggest practice scenarios. Respond with JSON only.",
        "scenario-suggest"
    )
    prompt = f"""Suggest a practice scenario for this user. Return JSON with:
- scenario (string, detailed scenario description)
- reasoning (string)
- suggested_persona (string)
- suggested_difficulty (string: friendly/neutral/challenging/strict)

User Role: {user_role}
Recent Session Context: {json.dumps(recent_sessions[:3] if recent_sessions else [])}

Return ONLY valid JSON."""

    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    return _parse_json(response)


async def performance_chat(message: str, context: dict) -> dict:
    chat = _make_chat(
        "You are a supportive AI performance coach. Help employees understand and improve their performance. Be encouraging and specific. Keep responses concise (3-5 sentences).",
        "perf-chat"
    )
    prompt = f"""Context: {json.dumps(context)}

Employee asks: {message}

Provide helpful, specific, growth-focused advice."""

    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    return {"response": response}
