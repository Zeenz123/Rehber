# Rehber REST & Webhook API Documentation

Base URL: `http://localhost:8000/api`

---

## 1. Authentication (`/auth`)

### `POST /auth/login`
- **Description**: Authenticates student by ID (`STU101`) or teacher by email.
- **Request Body**:
  ```json
  { "identifier": "STU101", "password": null }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "rehber-stu-token-STU101-...",
    "token_type": "bearer",
    "role": "STUDENT",
    "user_id": "STU101",
    "student_id": "STU101"
  }
  ```

---

## 2. Offline Synchronization (`/sync`)

### `POST /sync/batch`
- **Description**: Ingests batched offline actions from mobile clients with idempotency verification.
- **Request Body**:
  ```json
  {
    "student_id": "STU101",
    "client_timestamp": "2025-01-15T12:00:00Z",
    "records": [
      {
        "id": "c1f7b764-6df4-41d3-a447-e179bb49ec49",
        "operation_type": "QUIZ",
        "payload": { "quiz_id": "QZ_MATH_01", "score": 100.0, "answers": { "Q1": "A" } },
        "created_at": "2025-01-15T11:45:00Z",
        "retry_count": 0
      }
    ]
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "OK",
    "processed_ids": ["c1f7b764-6df4-41d3-a447-e179bb49ec49"],
    "failed_ids": [],
    "conflicts": [],
    "server_timestamp": "2025-01-15T12:00:02Z",
    "curriculum_version": "2025.1.0"
  }
  ```

---

## 3. Cellular SMS Webhook (`/sms`)

### `POST /sms/webhook`
- **Description**: Ingests delimited SMS messages from cellular gateways or test harnesses.
- **Request Body**:
  ```json
  {
    "from_number": "+923001234567",
    "body": "STU101#ASK#Why is photosynthesis important?"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "PROCESSED",
    "student_id": "STU101",
    "action_code": "ASK",
    "reply_sms": "STU101#ANS#Plants make food using sunlight and CO2, releasing oxygen.",
    "is_simulated": true
  }
  ```

---

## 4. Rehber AI Assistant (`/ai`)

### `POST /ai/ask`
- **Description**: Interactive educational tutoring via Google Gemini with local rules engine fallback.
- **Request Body**:
  ```json
  {
    "student_id": "STU101",
    "prompt": "What is a fraction?",
    "transport": "HTTPS"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "student_id": "STU101",
    "prompt": "What is a fraction?",
    "response": "A fraction represents a part of a whole...",
    "transport": "HTTPS",
    "is_fallback_rule": false,
    "suggested_revision_module": "MOD_MATH_01"
  }
  ```

---

## 5. Teacher Analytics (`/analytics`)

### `GET /analytics/dashboard`
- **Description**: Aggregates cohort sizes, learning band distributions, active student counts, struggling topics, and pending sync counts.
