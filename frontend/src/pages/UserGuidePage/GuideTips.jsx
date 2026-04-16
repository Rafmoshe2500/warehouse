import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import GuidePageLayout from './GuidePageLayout';

const GuideTips = () => {
  const { hasPermission, hasProcurementAccess } = useAuth();
  const hasInventoryAccess = hasPermission('inventory:ro') || hasPermission('inventory:rw');
  const procurementAccess = hasProcurementAccess();

  return (
    <GuidePageLayout>
      {/* Pro Tips Section */}
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">טיפים למקצוענים</h2>
        </div>

        {hasInventoryAccess && (
          <>
            <h3>🎯 טיפים לניהול מלאי</h3>
            <div className="guide-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Import מצויין מ-Excel</h4>
                <p>כדי לעדכן כמויות עבור הרבה פריטים בפעם אחת, הכינו קובץ Excel עם עמודות: catalog_number, quantity, status. ואז "ייבוא" מהמסך הראשי.</p>
              </div>
            </div>

            <div className="guide-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Bulk Edit - עריכה מרובה</h4>
                <p>סמנו מספר פריטים, לחצו ימין, בחרו "עריכה מרובה". אתם יכולים לשנות שדות בו-זמנית לכל הבחירה.</p>
              </div>
            </div>

            <div className="guide-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Undo/Redo - ביטול ופעולה חוזרת</h4>
                <p>לאחר עריכה, Ctrl+Z לביטול, Ctrl+Y לחזרה. המערכת זוכרת עד 50 פעולות!</p>
              </div>
            </div>
          </>
        )}

        {procurementAccess && (
          <>
            <h3>🛒 טיפים לניהול רכש</h3>
            <div className="guide-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>הוסף קובץ בדוק עם התמונות</h4>
                <p>בעת קליטת הזמנה, הוסיפו צילום של התוכן כדי להוכיח מה התקבל. זה עוזר במקרה של חילוקי דעות עם הספק.</p>
              </div>
            </div>

            <div className="guide-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>סנו לפי סטטוס</h4>
                <p>השתמשו בתת-הפריטים בתפריט הצד ("בתהליך" ו"הסתיים") כדי למיין בין הזמנות פתוחות וסגורות.</p>
              </div>
            </div>
          </>
        )}

        <h3>🎨 התאמה אישית</h3>
        <div className="guide-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h4>מצב תצוגה (Dark/Light)</h4>
            <p>לחצו על שם המשתמש בסרגל העליון ובחרו במעבר בין מצב כהה ובהיר.</p>
          </div>
        </div>
        <div className="guide-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h4>ערכות נושא (Theme Variants)</h4>
            <p>לחצו על שם המשתמש בסרגל העליון ובחרו ערכת נושא: <strong>רגיל</strong>, <strong>עץ</strong>, <strong>חלל</strong> או <strong>קלאסי</strong>. הבחירה נשמרת אוטומטית.</p>
          </div>
        </div>
        
        <div className="shortcuts-grid">
          <div className="shortcut-item">
            <span className="key-combo">Ctrl + B</span>
            <span className="key-desc">כיווץ / הרחבת תפריט הצד</span>
          </div>
          <div className="shortcut-item">
            <span className="key-combo">Ctrl + K</span>
            <span className="key-desc">חיפוש גלובלי (פריטים, הזמנות, קולקציות)</span>
          </div>
          <div className="shortcut-item">
            <span className="key-combo">Ctrl + Z</span>
            <span className="key-desc">ביטול פעולה אחרונה (Undo)</span>
          </div>
          <div className="shortcut-item">
            <span className="key-combo">Ctrl + Y</span>
            <span className="key-desc">חזרה על פעולה (Redo)</span>
          </div>
          <div className="shortcut-item">
            <span className="key-combo">Double Click</span>
            <span className="key-desc">כניסה מהירה לעריכת תא</span>
          </div>
          <div className="shortcut-item">
            <span className="key-combo">Shift + Click</span>
            <span className="key-desc">בחירת רצף שורות בטבלה</span>
          </div>
          <div className="shortcut-item">
            <span className="key-combo">Ctrl + Click</span>
            <span className="key-desc">בחירה מרובה בודדת של שורות</span>
          </div>
          <div className="shortcut-item">
            <span className="key-combo">ESC</span>
            <span className="key-desc">ביטול עריכה / יציאה מחלונית</span>
          </div>
          <div className="shortcut-item">
            <span className="key-combo">Right Click</span>
            <span className="key-desc">פתח תפריט פעולות</span>
          </div>
          <div className="shortcut-item">
            <span className="key-combo">Enter</span>
            <span className="key-desc">שמור עריכה וזוז לתא הבא</span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">שאלות נפוצות</h2>
        </div>
        
        <div className="faq-list">
          <details className="faq-item">
            <summary>האם מחיקת פריט מהאוסף שלי מוחקת אותו מהמערכת?</summary>
            <div className="faq-answer">
              לא. הפעולה רק מסירה את הקישור מהרשימה האישית שלך. הפריט נשאר בטוח במלאי הכללי.
            </div>
          </details>
          <details className="faq-item">
            <summary>למה אני לא יכול לערוך שדות מסוימים?</summary>
            <div className="faq-answer">
              שדות מסוימים (כמו מק"ט יצרן) הם שדות מפתח הנעולים לעריכה כדי לשמור על integrity של הנתונים. אם יש צורך בשינוי, פנה למנהל המערכת.
            </div>
          </details>
          <details className="faq-item">
            <summary>איך מייצאים נתונים לאקסל?</summary>
            <div className="faq-answer">
              בכל מסך ראשי יש כפתור "ייצוא" (Export). ניתן לייצא את כל הטבלה או רק את הסינון הנוכחי.
            </div>
          </details>
          <details className="faq-item">
            <summary>למה אני לא רואה את כל הספקים בדף הרכש?</summary>
            <div className="faq-answer">
              ההרשאות במערכת הן לפי ספק. אם חסרה לך גישה לספק כמו Dell או NetApp, פנה למנהל המערכת כדי לקבל הרשאות ספציפיות.
            </div>
          </details>
          <details className="faq-item">
            <summary>איך משנים ערכת נושא?</summary>
            <div className="faq-answer">
              לחצו על שם המשתמש בסרגל העליון כדי לפתוח את תפריט ההעדפות. משם ניתן לעבור בין מצב כהה/בהיר, ולבחור ערכת נושא (רגיל, עץ, חלל, קלאסי). הבחירה נשמרת אוטומטית.
            </div>
          </details>
          <details className="faq-item">
            <summary>מה ההבדל בין הרשאות Owner, RW ו-RO באוספים?</summary>
            <div className="faq-answer">
              <strong>Owner</strong> — שליטה מלאה כולל מחיקת האוסף וניהול הרשאות. <strong>RW</strong> — עריכת פריטים והגדרות. <strong>RO</strong> — צפייה בלבד.
            </div>
          </details>
          <details className="faq-item">
            <summary>מה זה "קטלוג פריטים"?</summary>
            <div className="faq-answer">
              הקטלוג הוא מאגר של כל המק"טים (Part Numbers) שהוזנו למערכת. הוא מתעדכן אוטומטית בכל פעם שפריט נוצר או מעודכן, ומשמש גם את מנוע ה-AI לסיווג רכיבים.
            </div>
          </details>
        </div>
      </section>
    </GuidePageLayout>
  );
};

export default GuideTips;
