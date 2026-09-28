# Local Mobile SQLite / Drift Schema & Field Mapping

## 1. Field Classification Architecture

In an offline-first learning system, fields in local tables must be explicitly categorized to avoid synchronization loops, race conditions, or bandwidth waste:

```text
┌─────────────────────────────────────────────────────────────┐
│                       FIELD TAXONOMY                        │
├───────────────────┬───────────────────┬─────────────────────┤
│ 1. Synchronizable │ 2. Local-Only     │ 3. Derived          │
│ Pushed to backend │ Never leaves the  │ Computed locally on │
│ in batch payloads │ physical device   │ the fly by client   │
└───────────────────┴───────────────────┴─────────────────────┘
```

---

## 2. Table-by-Table Field Mapping

### Table: `students`
| Field | Type | Classification | Description |
|:---|:---|:---|:---|
| `id` | TEXT PK | **Synchronizable** | Student ID (e.g. `STU101`) |
| `name` | TEXT | **Synchronizable** | Full name |
| `grade` | INTEGER | **Synchronizable** | Current class grade (6-8) |
| `language` | TEXT | **Synchronizable** | Target dialect (`urdu`, `english`) |
| `school_id` | TEXT | **Synchronizable** | Enrolled village school code |
| `learning_band` | TEXT | **Derived / Synchronizable** | Calibrated pedagogical band |
| `overall_mastery` | REAL | **Derived** | Client-side logistic sigmoid of $\theta$ |
| `theta_ability` | REAL | **Derived** | Latent ability computed by IRT 1PL calculator |
| `last_active_at` | TEXT | **Synchronizable** | ISO-8601 UTC timestamp |

---

### Table: `sync_queue`
| Field | Type | Classification | Description |
|:---|:---|:---|:---|
| `id` | TEXT PK | **Local-Only** | Internal SQLite row identifier |
| `client_record_id` | TEXT UNIQUE | **Synchronizable** | Immutable UUIDv4 for server idempotency |
| `student_id` | TEXT | **Synchronizable** | Authoring student ID |
| `operation_type` | TEXT | **Synchronizable** | `REG`, `PROGRESS`, `QUIZ`, `AI_CHAT` |
| `payload_json` | TEXT | **Synchronizable** | Serialized payload map |
| `status` | TEXT | **Local-Only** | `PENDING`, `QUEUED`, `SYNCING`, `SYNCED` |
| `retry_count` | INTEGER | **Local-Only** | Number of failed network sync attempts |
| `last_attempt` | TEXT | **Local-Only** | Timestamp of previous sync dispatch |
| `server_ack` | TEXT | **Local-Only** | Server acknowledgment code (`ACK_OK`) |
| `created_at` | TEXT | **Synchronizable** | Local creation timestamp |

---

### Table: `speech_models`
| Field | Type | Classification | Description |
|:---|:---|:---|:---|
| `id` | TEXT PK | **Local-Only** | Model identifier (e.g. `vosk-urdu-small`) |
| `language_code` | TEXT | **Local-Only** | ISO code (`ur`, `en`) |
| `model_name` | TEXT | **Local-Only** | Human-readable model label |
| `local_path` | TEXT | **Local-Only** | Storage directory where acoustic weights are mounted |
| `is_downloaded` | INTEGER | **Local-Only** | Boolean flag (1 if installed on flash memory) |
| `size_bytes` | INTEGER | **Local-Only** | Size of acoustic model binary (e.g. 45,000,000 bytes) |

---

### Table: `questions` (Curriculum)
| Field | Type | Classification | Description |
|:---|:---|:---|:---|
| `id` | TEXT PK | **Remote (Cached)** | Item ID (e.g. `Q_MATH_001`) |
| `lesson_id` | TEXT | **Remote (Cached)** | Parent lesson |
| `prompt` | TEXT | **Remote (Cached)** | Question text |
| `option_a` .. `d` | TEXT | **Remote (Cached)** | Pre-compiled options |
| `correct_option` | TEXT | **Remote (Cached)** | Answer key for instant offline scoring |
| `explanation` | TEXT | **Remote (Cached)** | Pedagogical explanation for student review |
| `difficulty` | TEXT | **Remote (Cached)** | Categorical difficulty (`EASY`, `MEDIUM`, `HARD`) |
| `irt_b` | REAL | **Remote (Cached)** | Item Response Theory item difficulty parameter |
