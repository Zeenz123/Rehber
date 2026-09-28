# Rehber System Architecture

## 1. Executive Summary

**Rehber** is an AI-powered personalized learning platform engineered specifically for rural communities facing intermittent, high-latency, or completely unavailable internet connectivity. Rather than functioning as a standard web portal, Rehber operates as an integrated local-first ecosystem where learning continuous uninterrupted regardless of physical network state.

---

## 2. Integrated Ecosystem Overview

```mermaid
flowchart TD
    subgraph Client["Student Android Mobile (Flutter + SQLite)"]
        UI["Preinstalled Static UI Templates"]
        LocalDB[("Local SQLite Database")]
        STT["Vosk Offline STT Engine"]
        TTS["Native Android TextToSpeech"]
        SyncQ["Offline Sync Queue"]
        LocalRules["Local Educational Rules Engine"]
    end

    subgraph NetworkRouting["Network State Engine"]
        NS{"Connection Quality Check"}
        OnlineMode["ONLINE (< 3000ms Latency)"]
        LowBwMode["LOW BANDWIDTH (>= 3000ms Latency)"]
        OfflineMode["OFFLINE (Zero Connectivity)"]
        FallbackMode["MESSAGE FALLBACK (Cellular / SMS)"]
    end

    subgraph Gateway["Low-Bandwidth Cellular Transport"]
        SMS_GW["Cellular SMS Gateway / Webhook"]
        SMS_Parser["SmsParser / Serializer / Validator"]
    end

    subgraph BackendCore["FastAPI Backend Server"]
        API["REST Endpoints /api/*"]
        SyncService["Batch Synchronization Service"]
        IRTEngine["Adaptive Learning Core (IRT 1PL)"]
        AIRouter["Rehber AI Router (Gemini / Rules)"]
    end

    subgraph Storage["Central Persistent Storage"]
        CentralDB[("PostgreSQL / SQLite Central DB")]
    end

    subgraph Educator["Teacher Web Platform (Next.js)"]
        WebDash["Educator Portal & Interventions"]
        SMSMonitor["Cellular Traffic Monitor"]
        SyncMonitor["Sync Batch Observability"]
    end

    UI --> LocalDB
    UI --> STT
    UI --> TTS
    UI --> LocalRules
    LocalDB --> SyncQ

    SyncQ --> NS
    NS -->|Ping < 3000ms| OnlineMode -->|Compressed HTTPS| API
    NS -->|Ping >= 3000ms| LowBwMode -->|Compact HTTP Payload| API
    NS -->|No Network| OfflineMode -->|Immediate Local Response| UI
    NS -->|Cellular Only| FallbackMode -->|SMS Protocol [ID]#[Action]#[Data]| SMS_GW

    SMS_GW --> SMS_Parser --> API
    API --> SyncService --> CentralDB
    API --> IRTEngine
    API --> AIRouter
    CentralDB --> WebDash
    SMS_GW -.-> SMSMonitor
    SyncService -.-> SyncMonitor
```

---

## 3. The 3 Primary Technical Differentiators

### 1. Offline Voice (Vosk STT + Native Android TTS)
- **Speech Recognition**: Uses the Vosk offline acoustic model engine (e.g. `vosk-model-small-ur`, `vosk-model-small-en-in`), loading lightweight acoustic representations from local device storage without cloud API roundtrips.
- **Speech Synthesis**: Employs native Android `TextToSpeech` configured with locally installed voice packs (`EXTRA_PREFER_OFFLINE`), allowing students with limited literacy to hear lesson explanations spoken in their native language.

### 2. Message-Embedded Low-Network Communication
- When data networks fail entirely, Rehber routes academic requests through a cellular SMS transport layer.
- The student's experience remains the unified **Rehber AI Chat UI**—the application automatically serializes the query into a compact delimited packet (`[StudentID]#[ActionCode]#[PayloadData]`), sends it via telephony channels, and receives a compact decoded response.

### 3. Preinstalled Static Low-Bandwidth UI
- Navigation structures, cards, buttons, MCQ interfaces, and vector icons are compiled into the local mobile application package.
- Transitioning between lessons or receiving personalized updates transmits only minimal text deltas, eliminating repeated multi-megabyte UI asset downloads over expensive 2G/EDGE cellular connections.
