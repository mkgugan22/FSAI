// ═══════════════════════════════════════
// FSAI – AgentResponse (with full markdown rendering)
// ═══════════════════════════════════════
import React, { useState } from 'react';
import { getLayerMeta } from '../utils/parser';
import './AgentResponse.css';

// ── Inline Markdown Renderer ─────────────────────────────────
// Handles: **bold**, *italic*, `code`, [link](url), ~~strike~~
function renderInline(text) {
  if (!text) return null;
  const parts = [];
  // Combined regex for all inline patterns
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|~~(.+?)~~|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }

    if (match[2]) {
      // ***bold italic***
      parts.push(<strong key={match.index}><em>{match[2]}</em></strong>);
    } else if (match[3]) {
      // **bold**
      parts.push(<strong key={match.index}>{match[3]}</strong>);
    } else if (match[4]) {
      // *italic*
      parts.push(<em key={match.index}>{match[4]}</em>);
    } else if (match[5]) {
      // `inline code`
      parts.push(<code key={match.index} className="inline-code">{match[5]}</code>);
    } else if (match[6]) {
      // ~~strikethrough~~
      parts.push(<del key={match.index}>{match[6]}</del>);
    } else if (match[7] && match[8]) {
      // [link](url)
      parts.push(
        <a key={match.index} href={match[8]} target="_blank" rel="noopener noreferrer" className="md-link">
          {match[7]}
        </a>
      );
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.length === 0 ? text : parts;
}

// ── Block Markdown Renderer ──────────────────────────────────
function renderMarkdownContent(text) {
  if (!text) return null;
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let idx = 0;

  while (idx < lines.length) {
    const line = lines[idx];

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim() || 'text';
      const codeLines = [];
      idx += 1;
      while (idx < lines.length && !/^```/.test(lines[idx])) {
        codeLines.push(lines[idx]);
        idx += 1;
      }
      blocks.push(
        <div className="code-block markdown-code" key={`code-${idx}`}>
          <div className="code-topbar-mini">
            <span className="code-lang-mini">{lang.toUpperCase()}</span>
            <InlineCopyBtn code={codeLines.join('\n')} />
          </div>
          <pre className="code-pre"><code>{codeLines.join('\n')}</code></pre>
        </div>
      );
      idx += 1;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      blocks.push(<hr key={`hr-${idx}`} className="md-hr" />);
      idx += 1;
      continue;
    }

    // Headings
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push(
        <div key={`h-${idx}`} className={`md-heading md-heading-${level}`}>
          {renderInline(headingMatch[2].trim())}
        </div>
      );
      idx += 1;
      continue;
    }

    // Blockquote
    if (/^>\s/.test(line)) {
      const qLines = [];
      while (idx < lines.length && /^>\s/.test(lines[idx])) {
        qLines.push(lines[idx].slice(2));
        idx += 1;
      }
      blocks.push(
        <blockquote key={`bq-${idx}`} className="md-blockquote">
          {qLines.map((l, i) => <p key={i}>{renderInline(l)}</p>)}
        </blockquote>
      );
      continue;
    }

    // Table
    if (/^\s*\|/.test(line) && idx + 1 < lines.length && /^\s*\|[\s|:-]+\|/.test(lines[idx + 1])) {
      const tableLines = [line];
      idx += 2; // skip separator
      while (idx < lines.length && /^\s*\|/.test(lines[idx])) {
        tableLines.push(lines[idx]);
        idx += 1;
      }
      const rows = tableLines.map(row =>
        row.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim())
      );
      const [header, ...body] = rows;
      blocks.push(
        <div className="md-table-wrapper" key={`table-${idx}`}>
          <table className="md-table">
            <thead>
              <tr>{header.map((cell, ci) => <th key={ci}>{renderInline(cell)}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{renderInline(cell)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Ordered / unordered list
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const isOrdered = /^\s*\d+\./.test(line);
      const items = [];

      while (idx < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[idx])) {
        const itemText = lines[idx].replace(/^\s*([-*+]|\d+\.)\s+/, '').trim();
        // Check for sub-items on next lines (indented continuation)
        const subLines = [itemText];
        idx += 1;
        while (idx < lines.length && /^\s{2,}/.test(lines[idx]) && !/^\s*([-*+]|\d+\.)\s+/.test(lines[idx])) {
          subLines.push(lines[idx].trim());
          idx += 1;
        }
        items.push(subLines.join(' '));
      }

      const ListTag = isOrdered ? 'ol' : 'ul';
      blocks.push(
        <ListTag key={`list-${idx}`} className="md-list">
          {items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
        </ListTag>
      );
      continue;
    }

    // Skip empty lines
    if (line.trim().length === 0) {
      idx += 1;
      continue;
    }

    // Paragraph — gather contiguous non-special lines
    const paraLines = [line];
    idx += 1;
    while (
      idx < lines.length &&
      lines[idx].trim().length > 0 &&
      !/^#{1,6}\s/.test(lines[idx]) &&
      !/^\s*\|/.test(lines[idx]) &&
      !/^\s*([-*+]|\d+\.)\s/.test(lines[idx]) &&
      !/^```/.test(lines[idx]) &&
      !/^>\s/.test(lines[idx]) &&
      !/^---+$/.test(lines[idx].trim())
    ) {
      paraLines.push(lines[idx]);
      idx += 1;
    }

    blocks.push(
      <p key={`p-${idx}`} className="body-text md-paragraph">
        {renderInline(paraLines.join(' ').trim())}
      </p>
    );
  }

  return blocks;
}

// ── Inline Copy Button (for code inside markdown) ────────────
function InlineCopyBtn({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button className="copy-btn" onClick={copy}>
      {copied ? '✓ Copied' : '⎘ Copy'}
    </button>
  );
}

// ── Section Card ─────────────────────────────────────────────
function SectionCard({ icon, label, color, bg, border, children, mono = false }) {
  return (
    <div className="section-card" style={{ borderColor: border || 'var(--border)' }}>
      <div className="section-header" style={{ background: bg, borderBottomColor: border || 'var(--border)' }}>
        <span className="section-icon">{icon}</span>
        <span className="section-label" style={{ color }}>{label}</span>
      </div>
      <div className={`section-body ${mono ? 'mono' : ''}`}>{children}</div>
    </div>
  );
}

// ── Code Block ───────────────────────────────────────────────
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="code-block">
      <div className="code-topbar">
        <div className="code-dots">
          <span className="cdot cdot-r" />
          <span className="cdot cdot-y" />
          <span className="cdot cdot-g" />
        </div>
        <span className="code-lang">{language?.toUpperCase() || 'CODE'}</span>
        <button className="copy-btn" onClick={copy}>
          {copied ? '✓ Copied' : '⎘ Copy'}
        </button>
      </div>
      <pre className="code-pre"><code>{code}</code></pre>
    </div>
  );
}

// ── Fix Section ───────────────────────────────────────────────
function FixSection({ fix }) {
  if (!fix) return null;

  const options = fix.split(/Option\s+\d+[:.]?\s+/i).filter(Boolean);
  const hasOptions = options.length > 1;

  if (!hasOptions) {
    return (
      <SectionCard
        icon="✔"
        label="FIX"
        color="var(--green)"
        bg="var(--green-dim)"
        border="rgba(16,185,129,0.25)"
      >
        {renderMarkdownContent(fix)}
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon="✔"
      label="FIX OPTIONS"
      color="var(--green)"
      bg="var(--green-dim)"
      border="rgba(16,185,129,0.25)"
    >
      {options.map((opt, i) => (
        <div key={i} className="fix-option">
          <span className="fix-option-label">Option {i + 1}</span>
          {renderMarkdownContent(opt.trim())}
        </div>
      ))}
    </SectionCard>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function AgentResponse({ parsed, raw }) {
  const { isStructured, errorType, layer, rootCause, fix, codePatch, codeLanguage, explanation } = parsed;
  const layerMeta = getLayerMeta(layer || '');

  // Fallback: plain text with full markdown rendering
  if (!isStructured) {
    return <div className="response-plain">{renderMarkdownContent(raw)}</div>;
  }

  return (
    <div className="agent-response">
      {/* Row 1: Error Type + Layer */}
      <div className="response-row-2">
        {errorType && (
          <SectionCard
            icon="⚠"
            label="ERROR TYPE"
            color="var(--red)"
            bg="var(--red-dim)"
            border="rgba(239,68,68,0.25)"
          >
            <p className="body-text highlight-red">{renderInline(errorType)}</p>
          </SectionCard>
        )}
        {layer && (
          <SectionCard
            icon="◈"
            label="LAYER AFFECTED"
            color={layerMeta.color}
            bg={layerMeta.bg}
            border={`${layerMeta.color}40`}
          >
            <div
              className="layer-pill"
              style={{
                background: layerMeta.bg,
                border: `1px solid ${layerMeta.color}50`,
                color: layerMeta.color,
              }}
            >
              {layerMeta.label}
            </div>
          </SectionCard>
        )}
      </div>

      {/* Root Cause */}
      {rootCause && (
        <SectionCard
          icon="🎯"
          label="ROOT CAUSE"
          color="var(--amber)"
          bg="var(--amber-dim)"
          border="rgba(245,158,11,0.25)"
        >
          {renderMarkdownContent(rootCause)}
        </SectionCard>
      )}

      {/* Fix */}
      <FixSection fix={fix} />

      {/* Code Patch */}
      {codePatch && (
        <SectionCard
          icon="⌨"
          label="CODE PATCH"
          color="var(--cyan)"
          bg="var(--cyan-dim)"
          border="rgba(0,210,255,0.2)"
        >
          <CodeBlock code={codePatch} language={codeLanguage} />
        </SectionCard>
      )}

      {/* Explanation */}
      {explanation && (
        <SectionCard
          icon="💡"
          label="EXPLANATION"
          color="var(--text-dim)"
          bg="rgba(255,255,255,0.03)"
          border="var(--border)"
        >
          {renderMarkdownContent(explanation)}
        </SectionCard>
      )}
    </div>
  );
}