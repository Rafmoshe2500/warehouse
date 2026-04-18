import React from 'react';
import { Navigate } from 'react-router-dom';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import GuidePageLayout from './GuidePageLayout';

const GuideAdmin = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/guide" replace />;
  }

  return (
    <GuidePageLayout>
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">ניהול מערכת (Admin)</h2>
          <p className="section-description">
            ממשק הניהול מאפשר לנהל משתמשים, קבוצות הרשאות וכלי AI. נגיש רק למנהלים. העמודים הנגישים דרך תפריט הצד תחת "ניהול".
          </p>
        </div>

        <div className="guide-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h3>ניהול משתמשים</h3>
            <p>עמוד <strong>"ניהול משתמשים וקבוצות"</strong> מציג את כל המשתמשים הרשומים:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>יצירת משתמש:</strong> הגדרת שם, סיסמה, תפקיד (User/Admin) והרשאות מפורטות</li>
              <li><FiCheckCircle className="list-icon" /> <strong>עריכת משתמש:</strong> שינוי תפקיד, איפוס סיסמה, עדכון הרשאות</li>
              <li><FiCheckCircle className="list-icon" /> <strong>מחיקת משתמש:</strong> הסרת משתמש (לא ניתן למחוק Admin אחרון או SuperAdmin)</li>
              <li><FiCheckCircle className="list-icon" /> <strong>חיפוש וסינון:</strong> חיפוש מהיר לפי שם משתמש</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>ניהול קבוצות הרשאה</h3>
            <p>קבוצות מאפשרות להגדיר חבילות הרשאות ולשייך אותן למשתמשים:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>יצירת קבוצה:</strong> הגדרת שם ובחירת הרשאות (מלאי, רכש, ספקים ספציפיים)</li>
              <li><FiCheckCircle className="list-icon" /> <strong>שיוך משתמשים:</strong> הוספת משתמשים לקבוצה — ההרשאות ממוזגות אוטומטית</li>
              <li><FiCheckCircle className="list-icon" /> <strong>הרשאות ספקים:</strong> ניתן להגדיר גישה לספקים ספציפיים (Dell, HPE, NetApp, Cisco, Commvault)</li>
              <li><FiCheckCircle className="list-icon" /> <strong>הרשאות מחירים:</strong> <em>procurement:view_prices</em> ו-<em>procurement:compare_prices</em> לשליטה בנראות מחירים</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h3>לוגים (יומן פעילות מנהלים)</h3>
            <p>עמוד <strong>"לוגים"</strong> (נגיש מתפריט הצד תחת ניהול) מציג את כל הפעולות הניהוליות — יצירה, עדכון ומחיקה של משתמשים וקבוצות. ניתן לסנן לפי סוג פעולה, משתמש ותאריך.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h3>כלי AI (SuperAdmin בלבד)</h3>
            <p>עמוד <strong>"כלי AI"</strong> (נגיש מתפריט הצד תחת ניהול) זמין רק למנהלי-על ומאפשר:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>אימון מחדש:</strong> הפעלת אימון מחדש של מודל סיווג הרכיבים (AI Classifier) על בסיס הקטלוג העדכני</li>
              <li><FiCheckCircle className="list-icon" /> <strong>מדדי ביצועים:</strong> צפייה באחוז דיוק המודל, מספר דוגמאות האימון ונתיב המודל</li>
            </ul>
          </div>
        </div>

        <div className="tip-box highlight">
          <div className="tip-icon"><FiAlertCircle /></div>
          <div className="tip-content">
            <h4>💡 הרשאות מצטברות</h4>
            <p>משתמש מקבל את כל ההרשאות שלו + כל ההרשאות מהקבוצות שהוא חבר בהן. לא צריך להגדיר הרשאות ידנית אם הקבוצה כבר מכילה אותן.</p>
          </div>
        </div>
      </section>
    </GuidePageLayout>
  );
};

export default GuideAdmin;
