הוספתי את ההנחיות החדשות בצורה מפורשת. סעיף הבדיקות עודכן כך שיאסור לחלוטין על כתיבת טסטים ל-Frontend (UI) וימקד את כל מאמצי הבדיקה אך ורק ב-Backend. בנוסף, הוספתי דרישה קשיחה לעדכון עמוד המדריך למשתמש (User Guide) בכל שינוי רלוונטי.

הנה קובץ ה-`AGENTS.md` המעודכן שתוכל להטמיע בפרויקט:

```markdown
# Project Architecture & Code Quality Standards

## 1. General Design Principles

- **SOLID & Clean Code:** All code must strictly adhere to SOLID principles. Maintain high cohesion and low coupling.
- **Readability:** Prioritize readability over cleverness. Use highly descriptive names for functions, classes, variables, and files. Avoid magic numbers and strings.
- **DRY Principle:** Do not repeat code. Extract shared logic into utility functions, common components, or custom hooks.

## 2. Testing Strategy (BACKEND ONLY)

- **Backend Continuous Testing:** All testing efforts must be focused EXCLUSIVELY on the Backend (Python/Pytest).
- **Always Verify Tests:** Before finalizing any Backend code changes or new feature creation, you MUST check if corresponding Backend tests exist.
- **Update/Create Tests:** If existing Backend logic is modified, update the tests to reflect the new logic. If a new Backend feature is created, you MUST write accompanying unit or integration tests. Never leave new or modified Backend logic without test coverage.

## 3. Backend Architecture (Python, FastAPI, MongoDB)

- **Separation of Concerns:** Maintain the strict layered architecture present in the codebase:
  - `Routes` (`app/routes/`): Must only handle HTTP requests, responses, and basic routing logic.
  - `Services` (`app/services/`): Must contain all the core business logic.
  - `Repositories` (`app/db/repositories/`): Must handle all direct database (MongoDB) queries and aggregations.
  - `Schemas` (`app/schemas/`): Use Pydantic heavily for all data validation and serialization.
- **Mandatory Logging:** You MUST add structured logs to the Backend for all significant actions. This includes function entries/exits for complex logic, state changes, external API calls, and all errors/exceptions. Use the project's established logging mechanism.
- **Error Handling:** Catch exceptions at the appropriate layer and translate them into standardized HTTP exceptions (e.g., 400, 404, 500) before reaching the user.
- **requirements.txt:** You MUST update the `requirements.txt` file with all the new dependencies that you add to the project.

## 4. Frontend Architecture (React, Vite)

- **Component Structure:** Keep components small and focused on a single responsibility.
- **State & Logic:** Extract complex state management and reusable frontend logic into Custom Hooks (`src/hooks/`).
- **API Integration:** Do not make direct fetch/axios calls from components. Always use the established API services layer (`src/api/services/`).
- **UI Consistency:** Follow the existing CSS structure and styling conventions to maintain a unified user experience.

## 5. Maintenance, Documentation & User Guide

- **Comments:** Code should be self-documenting. Leave comments only to explain the "WHY" behind complex or non-obvious business logic, not the "WHAT".
- **User Guide Updates (MANDATORY):** Whenever a feature is added, modified, or visual changes are made to the UI, you MUST evaluate if the changes affect the user flow. If they do, you are required to update the User Guide page (e.g., `UserGuidePage.jsx`) to reflect the new functionality.
- **Doc Updates:** If architectural changes, data flow modifications, or new core APIs are introduced, update the relevant documentation files (e.g., `ARCHITECTURE.md`, `API_REFERENCE.md`,`DATA_FLOW_DIAGRAMS.md`) .
```
