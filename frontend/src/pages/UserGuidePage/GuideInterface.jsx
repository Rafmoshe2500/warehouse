import React from 'react';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiBox,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiFilter,
  FiArrowUp,
  FiArrowDown,
  FiRotateCcw,
  FiRotateCw,
  FiLayers,
  FiHelpCircle,
  FiZap,
  FiMousePointer,
  FiCommand,
  FiGrid,
  FiClipboard
} from 'react-icons/fi';
import HotspotMarker from '../../components/guide/HotspotMarker/HotspotMarker';
import QuizCard from '../../components/guide/QuizCard/QuizCard';
import ActionMapCard from '../../components/guide/ActionMapCard/ActionMapCard';
import GuidePageLayout from './GuidePageLayout';
import './GuideInterface.css';

const DEMO_ITEMS = [
  { id: '1', catalog_number: 'CAT-1024', serial: 'SN-88721', description: 'מתאם רשת אלחוטי', manufacturer: 'Cisco', location: 'A-03-12', current_stock: 15, target_site: 'אתר צפון', purpose: 'תקשורת', notes: '', collections: 2, allocations: ['פרויקט אלפא'] },
  { id: '2', catalog_number: 'CAT-2048', serial: 'SN-44102', description: 'ממיר אותות דיגיטלי', manufacturer: 'TP-Link', location: 'B-07-04', current_stock: 3, target_site: 'אתר מרכז', purpose: 'תשתיות', notes: 'דורש בדיקה', collections: 0, allocations: [] },
  { id: '3', catalog_number: 'CAT-3072', serial: 'SN-11503', description: 'כבל סיב אופטי 10M', manufacturer: 'Corning', location: 'C-01-08', current_stock: 120, target_site: 'אתר דרום', purpose: 'תשתיות', notes: '', collections: 1, allocations: ['פרויקט בטא', 'פרויקט גמא'] },
  { id: '4', catalog_number: 'CAT-4096', serial: 'SN-67234', description: 'נתב תעשייתי', manufacturer: 'Juniper', location: 'A-03-12', current_stock: 7, target_site: 'אתר צפון', purpose: 'תקשורת', notes: 'חדש', collections: 3, allocations: ['פרויקט אלפא'] },
];

const GuideInterface = () => {
  return (
    <GuidePageLayout>

      {/* ── INTRO: Overview ── */}
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
              <li><FiCheckCircle className="list-icon" /> <strong>מלאי נוכחי:</strong> כל הפריטים הפעילים במחסן</li>
              <li><FiCheckCircle className="list-icon" /> <strong>מלאי ישן:</strong> פריטים שלא עודכנו זמן רב</li>
              <li><FiCheckCircle className="list-icon" /> <strong>קטלוג פריטים:</strong> מאגר המק"טים</li>
              <li><FiCheckCircle className="list-icon" /> <strong>תנועות:</strong> יומן שינויים ועדכונים</li>
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
          <div className="step-number">04</div>
          <div className="step-content">
            <h3>תפריט שורה מהיר ⋯ (חדש!)</h3>
            <p>כל שורה בטבלת המלאי מציגה כפתור <strong>⋯</strong> בעמודה הימנית — גלויה בריחוף מעל השורה.</p>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>✏️ עריכה:</strong> פתיחת חלון עריכת הפריט</li>
              <li><FiCheckCircle className="list-icon" /> <strong>📋 העתק מק"ט:</strong> העתקה ללוח בלחיצה אחת</li>
              <li><FiCheckCircle className="list-icon" /> <strong>📁 הוסף לקולקציה:</strong> שיוך לאוסף (תפריט משנה)</li>
              <li><FiCheckCircle className="list-icon" /> <strong>🗑️ מחיקה:</strong> מחיקת הפריט</li>
            </ul>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">05</div>
          <div className="step-content">
            <h3>מצבי תצוגה (חדש!)</h3>
            <ul className="feature-list">
              <li><FiCheckCircle className="list-icon" /> <strong>קומפקטי:</strong> שורות צפופות (35px)</li>
              <li><FiCheckCircle className="list-icon" /> <strong>רגיל:</strong> שורות סטנדרטיות (48px) — ברירת מחדל</li>
              <li><FiCheckCircle className="list-icon" /> <strong>כרטיסים:</strong> שורות גבוהות (72px)</li>
            </ul>
            <p>הבחירה נשמרת אוטומטית.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">06</div>
          <div className="step-content">
            <h3>פאנל פרטי פריט (חדש!)</h3>
            <p>לחיצה על שורה בטבלה פותחת <strong>פאנל צד</strong> עם כל פרטי הפריט — ללא צורך לגלול הצידה. <strong>טיפ:</strong> Ctrl+Click ו-Shift+Click עדיין עובדים לסימון מרובה.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">07</div>
          <div className="step-content">
            <h3>רצועת פילטרים פעילים (חדש!)</h3>
            <p>כשמסננים, מופיעה רצועה עם <strong>צ'יפים</strong> של כל הפילטרים הפעילים. לחצו X על כל צ'יפ להסרה, או "נקה הכל" לאיפוס.</p>
          </div>
        </div>
      </section>

      {/* ── DEEP DIVE: Intro Cards ── */}
      <section id="inventory-overview" className="content-section">
        <div className="section-header">
          <h2 className="section-title">טבלת ניהול המלאי — מדריך מפורט</h2>
          <p className="section-description">
            טבלת המלאי מאפשרת לסנן, למיין, לערוך תאים בלחיצה כפולה, לבצע פעולות מרובות ולבטל כל פעולה עם Ctrl+Z.
          </p>
        </div>
        <div className="cards-grid">
          <div className="feature-card">
            <h3 className="feature-card-header"><div className="card-icon blue"><FiEdit /></div><span>עריכה מהירה</span></h3>
            <p>לחיצה כפולה על תא ניתן-לעריכה פותחת שדה ישירות בטבלה. Enter לשמירה, Escape לביטול.</p>
          </div>
          <div className="feature-card">
            <h3 className="feature-card-header"><div className="card-icon purple"><FiRotateCcw /></div><span>ביטול וחזרה</span></h3>
            <p>כל עריכה ומחיקה נשמרת בהיסטוריה. Ctrl+Z מבטל, Ctrl+Y מחזיר.</p>
          </div>
          <div className="feature-card">
            <h3 className="feature-card-header"><div className="card-icon green"><FiLayers /></div><span>פעולות מרובות</span></h3>
            <p>בחרו מספר פריטים ובצעו עריכה, מחיקה או שיוך לאוסף — הכל בלחיצה אחת.</p>
          </div>
        </div>
      </section>

      {/* ── DEEP DIVE: Live Demo ── */}
      <section id="inventory-live-demo" className="content-section">
        <div className="section-header">
          <h2 className="section-title">הטבלה האינטראקטיבית — מבט מקרוב</h2>
          <p className="section-description">לחצו על הנקודות הכחולות הפועמות כדי ללמוד מה כל אזור עושה.</p>
        </div>
        <div className="demo-table-note"><FiAlertCircle /><span>זוהי גרסת תצוגה בלבד — הנקודות מסבירות את תפקיד כל אזור.</span></div>
        <div className="demo-table-wrapper">
          <table className="demo-table">
            <thead>
              <tr>
                <th className="th-checkbox th-frozen">
                  <HotspotMarker number={1} top="4px" left="6px" label="בחירת הכל (Checkbox)" description="לחיצה על התיבה בכותרת בוחרת את כל הפריטים בדף." />
                  <input type="checkbox" disabled />
                </th>
                <th className="th-frozen">
                  <HotspotMarker number={2} top="4px" left="4px" label="מיון לפי עמודה" description="לחיצה על כותרת עמודה ממיינת בסדר עולה. לחיצה נוספת — יורד." />
                  מק&quot;ט ▼
                </th>
                <th className="th-frozen">סריאלי</th>
                <th>תיאור</th><th>יצרן</th><th>מיקום</th><th>מלאי</th>
                <th>אתר יעד</th><th>יעוד</th><th>שריון פרויקטים</th><th>צוותים</th><th>הערות</th>
              </tr>
              <tr className="filter-row">
                <td></td>
                <td><input type="text" placeholder="סנן..." disabled /></td>
                <td><input type="text" placeholder="סנן..." disabled /></td>
                <td>
                  <HotspotMarker number={3} top="2px" left="4px" label="שורת סינון" description="הקלידו טקסט בשדה הסינון שבכל עמודה לצמצום התוצאות." />
                  <input type="text" placeholder="סנן..." disabled />
                </td>
                <td><input type="text" placeholder="סנן..." disabled /></td>
                <td><input type="text" placeholder="סנן..." disabled /></td>
                <td><input type="text" placeholder="סנן..." disabled /></td>
                <td><input type="text" placeholder="סנן..." disabled /></td>
                <td><input type="text" placeholder="סנן..." disabled /></td>
                <td><input type="text" placeholder="סנן..." disabled /></td>
                <td><input type="text" placeholder="סנן..." disabled /></td>
                <td><input type="text" placeholder="סנן..." disabled /></td>
              </tr>
            </thead>
            <tbody>
              {DEMO_ITEMS.map((item, index) => (
                <tr key={item.id}>
                  <td className="td-checkbox td-frozen">
                    {index === 0 && <HotspotMarker number={4} top="4px" left="6px" label="בחירת פריט בודד" description="Ctrl+Click מוסיף לבחירה, Shift+Click בוחר טווח." />}
                    <input type="checkbox" disabled />
                  </td>
                  <td className="td-frozen">
                    {index === 1 && <HotspotMarker number={6} top="4px" left="4px" label="תא לקריאה בלבד" description="לחיצה כפולה מעתיקה את הערך ללוח." />}
                    <span className="demo-cell-immutable">{item.catalog_number}</span>
                  </td>
                  <td className="td-frozen"><span className="demo-cell-immutable">{item.serial}</span></td>
                  <td>
                    {index === 0 && <HotspotMarker number={5} top="4px" left="4px" label="תא ניתן לעריכה" description="לחיצה כפולה פותחת שדה עריכה. Enter לשמירה, Escape לביטול." />}
                    <span className="demo-cell-editable">{item.description}</span>
                  </td>
                  <td><span className="demo-cell-immutable">{item.manufacturer}</span></td>
                  <td><span className="demo-cell-immutable">{item.location}</span></td>
                  <td><span className="demo-cell-editable">{item.current_stock}</span></td>
                  <td><span className="demo-cell-editable">{item.target_site}</span></td>
                  <td><span className="demo-cell-editable">{item.purpose}</span></td>
                  <td>
                    {index === 2 && <HotspotMarker number={7} top="4px" left="4px" label="שריון פרויקטים" description="תגיות צבעוניות לפרויקטים. מוצגים עד 3, השאר +עוד." />}
                    {item.allocations.length > 0
                      ? item.allocations.map((a, i) => <span key={i} className="demo-tag">{a}</span>)
                      : <span className="demo-cell-immutable">—</span>}
                  </td>
                  <td>
                    {index === 0 && <HotspotMarker number={8} top="4px" left="4px" label="משוייך לצוותים" description="פותח חלונית עם רשימת האוספים שהפריט שוייך אליהם." />}
                    {item.collections > 0 ? <span className="demo-link-btn">{item.collections}</span> : '—'}
                  </td>
                  <td><span className="demo-cell-editable">{item.notes || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── DEEP DIVE: Filtering ── */}
      <section id="inventory-actions-header" className="content-section">
        <div className="section-header">
          <h2 className="section-title">סינון, מיון וחיפוש</h2>
          <p className="section-description">הטבלה מציגה עשרות ואף מאות פריטים. הנה כיצד למצוא בדיוק מה שאתם מחפשים.</p>
        </div>
        <div className="action-cards-grid">
          <ActionMapCard icon={<FiCheckCircle />} elementName="בחירת הכל (Checkbox)" action="לחיצה על תיבת הסימון בכותרת בוחרת כל הפריטים בדף." useCase="לפני מחיקה מרובה או שיוך לאוסף." />
          <ActionMapCard icon={<FiArrowUp />} elementName="מיון לפי עמודה" action="לחיצה ממיינת A→Z. לחיצה נוספת — Z→A. חץ מציג כיוון נוכחי." useCase="לזהות פריטים עם מלאי הכי נמוך, או למיין לפי יצרן." />
          <ActionMapCard icon={<FiFilter />} elementName="שורת סינון" action="שדה טקסט בראש כל עמודה. מסנן תוך חצי שנייה. ניתן לסנן מספר עמודות בו-זמנית." useCase='חיפוש לפי מק"ט, יצרן, מיקום או כל שדה אחר.' />
        </div>
      </section>

      {/* ── DEEP DIVE: Cell Editing ── */}
      <section id="inventory-actions-edit" className="content-section">
        <div className="section-header">
          <h2 className="section-title">עריכת תאים בטבלה</h2>
          <p className="section-description">עריכה ישירה בתוך הטבלה — בלי חלונות קופצים. פשוט לחצו פעמיים ותתחילו להקליד.</p>
        </div>
        <div className="action-cards-grid">
          <ActionMapCard icon={<FiEdit />} elementName="לחיצה כפולה על תא ניתן לעריכה" action="נפתח שדה עריכה בתוך התא. Enter או ✓ לשמירה, Escape או ✗ לביטול." useCase="עדכון ערך בודד — שם, כמות, הערה, יעוד." />
          <ActionMapCard icon={<FiCopy />} elementName="לחיצה כפולה על תא לקריאה בלבד" action='מק"ט, סריאלי, מיקום — לחיצה כפולה מעתיקה ללוח. מופיעה הודעת "הועתק".' useCase='להעתיק מק"ט לחיפוש במערכת אחרת.' />
          <ActionMapCard icon={<FiArrowDown />} elementName="אתר יעד (Dropdown)" action='בעת עריכה, נפתחת רשימה עם אתרים מוגדרים מראש.' useCase="שיוך פריט לאתר פריסה ספציפי." />
          <ActionMapCard icon={<FiLayers />} elementName="משוייך לצוותים (קישור)" action="לחיצה על המספר פותחת חלונית עם כל האוספים והצוותים." useCase="לדעת מי משתמש בפריט ובאילו פרויקטים." />
        </div>
        <div className="tip-box">
          <div className="tip-icon"><FiAlertCircle /></div>
          <div className="tip-content"><h4>💡 עריכה עם מקלדת</h4><p>ניווט בין תאים עם חצים, Tab למעבר לתא הבא, Enter לכניסה למצב עריכה.</p></div>
        </div>
      </section>

      {/* ── DEEP DIVE: Selection & Bulk ── */}
      <section id="inventory-actions-selection" className="content-section">
        <div className="section-header">
          <h2 className="section-title">בחירה ופעולות מרובות</h2>
          <p className="section-description">בחרו פריט אחד, מספר פריטים, או טווח שלם — ובצעו פעולות על כולם יחד.</p>
        </div>
        <div className="action-cards-grid">
          <ActionMapCard icon={<FiMousePointer />} elementName="Checkbox בשורה" action="לחיצה על תיבת הסימון בוחרת את הפריט." useCase="לבחור פריטים לעריכה מרובה, מחיקה או שיוך." />
          <ActionMapCard icon={<FiCommand />} elementName="Ctrl + Click" action="מוסיף/מסיר מהבחירה ללא איבוד הקודמים." useCase="לבחור פריטים לא רצופים — פריט 2, 5 ו-8." />
          <ActionMapCard icon={<FiArrowDown />} elementName="Shift + Click" action="בוחר טווח רצוף מהשורה הראשונה לאחרונה." useCase="לבחור 20 פריטים רצופים." />
          <ActionMapCard icon={<FiEdit />} elementName="עריכה מרובה (Bulk Edit)" action='קליק ימני → "עריכה". עדכון יעוד, הערות, אתר יעד לכולם בבת-אחת.' useCase="עדכון ל-50 פריטים במקום אחד-אחד." />
          <ActionMapCard icon={<FiTrash2 />} elementName="מחיקה מרובה (Bulk Delete)" action='קליק ימני → "מחיקה". חלון אישור עם שדה סיבה. ניתן לבטל עם Ctrl+Z!' useCase="הסרת פריטים שהוצאו מהמלאי." />
        </div>
        <div className="tip-box highlight">
          <div className="tip-icon"><FiAlertCircle /></div>
          <div className="tip-content"><h4>⚡ לא לפחד ממחיקה</h4><p>כל מחיקה ניתנת לביטול עם Ctrl+Z מיד לאחר הביצוע.</p></div>
        </div>
      </section>

      {/* ── DEEP DIVE: Context Menu ── */}
      <section id="inventory-actions-context" className="content-section">
        <div className="section-header">
          <h2 className="section-title">תפריט קליק ימני (Context Menu)</h2>
          <p className="section-description">לחיצה ימנית בכל מקום בטבלה פותחת תפריט פעולות מהיר.</p>
        </div>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start', marginTop: '1.5rem' }}>
          <div className="demo-context-menu">
            <div className="demo-context-item"><FiCopy /> העתק תאים</div>
            <div className="demo-context-divider" />
            <div className="demo-context-item"><FiEdit /> ערוך נבחרים</div>
            <div className="demo-context-item danger"><FiTrash2 /> מחק נבחרים</div>
            <div className="demo-context-divider" />
            <div className="demo-context-item"><FiLayers /> שייך למלאי שלי ▸</div>
            <div className="demo-context-submenu">
              <div className="demo-context-submenu-item"><FiCheckCircle /> פרויקט אלפא</div>
              <div className="demo-context-submenu-item"><FiCheckCircle /> פרויקט בטא</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div className="action-cards-grid">
              <ActionMapCard icon={<FiCopy />} elementName="העתק תאים" action="מעתיק תאים נבחרים ללוח בפורמט Tab-separated — מוכן להדבקה באקסל." useCase="להעביר נתונים לגיליון אקסל." />
              <ActionMapCard icon={<FiEdit />} elementName="ערוך נבחרים" action="פותח חלון עריכה מרובה. ניתן לעדכן יעוד, הערות ואתר יעד." useCase="עדכון שדה משותף למספר פריטים." />
              <ActionMapCard icon={<FiTrash2 />} elementName="מחק נבחרים" action="פותח חלון אישור עם שדה סיבה. ניתן לבטל עם Ctrl+Z." useCase="הסרת פריטים שאינם במלאי." />
              <ActionMapCard icon={<FiLayers />} elementName="שייך למלאי שלי" action="פותח תת-תפריט עם רשימת האוספים שלכם." useCase="הוספת פריטים לאוסף פרויקט." />
            </div>
          </div>
        </div>
      </section>

      {/* ── DEEP DIVE: Undo / Redo ── */}
      <section id="inventory-actions-undo" className="content-section">
        <div className="section-header">
          <h2 className="section-title">ביטול וחזרה (Undo / Redo)</h2>
          <p className="section-description">כל פעולת עריכה ומחיקה נשמרת בהיסטוריה. ניתן לבטל וליחזר כמה שלבים אחורה.</p>
        </div>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1.5rem' }}>
          <div>
            <p style={{ marginBottom: '0.8rem', color: 'var(--text-muted)' }}>סרגל צף בפינה השמאלית-תחתונה:</p>
            <div className="demo-floating-toolbar">
              <div className="demo-toolbar-btn active" title="ביטול (Ctrl+Z)"><FiRotateCcw /></div>
              <div className="demo-toolbar-btn disabled" title="חזרה (Ctrl+Y)"><FiRotateCw /></div>
            </div>
          </div>
        </div>
        <div className="action-cards-grid" style={{ marginTop: '1.5rem' }}>
          <ActionMapCard icon={<FiRotateCcw />} elementName="ביטול (Ctrl+Z)" action="מחזיר פעולה אחרונה לקדמותה — עריכות ומחיקות מרובות." useCase="טעיתם בערך או מחקתם פריט בטעות." />
          <ActionMapCard icon={<FiRotateCw />} elementName="חזרה (Ctrl+Y)" action="מבצע מחדש פעולה שבוטלה." useCase="ביטלתם בטעות? Ctrl+Y מחזיר." />
        </div>
        <div className="tip-box">
          <div className="tip-icon"><FiAlertCircle /></div>
          <div className="tip-content"><h4>💡 הסרגל מופיע רק כשיש מה לבטל</h4><p>אם אין פעולות בהיסטוריה — הסרגל מוסתר.</p></div>
        </div>
      </section>

      {/* ── DEEP DIVE: Keyboard Shortcuts ── */}
      <section id="inventory-actions-keyboard" className="content-section">
        <div className="section-header">
          <h2 className="section-title">קיצורי מקלדת — טבלת המלאי</h2>
          <p className="section-description">עבדו מהר יותר בלי לגעת בעכבר.</p>
        </div>
        <div className="shortcuts-grid">
          <div className="shortcut-item"><span className="key-combo">Ctrl + Z</span><span className="key-desc">ביטול פעולה אחרונה</span></div>
          <div className="shortcut-item"><span className="key-combo">Ctrl + Y</span><span className="key-desc">חזרה על פעולה שבוטלה</span></div>
          <div className="shortcut-item"><span className="key-combo">Ctrl + C</span><span className="key-desc">העתקת תאים נבחרים</span></div>
          <div className="shortcut-item"><span className="key-combo">Enter</span><span className="key-desc">שמירת עריכה ומעבר למטה</span></div>
          <div className="shortcut-item"><span className="key-combo">Escape</span><span className="key-desc">ביטול עריכה נוכחית</span></div>
          <div className="shortcut-item"><span className="key-combo">Tab</span><span className="key-desc">מעבר לתא הבא</span></div>
          <div className="shortcut-item"><span className="key-combo">F2</span><span className="key-desc">כניסה למצב עריכה</span></div>
          <div className="shortcut-item"><span className="key-combo">חצים ↑↓←→</span><span className="key-desc">ניווט בין תאים</span></div>
          <div className="shortcut-item"><span className="key-combo">לחיצה כפולה</span><span className="key-desc">עריכה / העתקה (לפי סוג התא)</span></div>
        </div>
      </section>

      {/* ── DEEP DIVE: Summary ── */}
      <section id="inventory-summary" className="content-section">
        <div className="section-header">
          <h2 className="section-title">סיכום — טבלת המלאי</h2>
          <p className="section-description">תהליך העבודה המרכזי — ב-6 משפטים.</p>
        </div>
        <div className="summary-box">
          <h3><FiZap /> תהליך עבודה מרכזי</h3>
          <ol className="summary-list">
            <li><strong>צפו בטבלה</strong> — מיון ברירת מחדל לפי תאריך עדכון.</li>
            <li><strong>סננו ומיינו</strong> — שדות סינון + כותרות עמודות.</li>
            <li><strong>ערכו ישירות</strong> — לחיצה כפולה על תא ניתן-לעריכה. Enter שומר.</li>
            <li><strong>בחרו ופעלו</strong> — עריכה/מחיקה מרובה דרך קליק ימני.</li>
            <li><strong>שייכו לפרויקט</strong> — "שייך למלאי שלי" מוסיף לאוספים.</li>
            <li><strong>בטלו אם צריך</strong> — Ctrl+Z מבטל כל פעולה, כולל מחיקות.</li>
          </ol>
        </div>
      </section>

      {/* ── DEEP DIVE: Quiz ── */}
      <section id="inventory-quiz" className="content-section">
        <div className="section-header">
          <h2 className="section-title">בדיקת הבנה — טבלת המלאי</h2>
          <p className="section-description">ענו על 3 שאלות קצרות. התשובה תתגלה לאחר הלחיצה.</p>
        </div>
        <div className="quiz-section-grid">
          <QuizCard
            question='מה קורה כשלוחצים פעמיים על תא שאינו ניתן לעריכה (כמו מק"ט)?'
            options={['הערך מועתק ללוח (Clipboard)', 'נפתח שדה עריכה', 'לא קורה כלום']}
            correctIndex={0}
            explanation='שדות כמו מק"ט, סריאלי ומיקום הם לקריאה בלבד. לחיצה כפולה מעתיקה ללוח ומציגה "הועתק ללוח".'
          />
          <QuizCard
            question="איך מבטלים פעולת מחיקה?"
            options={['רענון הדף', 'לחיצה על Ctrl+Z', 'לא ניתן לבטל מחיקה']}
            correctIndex={1}
            explanation='לחיצה על Ctrl+Z מיד לאחר המחיקה משחזרת את הפריטים.'
          />
          <QuizCard
            question="נכון או לא נכון: ניתן לבחור טווח שורות רצוף באמצעות Shift+Click."
            options={['נכון — Shift+Click בוחר מהשורה האחרונה שנבחרה עד השורה שנלחצה', 'לא נכון — צריך לסמן כל שורה בנפרד']}
            correctIndex={0}
            explanation="לחצו על שורה ראשונה, החזיקו Shift, לחצו על האחרונה — כל מה שביניהם ייבחר."
          />
        </div>
      </section>

    </GuidePageLayout>
  );
};

export default GuideInterface;