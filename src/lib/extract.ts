const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const MONTH_NAMES = Object.keys(MONTHS).join("|");

// "March 15, 2026" / "March 15 2026"
const PATTERN_MONTH_DAY_YEAR = new RegExp(
  `\\b(${MONTH_NAMES})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`,
  "i"
);

// "15 March 2026" / "15th March, 2026"
const PATTERN_DAY_MONTH_YEAR = new RegExp(
  `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_NAMES})\\.?,?\\s+(\\d{4})\\b`,
  "i"
);

// "03/15/2026" (assumed MM/DD/YYYY)
const PATTERN_NUMERIC = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/;

export interface ExtractedDate {
  date: Date;
  text: string;
}

/** Finds the earliest plausible deadline-like date mentioned in the text. */
export function extractDeadline(text: string): ExtractedDate | null {
  const candidates: ExtractedDate[] = [];

  let match = PATTERN_MONTH_DAY_YEAR.exec(text);
  if (match) {
    const month = MONTHS[match[1].toLowerCase()];
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    candidates.push({ date: new Date(year, month, day), text: match[0] });
  }

  match = PATTERN_DAY_MONTH_YEAR.exec(text);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = MONTHS[match[2].toLowerCase()];
    const year = parseInt(match[3], 10);
    candidates.push({ date: new Date(year, month, day), text: match[0] });
  }

  match = PATTERN_NUMERIC.exec(text);
  if (match) {
    const month = parseInt(match[1], 10) - 1;
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    if (month >= 0 && month < 12 && day > 0 && day <= 31) {
      candidates.push({ date: new Date(year, month, day), text: match[0] });
    }
  }

  const valid = candidates.filter((c) => !isNaN(c.date.getTime()));
  if (valid.length === 0) return null;

  valid.sort((a, b) => a.date.getTime() - b.date.getTime());
  return valid[0];
}

const FULL_FUNDING_PATTERN =
  /\bfull(?:y)?[\s-]?(?:funded|ride|tuition|scholarship)\b/i;

// $1,000 / $1,000.50 / $1k / $1,000-$5,000
const AMOUNT_PATTERN = /[$€£₹]\s?([\d,]+(?:\.\d+)?)\s?(k|K)?/g;

export interface ExtractedAmount {
  amountUsdEquivalent: number;
  text: string;
}

/**
 * Finds the largest monetary amount mentioned (used as an optimistic award
 * estimate). Currency symbols are treated at face value — this is a rough
 * relative signal for ranking, not a real currency conversion.
 */
export function extractAward(text: string): ExtractedAmount | null {
  if (FULL_FUNDING_PATTERN.test(text)) {
    const match = FULL_FUNDING_PATTERN.exec(text);
    return { amountUsdEquivalent: 50000, text: match?.[0] ?? "Fully funded" };
  }

  let best: ExtractedAmount | null = null;
  let match: RegExpExecArray | null;
  AMOUNT_PATTERN.lastIndex = 0;
  while ((match = AMOUNT_PATTERN.exec(text)) !== null) {
    const raw = match[1].replace(/,/g, "");
    let amount = parseFloat(raw);
    if (isNaN(amount)) continue;
    if (match[2]) amount *= 1000;
    if (!best || amount > best.amountUsdEquivalent) {
      best = { amountUsdEquivalent: amount, text: match[0] };
    }
  }
  return best;
}
