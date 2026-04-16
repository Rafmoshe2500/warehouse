import React from 'react';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import GuidePageLayout from './GuidePageLayout';

const GuideStaleItems = () => {
  return (
    <GuidePageLayout>
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">פריטים ישנים</h2>
          <p className="section-description">
            דף שמציג פריטים שלא עודכנו במשך זמן, כדי לזהות מלאי מתיישן או שגוי. העמוד כולל את כל יכולות ניהול המלאי (למעט יבוא) — חיפוש, סינון, ייצוא, עריכה ומחיקה.
          </p>
        </div>

        <div className="guide-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h3>בחירת טווח זמן</h3>
            <p>בסרגל הכלים בחרו כמה ימים - "לא עודכנו למעלה מ-X ימים". ברירת המחדל היא 30 ימים.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>חיפוש וסינון</h3>
            <p>ניתן לשלב חיפוש חופשי ופילטרים לפי עמודות, בדיוק כמו בעמוד המלאי הראשי:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>חיפוש חופשי:</strong> מחפש בכל השדות בו-זמנית</li>
              <li><FiCheckCircle className="list-icon" /> <strong>פילטרים:</strong> סינון לפי עמודה ספציפית (מק"ט, מיקום, יצרן ועוד)</li>
              <li><FiCheckCircle className="list-icon" /> <strong>הצגת/הסתרת עמודות:</strong> התאמה אישית של העמודות המוצגות</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h3>עריכה ומחיקה</h3>
            <p>ניתן לבצע את כל פעולות העריכה והמחיקה ישירות מהטבלה:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>עריכה בתוך התא:</strong> לחצו על תא כדי לערוך ישירות</li>
              <li><FiCheckCircle className="list-icon" /> <strong>עריכה מרובה:</strong> סמנו מספר פריטים ועדכנו בבת אחת</li>
              <li><FiCheckCircle className="list-icon" /> <strong>מחיקה:</strong> מחיקת פריט בודד או מספר פריטים מסומנים</li>
              <li><FiCheckCircle className="list-icon" /> <strong>ביטול (Ctrl+Z):</strong> ביטול עריכה או מחיקה אחרונה</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h3>ייצוא לאקסל</h3>
            <p>לחצו על כפתור "ייצוא" כדי להוריד את הפריטים הישנים לקובץ Excel. הייצוא מכבד את החיפוש והפילטרים הפעילים.</p>
          </div>
        </div>

        <div className="tip-box highlight">
          <div className="tip-icon"><FiAlertCircle /></div>
          <div className="tip-content">
            <h4>💡 עצה: בדקו באופן קבוע</h4>
            <p>בדיקה שבועית של פריטים ישנים עוזרת לשמור על נתונים עדכניים ונקיים.</p>
          </div>
        </div>
      </section>
    </GuidePageLayout>
  );
};

export default GuideStaleItems;
