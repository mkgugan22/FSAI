// ═══════════════════════════════════════
// FSAI – Response Parser
// ═══════════════════════════════════════

/**
 * Parses FSAI structured response into sections
 * Returns { errorType, layer, rootCause, fix, codePatch, codeLanguage, explanation, raw }
 */
export function parseAgentResponse(text) {
  const result = {
    errorType:    null,
    layer:        null,
    rootCause:    null,
    fix:          null,
    codePatch:    null,
    codeLanguage: 'text',
    explanation:  null,
    raw:          text,
    isStructured: false,
  };

  // Normalize markdown headings into text headings to support both formats.
  const normalizedText = text
    .replace(/^\s*#{1,6}\s*Error\s*Type\s*:?/gim, 'Error Type:')
    .replace(/^\s*#{1,6}\s*Layer\s*Affected\s*:?/gim, 'Layer Affected:')
    .replace(/^\s*#{1,6}\s*Root\s*Cause\s*:?/gim, 'Root Cause:')
    .replace(/^\s*#{1,6}\s*Fix\s*:?/gim, 'Fix:')
    .replace(/^\s*#{1,6}\s*Code\s*Patch\s*:?/gim, 'Code Patch:')
    .replace(/^\s*#{1,6}\s*Explanation\s*:?/gim, 'Explanation:');

  // Check if structured now.
  const hasStructure =
    /Error Type:/i.test(normalizedText) ||
    /Layer Affected:/i.test(normalizedText) ||
    /Root Cause:/i.test(normalizedText);

  if (!hasStructure) return result;

  result.isStructured = true;
  text = normalizedText; // use normalized for extraction

  const extract = (label, nextLabels) => {
    const pattern = new RegExp(`${label}:\\s*`, 'i');
    const match = text.match(pattern);
    if (!match) return null;

    let start = text.indexOf(match[0]) + match[0].length;
    let end = text.length;

    for (const next of nextLabels) {
      const np = new RegExp(`${next}:\\s*`, 'im');
      const nm = text.slice(start).match(np);
      if (nm) {
        const pos = start + text.slice(start).indexOf(nm[0]);
        if (pos < end) end = pos;
      }
    }
    return text.slice(start, end).trim();
  };

  const allLabels = ['Error Type', 'Layer Affected', 'Root Cause', 'Fix', 'Code Patch', 'Explanation'];

  result.errorType = extract('Error Type', allLabels.slice(1));
  result.layer     = extract('Layer Affected', allLabels.slice(2));
  result.rootCause = extract('Root Cause', allLabels.slice(3));
  result.fix       = extract('Fix', allLabels.slice(4));
  result.explanation = extract('Explanation', []);

  // Code patch — extract from markdown code block
  const rawPatch = extract('Code Patch', ['Explanation']);
  if (rawPatch) {
    const cbMatch = rawPatch.match(/```(\w+)?\n?([\s\S]*?)```/);
    if (cbMatch) {
      result.codeLanguage = cbMatch[1] || 'text';
      result.codePatch    = cbMatch[2].trim();
    } else {
      // strip any wrapping backticks
      result.codePatch = rawPatch.replace(/^```\w*\n?|```$/g, '').trim();
    }
  }

  return result;
}

/**
 * Determines layer color/accent
 */
export function getLayerMeta(layer = '') {
  const l = layer.toLowerCase();
  if (l.includes('frontend')) return { color: 'var(--primary-1)', bg: 'var(--cyan-dim)', label: 'FRONTEND' };
  if (l.includes('backend'))  return { color: 'var(--primary-2)', bg: 'var(--violet-dim)', label: 'BACKEND' };
  if (l.includes('database')) return { color: 'var(--amber)', bg: 'var(--amber-dim)', label: 'DATABASE' };
  if (l.includes('cross'))    return { color: 'var(--orange)', bg: 'var(--amber-dim)', label: 'CROSS-LAYER' };
  return { color: 'var(--green)', bg: 'var(--green-dim)', label: layer.toUpperCase() };
}
