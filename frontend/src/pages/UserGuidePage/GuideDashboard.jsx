import React from 'react';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import GuidePageLayout from './GuidePageLayout';

const GuideDashboard = () => {
  return (
    <GuidePageLayout>
      <section className="content-section accent-bg">
        <div className="section-header">
          <h2 className="section-title">דשבורד - מרכז הבקרה</h2>
          <p className="section-description">
            דשבורד הבית מציג סקירה כללית חיה של כל המערכת — מלאי, רכש, התראות חכמות ופעולות מהירות.
          </p>
        </div>

        <div className="guide-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h3>פילטר תאריך (Splunk-style)</h3>
            <p>בפינה השמאלית של הדשבורד תמצאו פילטר תאריכים. בחרו תאריכי התחלה וסיום לסנן את נתוני הרכש לפי טווח זמן. לחצו <strong>"זמן נוכחי"</strong> לאיפוס הפילטר.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>כרטיסי מלאי — לחיצים!</h3>
            <p>שורת כרטיסים צבעוניים מציגה נתוני מלאי בזמן אמת. <strong>לחיצה על כל כרטיס מנווטת ישירות לעמוד הרלוונטי:</strong></p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>סה"כ פריטים:</strong> לחיצה → עמוד המלאי</li>
              <li><FiCheckCircle className="list-icon" /> <strong>שריונים פעילים:</strong> לחיצה → עמוד המלאי</li>
              <li><FiCheckCircle className="list-icon" /> <strong>ציוד סריאלי:</strong> לחיצה → עמוד המלאי</li>
              <li><FiCheckCircle className="list-icon" /> <strong>ציוד נלווה:</strong> לחיצה → עמוד המלאי (טאב פריטים ישנים)</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h3>כרטיסי רכש — לחיצים!</h3>
            <p>שורת כרטיסים נוספת מציגה נתוני רכש (לבעלי הרשאת רכש). <strong>לחיצה מנווטת לעמוד הרכש:</strong></p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>סך הכל רכש:</strong> הוצאות מצטברות בתקופה</li>
              <li><FiAlertCircle className="list-icon" /> <strong>ממתין ל-EMF:</strong> הזמנות שעדיין לא קיבלו מספר EMF</li>
              <li><FiAlertCircle className="list-icon" /> <strong>ממתין ל-BOM:</strong> הזמנות שממתינות לאישור BOM</li>
              <li><FiCheckCircle className="list-icon" /> <strong>בדרך אלינו:</strong> הזמנות שכבר יצאו מהספק</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h3>התראות חכמות</h3>
            <p>בצד השני של הדשבורד מופיע פאנל <strong>התראות חכמות</strong> שמציג פעולות שדורשות את תשומת לבכם:</p>
            <ul className="feature-list">
              <li><FiAlertCircle className="list-icon" /> <strong>פריטים ישנים:</strong> פריטים שלא עודכנו 90+ ימים</li>
              <li><FiAlertCircle className="list-icon" /> <strong>הזמנות ממתינות:</strong> EMF או BOM שטרם הגיעו</li>
              <li><FiCheckCircle className="list-icon" /> <strong>הזמנות בדרך:</strong> הזמנות שנשלחו וממתינות להגעה</li>
            </ul>
            <p>כל התראה לחיצה — מנווטת ישירות לעמוד הרלוונטי.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">5</div>
          <div className="step-content">
            <h3>פעולות מהירות (Quick Actions)</h3>
            <p>מתחת להתראות תמצאו כפתורי קיצור לפעולות נפוצות:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>פריט חדש:</strong> פתיחת טופס יצירת פריט</li>
              <li><FiCheckCircle className="list-icon" /> <strong>הזמנה חדשה:</strong> פתיחת טופס הזמנת רכש</li>
              <li><FiCheckCircle className="list-icon" /> <strong>ייבוא Excel:</strong> העלאת קובץ מלאי</li>
              <li><FiCheckCircle className="list-icon" /> <strong>ייצוא Excel:</strong> הורדת דוח מלאי</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">6</div>
          <div className="step-content">
            <h3>תרשימים ותובנות</h3>
            <p>הדשבורד כולל מגוון תרשימים אינטראקטיביים:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>מיקומים במחסן:</strong> פילוג הפריטים לפי מיקום</li>
              <li><FiCheckCircle className="list-icon" /> <strong>חיפוש לפי מק"ט:</strong> ניתוח מהיר של פריט ספציפי</li>
              <li><FiCheckCircle className="list-icon" /> <strong>פילוג לפי פרויקט:</strong> אחוז הפריטים לכל פרויקט</li>
              <li><FiCheckCircle className="list-icon" /> <strong>פילוג לפי אתר יעד:</strong> לאיזה אתר מיועד כל ציוד</li>
              <li><FiCheckCircle className="list-icon" /> <strong>יצרנים מובילים:</strong> אילו יצרנים הכי נפוצים במחסן</li>
              <li><FiCheckCircle className="list-icon" /> <strong>פעילות אחרונה:</strong> פעולות שנעשו לאחרונה במערכת</li>
            </ul>
          </div>
        </div>

        <div className="tip-box">
          <div className="tip-icon"><FiAlertCircle /></div>
          <div className="tip-content">
            <h4>🔍 חיפוש גלובלי (Ctrl+K)</h4>
            <p>בכל עמוד במערכת, לחצו <strong>Ctrl+K</strong> לפתיחת חלון חיפוש מהיר. החיפוש מחפש <strong>בו-זמנית</strong> בשלושה מקורות:</p>
            <ul className="feature-list" style={{ marginTop: '0.5rem' }}>
              <li><FiCheckCircle className="list-icon" /> <strong>📦 פריטי מלאי:</strong> לפי מק"ט, תיאור, יצרן, מיקום וסריאל</li>
              <li><FiCheckCircle className="list-icon" /> <strong>🛒 הזמנות רכש:</strong> לפי מספר EMF ורכיבי ה-BOM</li>
              <li><FiCheckCircle className="list-icon" /> <strong>📁 קולקציות:</strong> לפי שם ותיאור הקולקציה</li>
            </ul>
            <p>לחצו Enter על תוצאה לניווט ישיר לעמוד הרלוונטי. ↑↓ לניווט, Esc לסגירה.</p>
          </div>
        </div>
      </section>
    </GuidePageLayout>
  );
};

export default GuideDashboard;
