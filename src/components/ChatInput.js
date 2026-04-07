// ═══════════════════════════════════════
// FSAI – ChatInput
// ═══════════════════════════════════════
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './ChatInput.css';

const PLACEHOLDERS = [
  'Paste your stack trace, error log, or code snippet…',
  'Drop a slow SQL query and I will optimize it…',
  'Share your React component causing infinite re-renders…',
  'Paste a Spring Boot LazyInitializationException…',
  'Describe your CORS / JWT / auth issue…',
];

const ChatInput = forwardRef(function ChatInput(
  { onSend, isLoading, quickInput = '', onQuickInputConsumed },
  ref
) {
  const [value, setValue]     = useState('');
  const [focused, setFocused] = useState(false);
  const [phIndex, setPhIndex] = useState(0);
  const textareaRef           = useRef(null);

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  // Cycle placeholder
  useEffect(() => {
    const t = setInterval(() => setPhIndex(i => (i + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Inject quickInput WITHOUT remounting the component
  useEffect(() => {
    if (quickInput) {
      setValue(quickInput);
      setTimeout(() => {
        textareaRef.current?.focus();
        autoResize();
      }, 50);
      // Signal parent that we've consumed this value
      if (onQuickInputConsumed) onQuickInputConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickInput]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 260) + 'px';
  };

  const handleChange = e => {
    setValue(e.target.value);
    autoResize();
  };

  const handleKey = e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const charCount = value.length;
  const lineCount = value.split('\n').length;

  return (
    <div className="input-area">
      <div className={`input-wrapper ${focused ? 'focused' : ''}`}>
        {/* Textarea */}
        <div className="textarea-wrap">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={PLACEHOLDERS[phIndex]}
            disabled={isLoading}
            rows={2}
          />
        </div>

        {/* Bottom bar */}
        <div className="input-bottom">
          <div className="input-hints">
            <span className="hint-tag">Ctrl+Enter to send</span>
            <span className="hint-divider">·</span>
            <span className="hint-tag">Supports: errors · code · SQL · traces</span>
          </div>

          <div className="input-right">
            {charCount > 0 && (
              <span className="char-info">
                {charCount.toLocaleString()} chars · {lineCount} lines
              </span>
            )}
            <button
              className={`send-btn ${isLoading ? 'loading' : ''}`}
              onClick={submit}
              disabled={isLoading || !value.trim()}
              title="Send (Ctrl+Enter)"
            >
              {isLoading ? (
                <span className="send-spinner" />
              ) : (
                <span className="send-icon">▶</span>
              )}
              <span className="send-label">{isLoading ? 'Analyzing…' : 'Debug'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="input-footer">
        <span>FSAI analyzes across Backend · Frontend · Database layers simultaneously</span>
      </div>
    </div>
  );
});

export default ChatInput;