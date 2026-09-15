from pptx import Presentation
from pptx.util import Inches, Pt

prs = Presentation()

# Define slide layouts
title_slide_layout = prs.slide_layouts[0]
bullet_slide_layout = prs.slide_layouts[1]

slides_data = [
    {
        "title": "Agentic AI for Smart Event Management Operations",
        "content": ["Project: Agentic AI for Smart Event Management Operations", "Infosys Springboard Virtual Summer Internship 7.0", "Presented by: Sreecharan Maddikunta, B.Tech CSE (Data Science)"],
        "notes": "Welcome to the final presentation of my Infosys Springboard Virtual Summer Internship 7.0 project. Over the course of this internship, I developed a highly decoupled, event-driven microservices platform that utilizes Agentic AI to transform enterprise event management from a reactive, manual process into a proactive, intelligent, and real-time operational engine."
    },
    {
        "title": "The Evolution of Event Management",
        "content": ["Moving from reactive to proactive, correlated intelligence.", "Replacing manual scheduling with goal-oriented autonomous agents.", "Bridging the gap between planning, live execution, and sponsor ROI."],
        "notes": "Traditional event management relies on spreadsheets and human intuition, leading to capacity mismatches, speaker conflicts, and delayed incident responses. My platform shifts this paradigm. We moved from simple AI-assisted validation in Milestone 1 to a fully orchestrated Agentic AI system by Milestone 4, capable of parallel reasoning, live anomaly detection, and real-time executive decision support."
    },
    {
        "title": "Decoupled, Event-Driven Microservices Architecture",
        "content": ["Presentation: React.js, TailwindCSS (Student, Admin, Sponsor Portals)", "Orchestration: Node.js, Express, Socket.io", "Persistence: PostgreSQL, Prisma ORM", "Agentic Intelligence: Python, FastAPI, LangChain, Google Gemini"],
        "notes": "The system is built on a strict MVC microservices architecture. The Node.js backend handles CRUD and orchestration, while all heavy LLM reasoning is offloaded to a horizontally scalable Python FastAPI service. Socket.io binds the system together, ensuring that database state changes are instantly reflected on the frontends."
    },
    {
        "title": "Data Modeling & Referential Integrity",
        "content": ["Strictly typed relational schema using Prisma ORM.", "Junction tables (Registration, Venue/Speaker Assignments) preventing duplicate states.", "JSON fields for flexible tier-committed sponsor deliverables."],
        "notes": "Data integrity is the bedrock of the platform. Using Prisma and PostgreSQL, I designed an ACID-compliant schema. Everything from waitlist capacity checks to venue assignments is wrapped in atomic database transactions to completely eliminate race conditions under concurrent load."
    },
    {
        "title": "Milestone 1: Intelligent Registration & Validation",
        "content": ["Zero-shot LLM Spam & Identity Validation.", "Dynamic Waitlist Engine wrapped in Prisma transactions.", "Automated HTML Email Ticketing with dynamic QR codes.", "[Insert Screenshot: Student Portal Landing Page / Sign-up form]"],
        "notes": "Milestone 1 focused on the attendee experience. When a student registers, an AI Validation Engine acts as a gatekeeper, verifying their college/organization using Gemini before any database write occurs. We also implemented a dynamic waitlist engine that prevents capacity overflow during high traffic."
    },
    {
        "title": "Live Analytics & Real-Time VIP Alerts",
        "content": ["Server-side demographic aggregations via Recharts.", "HTML5 QR scanning for physical venue check-in.", "Real-time VIP arrival alerts pushed via Socket.io.", "[Insert Screenshots: Admin Dashboard & QR Scanner Module]"],
        "notes": "On the operations side, the Admin Dashboard provides real-time demographic analytics without heavy client-side processing. Furthermore, when a VIP or Sponsor's QR code is scanned at the door, a Socket.io event instantly triggers a sliding toast notification on all admin screens, elevating guest hospitality."
    },
    {
        "title": "Milestone 2: Venue & Speaker Intelligence",
        "content": ["Transitioning from validation to goal-oriented planning.", "Combining deterministic constraints with LLM semantic matching.", "Human-in-the-loop: Agents recommend, Admins approve."],
        "notes": "Milestone 2 introduced our first goal-oriented agents: the Venue and Speaker Agents. Instead of just validating data, these agents retrieve context, evaluate hard constraints like time conflicts, and use LLMs to score soft constraints like expertise matching, presenting ranked recommendations to the admin."
    },
    {
        "title": "Agentic Optimization & Scheduling",
        "content": ["Venue Optimization: Weights capacity, equipment, and accessibility.", "Speaker Scheduling: Matches bio/expertise against session topics.", "Strict schema validation ensures no hallucinated assignments reach the database.", "[Insert Screenshots: Venue Management AI Search & Speaker Management]"],
        "notes": "Here we see the agents in action. If an admin needs a venue for 1000 people with specific equipment, the Venue Agent ranks the best options. The Speaker Agent semantically matches speaker biographies to session topics. Crucially, the LLM output is strictly validated against a Pydantic schema to prevent hallucinations."
    },
    {
        "title": "Milestone 3: AI Incident Triage Agent",
        "content": ["Free-text natural language reporting by students.", "AI automatically classifies Severity (Low to Critical) and Category.", "Smart routing to specific operational teams (Medical, Security, Tech).", "[Insert Screenshots: Report Incident Form & Incident Management Board]"],
        "notes": "Milestone 3 shifted focus to live, safety-critical execution. Students can report issues in natural language. The Incident Agent reads the free text, deduces the severity, categorizes it, and routes it to the correct team instantly—no rigid dropdowns required."
    },
    {
        "title": "Real-Time Incident Alerts (Socket.io)",
        "content": ["Sub-second Socket.io pushes for 'incident_created' and 'new_alert'.", "AI Rationale Panel explains why a severity was chosen.", "Auto-escalation for critical safety reports.", "[Insert Screenshots: Incident Detail View & 'HIGH ALERT DETECTED' banner]"],
        "notes": "Because incidents are safety-critical, they are pushed over Socket.io instantly. The dashboard clearly displays the AI's rationale for its classification, ensuring explainability. If a critical incident occurs, predictive banners alert all connected admins simultaneously."
    },
    {
        "title": "Live Sponsor Engagement & ROI Tracking",
        "content": ["Brand-new, isolated React application for Sponsors.", "Agent computes real-time ROI based on live booth traffic.", "Generates natural-language performance summaries and alerts.", "[Insert Screenshots: Sponsor Portal & Sponsor Dashboard]"],
        "notes": "Sponsors need to know their investment is paying off. I built a dedicated, secure Sponsor Frontend. The Sponsorship Agent continuously monitors live booth traffic and interaction data, computing an engagement score and generating real-time, natural-language ROI insights directly to the sponsor."
    },
    {
        "title": "Milestone 4: Proactive Event Intelligence",
        "content": ["Continuous monitoring of live operational telemetry.", "Detects anomalies (e.g., registration queue overflow, hall capacity limits).", "Generates EventInsight and ActionableRecommendation records."],
        "notes": "Milestone 4 elevates the system to an enterprise level. The Event Intelligence Engine actively monitors live telemetry. Instead of just logging an error when a hall is full, it detects the trend proactively, logs an Event Insight, and generates an Actionable Recommendation for the staff to execute."
    },
    {
        "title": "Multi-Agent Collaboration (The Orchestrator)",
        "content": ["Decomposes complex, cross-domain problems into sub-tasks.", "Parallel delegation to specialized domain agents.", "Aggregates structured responses into a single coordinated action plan."],
        "notes": "The crowning technical achievement is the Agent Orchestrator. If a complex scenario occurs—like a VIP stuck in a queue—the Orchestrator decomposes the problem and simultaneously tasks the Venue Agent to open a lane and the Sponsor Agent to notify a liaison, combining their outputs into one coordinated response."
    },
    {
        "title": "Real-Time Decision Support",
        "content": ["Side-by-side view of anomalies and AI-proposed solutions.", "One-click Accept / Dismiss actions for rapid triage.", "Full audit logging of administrative decisions.", "[Insert Screenshot: Executive Command Center]"],
        "notes": "All this intelligence culminates in the Executive Command Center. Administrators see live insights alongside concrete AI recommendations. With a single click of 'Accept', the backend executes the recommendation and logs an audit trail of who made the decision and when."
    },
    {
        "title": "Inspectable AI: The Agents Fleet Dashboard",
        "content": ["Complete transparency into agent capabilities.", "Displays JSON input/output schemas and reasoning logic.", "Demystifies the 'black box' of LLM operations.", "[Insert Screenshots: AI Agents Fleet & Agent Detail Modal]"],
        "notes": "To ensure transparency and trust, I built the AI Agents Visualization Dashboard. It allows admins to click on any of the five agents to inspect exactly how they reason, their required JSON schemas, and step-by-step examples of their workflows. It makes the AI completely explainable."
    },
    {
        "title": "Enterprise Deployment & Security",
        "content": ["Strict RBAC: Closed privilege escalation gaps between Sponsor and Admin portals.", "CORS & JWT: Hardened cross-origin policies and token expiration handling.", "Consolidated Deployment: Single-command startup for all 5 services."],
        "notes": "For enterprise deployment, security was paramount. I implemented strict Role-Based Access Control, explicitly blocking Sponsors from accessing Admin routes, handled JWT expirations gracefully across all frontends, and consolidated the platform into a reliable, single-command startup sequence."
    },
    {
        "title": "Disciplined AI Engineering",
        "content": ["Structured Outputs: Forcing Gemini to return strict JSON via Pydantic.", "Deterministic Fallbacks: Hard constraints (SQL) always override soft constraints (LLM).", "Prompt Injection Defense: Treating user input as untrusted data.", "Human-in-the-Loop: Agents recommend; humans commit to the database."],
        "notes": "The success of this platform relies on disciplined AI engineering. We use LLMs for fuzzy, semantic reasoning, but we enforce hard constraints like time conflicts using deterministic SQL queries. Most importantly, the AI never writes directly to the database without explicit human approval."
    },
    {
        "title": "Technical Challenges & Resolutions",
        "content": ["Challenge: Prisma schema syncing errors. -> Solution: Enforced db push pipeline.", "Challenge: EADDRINUSE port collisions. -> Solution: Tuned Nodemon restart delays.", "Challenge: Vague natural-language incident reports. -> Solution: Refined system prompts for safety."],
        "notes": "Scaling this system brought challenges. Syncing 5 concurrent services often led to port collisions, which I resolved by tuning the Node runtime environment. I also heavily refined the Incident Agent's prompts to ensure vague reports containing safety keywords were always classified with high severity, preventing critical misses."
    },
    {
        "title": "The Roadmap Ahead",
        "content": ["Predictive Attendance Modeling for venue scaling.", "Mobile Push/SMS notifications for on-duty field staff.", "Incident Heatmaps for spatial pattern detection.", "Voice-based administration via NLP commands."],
        "notes": "While the platform is robust, the future roadmap includes predictive attendance modeling to forecast hall overflows before they happen, spatial incident heatmaps for security teams, and mobile push notifications for staff who aren't actively looking at a dashboard."
    },
    {
        "title": "Conclusion",
        "content": ["Delivered a cohesive, 5-service enterprise platform.", "Successfully merged generative AI with deterministic software engineering.", "Achieved true Agentic operational intelligence.", "[Insert Collage: Best Dashboard Screenshots]"],
        "notes": "In conclusion, this internship culminated in a highly complex, 5-service enterprise platform. By strictly bounding generative AI within deterministic validation and human-in-the-loop workflows, the system achieves true Agentic operational intelligence—making large-scale event management safer, smarter, and highly efficient. Thank you, and I am happy to take any questions."
    }
]

for slide_data in slides_data:
    if slide_data == slides_data[0]:
        slide = prs.slides.add_slide(title_slide_layout)
        title = slide.shapes.title
        subtitle = slide.placeholders[1]
        title.text = slide_data["title"]
        subtitle.text = "\\n".join(slide_data["content"])
    else:
        slide = prs.slides.add_slide(bullet_slide_layout)
        shapes = slide.shapes
        title_shape = shapes.title
        body_shape = shapes.placeholders[1]
        
        title_shape.text = slide_data["title"]
        tf = body_shape.text_frame
        
        for i, bullet in enumerate(slide_data["content"]):
            if i == 0:
                tf.text = bullet
            else:
                p = tf.add_paragraph()
                p.text = bullet
                p.level = 0
                
    # Add speaker notes
    notes_slide = slide.notes_slide
    text_frame = notes_slide.notes_text_frame
    text_frame.text = slide_data["notes"]

prs.save("Agentic_AI_Event_Management_Presentation.pptx")
print("Presentation generated successfully!")
