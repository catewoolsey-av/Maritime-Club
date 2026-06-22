// Minimal markdown -> HTML for the deal `description` field.
// Matches the spec used by ClubManagementCW's investment-description editor:
//   **text**       -> <strong>
//   *text*         -> <em>
//   - item / * item (at line start)  -> <ul><li>...</li></ul> (consecutive lines collapse)
//   blank line     -> paragraph break
//   single newline -> soft line break (<br/>)
//
// HTML is escaped *before* markdown conversion, so user-typed <script> or
// other markup cannot sneak through — only the four formatting markers above
// produce HTML.

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Inline transforms (run AFTER escaping). Bold first so `**` is consumed
// before the single-`*` italic rule matches its inner asterisks.
function applyInline(s) {
  return s
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
}

export function formatDealDescription(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const escaped = escapeHtml(raw);
  const lines = escaped.split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line — separates blocks; consume and continue.
    if (line.trim() === '') { i++; continue; }

    // Consecutive bullet lines collapse into one <ul>.
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(applyInline(lines[i].replace(/^\s*[-*]\s+/, '').trimEnd()));
        i++;
      }
      out.push(
        `<ul class="list-disc pl-5 space-y-1 my-2">${items.map((it) => `<li>${it}</li>`).join('')}</ul>`
      );
      continue;
    }

    // Paragraph — consecutive non-blank non-bullet lines, soft-break joined.
    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^\s*[-*]\s+/.test(lines[i])
    ) {
      para.push(applyInline(lines[i].trimEnd()));
      i++;
    }
    out.push(`<p class="my-2">${para.join('<br/>')}</p>`);
  }

  return out.join('');
}
