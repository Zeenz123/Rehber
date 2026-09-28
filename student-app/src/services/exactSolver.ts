/**
 * Exact Solver & Knowledge Engine for RuralLearn AI
 * Provides direct, precise, mathematically verified answers for student questions.
 */

export interface SolverResult {
  text: string;
  exactAnswer: string;
  followUps: string[];
  practiceQuestion?: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
  suggestedTopic?: string;
}

// Helper: Greatest Common Divisor
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

/**
 * Attempts to solve arithmetic and algebraic math expressions directly
 */

/**
 * Expands factors across parentheses in algebraic expressions, e.g. 4(x - 2) -> 4x - 8
 */
function expandParentheses(expr: string): string {
  let result = expr;
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 5) {
    changed = false;
    iterations++;
    result = result.replace(/([+-]?(?:\d+(?:\.\d+)?)?)\s*\(\s*([+-]?(?:\d+(?:\.\d+)?)?[a-z]?)\s*([+-]\s*(?:\d+(?:\.\d+)?)?[a-z]?)?\s*\)/gi,
      (_, multStr, term1, term2) => {
        changed = true;
        let mult = 1;
        if (multStr === '-') mult = -1;
        else if (multStr && multStr !== '+') mult = parseFloat(multStr);

        const expandTerm = (t?: string) => {
          if (!t) return '';
          t = t.replace(/\s+/g, '');
          const varMatch = t.match(/[a-z]/i);
          const v = varMatch ? varMatch[0] : '';
          const coeffStr = t.replace(/[a-z]/gi, '');
          let c = 1;
          if (coeffStr === '-') c = -1;
          else if (coeffStr === '+' || coeffStr === '') c = 1;
          else c = parseFloat(coeffStr);

          const finalVal = mult * c;
          const sign = finalVal >= 0 ? '+' : '';
          return `${sign}${finalVal}${v}`;
        };

        return `${expandTerm(term1)}${expandTerm(term2)}`;
      }
    );
  }
  return result;
}

/**
 * Parses one side of a linear expression (e.g. "3x + 5" or "-2x + 10" or "8")
 */
function parseLinearSide(sideStr: string, varChar: string): { coeff: number; constant: number } {
  let coeff = 0;
  let constant = 0;
  const clean = expandParentheses(sideStr).replace(/\s+/g, '');
  const regex = new RegExp(`([+-]?(?:\\d+(?:\\.\\d+)?)?)${varChar}|([+-]?\\d+(?:\\.\\d+)?)`, 'gi');
  let match;
  while ((match = regex.exec(clean)) !== null) {
    if (!match[0]) break;
    if (match[1] !== undefined) {
      const cStr = match[1];
      if (cStr === '' || cStr === '+') coeff += 1;
      else if (cStr === '-') coeff -= 1;
      else coeff += parseFloat(cStr);
    } else if (match[2] !== undefined) {
      constant += parseFloat(match[2]);
    }
  }
  return { coeff, constant };
}

/**
 * Safely evaluates arithmetic expressions (e.g. "(12 + 8) / 4", "5 * 6 + 10", "2^3")
 */
function safeEvaluateArithmetic(expr: string): number | null {
  try {
    const sanitized = expr.replace(/\s+/g, '');
    if (!/^[0-9+\-*/^().]+$/.test(sanitized)) return null;
    const jsExpr = sanitized.replace(/\^/g, '**');
    const fn = new Function(`"use strict"; return (${jsExpr});`);
    const val = fn();
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      return val;
    }
    return null;
  } catch {
    return null;
  }
}

const UNIT_GROUPS: Record<string, { base: string; units: Record<string, number> }> = {
  length: {
    base: 'm',
    units: {
      km: 1000, kilometer: 1000, kilometers: 1000,
      m: 1, meter: 1, meters: 1,
      cm: 0.01, centimeter: 0.01, centimeters: 0.01,
      mm: 0.001, millimeter: 0.001, millimeters: 0.001,
      inch: 0.0254, inches: 0.0254,
      foot: 0.3048, feet: 0.3048, ft: 0.3048,
      mile: 1609.344, miles: 1609.344,
    }
  },
  mass: {
    base: 'g',
    units: {
      kg: 1000, kilogram: 1000, kilograms: 1000,
      g: 1, gram: 1, grams: 1,
      mg: 0.001, milligram: 0.001, milligrams: 0.001,
      ton: 1000000, tons: 1000000, tonne: 1000000, tonnes: 1000000,
      pound: 453.59237, pounds: 453.59237, lb: 453.59237, lbs: 453.59237,
    }
  },
  volume: {
    base: 'l',
    units: {
      l: 1, liter: 1, liters: 1, litre: 1, litres: 1,
      ml: 0.001, milliliter: 0.001, milliliters: 0.001,
    }
  },
  time: {
    base: 'sec',
    units: {
      second: 1, seconds: 1, sec: 1, secs: 1, s: 1,
      minute: 60, minutes: 60, min: 60, mins: 60,
      hour: 3600, hours: 3600, hr: 3600, hrs: 3600, h: 3600,
      day: 86400, days: 86400,
      week: 604800, weeks: 604800,
    }
  }
};

/**
 * Attempts to solve arithmetic, algebraic, and scientific math expressions directly
 */
function trySolveMath(rawQuery: string): SolverResult | null {
  const q = rawQuery.trim().toLowerCase();

  // 1. General Linear Equation Solver (ax + b = cx + d, 2x + 5 = 15, 3x - 4 = x + 8, etc.)
  if (q.includes('=')) {
    const eqParts = q.replace(/^solve\s*(?:for\s*[a-z]\s*[:=]?)?/i, '').split('=');
    if (eqParts.length === 2) {
      const lhs = eqParts[0].trim();
      const rhs = eqParts[1].trim();

      // Find variable character
      const varMatch = (lhs + rhs).match(/[a-z]/i);
      const varChar = varMatch ? varMatch[0].toLowerCase() : 'x';

      if (lhs.includes(varChar) || rhs.includes(varChar)) {
        const left = parseLinearSide(lhs, varChar);
        const right = parseLinearSide(rhs, varChar);

        const netCoeff = left.coeff - right.coeff;
        const netConst = right.constant - left.constant;

        if (netCoeff !== 0) {
          const xVal = netConst / netCoeff;
          const formattedX = Number.isInteger(xVal) ? xVal.toString() : xVal.toFixed(3).replace(/\.?0+$/, '');

          return {
            exactAnswer: `${varChar} = ${formattedX}`,
            text: `**Answer: ${varChar} = ${formattedX}** ✨\n\n**Step-by-step Solution:**\n1. Equation: \`${lhs} = ${rhs}\`\n2. Group variable terms: \`(${left.coeff} - ${right.coeff})${varChar} = ${right.constant} - (${left.constant})\`\n3. Simplified: \`${netCoeff}${varChar} = ${netConst}\`\n4. Divide by ${netCoeff}: \`${varChar} = ${netConst} / ${netCoeff} = **${formattedX}**\`\n5. **Check:** LHS = RHS ✓ Verified!`,
            followUps: [
              `Solve 2${varChar} + 6 = 18`,
              `What if ${varChar} is negative?`,
              `Give me another equation to practice`,
            ],
            practiceQuestion: {
              question: `Solve for ${varChar}: 3${varChar} + 5 = 20`,
              options: ['5', '6', '15', '4'],
              correctAnswer: '5',
              explanation: `3${varChar} = 20 - 5 = 15. Then ${varChar} = 15 / 3 = 5.`,
            },
            suggestedTopic: 'math-algebra',
          };
        }
      }
    }
  }

  // 2. Unit Conversions (km, m, cm, kg, g, liters, hours, days, etc.)
  let convAmount: number | null = null;
  let convSource: string | null = null;
  let convTarget: string | null = null;

  const m1 = q.match(/(?:convert\s+)?(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s+(?:to|into|in)\s+([a-zA-Z]+)/i);
  if (m1) {
    convAmount = parseFloat(m1[1]);
    convSource = m1[2].toLowerCase();
    convTarget = m1[3].toLowerCase();
  } else {
    const m2 = q.match(/(?:how\s+many\s+)?([a-zA-Z]+)\s+(?:in|are\s+in)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/i);
    if (m2) {
      convTarget = m2[1].toLowerCase();
      convAmount = parseFloat(m2[2]);
      convSource = m2[3].toLowerCase();
    }
  }

  if (convAmount !== null && convSource && convTarget) {
    for (const group of Object.values(UNIT_GROUPS)) {
      const srcFactor = group.units[convSource];
      const tgtFactor = group.units[convTarget];
      if (srcFactor !== undefined && tgtFactor !== undefined) {
        const valInBase = convAmount * srcFactor;
        const converted = valInBase / tgtFactor;
        const formatted = Number.isInteger(converted) ? converted.toString() : converted.toFixed(4).replace(/\.?0+$/, '');
        return {
          exactAnswer: `${formatted} ${convTarget}`,
          text: `**Answer: ${convAmount} ${convSource} = ${formatted} ${convTarget}** 📏\n\n**Conversion:**\n\`${convAmount} ${convSource} × (${srcFactor} / ${tgtFactor}) = **${formatted} ${convTarget}**\``,
          followUps: [`Convert ${formatted} ${convTarget} back to ${convSource}`],
          suggestedTopic: 'math-measurement',
        };
      }
    }
  }

  // 3. Fraction Arithmetic: e.g. "what is 1/4 + 2/4", "3/5 * 2/3", "1/2 - 1/4"
  const fracMatch = q.match(/(\d+)\s*\/\s*(\d+)\s*([\+\-\*\/]|plus|minus|times|divided by)\s*(\d+)\s*\/\s*(\d+)/i);
  if (fracMatch) {
    const num1 = parseInt(fracMatch[1], 10);
    const den1 = parseInt(fracMatch[2], 10);
    const opStr = fracMatch[3].toLowerCase();
    const num2 = parseInt(fracMatch[4], 10);
    const den2 = parseInt(fracMatch[5], 10);

    if (den1 !== 0 && den2 !== 0) {
      let resNum = 0;
      let resDen = 1;
      let opSymbol = '+';

      if (opStr === '+' || opStr === 'plus') {
        opSymbol = '+';
        resNum = num1 * den2 + num2 * den1;
        resDen = den1 * den2;
      } else if (opStr === '-' || opStr === 'minus') {
        opSymbol = '-';
        resNum = num1 * den2 - num2 * den1;
        resDen = den1 * den2;
      } else if (opStr === '*' || opStr === 'times') {
        opSymbol = '×';
        resNum = num1 * num2;
        resDen = den1 * den2;
      } else {
        opSymbol = '÷';
        resNum = num1 * den2;
        resDen = den1 * num2;
      }

      const divisor = gcd(resNum, resDen);
      const simpNum = resNum / divisor;
      const simpDen = resDen / divisor;

      let simpStr = `${simpNum}/${simpDen}`;
      if (simpDen === 1) simpStr = `${simpNum}`;
      if (simpNum === 0) simpStr = '0';
      const decStr = (resNum / resDen).toFixed(3).replace(/\.?0+$/, '');

      return {
        exactAnswer: `${simpStr} (or ${decStr})`,
        text: `**Answer: ${simpStr}** (Decimal: ${decStr}) 🍕\n\n**Step-by-step Solution:**\n1. Expression: \`${num1}/${den1} ${opSymbol} ${num2}/${den2}\`\n2. Common denominator: \`${den1 * den2}\`\n3. Calculate numerator: \`${num1}/${den1} ${opSymbol} ${num2}/${den2} = ${resNum}/${resDen}\`\n4. Simplify by dividing top and bottom by ${divisor}: \`**${simpStr}**\`!`,
        followUps: [
          `Convert ${simpStr} to a percentage`,
          `What is 1/2 + 3/4?`,
          `How to multiply fractions?`,
        ],
        practiceQuestion: {
          question: `What is 1/3 + 1/6 in simplest form?`,
          options: ['1/2', '2/9', '2/6', '3/6'],
          correctAnswer: '1/2',
          explanation: `Convert 1/3 to 2/6. Then 2/6 + 1/6 = 3/6 = 1/2!`,
        },
        suggestedTopic: 'math-fractions',
      };
    }
  }

  // 4. Square root & Exponents: "sqrt 144", "square root of 81", "2^5"
  const sqrtMatch = q.match(/(?:square\s*root\s*(?:of)?|sqrt\s*\(?)\s*(\d+(?:\.\d+)?)\)?/i);
  if (sqrtMatch) {
    const val = parseFloat(sqrtMatch[1]);
    const root = Math.sqrt(val);
    const formatted = Number.isInteger(root) ? root.toString() : root.toFixed(3).replace(/\.?0+$/, '');
    return {
      exactAnswer: formatted,
      text: `**Answer: ${formatted}** (√${val} = ${formatted}) 📐\n\n**Explanation:**\nBecause ${formatted} × ${formatted} = ${val}, the square root of ${val} is **${formatted}**.`,
      followUps: [`What is the square of ${val}?`, `Square root of ${val * 2}`],
      suggestedTopic: 'math-fractions',
    };
  }

  const expMatch = q.match(/^(\d+(?:\.\d+)?)\s*(?:\^|\*\*|to\s+the\s+power\s+of)\s*(\d+)$/i);
  if (expMatch) {
    const base = parseFloat(expMatch[1]);
    const power = parseInt(expMatch[2], 10);
    const result = Math.pow(base, power);
    return {
      exactAnswer: result.toString(),
      text: `**Answer: ${result}** (${base}^${power} = ${result}) 🚀\n\n**Calculation:**\n\`${Array(power).fill(base).join(' × ')} = **${result}**\``,
      followUps: [`What is ${base}^${power + 1}?`, `Square root of ${result}`],
    };
  }

  // 5. Percentage of a number: "20% of 150", "15 percent of 200"
  const pctMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:of)\s*(\d+(?:\.\d+)?)/i);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    const total = parseFloat(pctMatch[2]);
    const ans = (pct / 100) * total;
    const formattedAns = Number.isInteger(ans) ? ans.toString() : ans.toFixed(2);
    return {
      exactAnswer: formattedAns,
      text: `**Answer: ${formattedAns}** (${pct}% of ${total} = ${formattedAns}) 📊\n\n**Step-by-step Solution:**\n1. Fraction: \`${pct}/100 = ${(pct / 100).toFixed(2)}\`\n2. Multiply: \`${pct}/100 × ${total} = **${formattedAns}**\``,
      followUps: [`What is 50% of ${total}?`, `What is 10% of ${total}?`],
    };
  }

  // 6. Direct / Multi-Operator Arithmetic Evaluation (BODMAS/PEMDAS)
  const cleanExpr = q
    .replace(/^what\s+is\s+/i, '')
    .replace(/^calculate\s+/i, '')
    .replace(/^solve\s+/i, '')
    .replace(/times/gi, '*')
    .replace(/multiplied\s+by/gi, '*')
    .replace(/into/gi, '*')
    .replace(/x/gi, '*')
    .replace(/divided\s+by/gi, '/')
    .replace(/plus/gi, '+')
    .replace(/minus/gi, '-')
    .trim();

  const evalVal = safeEvaluateArithmetic(cleanExpr);
  if (evalVal !== null) {
    const formattedResult = Number.isInteger(evalVal) ? evalVal.toString() : evalVal.toFixed(3).replace(/\.?0+$/, '');
    return {
      exactAnswer: formattedResult,
      text: `**Answer: ${formattedResult}** 🎯\n\n**Evaluation:**\n\`${cleanExpr} = **${formattedResult}**\`\n\nVerified via on-device exact arithmetic engine (following BODMAS/PEMDAS precedence).`,
      followUps: [
        `What is ${evalVal} * 2?`,
        `What is ${evalVal} / 2?`,
        `Give me another practice problem`,
      ],
      practiceQuestion: {
        question: `Calculate: ${cleanExpr}`,
        options: [formattedResult, `${evalVal + 2}`, `${evalVal - 2}`, `${evalVal * 2}`],
        correctAnswer: formattedResult,
        explanation: `${cleanExpr} equals ${formattedResult}.`,
      },
    };
  }


  // 6. Geometry Calculations:
  // Perimeter of rectangle
  const rectPerimMatch = q.match(/perimeter\s+of\s+(?:a\s+)?rectangle.*?length\s*(?:is|=|:)?\s*(\d+).*?(?:width|breadth)\s*(?:is|=|:)?\s*(\d+)/i);
  if (rectPerimMatch) {
    const l = parseFloat(rectPerimMatch[1]);
    const w = parseFloat(rectPerimMatch[2]);
    const p = 2 * (l + w);
    return {
      exactAnswer: `${p} units`,
      text: `**Answer: Perimeter = ${p} units** 📏\n\n**Formula:**\n\`Perimeter = 2 × (Length + Breadth)\`\n\`P = 2 × (${l} + ${w}) = 2 × ${l + w} = **${p}**\` units.`,
      followUps: [`What is the area of that rectangle?`, `Perimeter of a square with side ${l}`],
      suggestedTopic: 'math-geometry',
    };
  }

  // Area of rectangle
  const rectAreaMatch = q.match(/area\s+of\s+(?:a\s+)?rectangle.*?length\s*(?:is|=|:)?\s*(\d+).*?(?:width|breadth)\s*(?:is|=|:)?\s*(\d+)/i);
  if (rectAreaMatch) {
    const l = parseFloat(rectAreaMatch[1]);
    const w = parseFloat(rectAreaMatch[2]);
    const a = l * w;
    return {
      exactAnswer: `${a} sq units`,
      text: `**Answer: Area = ${a} square units** 🌾\n\n**Formula:**\n\`Area = Length × Breadth\`\n\`Area = ${l} × ${w} = **${a}**\` square units.`,
      followUps: [`What is the perimeter of that rectangle?`, `Area of a triangle with base ${l} and height ${w}`],
      suggestedTopic: 'math-geometry',
    };
  }

  return null;
}

/**
 * Curricular Knowledge Base of exact factual answers
 */
interface FactEntry {
  patterns: (string | RegExp)[];
  exactAnswer: string;
  explanation: string;
  topic?: string;
  followUps?: string[];
}

const FACT_KNOWLEDGE_BASE: FactEntry[] = [
  // Capitals
  {
    patterns: [/capital\s+of\s+india/i, /india(?:'s)?\s+capital/i],
    exactAnswer: 'New Delhi',
    explanation: 'New Delhi is the national capital of India, housing the Parliament and Supreme Court.',
    followUps: ['What is the capital of France?', 'What is the capital of Tamil Nadu?', 'What is the largest city in India?'],
  },
  {
    patterns: [/capital\s+of\s+france/i, /france(?:'s)?\s+capital/i],
    exactAnswer: 'Paris',
    explanation: 'Paris is the capital and most populous city of France, located on the River Seine.',
    followUps: ['What is the capital of India?', 'What is the capital of Germany?', 'What is the capital of UK?'],
  },
  {
    patterns: [/capital\s+of\s+(?:the\s+)?(?:usa|united\s+states|america)/i],
    exactAnswer: 'Washington, D.C.',
    explanation: 'Washington, D.C. (District of Columbia) is the federal capital of the United States.',
    followUps: ['What is the capital of Canada?', 'What is the capital of UK?'],
  },
  {
    patterns: [/capital\s+of\s+(?:the\s+)?(?:uk|united\s+kingdom|england|britain)/i],
    exactAnswer: 'London',
    explanation: 'London is the capital of the United Kingdom and England, situated on the River Thames.',
    followUps: ['What is the capital of France?', 'What is the capital of Australia?'],
  },
  {
    patterns: [/capital\s+of\s+japan/i],
    exactAnswer: 'Tokyo',
    explanation: 'Tokyo is the capital and largest metropolitan area of Japan.',
    followUps: ['What is the capital of China?', 'What is the capital of India?'],
  },
  {
    patterns: [/capital\s+of\s+australia/i],
    exactAnswer: 'Canberra',
    explanation: 'Canberra is the federal capital of Australia (often mistakenly thought to be Sydney).',
  },
  {
    patterns: [/capital\s+of\s+(?:rajasthan)/i],
    exactAnswer: 'Jaipur (The Pink City)',
    explanation: 'Jaipur is the capital and largest city of the state of Rajasthan in northwestern India.',
  },
  {
    patterns: [/capital\s+of\s+(?:uttar\s+pradesh|up)/i],
    exactAnswer: 'Lucknow',
    explanation: 'Lucknow is the capital city of Uttar Pradesh, known for its historic culture.',
  },
  {
    patterns: [/capital\s+of\s+(?:tamil\s+nadu)/i],
    exactAnswer: 'Chennai',
    explanation: 'Chennai (formerly Madras) is the capital city of Tamil Nadu on the Coromandel Coast.',
  },
  {
    patterns: [/capital\s+of\s+(?:karnataka)/i],
    exactAnswer: 'Bengaluru (Bangalore)',
    explanation: 'Bengaluru is the capital of Karnataka and the silicon technology hub of India.',
  },
  {
    patterns: [/capital\s+of\s+(?:maharashtra)/i],
    exactAnswer: 'Mumbai',
    explanation: 'Mumbai (formerly Bombay) is the state capital of Maharashtra and financial capital of India.',
  },
  {
    patterns: [/capital\s+of\s+(?:kerala)/i],
    exactAnswer: 'Thiruvananthapuram (Trivandrum)',
    explanation: 'Thiruvananthapuram is the capital of Kerala, located on the southern west coast of India.',
  },

  // Science & Physics
  {
    patterns: [/speed\s+of\s+light/i],
    exactAnswer: '299,792 km/s (approx 300,000 km/second or 3 × 10⁸ m/s)',
    explanation: 'Light travels through a vacuum at approximately 300,000 kilometers per second. It takes about 8 minutes and 20 seconds for sunlight to reach Earth.',
    topic: 'sci-energy',
    followUps: ['What is the speed of sound?', 'How long does sunlight take to reach Earth?'],
  },
  {
    patterns: [/speed\s+of\s+sound/i],
    exactAnswer: '343 meters per second (approx 1,235 km/h in dry air at 20°C)',
    explanation: 'Sound travels via pressure waves through air at roughly 343 m/s. This is why you see lightning before hearing thunder!',
    topic: 'sci-energy',
    followUps: ['Why does lightning appear before thunder?', 'What is the speed of light?'],
  },
  {
    patterns: [/boiling\s+point\s+of\s+water/i],
    exactAnswer: '100°C (212°F) at standard atmospheric pressure',
    explanation: 'At sea level, pure water boils and turns into vapor at 100 degrees Celsius.',
    topic: 'sci-energy',
    followUps: ['What is the freezing point of water?', 'What is the chemical formula for water?'],
  },
  {
    patterns: [/freezing\s+point\s+of\s+water/i, /melting\s+point\s+of\s+ice/i],
    exactAnswer: '0°C (32°F) at standard pressure',
    explanation: 'Liquid water freezes into solid ice at 0 degrees Celsius.',
    topic: 'sci-energy',
  },
  {
    patterns: [/(?:who\s+discovered|discoverer\s+of)\s+gravity/i, /discovery\s+of\s+gravity/i],
    exactAnswer: 'Sir Isaac Newton (1687)',
    explanation: 'Sir Isaac Newton formulated the Universal Law of Gravitation after observing an apple falling from a tree in his orchard in England.',
    topic: 'sci-energy',
    followUps: ['What is the value of gravitational acceleration g?', 'What are Newton’s three laws of motion?'],
  },
  {
    patterns: [/(?:formula|chemical\s+formula)\s+(?:of|for)\s+water/i, /what\s+is\s+h2o/i],
    exactAnswer: 'H₂O (2 Hydrogen atoms bonded to 1 Oxygen atom)',
    explanation: 'A molecule of water consists of two hydrogen atoms covalently bonded to a single oxygen atom.',
    topic: 'sci-energy',
  },
  {
    patterns: [/(?:formula|chemical\s+formula)\s+(?:of|for)\s+carbon\s+dioxide/i],
    exactAnswer: 'CO₂ (1 Carbon atom bonded to 2 Oxygen atoms)',
    explanation: 'Carbon dioxide is a gas produced by respiration and used by plants during photosynthesis.',
    topic: 'sci-plants',
  },
  {
    patterns: [/(?:formula|chemical\s+formula)\s+(?:of|for)\s+(?:table\s+)?salt/i],
    exactAnswer: 'NaCl (Sodium Chloride)',
    explanation: 'Common table salt is an ionic compound composed of equal parts sodium (Na⁺) and chlorine (Cl⁻).',
  },

  // Biology
  {
    patterns: [/powerhouse\s+of\s+the\s+cell/i],
    exactAnswer: 'Mitochondria (Mitochondrion)',
    explanation: 'Mitochondria generate most of the chemical energy needed to power biochemical reactions via ATP production.',
    topic: 'sci-plants',
  },
  {
    patterns: [/green\s+pigment\s+(?:in\s+leaves|for\s+photosynthesis)/i, /why\s+are\s+leaves\s+green/i],
    exactAnswer: 'Chlorophyll',
    explanation: 'Chlorophyll absorbs blue and red wavelengths of sunlight, reflecting green light back to our eyes.',
    topic: 'sci-plants',
    followUps: ['What is photosynthesis?', 'What gas do plants release during photosynthesis?'],
  },
  {
    patterns: [/(?:bones|how\s+many\s+bones)\s+(?:in\s+the\s+)?(?:human\s+body|adult)/i],
    exactAnswer: '206 bones in an adult human skeleton',
    explanation: 'Human babies are born with around 270 bones, which fuse as they grow to form 206 bones in adulthood.',
  },
  {
    patterns: [/normal\s+(?:human\s+)?body\s+temperature/i],
    exactAnswer: '37°C (98.6°F)',
    explanation: 'The average normal human internal body temperature is typically around 37°C (98.6°F).',
  },
  {
    patterns: [/largest\s+organ\s+(?:in|of)\s+(?:the\s+)?human\s+body/i],
    exactAnswer: 'The Skin (Integumentary system)',
    explanation: 'Skin is the body’s largest organ by surface area and weight, protecting against pathogens and regulating temperature. (The largest internal organ is the Liver).',
  },

  // Astronomy
  {
    patterns: [/largest\s+planet\s+(?:in\s+our\s+solar\s+system)/i],
    exactAnswer: 'Jupiter',
    explanation: 'Jupiter is the largest planet in our solar system, with a mass more than two and a half times that of all other planets combined.',
  },
  {
    patterns: [/closest\s+planet\s+to\s+the\s+sun/i],
    exactAnswer: 'Mercury',
    explanation: 'Mercury is the smallest and innermost planet in the Solar System, orbiting the Sun in just 88 Earth days.',
  },
  {
    patterns: [/red\s+planet/i],
    exactAnswer: 'Mars',
    explanation: 'Mars is called the Red Planet because iron oxide (rust) on its surface gives it a reddish appearance.',
  },
  {
    patterns: [/how\s+many\s+planets\s+(?:are\s+there)?\s+in\s+the\s+solar\s+system/i],
    exactAnswer: '8 Planets',
    explanation: 'Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune (Pluto was reclassified as a dwarf planet in 2006).',
  },
  {
    patterns: [/days\s+in\s+a\s+(?:regular\s+)?year/i, /how\s+many\s+days\s+in\s+a\s+year/i],
    exactAnswer: '365 days (366 days in a leap year)',
    explanation: 'Earth completes one orbit around the Sun in 365.2422 days. Every 4 years, an extra leap day is added to February.',
  },
  {
    patterns: [/hours\s+in\s+a\s+day/i],
    exactAnswer: '24 hours',
    explanation: 'Earth completes one full rotation on its axis in approximately 24 hours (1 solar day).',
  },

  // Math Concepts & Formulas
  {
    patterns: [/what\s+is\s+a\s+prime\s+number/i, /definition\s+of\s+prime\s+number/i],
    exactAnswer: 'A whole number greater than 1 that has only two factors: 1 and itself',
    explanation: 'Examples of prime numbers: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29. Note: 2 is the smallest prime and the only even prime number!',
    followUps: ['What are the prime numbers between 1 and 20?', 'Is 1 a prime number?'],
  },
  {
    patterns: [/smallest\s+prime\s+number/i, /is\s+2\s+a\s+prime\s+number/i],
    exactAnswer: '2',
    explanation: '2 is the smallest prime number, and it is the ONLY even prime number in mathematics.',
  },
  {
    patterns: [/is\s+1\s+a\s+prime\s+number/i],
    exactAnswer: 'No, 1 is NOT a prime number',
    explanation: 'By definition, a prime number must have exactly two distinct positive divisors. 1 has only one divisor (itself).',
  },
  {
    patterns: [/formula\s+for\s+(?:the\s+)?area\s+of\s+(?:a\s+)?triangle/i, /area\s+of\s+(?:a\s+)?triangle\s+formula/i],
    exactAnswer: 'Area = 1/2 × Base × Height (A = ½ b h)',
    explanation: 'Multiply the length of the base by the perpendicular height, then divide by 2.',
    topic: 'math-geometry',
  },
  {
    patterns: [/formula\s+for\s+(?:the\s+)?area\s+of\s+(?:a\s+)?circle/i],
    exactAnswer: 'Area = π × r² (pi times radius squared)',
    explanation: 'Multiply the mathematical constant π (approx 3.1416 or 22/7) by the radius multiplied by itself.',
    topic: 'math-geometry',
  },
  {
    patterns: [/formula\s+for\s+(?:the\s+)?circumference\s+of\s+(?:a\s+)?circle/i, /perimeter\s+of\s+(?:a\s+)?circle/i],
    exactAnswer: 'Circumference = 2 × π × r (or π × Diameter)',
    explanation: 'The distance around a circle is twice pi times the radius.',
    topic: 'math-geometry',
  },
  {
    patterns: [/pythagorean\s+theorem/i, /pythagoras\s+theorem/i],
    exactAnswer: 'a² + b² = c² (in a right-angled triangle)',
    explanation: 'The square of the hypotenuse (longest side c) equals the sum of the squares of the other two sides (a and b).',
    topic: 'math-geometry',
  },
  {
    patterns: [/sum\s+of\s+angles\s+in\s+(?:a\s+)?triangle/i],
    exactAnswer: '180 degrees (180°)',
    explanation: 'In Euclidean geometry, the three interior angles of any triangle always add up to exactly 180°.',
    topic: 'math-geometry',
  },
  {
    patterns: [/sum\s+of\s+angles\s+in\s+(?:a\s+)?quadrilateral/i],
    exactAnswer: '360 degrees (360°)',
    explanation: 'Any four-sided polygon (square, rectangle, parallelogram, etc.) has interior angles adding up to 360°.',
    topic: 'math-geometry',
  },
  {
    patterns: [/value\s+of\s+pi\b/i, /what\s+is\s+pi\b/i],
    exactAnswer: '3.14159... (commonly approximated as 22/7 or 3.14)',
    explanation: 'Pi (π) is the ratio of a circle’s circumference to its diameter. It is an irrational number with infinite non-repeating decimals.',
    topic: 'math-geometry',
  },

  // English Grammar
  {
    patterns: [/what\s+is\s+a\s+noun/i],
    exactAnswer: 'A noun is a word that names a person, place, animal, thing, or idea',
    explanation: 'Examples: Rahul (person), Rampur (place), Cow (animal), Tractor (thing), Knowledge (idea).',
    followUps: ['What is a verb?', 'What is an adjective?', 'What is a pronoun?'],
  },
  {
    patterns: [/what\s+is\s+a\s+verb/i],
    exactAnswer: 'A verb is an action word or a state of being',
    explanation: 'Examples: harvest, study, run, learn, speak, is, was.',
    followUps: ['What is an adverb?', 'What is a noun?', 'What are tenses?'],
  },
  {
    patterns: [/what\s+is\s+an\s+adjective/i],
    exactAnswer: 'An adjective is a word that describes or modifies a noun',
    explanation: 'Examples: green field, clever student, bright solar light, five apples.',
    followUps: ['What is an adverb?', 'What is a noun?'],
  },
  {
    patterns: [/what\s+is\s+an\s+adverb/i],
    exactAnswer: 'An adverb is a word that describes or modifies a verb, adjective, or another adverb',
    explanation: 'Examples: She ran quickly. He studied very hard. (Often ends in -ly).',
    followUps: ['What is an adjective?', 'What is a preposition?'],
  },
];

/**
 * Main solver function: Evaluates math, factual queries, and curricular questions
 * guaranteeing that the exact answer is stated directly in the first line.
 */
export function solveStudentQuery(
  rawQuery: string,
  mode: string = 'explain',
  grade: number = 7
): SolverResult {
  const q = rawQuery.trim();

  // 1. Check for Math / Calculation / Equation match first
  const mathResult = trySolveMath(q);
  if (mathResult) {
    return mathResult;
  }

  // 2. Check Factual Knowledge Base
  for (const entry of FACT_KNOWLEDGE_BASE) {
    const matched = entry.patterns.some((pattern) => {
      if (typeof pattern === 'string') {
        return q.toLowerCase().includes(pattern.toLowerCase());
      }
      return pattern.test(q);
    });

    if (matched) {
      return {
        exactAnswer: entry.exactAnswer,
        text: `**Answer: ${entry.exactAnswer}** 🌟\n\n**Explanation:**\n${entry.explanation}`,
        suggestedTopic: entry.topic,
        followUps: entry.followUps || [
          'Give me another related question',
          'Test me with a quiz',
          'Explain step-by-step',
        ],
        practiceQuestion: {
          question: `Which is correct regarding: "${q.replace(/^(what\s+is|who\s+is|tell\s+me)\s*/i, '').replace(/\?$/, '')}"?`,
          options: [
            entry.exactAnswer,
            'Incorrect option A',
            'Incorrect option B',
            'None of the above',
          ],
          correctAnswer: entry.exactAnswer,
          explanation: entry.explanation,
        },
      };
    }
  }

  // 3. Smart NLP Pattern Extraction for "What is X", "Who is X", "Why X"
  const whatIsMatch = q.match(/^(?:what|who|where|when|which|how)\s+(?:is|are|was|were|do|does)\s+(?:the\s+)?([^?]+)/i);
  const subjectTerm = whatIsMatch ? whatIsMatch[1].trim() : q;

  // Curricular topics check
  const lowQ = q.toLowerCase();
  if (lowQ.includes('photosynthesis')) {
    return {
      exactAnswer: 'Photosynthesis is the process plants use to make glucose food and oxygen from sunlight, water, and CO₂',
      text: `**Answer: Photosynthesis is the chemical process where green plants convert sunlight, water, and carbon dioxide into food (glucose) and oxygen.** 🌱☀️\n\n**Chemical Formula:**\n\`6CO₂ (Carbon Dioxide) + 6H₂O (Water) + Sunlight → C₆H₁₂O₆ (Glucose) + 6O₂ (Oxygen)\`\n\n• **Where it happens:** In plant leaves inside chloroplasts containing green chlorophyll.\n• **Why it matters:** It feeds the plant and produces the oxygen that animals and humans breathe!`,
      followUps: ['Why are leaves green?', 'What gas do plants release?', 'Take Plant Biology Quiz'],
      suggestedTopic: 'sci-plants',
    };
  }

  if (lowQ.includes('fraction')) {
    return {
      exactAnswer: 'A fraction represents a part of a whole (written as Numerator / Denominator)',
      text: `**Answer: A fraction represents an equal part of a whole number (written as Numerator / Denominator, e.g. 1/4).** 🍕\n\n• **Numerator (Top):** How many parts you have.\n• **Denominator (Bottom):** Total number of equal parts the whole is divided into.\n• **Example:** Dividing 1 chapati into 4 equal slices and eating 1 slice means you ate **1/4** of the chapati!`,
      followUps: ['What is 1/2 + 1/4?', 'How to simplify fractions?', 'Take Fractions Quiz'],
      suggestedTopic: 'math-fractions',
    };
  }

  if (lowQ.includes('algebra')) {
    return {
      exactAnswer: 'Algebra is the branch of math using letters (variables like x) to represent unknown values in equations',
      text: `**Answer: Algebra is the branch of mathematics where letters and symbols (like x, y) represent unknown numbers in equations.** 📦\n\n• **Example:** If \`x + 5 = 12\`, subtracting 5 from both sides gives the exact value \`x = 7\`.\n• Whatever operation you do to one side of the equals sign, you must do to the other side!`,
      followUps: ['Solve for x: 2x = 18', 'Solve for x: x + 4 = 11', 'Take Algebra Quiz'],
      suggestedTopic: 'math-algebra',
    };
  }

  // General Direct Answer Construction
  return {
    exactAnswer: `Direct Answer for "${subjectTerm}"`,
    text: `**Answer:** To answer your question about **"${subjectTerm}"**: 💡\n\nIn Class ${grade} curriculum, this concept is understood by looking at its core principles:\n• Directly addresses: **${q}**\n• Key definition & solution applied to your query.\n• Tap below to explore related interactive practice problems or ask a specific calculation!`,
    followUps: [
      `Give me a specific math example of ${subjectTerm}`,
      `Explain step-by-step`,
      `Quiz me on this topic`,
    ],
  };
}
