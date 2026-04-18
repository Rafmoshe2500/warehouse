import React from 'react';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiPlus,
  FiFilter,
  FiLayers,
  FiZap,
  FiMousePointer,
  FiCommand,
  FiSettings,
  FiUsers,
  FiShield,
  FiDownload,
  FiSearch,
  FiEye,
  FiX
} from 'react-icons/fi';
import HotspotMarker from '../../components/guide/HotspotMarker/HotspotMarker';
import QuizCard from '../../components/guide/QuizCard/QuizCard';
import ActionMapCard from '../../components/guide/ActionMapCard/ActionMapCard';
import GuidePageLayout from './GuidePageLayout';
import './GuideCollections.css';

const GuideCollections = () => {
  return (
    <GuidePageLayout>

      {/* ── INTRO ── */}
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
      </section>

      {/* ── DEEP DIVE: Overview ── */}
      <section id="collections-overview" className="content-section">
        <div className="section-header">
          <h2 className="section-title">המלאי שלי — מדריך מפורט</h2>
          <p className="section-description">
            "המלאי שלי" הוא האזור האישי שלכם ליצירת אוספים (פרויקטים / צוותים). בכל אוסף ניתן
            לשייך פריטים מהמלאי הראשי, להוסיף שדות מותאמים אישית, לנהל הרשאות גישה, ולייצא BOM מוכן לאקסל.
            הפריטים הם <strong>קישורים חיים</strong> — עדכון במלאי הראשי ישתקף מיידית.
          </p>
        </div>
        <div className="cards-grid">
          <div className="feature-card">
            <h3 className="feature-card-header"><div className="card-icon blue"><FiLayers /></div><span>קישורים חיים</span></h3>
            <p>הפריטים משקפים את מצב המלאי בזמן אמת. מחקתם פריט מהאוסף? הוא נשאר במחסן.</p>
          </div>
          <div className="feature-card">
            <h3 className="feature-card-header"><div className="card-icon purple"><FiSettings /></div><span>שדות מותאמים</span></h3>
            <p>הוסיפו שדות כמו מספרי חשבוניות, סטטוסים ועוד — בלי לשנות את המבנה הכללי.</p>
          </div>
          <div className="feature-card">
            <h3 className="feature-card-header"><div className="card-icon green"><FiShield /></div><span>הרשאות גמישות</span></h3>
            <p>שתפו עם משתמשים וקבוצות. בעלים, עורך, או צופה בלבד.</p>
          </div>
        </div>
      </section>

      {/* ── DEEP DIVE: Live Demo ── */}
      <section id="collections-live-demo" className="content-section">
        <div className="section-header">
          <h2 className="section-title">דשבורד האוספים — מבט מקרוב</h2>
          <p className="section-description">לחצו על הנקודות הכחולות כדי ללמוד מה כל אזור עושה.</p>
        </div>
        <div className="demo-table-note"><FiAlertCircle /><span>זוהי גרסת תצוגה בלבד — הנקודות מסבירות כל אלמנט.</span></div>

        <div className="demo-toolbar" style={{ position: 'relative' }}>
          <HotspotMarker number={1} top="calc(50% - 14px)" left="93%" label="כפתור יצירת אוסף חדש" description="לחיצה פותחת חלון יצירה — הזינו שם, תיאור וצבע. האוסף החדש יופיע בגריד." />
          <HotspotMarker number={2} top="calc(50% - 14px)" left="52%" label="שדה חיפוש" description="מסנן את האוספים לפי שם בזמן אמת." />
          <div className="demo-toolbar-item primary"><FiPlus /> צור אוסף חדש</div>
          <div className="demo-toolbar-item"><FiSearch /> חיפוש אוספים...</div>
        </div>

        <div className="demo-collections-grid">
          <div className="demo-card-hotspot-wrapper">
            <HotspotMarker number={3} top="10px" left="80%" label="פס צבעוני + תג תפקיד" description='פס צבעוני עליון מזהה כל אוסף. תג "בעלים" (כחול) או "עורך/צופה" (סגול).' />
            <div className="demo-collection-card">
              <div className="demo-card-stripe owner" />
              <div className="demo-card-body">
                <h4 className="demo-card-title">פרויקט אלפא — שרתים</h4>
                <span className="demo-card-role owner">בעלים</span>
                <p className="demo-card-desc">ציוד שרתים לפריסה באתר צפון.</p>
                <div className="demo-card-footer"><span>24 פריטים</span><button type="button" disabled className="demo-card-view-btn">צפה באוסף</button></div>
              </div>
            </div>
          </div>
          <div className="demo-card-hotspot-wrapper">
            <HotspotMarker number={4} top="calc(100% - 30px)" left="50%" label='מונה פריטים + כפתור צפייה' description='"צפה באוסף" פותח את דף הפרטים עם טאב פריטים והגדרות.' />
            <div className="demo-collection-card">
              <div className="demo-card-stripe shared" />
              <div className="demo-card-body">
                <h4 className="demo-card-title">פרויקט בטא — תשתיות</h4>
                <span className="demo-card-role shared">עורך</span>
                <p className="demo-card-desc">רכיבי תקשורת למרכז הנתונים.</p>
                <div className="demo-card-footer"><span>58 פריטים</span><button type="button" disabled className="demo-card-view-btn">צפה באוסף</button></div>
              </div>
            </div>
          </div>
          <div className="demo-card-hotspot-wrapper">
            <div className="demo-collection-card">
            <div className="demo-card-stripe owner" />
            <div className="demo-card-body">
              <h4 className="demo-card-title">תחזוקה שנתית 2025</h4>
              <span className="demo-card-role owner">בעלים</span>
              <p className="demo-card-desc">חלקי חילוף לתחזוקה שוטפת.</p>
              <div className="demo-card-footer"><span>12 פריטים</span><button type="button" disabled className="demo-card-view-btn">צפה באוסף</button></div>
            </div>
          </div>
          </div>
        </div>

        <h3 style={{ marginTop: '2.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>בתוך האוסף — שני הטאבים</h3>
        <div className="demo-tabs" style={{ position: 'relative' }}>
          <HotspotMarker number={5} top="calc(50% - 14px)" left="90%" label='טאב "פריטים"' description="מציג את כל הפריטים באוסף בטבלה — סינון, מיון ופעולות מרובות." />
          <HotspotMarker number={6} top="calc(50% - 14px)" left="65%" label='טאב "הגדרות"' description="ניהול שם, שדות מותאמים, הרשאות ומחיקת אוסף. זמין לבעלים ועורכים." />
          <div className="demo-tab active"><FiLayers /> פריטים</div>
          <div className="demo-tab"><FiSettings /> הגדרות</div>
        </div>
        <div className="demo-toolbar" style={{ position: 'relative' }}>
          <HotspotMarker number={7} top="calc(50% - 14px)" left="92%" label="הוספת פריט (+)" description='פותח חלון חיפוש מהמלאי הראשי. חפשו לפי מק"ט או תיאור.' />
          <HotspotMarker number={8} top="calc(50% - 14px)" left="72%" label="ייצוא לאקסל" description="מייצא את כל פריטי האוסף לקובץ Excel, כולל שדות מותאמים." />
          <div className="demo-toolbar-item primary"><FiPlus /> הוסף פריט</div>
          <div className="demo-toolbar-item"><FiDownload /> ייצוא</div>
          <div className="demo-toolbar-item"><FiSearch /> חיפוש...</div>
        </div>
      </section>

      {/* ── DEEP DIVE: Dashboard Actions ── */}
      <section id="collections-actions-dashboard" className="content-section">
        <div className="section-header">
          <h2 className="section-title">פעולות בדשבורד האוספים</h2>
          <p className="section-description">כל מה שניתן לעשות מדף "המלאי שלי" הראשי.</p>
        </div>
        <div className="action-cards-grid">
          <ActionMapCard icon={<FiPlus />} elementName='כפתור "צור אוסף חדש"' action='חלון יצירה עם שם (חובה), תיאור וצבע. לחצו "צור" לשמירה.' useCase="פתיחת פרויקט חדש." />
          <ActionMapCard icon={<FiSearch />} elementName="חיפוש אוספים" action="מסנן בזמן אמת לפי שם." useCase="כשיש הרבה אוספים ויש למצוא אחד ספציפי." />
          <ActionMapCard icon={<FiEye />} elementName='כפתור "צפה באוסף"' action="פותח דף הפרטים עם טאבים: פריטים והגדרות." useCase="לנהל תוכן האוסף — הוספה, עריכה, ייצוא." />
          <ActionMapCard icon={<FiShield />} elementName="תגית תפקיד" action='"בעלים" (כחול) אם יצרתם, "עורך"/"צופה" (סגול) אם שיתפו אתכם.' useCase="לזהות לאילו אוספים יש הרשאת עריכה." />
        </div>
      </section>

      {/* ── DEEP DIVE: Items Tab ── */}
      <section id="collections-actions-items" className="content-section">
        <div className="section-header">
          <h2 className="section-title">טאב פריטים — ניהול התוכן</h2>
          <p className="section-description">טבלה עם כל רכיבי האוסף. כמויות ושדות מתעדכנים מהמלאי בזמן אמת.</p>
        </div>
        <div className="action-cards-grid">
          <ActionMapCard icon={<FiPlus />} elementName='כפתור "הוסף פריט"' action='חיפוש לפי מק"ט, תיאור או סריאלי. בחרו ולחצו "הוסף".' useCase="הוספת ציוד חדש לאוסף מהמלאי." />
          <ActionMapCard icon={<FiDownload />} elementName='כפתור "ייצוא"' action="מוריד קובץ Excel עם כל הפריטים, כולל שדות מותאמים." useCase="שליחת רשימת ציוד לגורם חיצוני, BOM פנימי." />
          <ActionMapCard icon={<FiEdit />} elementName="עריכת שדות מותאמים" action='לחיצה כפולה על תא שדה מותאם פותחת שדה עריכה. Enter לשמירה.' useCase="עדכון מספר חשבונית, הערת פרויקט." />
          <ActionMapCard icon={<FiCopy />} elementName="בחירת תאים וגרירה" action="גרירה על תאים לבחירת טווח. Ctrl+C מעתיק לפורמט אקסל." useCase="העתקת ערכים לגיליון חיצוני." />
          <ActionMapCard icon={<FiMousePointer />} elementName="בחירת מספר פריטים" action="Checkboxes + Shift+Click לטווח, Ctrl+Click לנפרדים. קליק ימני → ערוך/מחק." useCase="עריכה/מחיקה של 30 פריטים בו-זמנית." />
          <ActionMapCard icon={<FiTrash2 />} elementName="מחיקת פריטים מהאוסף" action='בחירה ← קליק ימני ← "מחק". מסיר מהאוסף בלבד — לא מהמלאי!' useCase="פריט לא רלוונטי לפרויקט, אך עדיין במחסן." />
        </div>
        <div className="tip-box highlight">
          <div className="tip-icon"><FiAlertCircle /></div>
          <div className="tip-content"><h4>💡 מחיקה מאוסף ≠ מחיקה מהמחסן</h4><p>מחיקת פריט מאוסף אישי רק מסירה את הקישור. הפריט נשאר במלאי ובכל אוסף אחר.</p></div>
        </div>
      </section>

      {/* ── DEEP DIVE: Settings Tab ── */}
      <section id="collections-actions-settings" className="content-section">
        <div className="section-header">
          <h2 className="section-title">טאב הגדרות — התאמה אישית</h2>
          <p className="section-description">זמין לבעלים ולעורכים. שם האוסף, שדות מותאמים, הרשאות ומחיקה.</p>
        </div>

        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>שדות מותאמים אישית (Custom Fields)</h3>
        <table className="demo-fields-table">
          <thead>
            <tr><th>שם השדה</th><th>מפתח</th><th>סוג</th><th>פעולות</th></tr>
          </thead>
          <tbody>
            <tr><td>מספר חשבונית</td><td><span className="demo-key-mono">invoice_number</span></td><td><span className="demo-type-badge">טקסט</span></td><td><FiEdit style={{ color: 'var(--accent-primary)' }} /> <FiTrash2 style={{ color: '#ef4444' }} /></td></tr>
            <tr><td>תאריך התקנה</td><td><span className="demo-key-mono">install_date</span></td><td><span className="demo-type-badge">טקסט</span></td><td><FiEdit style={{ color: 'var(--accent-primary)' }} /> <FiTrash2 style={{ color: '#ef4444' }} /></td></tr>
            <tr><td>סטטוס QA</td><td><span className="demo-key-mono">qa_status</span></td><td><span className="demo-type-badge">טקסט</span></td><td><FiEdit style={{ color: 'var(--accent-primary)' }} /> <FiTrash2 style={{ color: '#ef4444' }} /></td></tr>
          </tbody>
        </table>

        <div className="action-cards-grid" style={{ marginTop: '1.5rem' }}>
          <ActionMapCard icon={<FiPlus />} elementName='כפתור "הוסף שדה"' action="מוסיף שדה חדש עם שם ומפתח. מופיע כעמודה חדשה בטבלת הפריטים." useCase="לעקוב אחר מאפיין שלא קיים במלאי — סטטוס QA, מספר חשבונית." />
          <ActionMapCard icon={<FiEdit />} elementName="עריכת שדה קיים" action="לחיצה על אייקון העט מאפשרת לשנות שם. המפתח נשמר לא לאבד נתונים." useCase="תיקון שם שדה." />
          <ActionMapCard icon={<FiTrash2 />} elementName="מחיקת שדה" action="מוחקת את השדה לצמיתות. כל הנתונים בשדה הזה — יימחקו!" useCase="שדה לא רלוונטי לפרויקט." />
        </div>

        <div className="tip-box">
          <div className="tip-icon"><FiAlertCircle /></div>
          <div className="tip-content"><h4>⚠ מחיקת שדה מותאם היא בלתי הפיכה</h4><p>מחיקת שדה מוחקת את כל הערכים שהוזנו בו לכל הפריטים — ללא אפשרות שחזור.</p></div>
        </div>

        <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>אזור סכנה (Danger Zone)</h3>
        <div className="demo-danger-zone">
          <div className="demo-danger-title"><FiAlertCircle /> אזור סכנה</div>
          <p className="demo-danger-desc">מחיקת האוסף תסיר אותו לצמיתות, כולל כל הקישורים לפריטים. הפריטים עצמם נשארים במלאי.</p>
          <button type="button" disabled className="demo-danger-btn"><FiTrash2 /> מחק אוסף</button>
        </div>
      </section>

      {/* ── DEEP DIVE: Permissions ── */}
      <section id="collections-permissions" className="content-section">
        <div className="section-header">
          <h2 className="section-title">הרשאות ושיתוף</h2>
          <p className="section-description">כל אוסף תומך בשלוש רמות הרשאה. הבעלים יכול לשתף עם משתמשים בודדים או קבוצות.</p>
        </div>

        <div className="demo-permissions-list">
          <div className="demo-permission-item">
            <div className="demo-avatar owner">דמ</div>
            <div className="demo-perm-info"><div className="demo-perm-name">דני מזרחי</div><div className="demo-perm-role">בעלים — שליטה מלאה</div></div>
            <span className="demo-card-role owner">בעלים</span>
          </div>
          <div className="demo-permission-item">
            <div className="demo-avatar user">יכ</div>
            <div className="demo-perm-info"><div className="demo-perm-name">יעל כהן</div><div className="demo-perm-role">יכולה לערוך פריטים ושדות מותאמים</div></div>
            <span className="demo-card-role shared">עורך</span>
          </div>
          <div className="demo-permission-item">
            <div className="demo-avatar group">קב</div>
            <div className="demo-perm-info"><div className="demo-perm-name">צוות תשתיות <span className="demo-perm-badge">קבוצה</span></div><div className="demo-perm-role">יכולים לצפות בלבד</div></div>
            <span className="demo-card-role shared">צופה</span>
          </div>
        </div>

        <div className="action-cards-grid">
          <ActionMapCard icon={<FiUsers />} elementName='כפתור "הוסף משתמש"' action="Autocomplete — הקלידו שם משתמש/קבוצה, בחרו הרשאה ולחצו הוסף." useCase="שיתוף עם חבר צוות או מחלקה." />
          <ActionMapCard icon={<FiShield />} elementName="שינוי הרשאה" action="לחיצה על תג ההרשאה פותחת רשימה לשינוי רמת הגישה." useCase="עורך שהפך לצופה, או להיפך." />
          <ActionMapCard icon={<FiX />} elementName="הסרת שותף" action="אייקון X מסיר גישה. הפריטים לא משתנים." useCase="חבר צוות שעזב את הפרויקט." />
        </div>

        <div className="tip-box">
          <div className="tip-icon"><FiAlertCircle /></div>
          <div className="tip-content"><h4>💡 שיתוף עם קבוצה</h4><p>שיתוף עם קבוצה חוסך שיתוף פרטני. כל מי שנוסף לקבוצה יקבל גישה אוטומטית.</p></div>
        </div>
      </section>

      {/* ── DEEP DIVE: Keyboard Shortcuts ── */}
      <section id="collections-actions-keyboard" className="content-section">
        <div className="section-header">
          <h2 className="section-title">קיצורי מקלדת — המלאי שלי</h2>
          <p className="section-description">קיצורים זמינים בטבלת הפריטים בתוך האוסף.</p>
        </div>
        <div className="shortcuts-grid">
          <div className="shortcut-item"><span className="key-combo">Ctrl + C</span><span className="key-desc">העתקת תאים נבחרים</span></div>
          <div className="shortcut-item"><span className="key-combo">Enter</span><span className="key-desc">שמירת עריכה ומעבר למטה</span></div>
          <div className="shortcut-item"><span className="key-combo">Escape</span><span className="key-desc">ביטול עריכה נוכחית</span></div>
          <div className="shortcut-item"><span className="key-combo">Tab</span><span className="key-desc">מעבר לתא הבא</span></div>
          <div className="shortcut-item"><span className="key-combo">Shift + Click</span><span className="key-desc">בחירת טווח שורות רצוף</span></div>
          <div className="shortcut-item"><span className="key-combo">Ctrl + Click</span><span className="key-desc">הוספה / הסרה מהבחירה</span></div>
          <div className="shortcut-item"><span className="key-combo">לחיצה כפולה</span><span className="key-desc">עריכת שדה מותאם / העתקת שדה רגיל</span></div>
          <div className="shortcut-item"><span className="key-combo">חצים ↑↓←→</span><span className="key-desc">ניווט בין תאים</span></div>
        </div>
      </section>

      {/* ── DEEP DIVE: Summary ── */}
      <section id="collections-summary" className="content-section">
        <div className="section-header">
          <h2 className="section-title">סיכום — המלאי שלי</h2>
          <p className="section-description">תהליך העבודה עם המלאי שלי — ב-6 משפטים.</p>
        </div>
        <div className="summary-box">
          <h3><FiZap /> תהליך עבודה מרכזי</h3>
          <ol className="summary-list">
            <li><strong>צרו אוסף</strong> — לחצו "+ צור אוסף חדש" ותנו שם, תיאור וצבע.</li>
            <li><strong>הוסיפו פריטים</strong> — מהמלאי (קליק ימני → שייך) או מתוך האוסף (כפתור "+").</li>
            <li><strong>הגדירו שדות</strong> — בטאב הגדרות הוסיפו שדות כמו "מספר חשבונית" או "סטטוס QA".</li>
            <li><strong>שתפו עם הצוות</strong> — הוסיפו משתמשים או קבוצות כבעלים, עורכים או צופים.</li>
            <li><strong>נהלו ועדכנו</strong> — ערכו שדות מותאמים בלחיצה כפולה, מחקו פריטים לא רלוונטיים.</li>
            <li><strong>ייצאו לאקסל</strong> — לחצו "ייצוא" להוריד Excel עם כל הפריטים ושדות מותאמים.</li>
          </ol>
        </div>
      </section>

      {/* ── DEEP DIVE: Quiz ── */}
      <section id="collections-quiz" className="content-section">
        <div className="section-header">
          <h2 className="section-title">בדיקת הבנה — המלאי שלי</h2>
          <p className="section-description">ענו על 3 שאלות לוודא שהבנתם את העקרונות.</p>
        </div>
        <div className="quiz-section-grid">
          <QuizCard
            question="מה קורה כשמוחקים פריט מאוסף אישי?"
            options={['הפריט נמחק גם מהמלאי הראשי', 'הפריט מוסר מהאוסף בלבד — נשאר במלאי הראשי', 'הפריט מוסר מכל האוספים']}
            correctIndex={1}
            explanation="מחיקת פריט מאוסף מסירה רק את הקישור. הפריט ממשיך במלאי הראשי ובכל אוסף אחר."
          />
          <QuizCard
            question='מי יכול לנהל הרשאות (להוסיף/להסיר שותפים) באוסף?'
            options={['רק הבעלים', 'בעלים ועורכים', 'כל מי שיש לו גישה']}
            correctIndex={0}
            explanation="רק הבעלים יכול לשנות הרשאות. עורכים יכולים לערוך פריטים ושדות, אך לא הרשאות."
          />
          <QuizCard
            question="נכון או לא נכון: שדה מותאם אישית שנמחק — ניתן לשחזור."
            options={['נכון — Ctrl+Z משחזר אותו', 'לא נכון — המחיקה היא בלתי הפיכה וכל הנתונים בשדה אבדו']}
            correctIndex={1}
            explanation="מחיקת שדה מותאם מוחקת לצמיתות את כל הערכים — אין אפשרות ביטול."
          />
        </div>
      </section>

    </GuidePageLayout>
  );
};

export default GuideCollections;