# RuralLearn AI — Offline-First AI Personalized Learning Platform for Rural Communities

> **"LEARN ANYWHERE — EVEN WITHOUT INTERNET"**

RuralLearn AI is a production-grade full-stack educational platform built specifically for children in rural communities where internet connectivity is unavailable, sporadic, or expensive. It integrates an **On-Device Offline AI Engine**, **Regional Dialect Voice Guidance**, **Solar Community Hub Synchronization**, and a **Teacher Classroom Analytics Dashboard**.

---

## 🌟 Key Differentiators

1. **100% Offline-First Learning**: The core learning loop (lessons, worked examples, interactive practice, quizzes, score analysis, gap detection, and speed adaptation) runs entirely on the student's device without requiring an active internet connection.
2. **On-Device Offline AI Engine**: Uses deterministic heuristics, Bayesian mastery calculations, and gap detection to identify weaknesses, slow down or accelerate learning pace, and generate tailored recommendations locally.
3. **Voice-First Learning & Step-by-Step Guidance**: Features Speech-to-Text and Text-to-Speech in regional languages with granular playback controls (▶ Listen, ⏸ Pause, 🔁 Replay, 🐢 Explain Slowly [0.7x], ⚡ Explain Faster [1.25x]).
4. **Native Dialect Support**: Fully localized in **English**, **Hindi (हिन्दी)**, **Tamil (தமிழ்)**, **Telugu (తెలుగు)**, **Malayalam (മലയാളം)**, and **Kannada (ಕನ್ನಡ)**.
5. **Solar Community Hub Sync**: Offline learning records accumulate in a local queue and batch synchronize when the tablet comes in proximity to a solar-powered community node or school hub.
6. **Teacher Classroom Dashboard**: Aggregates mastery records across all rural tablets, revealing class-wide conceptual bottlenecks (e.g., "12 students need fraction practice") with actionable intervention recommendations.
7. **Low-Resource Device Optimization**: Lightweight assets, zero bloat, battery-friendly UI, and a built-in Tablet Simulator mode.

---

## 🏛️ Architecture Pipeline

```
CHILD SPEAKS / PRACTICES
      ↓
OFFLINE AI ENGINE (On-Device)
      ↓
AI IDENTIFIES LEARNING LEVEL & CONCEPT GAPS
      ↓
AI PERSONALIZES DIFFICULTY & SPEED (Slow / Normal / Fast)
      ↓
STEP-BY-STEP VOICE GUIDANCE (Native Dialect)
      ↓
INTERACTIVE PRACTICE & QUIZZES
      ↓
PERFORMANCE & MASTERY UPDATE
      ↓
LOCAL DATABASE (Offline Storage)
      ↓
SYNC QUEUE
      ↓
SOLAR COMMUNITY HUB (Solar Node #4)
      ↓
CLOUD RELAY (When Available)
      ↓
TEACHER & CLASSROOM DASHBOARD
```

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend**: Express full-stack API server, Vite middleware.
- **AI Engine**:
  - *On-Device Engine*: Heuristic gap detection, adaptive Bayesian mastery engine, deterministic fallback tutor.
  - *Cloud Engine*: Google Gemini 3.8 Flash (`@google/genai` TypeScript SDK) via server-side `/api/ai/chat`.
- **Speech**: Web Speech Recognition API & Web Speech Synthesis API with regional voice mapping (`en-IN`, `hi-IN`, `ta-IN`, `te-IN`, `ml-IN`, `kn-IN`).
- **Database**:
  - Client-side: Local Storage / IndexedDB schema with transaction serialization.
  - Server-side: Express in-memory store + JSON sync buffer with student records and class analytics.

---

## 🚀 Quick Start & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file from `.env.example`:
```bash
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Scenarios

### How to Test Offline Mode
1. Click the **"Simulate Offline"** button in the top navigation banner.
2. Notice the indicator switches to **"⚡ 100% Offline Mode (No Internet Needed)"**.
3. Navigate to **Learn** or **Practice**; complete a lesson or take a quiz.
4. Open the **AI Tutor**; speak or type a question. The response will be processed locally with the badge **"🌱 On-Device Offline AI Engine"**.
5. No network error alerts appear; progress is saved to the local sync queue.

### How to Test Solar Hub Synchronization
1. Complete a quiz while in Offline Mode.
2. Notice the top banner updates to show **"1 Pending Sync"**.
3. Navigate to the **Solar Hub** tab.
4. Review the Solar Node telemetry (Solar Battery: 92%, Connected Tablets: 6, Hub Storage).
5. Inspect the pending sync records in the on-device queue.
6. Click **"Switch to Online"** and then **"Sync Now with Hub"**.
7. The status transitions from **Syncing...** to **All Synced ✓**.

### How to Run the 13-Step Guided Hackathon Demo
1. Click the **"Guided Demo Tour"** button in the navigation header.
2. Step through the 13 official evaluation steps:
   - **Step 1**: Open app.
   - **Step 2**: Select Language (Hindi/Tamil/English) and Class 7.
   - **Step 3**: Diagnostic assessment.
   - **Step 4**: AI analyzes results (Algebra: Weak, Fractions: Medium, Geometry: Strong).
   - **Step 5**: AI recommends "Start with Algebra Basics".
   - **Step 6**: Open lesson with step-by-step voice guidance.
   - **Step 7**: Child asks AI with voice: "Explain this to me".
   - **Step 8**: Student takes quiz.
   - **Step 9**: Student scores 42% -> AI slows down learning speed to Slow Pace.
   - **Step 10**: Student retests -> 78% -> AI advances recommendation to Intermediate Algebra.
   - **Step 11**: Switch to 100% Offline Mode.
   - **Step 12**: Reconnect with Solar Hub -> Sync Complete ✓.
   - **Step 13**: Open Teacher Dashboard to see class-wide analytics.
