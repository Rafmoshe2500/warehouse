import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import GuidePageLayout from './GuidePageLayout';

const GuideCollections = () => {
  return (
    <GuidePageLayout>
      <section className="content-section accent-bg">
        <div className="section-header">
          <h2 className="section-title">המלאי שלי (Collections)</h2>
          <p className="section-description">
            האזור האישי שלכם לניהול פרויקטים. בנו, ערכו וייצאו BOM מותאם לכל פרויקט.
          </p>
        </div>

        <div className="tip-box highlight">
          <div className="tip-icon"><FiAlertCircle /></div>
          <div className="tip-content">
            <h4>קונספט המפתח: קישורים חיים</h4>
            <p>
              כשאתם מוסיפים פריט לאוסף, אתם יוצרים <strong>קישור</strong> למלאי הראשי.
              <br />
              המשמעות: אם המחסנאי מעדכן שיש 0 יחידות במלאי, אתם תראו את זה מייד באוסף שלכם.
              מחיקת פריט מהאוסף שלכם <strong>לא מוחקת</strong> אותו מהמחסן!
            </p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">01</div>
          <div className="step-content">
            <h3>הוספת פריטים לאוסף</h3>
            <p>שתי דרכים להוסיף פריטים:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>מהמלאי הראשי:</strong> סמנו פריטים ← קליק ימני ← "שייך למלאי שלי" ← בחרו אוסף.</li>
              <li><FiCheckCircle className="list-icon" /> <strong>מתוך האוסף:</strong> לחצו כפתור <strong>"+"</strong> (הוסף פריט) לפתוח חלון חיפוש ובחירה ישירה.</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">02</div>
          <div className="step-content">
            <h3>ניהול האוסף — טאב פריטים</h3>
            <p>טאב <strong>"פריטים"</strong> מציג את כל הפריטים באוסף. תוכלו:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> לערוך שדות מותאמים אישית שהגדרתם לאוסף</li>
              <li><FiCheckCircle className="list-icon" /> לבחור מספר פריטים ולמחוק בבת-אחת (מחיקה מרובה)</li>
              <li><FiCheckCircle className="list-icon" /> לבחור מספר פריטים ולערוך שדות בו-זמנית (עריכה מרובה)</li>
              <li><FiCheckCircle className="list-icon" /> לייצא את האוסף לאקסל עם כפתור <strong>"ייצוא"</strong></li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">03</div>
          <div className="step-content">
            <h3>הגדרות האוסף — טאב הגדרות</h3>
            <p>טאב <strong>"הגדרות"</strong> (זמין לבעלים ועורכים) מאפשר:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> שינוי שם האוסף ותיאורו</li>
              <li><FiCheckCircle className="list-icon" /> הוספת שדות מותאמים אישית (Custom Fields) לכל הפריטים באוסף</li>
              <li><FiCheckCircle className="list-icon" /> ניהול הרשאות — מי יכול לצפות ומי יכול לערוך</li>
            </ul>
          </div>
        </div>

        <div className="tip-box">
          <div className="tip-icon"><FiAlertCircle /></div>
          <div className="tip-content">
            <h4>📖 מדריך מפורט למלאי שלי</h4>
            <p>רוצים ללמוד לעומק כל אינטראקציה — שדות מותאמים, הרשאות, ייצוא ועוד? <Link to="/guide/collections-deep" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>למדריך האינטראקטיבי המלא →</Link></p>
          </div>
        </div>
      </section>
    </GuidePageLayout>
  );
};

export default GuideCollections;
