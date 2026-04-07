// ═══════════════════════════════════════
// FSAI – AgentResponse
// ═══════════════════════════════════════
import React, { useState } from 'react';
import { getLayerMeta } from '../utils/parser';
import './AgentResponse.css';

function normalizeLine(line) {
  return line.trim();
}

function renderMarkdownContent(text) {
  if (!text) return null;
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let idx = 0;

  while (idx < lines.length) {
    const line = lines[idx];

    if (/^```/.test(line)) {
      const lang = line.slice(3).trim() || 'text';
      let codeLines = [];
      idx += 1;
      while (idx < lines.length && !/^```/.test(lines[idx])) {
        codeLines.push(lines[idx]);
        idx += 1;
      }
      blocks.push(
        <div className="code-block markdown-code" key={`code-${idx}`}>
          <pre className="code-pre"><code>{codeLines.join('\n')}</code></pre>
        </div>
      );
      idx += 1;
      continue;
    }

    const headingMatch = /^(#{1,6})\s*(.+)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const tag = level <= 2 ? 'h3' : 'h4';
      const Heading = tag;
      blocks.push(
        <Heading className={`md-heading md-heading-${level}`} key={`heading-${idx}`}>
          {headingMatch[2].trim()}
        </Heading>
      );
      idx += 1;
      continue;
    }

    if (/^\s*\|/.test(line) && idx + 1 < lines.length && /^\s*\|[\s:-]+\|/.test(lines[idx + 1])) {
      const tableLines = [line];
      idx += 2;
      while (idx < lines.length && /^\s*\|/.test(lines[idx])) {
        tableLines.push(lines[idx]);
        idx += 1;
      }
      const rows = tableLines.map((row) => row.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim()));
      const [header, ...body] = rows;
      blocks.push(
        <div className="md-table-wrapper" key={`table-${idx}`}>
          <table className="md-table">
            <thead>
              <tr>{header.map((cell, cellIndex) => <th key={`th-${idx}-${cellIndex}`}>{cell}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={`row-${idx}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => <td key={`td-${idx}-${rowIndex}-${cellIndex}`}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const items = [];
      const ordered = /^\s*\d+\./.test(line);
      while (idx < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[idx])) {
        const nextLine = lines[idx].replace(/^\s*([-*+]|\d+\.)\s+/, '').trim();
        items.push(nextLine);
        idx += 1;
      }
      blocks.push(
        ordered ? (
          <ol className="md-list" key={`list-${idx}`}>
            {items.map((item, i) => <li key={i}>{item}</li>)}
          </ol>
        ) : (
          <ul className="md-list" key={`list-${idx}`}>
            {items.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        )
      );
      continue;
    }

    if (normalizeLine(line).length === 0) {
      idx += 1;
      continue;
    }

    const paragraphLines = [line];
    idx += 1;
    while (idx < lines.length && normalizeLine(lines[idx]).length > 0 && !/^#{1,6}\s+/.test(lines[idx]) && !/^\s*\|/.test(lines[idx]) && !/^\s*([-*+]|\d+\.)\s+/.test(lines[idx]) && !/^```/.test(lines[idx])) {
      paragraphLines.push(lines[idx]);
      idx += 1;
    }
    blocks.push(
      <p className="body-text md-paragraph" key={`para-${idx}`}>
        {paragraphLines.join(' ').trim()}
      </p>
    );
  }

  return blocks;
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

// ── Fix Section (handles Option 1 / Option 2) ────────────────
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

  const renderRich = (text) => renderMarkdownContent(text || '');

  // Fallback: plain text (try to avoid raw markdown look)
  if (!isStructured) {
    return <div className="response-plain">{renderRich(raw)}</div>;
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
            <p className="body-text highlight-red">{errorType}</p>
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
            <div className="layer-pill" style={{ background: layerMeta.bg, border: `1px solid ${layerMeta.color}50`, color: layerMeta.color }}>
              {layerMeta.label}
            </div>
          </SectionCard>
        )}
      </div>

      {/* Row 2: Root Cause */}
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

      {/* Row 3: Fix */}
      <FixSection fix={fix} />

      {/* Row 4: Code Patch */}
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

      {/* Row 5: Explanation */}
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
