# AccountabilityOS (Laddrr) - PRD

## Problem Statement
AI-powered HR and performance management platform for managers and employees to improve performance, communication, and leadership skills.

## Architecture
- **Frontend**: React 18 + Tailwind CSS + Lucide icons
- **Backend**: FastAPI (Python) on port 8001
- **Database**: MongoDB (local)
- **AI**: Gemini 2.5 Flash via Emergent LLM Key
- **Video**: Daily.co (MOCKED - no API key)

## User Personas & Roles (RBAC)
1. **Employee** - View scores, insights, surveys, coaching goals
2. **Team Lead** - Manage 1-on-1s, feedback, team members
3. **Area Manager** - Review escalations, coaching declines
4. **Manager** - KPI frameworks, nominations, full oversight
5. **HR Head** - Org health surveys, final escalation, analytics

## What's Been Implemented (Jan 7, 2026)

### Core
- RBAC with 5 roles + localStorage persistence
- Dark/Light theme toggle
- Sidebar navigation with role-based menu items
- Responsive layout

### Feature 1: 1-on-1 Hub
- Meeting scheduling with employee selection
- Upcoming/completed session views
- AI-powered briefing packet generation
- Video meeting UI (MOCKED)
- Feedback capture form (tone, quality, growth, stress, notes)
- AI analysis with SWOT, scores, action items, recommendations
- Critical insight detection & escalation

### Feature 2: Critical Insight Escalation
- 5-level escalation workflow (Supervisor > Employee > AM > Manager > HR)
- Timeline tracking, response forms, status progression

### Feature 3: Nets Practice Arena
- Scenario setup with persona/difficulty selection
- AI-suggested scenarios
- Real-time chat simulation with Gemini
- Mid-conversation nudge system
- Post-session scorecard (clarity, empathy, assertiveness)
- Annotated conversation review

### Feature 4: Coaching & Development Hub
- Pending AI recommendations (accept/decline)
- Active development plan with progress tracking
- Check-in history
- AI coaching feedback for goals
- AM review for declined recommendations
- Custom goal creation

### Feature 5: Goals & KPI Framework (Manager)
- 3-step setup wizard (methodology, KPIs, review)
- Multiple methodologies (Bell Curve, 9-Box, OKR, Custom)
- KPI weight validation

### Feature 6: Manager's Lab
- Interviewer Lab nominations
- Leadership Development nominations
- Progress tracking table

### Feature 7: Employee Tools
- Insight carousel on dashboard
- Performance scores with trends
- Survey response page

### Feature 8: Org Health (HR Head)
- AI-generated survey questions
- Survey deployment
- Anonymous response collection
- AI analysis of responses
- Leadership pulse generation
- Pulse distribution to leaders

## Prioritized Backlog
### P0
- [ ] Employee performance comparison side-sheet
- [ ] Real Daily.co video integration (needs API key)

### P1
- [ ] AI performance coach chat (frontend wiring)
- [ ] Interviewer Lab training modules & certification
- [ ] Leadership Development curriculum
- [ ] Survey question curation (select/deselect)

### P2
- [ ] PDF export for analysis reports & scorecards
- [ ] Notification system
- [ ] Real-time data with WebSocket
- [ ] Authentication (NextAuth/JWT)
- [ ] Firestore migration for production

## Next Tasks
1. Add employee performance comparison with peer selection
2. Wire up AI performance coach chat on employee dashboard
3. Add survey question curation interface
4. Implement interviewer lab training flow
