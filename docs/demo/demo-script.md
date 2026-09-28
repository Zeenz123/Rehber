# Rehber Complete Demonstration Script for Judges

This walkthrough demonstrates how Rehber delivers offline-first personalized education across the 4 distinct network states.

---

## Pre-requisites & Launch Instructions

### 1. Launch Backend Server:
```bash
# Terminal 1
cd Desktop/Rehber/backend
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Launch Teacher Web Portal:
```bash
# Terminal 2
cd Desktop/Rehber/web
npm run dev
# Open browser at http://localhost:3000
```

### 3. Launch Mobile Application / Emulator:
```bash
# Terminal 3
cd Desktop/Rehber/mobile
flutter run
```

---

## Demonstration Sequence

### Phase 1: Zero-Network Offline Learning Demo
1. **Disable Network**: In the Android emulator or top header, set network mode to **`OFFLINE`**.
2. **Open Lesson**: Navigate to **"Understanding Fractions & Equal Parts"**.
3. **Listen via Offline Voice**:
   - Tap the speaker icon: "Listen Offline Audio".
   - Notice the lesson is read aloud using native Android TextToSpeech without making any internet requests.
4. **Complete Offline Practice Test**:
   - Tap "Start Practice Test (MCQ)".
   - Answer the 2 questions: Option A for Question 1, Option B for Question 2.
   - Tap "Submit Answers (Offline)".
   - Notice immediate scoring (100%), localized explanations, and instant IRT mastery recalibration stored in local SQLite.
5. **Verify Sync Queue**:
   - Tap the Network Status Badge to open the **Judge Demo Panel**.
   - Inspect the SQLite sync queue: observe that the quiz attempt is queued with status `PENDING` and assigned an immutable client UUID.

---

### Phase 2: Message-Embedded Cellular Fallback Demo
1. **Switch to Fallback Mode**:
   - In the Developer Demo Panel, select **`MESSAGE_FALLBACK (Cellular / SMS)`**.
2. **Open Rehber AI Tutor**:
   - Return to the Home Dashboard and tap **"Rehber AI Tutor"**.
   - Notice the chat interface is identical.
3. **Ask Concept Query**:
   - Type or speak: *"Why do plants need sunlight?"*
   - Tap Send.
4. **Observe Low-Data Transport**:
   - The message bubble renders with transport tag `SMS_FALLBACK`.
   - The developer accordion reveals the exact serialized payload:
     `STU101#ASK#Why do plants need sunlight?`
   - The response arrives and is read aloud via TTS:
     `STU101#ANS#Plants make food using sunlight, water, and CO2, releasing oxygen.`
5. **Inspect Teacher SMS Gateway**:
   - In the Web Portal (`http://localhost:3000/sms-gateway`), inspect the incoming cellular SMS packet feed.

---

### Phase 3: Automatic Online Synchronization Demo
1. **Restore Connectivity**:
   - In the Judge Demo Panel, switch mode to **`ONLINE (<3000ms)`**.
2. **Trigger Sync**:
   - Tap "Trigger Manual Sync to Backend" (or observe automatic sync firing in the background).
   - Watch the pending count decrement from 1 to 0 as records transition to `SYNCED`.
3. **Verify Central Web Dashboard**:
   - Refresh the Teacher Dashboard at `http://localhost:3000`.
   - Observe the updated mastery score, active student counters, and new quiz activity in the live feed.

---

### Phase 4: Teacher Pedagogical Interventions
1. Navigate to **`Learning Bands & Interventions`** (`http://localhost:3000/interventions`).
2. Review the **Remedial Support** list:
   - Identify Bilal Ahmed (Mastery: 35%).
   - Read the teacher intervention suggestion: "Pair with physical manipulatives (seeds/flatbread paper cuts) before proceeding to symbolic fractions."
3. Review the **Struggling Topics Alert**:
   - Inspect *MOD_MATH_02: Fraction Addition & Subtraction* (Class average: 52.4%).
