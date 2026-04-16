import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import GuidePageLayout from './GuidePageLayout';

const GuideAuditLogs = () => {
  return (
    <GuidePageLayout>
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">יומן פעילות (Audit Logs)</h2>
          <p className="section-description">
            רישום של כל הפעולות שבוצעו במערכת - מי עשה מה ובאיזה זמן.
          </p>
        </div>

        <div className="guide-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h3>סינון יומנים</h3>
            <p>אתם יכולים לסנן לפי:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>משתמש:</strong> מי ביצע את הפעולה</li>
              <li><FiCheckCircle className="list-icon" /> <strong>סוג פעולה:</strong> יצירה, עריכה, מחיקה, כניסה</li>
              <li><FiCheckCircle className="list-icon" /> <strong>תאריך:</strong> בטווח מסוים</li>
              <li><FiCheckCircle className="list-icon" /> <strong>משאב:</strong> איזה פריט/משתמש/הזמנה</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>צפייה בפרטים</h3>
            <p>לחצו על כל שורה ביומן כדי לראות פרטים מלאים על השינויים שבוצעו. זה שימושי לדיבוגינג או הבנת מה השתנה בדיוק.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h3>ייצוא דוח</h3>
            <p>אתם יכולים לייצא את היומן ל-CSV לצורכי דיווח או ניתוח עתידי.</p>
          </div>
        </div>
      </section>
    </GuidePageLayout>
  );
};

export default GuideAuditLogs;
