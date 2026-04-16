import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiAlertCircle, FiLayers } from 'react-icons/fi';
import GuidePageLayout from './GuidePageLayout';

const GuideProcurement = () => {
  return (
    <GuidePageLayout>
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">רכש והצטיידות</h2>
          <p className="section-description">
            ניהול כל תהליך הרכש — מיצירת הזמנה ועד קליטתה במחסן. עם תצוגת קנבן חדשה למעקב ויזואלי.
          </p>
        </div>

        <div className="guide-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h3>תת-עמודים: בתהליך / הסתיים</h3>
            <p>עמוד הרכש כולל תת-עמודים הנגישים מתפריט הצד:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>בתהליך:</strong> כל ההזמנות הפעילות (שטרם התקבלו) — ברירת מחדל: תצוגת קנבן</li>
              <li><FiCheckCircle className="list-icon" /> <strong>הסתיים:</strong> הזמנות שהגיעו ונסגרו</li>
              <li><FiCheckCircle className="list-icon" /> <strong>אנליטיקס:</strong> נתוני רכש חודשיים ותובנות</li>
              <li><FiCheckCircle className="list-icon" /> <strong>השוואת מחירים:</strong> מעקב מחירים לאורך זמן</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>תצוגת קנבן (חדש!)</h3>
            <p>בטאב <strong>"בתהליך"</strong>, ההזמנות מוצגות כלוח קנבן עם 3 עמודות:</p>
            <ul className="feature-list">
              <li><FiAlertCircle className="list-icon" /> <strong>ממתין:</strong> הזמנות שממתינות ל-BOM, EMF או הזמנה</li>
              <li><FiCheckCircle className="list-icon" /> <strong>בתהליך:</strong> הזמנות שממתינות לשילוח או שהוזמנו</li>
              <li><FiCheckCircle className="list-icon" /> <strong>נשלח:</strong> הזמנות שיצאו לדרך ומחכות להגעה</li>
            </ul>
            <p>לחצו על כפתור <strong>הרשימה/קנבן</strong> בשורת הפעולות כדי להחליף בין תצוגת קנבן לתצוגת רשימה.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h3>מסלול הסטטוסים</h3>
            <p>כל הזמנה עוברת את השלבים הבאים לפי הסדר:</p>
            <ul className="feature-list">
              <li>🔴 <strong>מחכה ל-BOM ו-EMF:</strong> הסטטוס ההתחלתי — ממתין לשני המסמכים</li>
              <li>🟡 <strong>מחכה ל-EMF / מחכה ל-BOM:</strong> אחד המסמכים התקבל, ממתין לשני</li>
              <li>🔵 <strong>מחכה שרכש ייצא:</strong> שני המסמכים התקבלו — ניתן לסמן כ"יצא לדרך"</li>
              <li>🚛 <strong>רכש יצא:</strong> ההזמנה שודרה לספק — ניתן לסמן כ"הגיע"</li>
              <li>✅ <strong>רכש הגיע:</strong> קלוט ונסגר (עובר לטאב "הסתיים")</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h3>כפתורי הפעולה (2×2)</h3>
            <p>לכל הזמנה יש עד 4 כפתורי פעולה המסודרים ברשת:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>עריכה (עיפרון):</strong> עריכת פרטי ההזמנה — זמינה עד לסטטוס "רכש יצא"</li>
              <li><FiCheckCircle className="list-icon" /> <strong>מחיקה (פח):</strong> מחיקת ההזמנה — זמינה עד לסטטוס "רכש יצא"</li>
              <li><FiCheckCircle className="list-icon" /> <strong>היסטוריה (שעון):</strong> צפייה בכל השינויים שנעשו בהזמנה</li>
              <li><FiCheckCircle className="list-icon" /> <strong>שלח לדרך (משאית):</strong> מעבר לסטטוס "רכש יצא"</li>
              <li><FiCheckCircle className="list-icon" /> <strong>סמן כהגיע (וי):</strong> מעבר לסטטוס "רכש הגיע"</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">5</div>
          <div className="step-content">
            <h3>סורק הצעות מחיר (BOM Scanner)</h3>
            <p>ייבוא מהיר של קבצי Excel/CSV מהספקים השונים:</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> זיהוי אוטומטי של עמודות לפורמטים של Dell, HPE, NetApp ו-Cisco</li>
              <li><FiCheckCircle className="list-icon" /> גרירה ושחרור (Drag & Drop) ויצירת קבוצות רכש אוטומטית</li>
              <li><FiAlertCircle className="list-icon" /> התרעה על פריטים שאינם קיימים במאגר</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">5א</div>
          <div className="step-content">
            <h3>סיווג אוטומטי חכם (AI / ML)</h3>
            <p>המערכת מסווגת כל רכיב BOM אוטומטית ל-16 קטגוריות, כולל חילוץ מאפיינים (מהירות, אורך, קיבולת) ותג ביטחון (ירוק/צהוב/אדום).</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">6</div>
          <div className="step-content">
            <h3>רצועת נתוני חודש שוטף (Analytics Strip)</h3>
            <p>בתחתית עמוד הרכש מוצגת רצועה קבועה עם 4 מדדים: סה"כ הוצאה, ממוצע ימי אספקה, מספר הזמנות, וספק מוביל.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">7</div>
          <div className="step-content">
            <h3>השוואת מחירים (Price Intel)</h3>
            <p>לשונית מעקב וניתוח מחירים לאורך זמן — גרפים, רזולוציית זמן, השוואה מתקדמת עם שרשראות מוצר, וגרף הוצאות לפי יצרן.</p>
          </div>
        </div>

        <div className="tip-box highlight">
          <div className="tip-icon"><FiAlertCircle /></div>
          <div className="tip-content">
            <h4>💡 הסטטוס מתעדכן אוטומטית</h4>
            <p>כשמסמן BOM ו-EMF כהתקבלו, הסטטוס עולה אוטומטית ל"מחכה שרכש ייצא", ורק אז כפתור המשאית הופך פעיל.</p>
          </div>
        </div>

        <div className="tip-box">
          <div className="tip-icon"><FiAlertCircle /></div>
          <div className="tip-content">
            <h4>📖 מדריך מפורט לרכש והצטיידות</h4>
            <p>רוצים ללמוד לעומק — סורק BOM, סיווג AI, מסלול סטטוסים, השוואת מחירים ועוד? <Link to="/guide/procurement-deep" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>למדריך האינטראקטיבי המלא →</Link></p>
          </div>
        </div>
      </section>
    </GuidePageLayout>
  );
};

export default GuideProcurement;
