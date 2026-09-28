# Rehber Cellular SMS / Low-Bandwidth Protocol Specification

## 1. Specification Overview

When regular TCP/IP internet data connectivity is unavailable, Rehber utilizes a delimited cellular message format designed for standard GSM SMS limits (160 characters per single-segment message, or concatenated double-segment SMS up to 320 characters).

### Message Structure:
```text
[StudentID]#[ActionCode]#[PayloadData]
```

---

## 2. Character Delimiters & Escaping Rules

| Delimiter | Purpose | Escape Sequence |
|:---|:---|:---|
| `#` | Primary segment separator | `\#` |
| `\|` | Secondary field separator | `\\\|` |
| `:` | Key-value subfield separator | N/A |
| `\\` | Escape character | `\\\\` |

---

## 3. Supported Action Codes & Payloads

### 1. `REG` — Student Registration
- **Format**: `[StudentID]#REG#[Name]|[Grade]|[Language]`
- **Example**: `STU101#REG#Amina Khan|6|urdu`
- **Response**: `STU101#ACK#OK|REG_SUCCESS|Amina Khan`

### 2. `QZ` — Quiz Submission
- **Format**: `[StudentID]#QZ#[QuizID]|[Answers]`
- **Answers Structure**: Comma-separated pairs `QuestionID:ChosenOption`
- **Example**: `STU102#QZ#QZ_MATH_01|Q_MATH_001:A,Q_MATH_002:B`
- **Response**: `STU102#RES#QZ|Score:100%|Mastery:+0.16|Next:MOD_MATH_02`

### 3. `ASK` — AI Question / Concept Query
- **Format**: `[StudentID]#ASK#[QueryText]`
- **Example**: `STU101#ASK#Why do plants need sunlight?`
- **Response**: `STU101#ANS#Plants make food using sunlight, water, and CO2, releasing oxygen.`

### 4. `PGR` — Learning Progress Checkpoint
- **Format**: `[StudentID]#PGR#[ModuleID]|[Score]|[TimeSeconds]`
- **Example**: `STU104#PGR#MOD_SCI_01|85|1200`
- **Response**: `STU104#ACK#PGR|MOD_SCI_01|SAVED`

### 5. `ERR` — Error Response
- **Format**: `[StudentID]#ERR#[ErrorCode]|[ErrorMessage]`
- **Example**: `STU101#ERR#ERR_STUDENT_NOT_FOUND|Student ID not registered`
