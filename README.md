# Infosys Agentic AI for Smart Event Management Operations

An intelligent, microservices-based event management platform that transforms passive data collection into proactive, real-time decision support using Agentic AI. 

## 🏗️ Architecture & Components

This project is built using a microservices architecture, divided into the following core components:

*   **`backend`**: Node.js & Express API serving as the central data store (PostgreSQL + Prisma). Handles core business logic (Registrations, Venues, Check-ins) and triggers real-time state changes.
*   **`ai_service`**: Python & FastAPI engine powering the Event Intelligence Engine. It routes complex requests to specialized AI agents (e.g., `VenueAgent`, `SchedulingAgent`) to generate actionable recommendations (e.g., crowd management, staff deployment).
*   **`admin-frontend`**: React & Vite dashboard acting as the command center for event organizers to view real-time analytics and approve/dismiss AI recommendations.
*   **`student-frontend`**: React frontend for student attendees to register, manage profiles, and view event schedules.
*   **`sponsor-frontend`**: React frontend for event sponsors to track engagement and metrics.

## 💻 Tech Stack

*   **Frontend:** React, Vite, TailwindCSS
*   **Backend:** Node.js, Express, Prisma ORM
*   **AI Service:** Python, FastAPI, LLM Integrations
*   **Database:** PostgreSQL
*   **Testing:** Playwright (E2E)
*   **Deployment:** Docker & Docker Compose

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18+)
*   [Python](https://www.python.org/) (3.10+)
*   [PostgreSQL](https://www.postgresql.org/)
*   [Docker](https://www.docker.com/) (Optional, for containerized deployment)

## 🛠️ Setup & Installation

### 1. Database Setup
Ensure PostgreSQL is running and create a database for the project.

### 2. Backend Setup
```bash
cd backend
npm install
# Configure your .env file with DATABASE_URL
npx prisma generate
npx prisma db push
node seed_dummy_data.js # Optional: to seed dummy data
npm run dev
```

### 3. AI Service Setup
```bash
cd ai_service
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
# Configure your .env file with necessary API keys (e.g., OPENAI_API_KEY)
uvicorn main:app --reload
```

### 4. Frontend Setup (Repeat for admin, student, and sponsor)
```bash
cd admin-frontend # or student-frontend / sponsor-frontend
npm install
npm run dev
```

## 🐳 Docker Deployment

To run the entire stack using Docker Compose for production/testing:
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🧪 Testing

End-to-End (E2E) testing is configured using Playwright to test the full microservice chain (Frontend -> Backend -> AI Service).

To run the tests:
```bash
npx playwright test
```

## 📚 Technical Documentation

For a deeper dive into the system architecture, AI data flow, and agent orchestration, please refer to the [`TECHNICAL_DOCS.md`](./TECHNICAL_DOCS.md).
