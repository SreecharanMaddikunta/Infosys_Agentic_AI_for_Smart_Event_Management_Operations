# Infosys Event Platform - Technical Documentation

## 1. Overview
The Infosys Event Platform is an intelligent event management system built with a microservices architecture. It integrates a central **Event Intelligence Engine** that transforms passive data collection into proactive, real-time decision support.

## 2. Architecture & Components

### 2.1 Backend (`backend`)
- **Framework**: Node.js, Express
- **Database**: PostgreSQL with Prisma ORM
- **Role**: Serves as the central data store. It handles core business logic like Registrations, Venues, and Check-ins. 
- **Event Triggers**: The backend emits real-time HTTP requests to the `ai_service` when critical state changes occur (e.g., ticket scanned, capacity changed).

### 2.2 AI Service (`ai_service`)
- **Framework**: Python, FastAPI
- **Event Intelligence Engine**: Analyzes data payloads (capacity metrics, scheduling anomalies) and generates actionable recommendations (e.g., "Deploy additional staff").
- **Agent Orchestration**: Routes complex requests to specialized agents (e.g., `VenueAgent`, `SchedulingAgent`).
- **Endpoints**: Exposes `/api/intelligence/analyze` for backend consumption.

### 2.3 Executive Dashboard (`admin-frontend`)
- **Framework**: React, Vite
- **Role**: A command center for event organizers. 
- **Features**: Real-time graphs powered by HTTP polling from the backend, and a `RecommendationsFeed` UI component to present AI-generated insights for admin approval or dismissal.

## 3. Data Flow Example: Crowd Management
1. **Trigger**: Attendee ticket is scanned via `scanController.js`.
2. **Context**: Backend calculates the venue is at 90% capacity and POSTs to `/api/intelligence/analyze`.
3. **Orchestration**: The `ai_service` routes the payload to the `VenueAgent`.
4. **Insight Generation**: The LLM infers that high capacity + rapid registrations = queue buildup. It recommends opening an alternative entry point.
5. **Persistence**: The backend saves this as an `ActionableRecommendation`.
6. **Action**: The Executive Dashboard polls the backend and displays the recommendation to the administrator.

## 4. Testing (E2E)
We utilize **Playwright** for End-to-End testing to ensure the entire microservice chain (Frontend -> Backend -> AI Service) behaves reliably. Test suites are located in `tests/e2e/`.

Run tests locally with:
```bash
npx playwright test
```
