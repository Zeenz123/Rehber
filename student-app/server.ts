import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Enable CORS for cross-app local development & Web portal (port 3001)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-SlowNet-Compression'
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-Memory SMS logs store for web gateway observability
const recentSmsLogs: any[] = [];


// Initialize Gemini Client server-side
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-Memory Teacher & Classroom Mock Store
interface MockStudent {
  id: string;
  name: string;
  grade: number;
  avatar: string;
  learningLevel: 'beginner' | 'intermediate' | 'advanced';
  overallProgress: number;
  averageScore: number;
  subjectProgress: { math: number; science: number; english: number };
  weakTopics: string[];
  strongTopics: string[];
  lastSync: string;
  lastActive: string;
  needsSupport: boolean;
  learningSpeed: 'slow' | 'normal' | 'fast';
  recommendedIntervention: string;
}

const mockStudents: MockStudent[] = [
  {
    id: 'student-rahul-01',
    name: 'Rahul Kumar',
    grade: 7,
    avatar: '👦🏽',
    learningLevel: 'beginner',
    overallProgress: 65,
    averageScore: 68,
    subjectProgress: { math: 62, science: 78, english: 72 },
    weakTopics: ['Fractions & Decimals', 'Algebra Basics & Equations'],
    strongTopics: ['Geometry & Land Measurement', 'Plant Life & Photosynthesis'],
    lastSync: '28 Sep 2026, 10:30 AM',
    lastActive: 'Today, 10:15 AM',
    needsSupport: true,
    learningSpeed: 'slow',
    recommendedIntervention: 'Additional step-by-step practice required for fractions & algebra equations.',
  },
  {
    id: 'student-priya-02',
    name: 'Priya Sharma',
    grade: 7,
    avatar: '👧🏽',
    learningLevel: 'intermediate',
    overallProgress: 84,
    averageScore: 86,
    subjectProgress: { math: 85, science: 90, english: 78 },
    weakTopics: ['Ratios, Proportions & Percentages'],
    strongTopics: ['Algebra Basics & Equations', 'Plant Life & Photosynthesis', 'Water Cycle'],
    lastSync: '28 Sep 2026, 09:45 AM',
    lastActive: 'Today, 09:40 AM',
    needsSupport: false,
    learningSpeed: 'fast',
    recommendedIntervention: 'Ready for advanced challenge questions in proportions.',
  },
  {
    id: 'student-anita-03',
    name: 'Anita Devi',
    grade: 7,
    avatar: '👧🏾',
    learningLevel: 'beginner',
    overallProgress: 52,
    averageScore: 56,
    subjectProgress: { math: 48, science: 55, english: 53 },
    weakTopics: ['Fractions & Decimals', 'Energy & Simple Machines', 'Parts of Speech'],
    strongTopics: ['Geometry & Land Measurement'],
    lastSync: '27 Sep 2026, 04:15 PM',
    lastActive: 'Yesterday',
    needsSupport: true,
    learningSpeed: 'slow',
    recommendedIntervention: 'Recommend small-group audio guidance and remedial fraction cards.',
  },
  {
    id: 'student-arun-04',
    name: 'Arun Patel',
    grade: 7,
    avatar: '👦🏾',
    learningLevel: 'intermediate',
    overallProgress: 76,
    averageScore: 79,
    subjectProgress: { math: 74, science: 82, english: 72 },
    weakTopics: ['Water Cycle & Rainwater Harvesting'],
    strongTopics: ['Algebra Basics & Equations', 'Simple Machines'],
    lastSync: '28 Sep 2026, 08:30 AM',
    lastActive: 'Today, 08:20 AM',
    needsSupport: false,
    learningSpeed: 'normal',
    recommendedIntervention: 'Performing well; assign science water conservation project.',
  },
  {
    id: 'student-sunita-05',
    name: 'Sunita Meena',
    grade: 7,
    avatar: '👧🏽',
    learningLevel: 'beginner',
    overallProgress: 58,
    averageScore: 61,
    subjectProgress: { math: 50, science: 64, english: 60 },
    weakTopics: ['Fractions & Decimals', 'Algebra Basics & Equations'],
    strongTopics: ['Human Body & Nutrition'],
    lastSync: '28 Sep 2026, 10:10 AM',
    lastActive: 'Today, 09:55 AM',
    needsSupport: true,
    learningSpeed: 'slow',
    recommendedIntervention: 'Visual manipulatives recommended for decimal place values.',
  },
];

// Backend API Routes

// 1. Auth routes
app.post('/api/auth/login', (req, res) => {
  const { username } = req.body;
  res.json({
    token: 'jwt-session-rural-node-token-xyz',
    user: {
      id: 'student-rahul-01',
      name: username || 'Rahul Kumar',
      role: 'student',
      grade: 7,
      school: 'Rampur Secondary School',
      hubId: 'hub-solar-node-04',
    },
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    user: {
      id: 'student-rahul-01',
      name: 'Rahul Kumar',
      role: 'student',
      grade: 7,
      school: 'Rampur Secondary School',
    },
  });
});

import { solveStudentQuery } from './src/services/exactSolver';

// 2. Advanced AI Tutor Endpoint (Gemini 3.8 Flash)
app.post('/api/ai/chat', async (req, res) => {
  const { query, learnerContext, mode = 'explain', history = [] } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const studentGrade = learnerContext?.grade || 7;
  const studentLevel = learnerContext?.level || 'beginner';
  const studentSpeed = learnerContext?.speed || 'normal';
  const studentLang = learnerContext?.language || 'en';
  const weakTopics = (learnerContext?.weakTopics || []).join(', ') || 'None';
  const strongTopics = (learnerContext?.strongTopics || []).join(', ') || 'None';

  // 1. Run local exact solver first to obtain verified answer for math or known facts
  const exactLocal = solveStudentQuery(query, mode, studentGrade);

  // If Gemini API is available, generate rich contextual response
  if (ai) {
    try {
      const modeInstructions: Record<string, string> = {
        explain: 'Give the exact direct answer immediately on line 1. Then provide a crystal-clear, easy-to-understand conceptual explanation with 1 practical village analogy.',
        step_by_step: 'State the exact final answer first in bold (e.g. **Answer: ...**). Then show every single step cleanly numbered (Step 1, Step 2, Step 3) showing how to reach that exact answer.',
        quiz_me: 'Give the exact answer to the student query first. Then generate 1 multiple-choice practice question testing the same concept with 4 options and the correct answer.',
        rural_analogy: 'Give the exact answer clearly first. Then explain the mechanism using an intuitive rural village life analogy (farming, rotis, well pulleys, solar battery storage, village trade).',
        quick_summary: 'State the exact answer directly in the first line. Then give key bullet points, formulas, and definitions under 80 words.',
      };

      const selectedModeGuide = modeInstructions[mode] || modeInstructions.explain;

      const langGuide =
        studentLang === 'hi'
          ? 'Respond in clear, friendly Hindi (Devanagari script) or natural conversational Hindi, using English terms in parentheses for technical school syllabus words where helpful.'
          : studentLang === 'ta'
          ? 'Respond in friendly Tamil, keeping school terms accessible.'
          : studentLang === 'te'
          ? 'Respond in friendly Telugu.'
          : studentLang === 'ml'
          ? 'Respond in friendly Malayalam.'
          : studentLang === 'kn'
          ? 'Respond in friendly Kannada.'
          : 'Respond in clear, accessible, child-friendly English.';

      // Format previous 3 conversation turns if available
      const historyContext = (history || [])
        .slice(-4)
        .map((h: any) => `${h.sender === 'student' ? 'Student' : 'Tutor'}: ${h.text}`)
        .join('\n');

      const systemPrompt = `You are RuralLearn AI's intelligent tutor, supporting a Class ${studentGrade} student in a rural community school.

CRITICAL INSTRUCTION - EXACT ANSWER MANDATE:
1. You MUST ALWAYS provide the EXACT, DIRECT, PRECISE ANSWER to the student's question on the very first line of your response in bold (e.g., "**Answer: [Exact Result]**").
2. If the student asks to calculate or solve any math problem, fraction, equation, or measurement (e.g., "15 * 4", "solve 2x + 6 = 20", "what is 1/4 + 2/4", "square root of 144", "area of rectangle with length 10 and width 5"):
   - You MUST compute the exact numerical or algebraic solution. Never dodge, never give a generic placeholder, and never leave the question unanswered!
3. If the student asks a factual question (e.g., "What is the capital of France?", "What is photosynthesis?", "Who discovered gravity?", "Formula for area of circle", "What is an adjective?"):
   - State the exact factual answer immediately.
4. After stating the direct answer, provide a clear, encouraging, step-by-step explanation suitable for a Class ${studentGrade} student.

Student Profile:
- Level: ${studentLevel}
- Learning Pace: ${studentSpeed}
- Weak areas: ${weakTopics}
- Strong areas: ${strongTopics}
- Active Teaching Mode: ${mode.toUpperCase()} - ${selectedModeGuide}
- Language requirement: ${langGuide}
${exactLocal?.exactAnswer ? `Verified exact reference answer: ${exactLocal.exactAnswer}` : ''}

Conversation History:
${historyContext || 'No previous history.'}

Student's Latest Question: "${query}"

Return a JSON object with this exact structure:
{
  "text": "Your complete response: Starts with the bold exact answer (e.g. **Answer: ...**), followed by step-by-step explanation and 1-2 friendly emojis.",
  "followUps": ["Relevant follow-up question 1", "Relevant follow-up question 2", "Relevant follow-up question 3"],
  "practiceQuestion": {
    "question": "Optional mini practice question or null",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Exact matching string of correct option",
    "explanation": "Brief solution explanation"
  },
  "suggestedTopic": "math-fractions" or "math-algebra" or "math-geometry" or "sci-plants" or "sci-energy" or null
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: systemPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '';
      try {
        const parsed = JSON.parse(rawText);
        let suggestedAction = undefined;
        if (parsed.suggestedTopic) {
          suggestedAction = {
            type: 'start_quiz',
            payload: parsed.suggestedTopic,
            label: `Practice ${parsed.suggestedTopic.replace('math-', '').replace('sci-', '').toUpperCase()}`,
          };
        }

        return res.json({
          text: parsed.text || rawText,
          followUps: Array.isArray(parsed.followUps) && parsed.followUps.length > 0 ? parsed.followUps.slice(0, 3) : exactLocal.followUps,
          practiceQuestion: parsed.practiceQuestion?.question ? parsed.practiceQuestion : exactLocal.practiceQuestion,
          suggestedAction: suggestedAction || (exactLocal.suggestedTopic ? { type: 'start_quiz', payload: exactLocal.suggestedTopic, label: 'Explore Practice Quiz' } : undefined),
          provider: 'cloud_gemini',
        });
      } catch (jsonErr) {
        return res.json({
          text: rawText,
          followUps: exactLocal.followUps,
          practiceQuestion: exactLocal.practiceQuestion,
          provider: 'cloud_gemini',
        });
      }
    } catch (err: any) {
      console.warn('Gemini generateContent error in server.ts:', err.message);
    }
  }

  // Exact fallback: returns mathematically and factually verified answer directly
  return res.json({
    text: exactLocal.text,
    followUps: exactLocal.followUps,
    practiceQuestion: exactLocal.practiceQuestion,
    suggestedAction: exactLocal.suggestedTopic ? { type: 'start_quiz', payload: exactLocal.suggestedTopic, label: 'Take Topic Quiz' } : undefined,
    provider: 'local_engine',
  });
});

// 3. Solar Hub & Sync endpoints
app.post('/api/sync/upload', (req, res) => {
  const { studentId, records, profile } = req.body;
  console.log(`[Solar Hub Server] Received ${records?.length || 0} sync records from ${studentId}`);

  // Update mock student if matching
  const st = mockStudents.find((s) => s.id === studentId);
  if (st && profile) {
    st.overallProgress = Math.min(100, Math.round(profile.xpPoints / 5));
    st.learningSpeed = profile.currentSpeed;
    st.lastSync = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  res.json({
    status: 'synced',
    timestamp: new Date().toISOString(),
    recordsProcessed: records?.length || 0,
    serverMessage: 'Records backed up to Community Hub solar storage buffer.',
  });
});

app.get('/api/sync/status', (req, res) => {
  res.json({
    hubStatus: 'CONNECTED',
    nodeName: 'Rampur Solar Node #4',
    batteryPercentage: 92,
    activeTablets: 6,
    lastCloudRelay: new Date().toISOString(),
  });
});

// 4. Teacher Dashboard API
app.get('/api/teacher/students', (req, res) => {
  res.json(mockStudents);
});

app.get('/api/teacher/class-insights', (req, res) => {
  res.json({
    totalStudents: 32,
    activeToday: 28,
    studentsNeedingSupport: 9,
    averageClassProgress: 68,
    topicWeaknesses: [
      {
        subject: 'Mathematics',
        topic: 'Fractions & Decimals',
        studentsCount: 12,
        severity: 'high',
        suggestion: 'Organize hands-on paper-folding and roti sharing workshop.',
      },
      {
        subject: 'Mathematics',
        topic: 'Algebra Basics & Equations',
        studentsCount: 8,
        severity: 'medium',
        suggestion: 'Provide mystery balance scale manipulatives.',
      },
      {
        subject: 'Science',
        topic: 'Energy & Simple Machines',
        studentsCount: 6,
        severity: 'medium',
        suggestion: 'Demonstrate well pulleys and bicycle gears outdoors.',
      },
      {
        subject: 'Mathematics',
        topic: 'Geometry & Land Measurement',
        studentsCount: 3,
        severity: 'low',
        suggestion: 'Most students have achieved mastery; introduce triangular perimeters.',
      },
    ],
  });
});

app.get('/api/teacher/student/:id', (req, res) => {
  const student = mockStudents.find((s) => s.id === req.params.id) || mockStudents[0];
  res.json(student);
});

// 5. Cellular SMS Gateway Webhook
// Standard: [StudentID]#[ActionCode]#[PayloadData]
app.post('/api/sms/webhook', async (req, res) => {
  const { body } = req.body || {};
  const rawBody = (body || '').trim();

  if (!rawBody) {
    return res.status(400).json({ error: 'body is required' });
  }

  try {
    const match = /^([A-Za-z0-9_-]+)#([A-Z]{2,4})#(.*)$/s.exec(rawBody);
    if (!match) {
      return res.json({
        status: 'ERROR',
        student_id: 'UNKNOWN',
        action_code: 'ERR',
        reply_sms: 'UNKNOWN#ERR#ERR_FORMAT|Invalid message format. Expected [StudentID]#[Action]#[Payload]',
        is_simulated: true,
      });
    }

    const [, studentId, actionCode, rawPayload] = match;

    let finalReply = `${studentId}#ACK#OK|RECEIVED`;

    if (actionCode === 'ASK') {
      const exact = solveStudentQuery(rawPayload, 'explain', 7);
      const cleanAns = exact.text.replace(/[*#_`]/g, '').trim().slice(0, 155);
      finalReply = `${studentId}#ANS#${cleanAns}`;
    } else if (actionCode === 'QZ') {
      finalReply = `${studentId}#RES#QZ|Score:85%|Mastery:+0.16|Next:MOD_MATH_02`;
    } else if (actionCode === 'REG') {
      const parts = rawPayload.split('|');
      const name = parts[0] || 'Student';
      finalReply = `${studentId}#ACK#OK|REG_SUCCESS|${name}`;
    } else if (actionCode === 'PGR') {
      const parts = rawPayload.split('|');
      const mod = parts[0] || 'MOD_01';
      finalReply = `${studentId}#ACK#PGR|${mod}|SAVED`;
    }

    const logEntry = {
      id: `sms-srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      direction: 'INBOUND',
      sender_number: req.body?.from_number || '+923001234567',
      raw_text: rawBody,
      student_id: studentId,
      action_code: actionCode,
      status: 'PROCESSED',
      response_text: finalReply,
      created_at: new Date().toISOString(),
    };
    recentSmsLogs.unshift(logEntry);
    if (recentSmsLogs.length > 50) recentSmsLogs.pop();

    return res.json({
      status: 'PROCESSED',
      student_id: studentId,
      action_code: actionCode,
      reply_sms: finalReply,
      is_simulated: true,
    });
  } catch (err: any) {
    return res.json({
      status: 'ERROR',
      student_id: 'UNKNOWN',
      action_code: 'ERR',
      reply_sms: `UNKNOWN#ERR#ERR_SERVER|${err.message}`,
      is_simulated: true,
    });
  }
});

// 6. Live SMS Gateway Logs Endpoint
app.get('/api/sms/logs', async (req, res) => {
  try {
    const fRes = await fetch('http://localhost:8000/api/sms/logs?limit=50');
    if (fRes.ok) {
      const data = await fRes.json();
      return res.json(data);
    }
  } catch (_) {}

  // Fallback to local server logs if FastAPI is not currently up
  res.json(recentSmsLogs);
});

// 7. Teacher Outbound SMS Sender Endpoint
app.post('/api/sms/send', async (req, res) => {
  const { student_id = 'STU101', text = 'Hello', action_code = 'TCH' } = req.query as any;

  try {
    const fRes = await fetch(
      `http://localhost:8000/api/sms/send?student_id=${encodeURIComponent(student_id)}&text=${encodeURIComponent(
        text
      )}&action_code=${action_code}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } }
    );
    if (fRes.ok) {
      return res.json(await fRes.json());
    }
  } catch (_) {}

  const logEntry = {
    id: `sms-portal-${Date.now()}`,
    direction: 'OUTBOUND',
    sender_number: 'PORTAL',
    raw_text: `${student_id}#${action_code}#${text}`,
    student_id,
    action_code,
    status: 'DELIVERED',
    response_text: text,
    created_at: new Date().toISOString(),
  };
  recentSmsLogs.unshift(logEntry);
  res.json(logEntry);
});

// 8. Offline Sync Batch Endpoint (FastAPI parity)
app.post('/api/sync/batch', async (req, res) => {
  const { student_id = 'STU101', records = [] } = req.body || {};

  try {
    const fRes = await fetch('http://localhost:8000/api/sync/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    if (fRes.ok) return res.json(await fRes.json());
  } catch (_) {}

  res.json({
    status: 'OK',
    processed_ids: records.map((r: any) => r.id),
    failed_ids: [],
    conflicts: [],
    server_timestamp: new Date().toISOString(),
    curriculum_version: '2025.1.0',
  });
});


// Vite Middleware for Dev and Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`RuralLearn AI server running on http://localhost:${PORT}`);
  });
}

startServer();
