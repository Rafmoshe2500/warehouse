import React, { useState } from 'react';
import { FiRefreshCw, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import bomService from '../../api/services/bomService';
import './AiToolsPanel.css';

const AiToolsPanel = () => {
  const [retraining, setRetraining] = useState(false);
  const [result, setResult] = useState(null); // { success, message, metrics }

  const handleRetrain = async () => {
    setRetraining(true);
    setResult(null);
    try {
      const data = await bomService.retrainModel();
      setResult({ success: true, message: data?.message || 'האימון הושלם בהצלחה', metrics: data });
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'שגיאה לא צפויה';
      setResult({ success: false, message: msg });
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="ai-tools-panel">
      <h3 className="atp-title">כלי AI</h3>
      <p className="atp-subtitle">ניהול מודל הסיווג האוטומטי של רכיבים. השינויים משפיעים על סריקות BOM עתידיות.</p>

      <div className="atp-card">
        <div className="atp-card-header">
          <FiRefreshCw size={20} className="atp-card-icon" />
          <div>
            <div className="atp-card-title">אימון מחדש של מודל הסיווג</div>
            <div className="atp-card-desc">
              מאמן את מודל ה-AI מחדש על בסיס הקטלוג הנוכחי ב-MongoDB.
              מומלץ להריץ לאחר עדכון קטלוג משמעותי.
            </div>
          </div>
        </div>

        <button
          className={`atp-retrain-btn${retraining ? ' loading' : ''}`}
          onClick={handleRetrain}
          disabled={retraining}
        >
          <FiRefreshCw size={15} className={retraining ? 'spin' : ''} />
          {retraining ? 'מאמן...' : 'הפעל אימון מחדש'}
        </button>

        {result && (
          <div className={`atp-result${result.success ? ' success' : ' error'}`}>
            {result.success ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
            <span>{result.message}</span>
            {result.success && result.metrics && (
              <div className="atp-metrics">
                {result.metrics.accuracy    != null && <span>דיוק: {Math.round(result.metrics.accuracy * 100)}%</span>}
                {result.metrics.samples     != null && <span>דגימות: {result.metrics.samples}</span>}
                {result.metrics.model_path  != null && <span className="atp-metric-path">{result.metrics.model_path}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiToolsPanel;
