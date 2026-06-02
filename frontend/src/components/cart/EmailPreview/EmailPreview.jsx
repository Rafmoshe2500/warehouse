import React, { useState } from 'react';
import { FiCopy, FiCheck, FiMail, FiX } from 'react-icons/fi';
import './EmailPreview.css';

const EmailPreview = ({ emailText, targetSite, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard API unavailable — silent */
    }
  };

  const handleOpenOutlook = () => {
    const subject = encodeURIComponent(`בקשת משיכת ציוד — ${targetSite || ''}`);
    const body = encodeURIComponent(emailText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="email-preview__overlay" onClick={onClose}>
      <div
        className="email-preview"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="תצוגה מקדימה של בקשת משיכה"
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="email-preview__header">
          <h2 className="email-preview__title">בקשת משיכת ציוד</h2>
          <button className="email-preview__close" onClick={onClose} aria-label="סגור">
            <FiX size={18} />
          </button>
        </div>

        <p className="email-preview__hint">
          עיין בטקסט, העתק או פתח ב-Outlook. הציוד נמשך ועודכן במערכת.
        </p>

        {/* ── Email text ─────────────────────────────────────────────── */}
        <pre className="email-preview__text">{emailText}</pre>

        {/* ── Actions ────────────────────────────────────────────────── */}
        <div className="email-preview__actions">
          <button
            className="email-preview__btn email-preview__btn--copy"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <FiCheck size={15} />
                הועתק!
              </>
            ) : (
              <>
                <FiCopy size={15} />
                העתק
              </>
            )}
          </button>

          <button
            className="email-preview__btn email-preview__btn--outlook"
            onClick={handleOpenOutlook}
          >
            <FiMail size={15} />
            פתח ב-Outlook
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
