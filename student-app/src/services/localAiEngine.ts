import {
  LearnerProfile,
  TopicMastery,
  AIRecommendation,
  QuizAttempt,
  LearningLevel,
  LearningSpeed,
  Question,
  TutorMode,
} from '../types';
import { localDb } from './localDb';
import { solveStudentQuery } from './exactSolver';

export interface PerformanceAnalysis {
  score: number;
  previousScore?: number;
  identifiedGaps: string[];
  masteryDelta: number;
  status: 'needs_practice' | 'improving' | 'strong';
  adaptedSpeed: LearningSpeed;
  adaptedLevel: LearningLevel;
  recommendation: AIRecommendation;
  feedbackMessage: string;
}

export class LocalAiEngine {
  /**
   * Analyzes a completed quiz attempt and updates the learner's profile
   * using local deterministic heuristics & Bayesian skill updates.
   */
  public analyzeQuizPerformance(
    attempt: QuizAttempt,
    questions: Question[]
  ): PerformanceAnalysis {
    const profile = localDb.getProfile();
    const existingMastery = profile.topicMasteries[attempt.topicId];
    const prevScore = existingMastery ? existingMastery.lastScore : 50;

    // 1. Identify specific conceptual gaps from wrong answers
    const identifiedGaps: string[] = [];
    attempt.answers.forEach((ans) => {
      if (!ans.isCorrect) {
        const q = questions.find((item) => item.id === ans.questionId);
        if (q && q.subtopic && !identifiedGaps.includes(q.subtopic)) {
          identifiedGaps.push(q.subtopic);
        }
      }
    });

    // 2. Compute new mastery percentage (weighted exponential moving average)
    const weight = 0.65; // higher weight on most recent performance
    const newMastery = Math.round(
      existingMastery
        ? existingMastery.masteryPercentage * (1 - weight) + attempt.score * weight
        : attempt.score
    );

    // 3. Determine status classification
    let status: 'needs_practice' | 'improving' | 'strong' = 'improving';
    if (newMastery < 60 || attempt.score < 55) {
      status = 'needs_practice';
    } else if (newMastery >= 75 && attempt.score >= 70) {
      status = 'strong';
    } else {
      status = 'improving';
    }

    // 4. Adapt learning speed & difficulty
    let adaptedSpeed: LearningSpeed = 'normal';
    let adaptedLevel: LearningLevel = 'beginner';

    if (attempt.score < 55) {
      // Struggling: slow down learning pace, provide simpler foundational guidance
      adaptedSpeed = 'slow';
      adaptedLevel = 'beginner';
    } else if (attempt.score >= 75) {
      // Excelling: increase pace, advance difficulty level
      adaptedSpeed = attempt.timeSpentSeconds < 90 ? 'fast' : 'normal';
      adaptedLevel = newMastery >= 80 ? 'advanced' : 'intermediate';
    } else {
      // Moderate: standard pace
      adaptedSpeed = 'normal';
      adaptedLevel = 'intermediate';
    }

    // 5. Build updated TopicMastery
    const allTopics = localDb.getTopics();
    const currentTopic = allTopics.find((t) => t.id === attempt.topicId);
    const topicTitle = currentTopic ? currentTopic.title : attempt.topicId;

    const updatedMastery: TopicMastery = {
      topicId: attempt.topicId,
      topicTitle,
      subjectId: attempt.subjectId,
      masteryPercentage: newMastery,
      status,
      attemptsCount: (existingMastery?.attemptsCount || 0) + 1,
      lastScore: attempt.score,
      recommendedSpeed: adaptedSpeed,
      recommendedDifficulty: adaptedLevel,
      identifiedGaps,
      lastPracticed: new Date().toISOString(),
    };

    // 6. Generate Next Personalized Recommendation
    let recTitle = '';
    let recReason = '';
    let actionText = 'Start Lesson';
    let isRevision = false;
    let targetLessonId: string | undefined = undefined;

    const lessons = localDb.getLessons(attempt.topicId);

    if (status === 'needs_practice') {
      isRevision = true;
      recTitle = `Revise ${topicTitle} Basics (Slow Pace)`;
      recReason = `Score was ${attempt.score}%. The on-device AI detected conceptual gaps in ${
        identifiedGaps.length > 0 ? identifiedGaps.join(', ') : 'fundamentals'
      }. Slowing down pace and offering worked step-by-step examples.`;
      actionText = 'Revise Basics';
      targetLessonId = lessons[0]?.id;
    } else if (status === 'strong') {
      isRevision = false;
      // Find next lesson or next topic
      const nextLesson = lessons.find((l) => l.level === adaptedLevel) || lessons[lessons.length - 1];
      targetLessonId = nextLesson?.id;
      recTitle = `Advance to ${targetLessonId ? nextLesson.title : 'Next Challenge'}`;
      recReason = `Excellent mastery of ${attempt.score}%! The AI has promoted you to ${adaptedLevel.toUpperCase()} level at an accelerated pace.`;
      actionText = 'Continue Learning';
    } else {
      isRevision = false;
      targetLessonId = lessons[1]?.id || lessons[0]?.id;
      recTitle = `Practice Next Step in ${topicTitle}`;
      recReason = `Good progress (${attempt.score}%). A little more practice on intermediate examples will solidify your understanding.`;
      actionText = 'Practice Now';
    }

    const recommendation: AIRecommendation = {
      id: 'rec-' + Date.now(),
      studentId: profile.studentId,
      subjectId: attempt.subjectId,
      topicId: attempt.topicId,
      topicTitle,
      lessonId: targetLessonId,
      title: recTitle,
      reason: recReason,
      recommendedLevel: adaptedLevel,
      recommendedSpeed: adaptedSpeed,
      practiceCount: status === 'needs_practice' ? 5 : 3,
      actionText,
      isRevision,
      timestamp: new Date().toISOString(),
    };

    // 7. Update profile state and save
    profile.topicMasteries[attempt.topicId] = updatedMastery;
    profile.currentSpeed = adaptedSpeed;
    profile.overallLevel = adaptedLevel;
    profile.xpPoints += Math.round(attempt.score / 2) + 20;

    // Check for streak and badges
    if (attempt.score >= 70 && !profile.badges.some((b) => b.id === 'badge-quiz-master')) {
      profile.badges.push({
        id: 'badge-quiz-master',
        title: 'Quiz Master ⭐',
        description: 'Scored 70%+ on a challenging quiz!',
        icon: '⭐',
        unlockedAt: new Date().toISOString(),
      });
    }

    localDb.setProfile(profile);
    localDb.setRecommendation(recommendation);

    // Feedback message
    let feedbackMessage = '';
    if (attempt.score >= 75) {
      feedbackMessage = `Outstanding job! 🎉 You scored ${attempt.score}%. Your mastery is now ${newMastery}%. The AI tutor is ready to advance your level!`;
    } else if (attempt.score >= 50) {
      feedbackMessage = `Good effort! 👏 You scored ${attempt.score}%. With a little more review, you'll reach top mastery.`;
    } else {
      feedbackMessage = `Let's understand why! 💡 You scored ${attempt.score}%. Don't worry, learning takes practice. The AI tutor has slowed down your pace and prepared easier worked examples.`;
    }

    return {
      score: attempt.score,
      previousScore: prevScore,
      identifiedGaps,
      masteryDelta: newMastery - prevScore,
      status,
      adaptedSpeed,
      adaptedLevel,
      recommendation,
      feedbackMessage,
    };
  }

  /**
   * Diagnostic assessment engine that initializes the learner profile
   */
  public processDiagnosticAssessment(
    results: { subjectId: string; topicId: string; score: number; gaps: string[] }[]
  ): LearnerProfile {
    const profile = localDb.getProfile();
    const topics = localDb.getTopics();

    results.forEach((res) => {
      const topic = topics.find((t) => t.id === res.topicId);
      const status: TopicMastery['status'] =
        res.score < 50 ? 'needs_practice' : res.score >= 75 ? 'strong' : 'improving';
      const speed: LearningSpeed = res.score < 50 ? 'slow' : res.score >= 75 ? 'fast' : 'normal';
      const level: LearningLevel =
        res.score < 50 ? 'beginner' : res.score >= 75 ? 'intermediate' : 'beginner';

      profile.topicMasteries[res.topicId] = {
        topicId: res.topicId,
        topicTitle: topic ? topic.title : res.topicId,
        subjectId: res.subjectId,
        masteryPercentage: res.score,
        status,
        attemptsCount: 1,
        lastScore: res.score,
        recommendedSpeed: speed,
        recommendedDifficulty: level,
        identifiedGaps: res.gaps,
        lastPracticed: new Date().toISOString(),
      };
    });

    profile.lastAssessmentDate = new Date().toISOString();

    // Find the weakest topic to recommend first
    const masteries = Object.values(profile.topicMasteries);
    masteries.sort((a, b) => a.masteryPercentage - b.masteryPercentage);
    const weakest = masteries[0];

    if (weakest) {
      const lessons = localDb.getLessons(weakest.topicId);
      const rec: AIRecommendation = {
        id: 'rec-diag-' + Date.now(),
        studentId: profile.studentId,
        subjectId: weakest.subjectId,
        topicId: weakest.topicId,
        topicTitle: weakest.topicTitle,
        lessonId: lessons[0]?.id,
        title: `Start with ${weakest.topicTitle} Basics`,
        reason: `Diagnostic assessment identified that ${weakest.topicTitle} needs additional foundational practice (Score: ${weakest.masteryPercentage}%).`,
        recommendedLevel: 'beginner',
        recommendedSpeed: 'slow',
        practiceCount: 5,
        actionText: 'Start Learning',
        isRevision: true,
        timestamp: new Date().toISOString(),
      };
      localDb.setRecommendation(rec);
    }

    localDb.setProfile(profile);
    return profile;
  }

  /**
   * Deterministic Offline AI response generator for student questions.
   * Completely offline, instantaneous, zero latency, zero cloud dependency!
   */
  public generateOfflineResponse(
    query: string,
    profile: LearnerProfile,
    mode: TutorMode = 'explain'
  ): {
    text: string;
    action?: { type: 'open_lesson' | 'start_quiz' | 'practice'; payload: string; label: string };
    followUps?: string[];
    practiceQuestion?: {
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
    };
  } {
    const q = query.toLowerCase();
    const user = localDb.getUser();
    const grade = user?.grade || 7;

    // 1. Run Exact Solver first for calculations, equations, fractions, geometry, and facts!
    const exact = solveStudentQuery(query, mode, grade);
    if (exact.exactAnswer && !exact.exactAnswer.startsWith('Direct Answer for')) {
      return {
        text: exact.text,
        action: exact.suggestedTopic
          ? {
              type: 'open_lesson',
              payload:
                exact.suggestedTopic === 'math-fractions'
                  ? 'lesson-frac-1'
                  : exact.suggestedTopic === 'math-algebra'
                  ? 'lesson-alg-1'
                  : 'lesson-geom-1',
              label: `Open ${exact.suggestedTopic.replace('math-', '').replace('sci-', '').toUpperCase()} Lesson`,
            }
          : undefined,
        followUps: exact.followUps,
        practiceQuestion: exact.practiceQuestion,
      };
    }

    // 2. Fractions & Decimals (conceptual)
    if (q.includes('fraction') || q.includes('numerator') || q.includes('denominator') || q.includes('भिन्न') || q.includes('decimal')) {
      if (mode === 'quiz_me') {
        return {
          text: `Here is an interactive Fraction Challenge for you! 🍕\n\nTry to solve it below:`,
          practiceQuestion: {
            question: 'What is 1/4 + 2/4 in simplest form?',
            options: ['3/4', '3/8', '2/4', '1/2'],
            correctAnswer: '3/4',
            explanation: 'When denominators are identical (4), add the numerators directly: 1 + 2 = 3. So the answer is 3/4!',
          },
          followUps: ['How do I subtract fractions?', 'Explain decimals', 'Give me another fraction quiz'],
          action: {
            type: 'start_quiz',
            payload: 'math-fractions',
            label: 'Open Full Fractions Quiz',
          },
        };
      }

      if (mode === 'step_by_step') {
        return {
          text: `Step-by-Step Guide to Adding Fractions 📐:\n\n1. Check the bottom numbers (denominators). If they are the same, keep that number.\n2. Add only the top numbers (numerators) together.\n3. Write the new total over the common bottom number.\n4. Check if you can simplify (e.g., 2/4 simplifies to 1/2)!`,
          followUps: ['Show an example with numbers', 'What if denominators are different?', 'Quiz me on this!'],
          action: {
            type: 'open_lesson',
            payload: 'lesson-frac-1',
            label: 'Explore Step-by-Step Lesson',
          },
        };
      }

      if (mode === 'rural_analogy') {
        return {
          text: `Imagine your mother made 1 fresh round chapati (roti) 🫓:\n\n• If she divides it equally among 4 family members, each person receives 1 out of 4 pieces: that is 1/4.\n• If you eat your piece and your sister gives you hers, you have eaten 1/4 + 1/4 = 2/4 pieces (which equals half the chapati, 1/2)!\n• The bottom number tells you how many pieces the roti was cut into.`,
          followUps: ['How does this apply to field land?', 'What about 3/4?', 'Quiz me on fractions'],
          action: {
            type: 'open_lesson',
            payload: 'lesson-frac-1',
            label: 'Practice Roti Fractions',
          },
        };
      }

      if (mode === 'quick_summary') {
        return {
          text: `⚡ Fraction Quick Rules:\n• Fraction = Numerator / Denominator (Part / Whole)\n• Same denominators: a/c + b/c = (a+b)/c\n• Common Decimals: 1/4 = 0.25 | 1/2 = 0.50 | 3/4 = 0.75 | 1/5 = 0.20`,
          followUps: ['Test me on decimal conversions', 'Explain step-by-step', 'How do I multiply fractions?'],
        };
      }

      // Default Socratic explain
      return {
        text: `A fraction simply means sharing equal pieces of a whole! 🍕\n\n• The bottom number (Denominator) is the total slices you cut.\n• The top number (Numerator) is how many slices you take.\n\nExample: If you cut 1 roti into 4 equal slices and eat 1 slice, you ate 1/4 of the roti! 3/4 remains.`,
        followUps: ['Explain like a village analogy', 'Give me a practice problem', 'Show step-by-step steps'],
        action: {
          type: 'open_lesson',
          payload: 'lesson-frac-1',
          label: 'Open Fraction Lesson',
        },
      };
    }

    // 2. Algebra & Equations
    if (q.includes('algebra') || q.includes('equation') || q.includes('variable') || q.includes('x') || q.includes('बीजगणित')) {
      if (mode === 'quiz_me') {
        return {
          text: `Here is an Algebra Mystery Box Challenge for you! 📦`,
          practiceQuestion: {
            question: 'Solve for x: x + 7 = 19',
            options: ['12', '14', '26', '7'],
            correctAnswer: '12',
            explanation: 'Subtract 7 from both sides: x = 19 - 7 = 12. Great job!',
          },
          followUps: ['Solve with multiplication (2x = 18)', 'Explain step-by-step', 'Show village analogy'],
          action: {
            type: 'start_quiz',
            payload: 'math-algebra',
            label: 'Take Algebra Quiz',
          },
        };
      }

      if (mode === 'step_by_step') {
        return {
          text: `How to Solve Any Simple Linear Equation ⚖️:\n\nStep 1: Look at what is happening to x (is a number added or subtracted?).\nStep 2: Do the exact opposite operation to BOTH sides of the equals sign (=).\nStep 3: If 5 is added (x + 5 = 12), subtract 5 from 12: x = 12 - 5 = 7.\nStep 4: Check your answer: 7 + 5 = 12 ✓!`,
          followUps: ['Give me a quiz on this', 'What if x is multiplied?', 'Show a village scale analogy'],
          action: {
            type: 'open_lesson',
            payload: 'lesson-alg-1',
            label: 'Algebra Steps Lesson',
          },
        };
      }

      return {
        text: `In algebra, "x" is like a closed mystery box! 📦\n\nIf you have a mystery box plus 3 mangoes, and together on a balance scale they match 10 mangoes:\n\nx + 3 = 10\n\nTo see what is inside the box, remove 3 mangoes from both sides of the scale:\nx = 10 - 3 = 7 mangoes! Whatever you do to one side of the scale, do to the other.`,
        followUps: ['Test me with a quiz', 'Explain step-by-step', 'What is 2x?'],
        action: {
          type: 'open_lesson',
          payload: 'lesson-alg-1',
          label: 'Practice Algebra Basics',
        },
      };
    }

    // 3. Geometry, Measurement & Village Fields
    if (q.includes('geometry') || q.includes('area') || q.includes('perimeter') || q.includes('angle') || q.includes('rectangle') || q.includes('square')) {
      if (mode === 'quiz_me') {
        return {
          text: `Geometry Land Measurement Challenge 📐:`,
          practiceQuestion: {
            question: 'A farmer fences a square field with sides of 10 meters each. What is the total perimeter?',
            options: ['40 meters', '100 square meters', '20 meters', '50 meters'],
            correctAnswer: '40 meters',
            explanation: 'Perimeter of a square = 4 × side length = 4 × 10m = 40 meters of wire fencing!',
          },
          followUps: ['What is the area of that field?', 'Explain difference between area and perimeter', 'Quiz on triangles'],
        };
      }

      return {
        text: `Think of a farm field 🌾:\n\n• Perimeter = The wire fence around the border (walk all the edges and add them up: length + breadth + length + breadth).\n• Area = The crop soil inside the fence (Length × Breadth)!\n\nFor a 20m by 10m field: Perimeter = 60m of fence, Area = 200 sq meters of crops.`,
        followUps: ['Give me a quiz question', 'What is a 90 degree angle?', 'Calculate area of a circle'],
        action: {
          type: 'open_lesson',
          payload: 'lesson-geom-1',
          label: 'Open Geometry Lesson',
        },
      };
    }

    // 4. Photosynthesis & Plant Biology
    if (q.includes('photosynthesis') || q.includes('plant') || q.includes('leaf') || q.includes('chlorophyll') || q.includes('प्रकाश संश्लेषण')) {
      if (mode === 'quiz_me') {
        return {
          text: `Plant Science Quick Checkup 🌱:`,
          practiceQuestion: {
            question: 'What green pigment in crop leaves captures warm sunlight for photosynthesis?',
            options: ['Chlorophyll', 'Carotene', 'Hemoglobin', 'Cellulose'],
            correctAnswer: 'Chlorophyll',
            explanation: 'Chlorophyll is the green pigment in chloroplasts that absorbs sunlight energy!',
          },
          followUps: ['What gas do plants release?', 'How do roots absorb water?', 'Explain step-by-step'],
        };
      }

      return {
        text: `Photosynthesis is how green leaves cook food for the plant using natural elements! 🌱☀️\n\n1. Roots pull water and minerals up from the soil.\n2. Chlorophyll (green pigment) catches warm sunlight.\n3. Leaves breathe in Carbon Dioxide from the breeze.\n4. Result: Sweet glucose food for the plant, and fresh Oxygen (O₂) for us to breathe!`,
        followUps: ['Give me a quiz on plants', 'Why are leaves green?', 'How do plants breathe at night?'],
        action: {
          type: 'open_lesson',
          payload: 'lesson-sci-plant-1',
          label: 'View Photosynthesis Lesson',
        },
      };
    }

    // 5. Energy, Solar & Village Simple Machines
    if (q.includes('energy') || q.includes('machine') || q.includes('solar') || q.includes('pulley') || q.includes('lever') || q.includes('wheel')) {
      return {
        text: `Simple machines make hard village work easy! 🚜\n\n• Pulley: The grooved wheel over the village well that lets you lift a heavy bucket of water with much less effort.\n• Lever: A crowbar or seesaw used to pry up heavy rocks in the field.\n• Solar Panels: Capture sunlight photons and convert them into electrical power for our classroom tablet hub!`,
        followUps: ['Quiz me on simple machines', 'How does solar battery storage work?', 'Explain the 6 types of simple machines'],
        action: {
          type: 'open_lesson',
          payload: 'lesson-sci-energy-1',
          label: 'Explore Energy Lesson',
        },
      };
    }

    // 6. English Grammar & Vocabulary
    if (q.includes('noun') || q.includes('verb') || q.includes('adjective') || q.includes('english') || q.includes('grammar') || q.includes('tense')) {
      if (mode === 'quiz_me') {
        return {
          text: `English Grammar Challenge 📝:`,
          practiceQuestion: {
            question: 'In the sentence "The clever girl solved the puzzle quickly", what part of speech is "clever"?',
            options: ['Adjective', 'Noun', 'Verb', 'Adverb'],
            correctAnswer: 'Adjective',
            explanation: '"Clever" describes the girl (a noun), so it is an adjective!',
          },
          followUps: ['What is an adverb?', 'Explain past, present, and future tenses', 'Give me another grammar question'],
        };
      }

      return {
        text: `Every English sentence is built with simple building blocks 🧱:\n\n• Noun: Person, place, or thing (Rahul, Rampur, Tractor, Book).\n• Verb: Action word (run, harvest, study, speak).\n• Adjective: Describing word (green field, clever student, bright solar light).\n\nCombine them: "The clever student (Adj+Noun) studies (Verb) happily."`,
        followUps: ['Give me an English quiz', 'Explain tenses simply', 'How to form questions in English'],
      };
    }

    // 7. Slow down pace request
    if (q.includes('slow') || q.includes('slowly') || q.includes('confused') || q.includes('hard') || q.includes('कठिन')) {
      profile.currentSpeed = 'slow';
      localDb.setProfile(profile);
      return {
        text: `No worries at all! I have switched to gentle learning speed 🐢.\n\nWe will take one tiny step at a time with simple pictures and practical village examples. What concept would you like to revisit first?`,
        followUps: ['Explain fractions slowly', 'Explain algebra slowly', 'Explain photosynthesis slowly'],
        action: {
          type: 'open_lesson',
          payload: 'lesson-frac-1',
          label: 'Step-by-Step Foundations',
        },
      };
    }

    // 8. Quiz or practice request
    if (q.includes('quiz') || q.includes('test') || q.includes('practice') || q.includes('challenge')) {
      const rec = localDb.getCurrentRecommendation();
      return {
        text: `Here is a personalized challenge for you: Let's test your skills in ${rec.topicTitle}! Tap below to begin a quick checkup. 🎯`,
        followUps: ['Give me a math quiz', 'Give me a science quiz', 'Give me an English quiz'],
        action: {
          type: 'start_quiz',
          payload: rec.topicId,
          label: `Start ${rec.topicTitle} Quiz`,
        },
      };
    }

    // Default: use exact solver to provide a direct response for the student's query
    return {
      text: exact.text,
      followUps: exact.followUps,
      practiceQuestion: exact.practiceQuestion,
      action: {
        type: 'open_lesson',
        payload: 'lesson-frac-1',
        label: 'Explore Related Lesson',
      },
    };
  }
}

export const localAiEngine = new LocalAiEngine();
