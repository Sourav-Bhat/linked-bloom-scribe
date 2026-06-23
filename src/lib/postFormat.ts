// Utilities for turning model output into LinkedIn-ready text.
// LinkedIn does NOT render markdown, so `**bold**`, `#`, `>` etc. would appear
// literally. We convert emphasis to Unicode bold (which LinkedIn DOES render)
// and strip the rest, then expose helpers for word counting and length bands.

export type PostLength = 'short' | 'medium' | 'long';

// Target word bands shown in the UI. Keep these in sync with the backend prompt.
export const LENGTH_BANDS: Record<PostLength, { min: number; max: number; label: string }> = {
  short: { min: 50, max: 100, label: 'Short (50–100 words)' },
  medium: { min: 100, max: 200, label: 'Medium (100–200 words)' },
  long: { min: 200, max: 300, label: 'Long (200–300 words)' },
};

// LinkedIn truncates the post body at ~210 characters before "…see more".
export const LINKEDIN_FOLD_CHARS = 210;

const BOLD_OFFSETS = { upper: 0x1d5d4, lower: 0x1d5ee, digit: 0x1d7ec };

/** Convert ASCII letters/digits in `s` to Unicode sans-serif bold glyphs. */
function toUnicodeBold(s: string): string {
  let out = '';
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code >= 0x41 && code <= 0x5a) {
      out += String.fromCodePoint(BOLD_OFFSETS.upper + (code - 0x41));
    } else if (code >= 0x61 && code <= 0x7a) {
      out += String.fromCodePoint(BOLD_OFFSETS.lower + (code - 0x61));
    } else if (code >= 0x30 && code <= 0x39) {
      out += String.fromCodePoint(BOLD_OFFSETS.digit + (code - 0x30));
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Convert markdown-ish model output to clean, paste-ready LinkedIn text.
 * - **bold** / __bold__  -> Unicode bold
 * - # Heading            -> bold line
 * - * / - bullets        -> "• " bullets
 * - `code`               -> plain
 * - stray markdown marks  removed
 */
export function toLinkedInText(input?: string | null): string {
  if (!input) return '';
  let text = input.replace(/\r\n/g, '\n');

  // Headings -> bold line (strip leading #'s)
  text = text.replace(/^\s{0,3}#{1,6}\s+(.*)$/gm, (_m, t) => toUnicodeBold(t.trim()));

  // Bold (**x** or __x__) -> unicode bold
  text = text.replace(/\*\*([^*]+)\*\*/g, (_m, t) => toUnicodeBold(t));
  text = text.replace(/__([^_]+)__/g, (_m, t) => toUnicodeBold(t));

  // Inline code `x` -> x
  text = text.replace(/`([^`]+)`/g, '$1');

  // Bullets: leading * or - (not part of **) -> •
  text = text.replace(/^\s{0,3}[*-]\s+/gm, '• ');

  // Blockquotes "> " -> plain
  text = text.replace(/^\s{0,3}>\s?/gm, '');

  // Remaining stray emphasis markers
  text = text.replace(/\*\*/g, '').replace(/(^|\s)\*(\S)/g, '$1$2');

  // Collapse 3+ blank lines to 2
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/** Count words in a string (handles Unicode bold by stripping to ASCII-ish). */
export function countWords(text?: string | null): number {
  if (!text) return 0;
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

/** Is the word count within the band for the given length (±15% tolerance)? */
export function isWithinBand(words: number, length: PostLength): boolean {
  const band = LENGTH_BANDS[length];
  const tol = 0.15;
  return words >= band.min * (1 - tol) && words <= band.max * (1 + tol);
}

/** Build the full copy-ready text (body + hashtags), LinkedIn-formatted. */
export function buildCopyText(content?: string | null, hashtags?: string | null): string {
  const body = toLinkedInText(content);
  const tags = (hashtags || '').trim();
  return tags ? `${body}\n\n${tags}` : body;
}
