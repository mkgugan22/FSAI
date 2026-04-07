// ═══════════════════════════════════════
// FSAI – WelcomeScreen
// ═══════════════════════════════════════
import React from 'react';
import { WELCOME_CHIPS } from '../utils/prompts';
import './WelcomeScreen.css';

const CAPABILITIES = [
  { icon: '🎯', title: 'Root Cause Analysis', desc: 'Pinpoints exact line/function causing the error' },
  { icon: '🔧', title: 'Code Patches',        desc: 'Returns corrected code for every bug' },
  { icon: '⚡', title: 'Multi-Stack',         desc: '20+ frameworks across BE, FE & DB layers' },
  { icon: '🗄️', title: 'SQL Optimization',   desc: 'Query rewrites, index advice, EXPLAIN analysis' },
];

export default function WelcomeScreen({ onChipClick }) {
  return (
    <div className="welcome">
      {/* Hero */}
      <div className="welcome-hero">
        <div className="welcome-orb">
          <div className="orb-ring orb-ring-1" />
          <div className="orb-ring orb-ring-2" />
          <div className="orb-ring orb-ring-3" />
          <span className="orb-icon">⬡</span>
        </div>
        <div className="welcome-text">
          <h1 className="welcome-title">
            <span className="title-fs">Full-Stack</span>
            <span className="title-ai">Debug Agent</span>
          </h1>
          <p className="welcome-desc">
            Drop your error log, stack trace, code snippet, or SQL query.<br />
            I'll detect the framework, isolate the root cause, and give you a precise fix.
          </p>
        </div>
      </div>

      {/* Capabilities */}
      <div className="welcome-caps">
        {CAPABILITIES.map(c => (
          <div key={c.title} className="cap-card">
            <span className="cap-icon">{c.icon}</span>
            <div>
              <div className="cap-title">{c.title}</div>
              <div className="cap-desc">{c.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chips */}
      <div className="welcome-chips-section">
        <div className="chips-label">TRY AN EXAMPLE</div>
        <div className="chips-grid">
          {WELCOME_CHIPS.map(chip => (
            <button
              key={chip.label}
              className="welcome-chip"
              onClick={() => onChipClick(chip.text)}
            >
              <span className="chip-label">{chip.label}</span>
              <span className="chip-arrow">↗</span>
            </button>
          ))}
        </div>
      </div>

      <div className="welcome-hint">
        Supports: React · Next.js · Node.js · Spring Boot · FastAPI · Laravel · Go · PostgreSQL · MongoDB · and 20+ more
      </div>
    </div>
  );
}
