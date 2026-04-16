import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import GuidePageLayout from './GuidePageLayout';

const GuideInterface = () => {
  return (
    <GuidePageLayout>
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">ממשק וטבלאות חכמות</h2>
          <p className="section-description">
            עמוד המלאי מחולק ל-4 תת-עמודים הנגישים דרך תפריט הצד: <strong>מלאי נוכחי</strong>, <strong>מלאי ישן</strong>, <strong>קטלוג פריטים</strong> ו<strong>תנועות</strong>. הטבלאות בכל עמוד מאפשרות סינון, מיון, עריכה ופעולות מהירות.
          </p>
        </div>

        <div className="guide-step">
          <div className="step-number">00</div>
          <div className="step-content">
            <h3>תת-עמודי המלאי בתפריט הצד</h3>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>מלאי נוכחי:</strong> כל הפריטים הפעילים במחסן — העמוד הראשי לניהול יומיומי</li>
              <li><FiCheckCircle className="list-icon" /> <strong>מלאי ישן:</strong> פריטים שלא עודכנו זמן רב — לזיהוי מלאי מתיישן</li>
              <li><FiCheckCircle className="list-icon" /> <strong>קטלוג פריטים:</strong> מאגר המק"טים — צפייה וחיפוש מהיר בקטלוג</li>
              <li><FiCheckCircle className="list-icon" /> <strong>תנועות:</strong> יומן שינויים ועדכונים של פריטי המלאי</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">01</div>
          <div className="step-content">
            <h3>סינון וחיפוש מתקדם</h3>
            <p>השתמשו בשורת החיפוש העליונה לחיפוש מהיר בכל הטבלה. לסינון מדויק יותר, הקלידו ערכים בשדות הסינון שבראש כל עמודה. כפתור <strong>"פילטרים"</strong> מאפשר להציג או להסתיר את שורת הסינון.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">02</div>
          <div className="step-content">
            <h3>תצוגה אישית (Column Visibility)</h3>
            <p>חדש! כפתור <strong>"עמודות"</strong> מאפשר לכם לבחור בדיוק אילו נתונים להציג. סמנו את העמודות הרלוונטיות לכם והסירו את העומס מהעיניים.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">03</div>
          <div className="step-content">
            <h3>תפריט פעולות (Context Menu)</h3>
            <p>לחיצה ימנית על כל שורה בטבלה תפתח תפריט פעולות עשיר:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>עריכה:</strong> עדכון פרטי הפריט (לבעלי הרשאות).</li>
              <li><FiCheckCircle className="list-icon" /> <strong>העתקה:</strong> העתקת תאים או שורות לאקסל.</li>
              <li><FiCheckCircle className="list-icon" /> <strong>שיוך למלאי שלי:</strong> הוספה מהירה לאוספים שלכם.</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">03א</div>
          <div className="step-content">
            <h3>תפריט שורה מהיר ⋯ (חדש!)</h3>
            <p>כל שורה בטבלת המלאי מציגה כפתור <strong>⋯</strong> בעמודה הימנית — גלויה בריחוף מעל השורה. לחיצה עליו פותחת תפריט נפתח עם הפעולות הנפוצות ביותר:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>✏️ עריכה:</strong> פתיחת חלון עריכת הפריט (לבעלי הרשאת כתיבה)</li>
              <li><FiCheckCircle className="list-icon" /> <strong>📋 העתק מק"ט:</strong> העתקת מספר המק"ט ללוח הגזירה בלחיצה אחת</li>
              <li><FiCheckCircle className="list-icon" /> <strong>📁 הוסף לקולקציה:</strong> שיוך הפריט לאחת מהקולקציות שלכם (תפריט משנה)</li>
              <li><FiCheckCircle className="list-icon" /> <strong>🗑️ מחיקה:</strong> מחיקת הפריט (לבעלי הרשאת כתיבה)</li>
            </ul>
            <p><strong>טיפ:</strong> התפריט מחליף את הצורך לסמן שורה לפני כל פעולה — מהיר יותר לפעולות חד-פעמיות.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">04</div>
          <div className="step-content">
            <h3>מצבי תצוגה (חדש!)</h3>
            <p>בפינה העליונה של עמוד המלאי תמצאו 3 מצבי תצוגה:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>קומפקטי:</strong> שורות צפופות (35px) — מקסימום מידע על המסך</li>
              <li><FiCheckCircle className="list-icon" /> <strong>רגיל:</strong> שורות סטנדרטיות (48px) — ברירת מחדל</li>
              <li><FiCheckCircle className="list-icon" /> <strong>כרטיסים:</strong> שורות גבוהות (72px) — קריאות מקסימלית</li>
            </ul>
            <p>הבחירה נשמרת אוטומטית ותישאר גם בכניסה הבאה.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">05</div>
          <div className="step-content">
            <h3>פאנל פרטי פריט (חדש!)</h3>
            <p>לחיצה על שורה בטבלה פותחת <strong>פאנל צד</strong> עם כל פרטי הפריט — ללא צורך לגלול הצידה. הפאנל מציג את כל השדות ברשת נוחה, כולל פעולות מהירות (עריכה, מחיקה, שיוך לקולקציות).</p>
            <p><strong>טיפ:</strong> Ctrl+Click ו-Shift+Click עדיין עובדים לסימון מרובה כרגיל.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">06</div>
          <div className="step-content">
            <h3>רצועת פילטרים פעילים (חדש!)</h3>
            <p>כשמסננים את הטבלה, מופיעה רצועה מעל הטבלה עם <strong>צ'יפים</strong> של כל הפילטרים הפעילים. לחצו X על כל צ'יפ להסרה, או "נקה הכל" לאיפוס כל הסינונים.</p>
          </div>
        </div>

        <div className="tip-box">
          <div className="tip-icon"><FiAlertCircle /></div>
          <div className="tip-content">
            <h4>📖 מדריך מפורט לטבלת המלאי</h4>
            <p>רוצים ללמוד לעומק כל אינטראקציה בטבלה — עריכה, מיון, קיצורי מקלדת ועוד? <Link to="/guide/inventory-table" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>למדריך האינטראקטיבי המלא →</Link></p>
          </div>
        </div>
      </section>
    </GuidePageLayout>
  );
};

export default GuideInterface;
