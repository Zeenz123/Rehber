# Offline-First Architecture in Rehber

## 1. Local-First Design Philosophy

Rehber treats local storage as the primary source of truth for the student's active session, rather than an ephemeral cache of a remote server. 

### Traditional Online Architecture vs. Rehber Local-First Architecture:

```text
Traditional Web App:
User Action -> Network Request -> Remote Server -> Remote DB -> Response -> UI Render
(Any network failure completely freezes the student experience)

Rehber Architecture:
User Action -> Local SQLite DB -> Immediate UI Render -> Sync Queue -> Background Transport
(Student continues uninterrupted; network transfers happen asynchronously)
```

---

## 2. Local Database Schema (SQLite)

The local Android client persists:
1. **Student Profile**: Local student identifier, name, grade, language, calibrated latent ability ($\theta$), overall mastery ($0.0 - 1.0$), and learning band (`REMEDIAL`, `ON_TRACK`, `ADVANCED`).
2. **Preinstalled Curriculum**: Subjects, modules, lessons, concept summaries, and localized audio scripts for offline speech playback.
3. **Question Bank**: Pre-seeded MCQ items with options A/B/C/D, explanations, difficulty ratings, and Item Response Theory difficulty parameters ($b_i$).
4. **Assessment & Progress History**: Scores, elapsed study time, and module completion checkpoints.
5. **Offline Sync Queue**: Enqueued mutations tagged with unique UUIDs, retry counters, timestamp metadata, and synchronization statuses.
6. **Speech Resource Metadata**: Directory paths and availability flags for Vosk language acoustic models (`vosk-model-small-ur`, `vosk-model-small-en-in`).

---

## 3. Optimistic Offline UI Lifecycle

When a student completes a quiz or finishes a learning module:
1. **Immediate Evaluation**: The local application compares selected answers against pre-cached item answer keys.
2. **Local Adaptive Recalibration**: The client-side `MobileIrtCalculator` executes a 1PL Rasch update:
   $$\theta_{new} = \theta_{old} + 0.4 \times \sum (y_i - P(y_i = 1 | \theta, b_i))$$
   $$\text{mastery} = \frac{1}{1 + e^{-\theta_{new}}}$$
3. **Instant Visual Feedback**: The student immediately receives their score percentage, mastery status update, and pedagogical explanations.
4. **Queue Enqueue**: An immutable sync mutation packet is recorded in the `sync_queue` table with status `PENDING`.
5. **Non-Blocking Operation**: The student seamlessly advances to the next recommended lesson without experiencing loading spinners or network timeouts.
