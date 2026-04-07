// ═══════════════════════════════════════
// FSAI – TypingIndicator
// ═══════════════════════════════════════
import React, { useState, useEffect } from 'react';
import './TypingIndicator.css';

const ANALYSIS_STEPS = [
  'Detecting framework & language…',
  'Extracting root error segment…',
  'Tracing call stack…',
  'Identifying root cause…',
  'Generating code patch…',
  'Compiling structured response…',
];

export default function TypingIndicator() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s + 1) % ANALYSIS_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="typing-wrap">
      <div className="typing-avatar">⬡</div>
      <div className="typing-bubble">
        <div className="typing-header">
          <span className="typing-label">FSAI ANALYZING</span>
          <div className="typing-dots">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
        <div className="typing-step">{ANALYSIS_STEPS[step]}</div>
        <div className="typing-progress">
          <div
            className="typing-bar"
            style={{ width: `${((step + 1) / ANALYSIS_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
