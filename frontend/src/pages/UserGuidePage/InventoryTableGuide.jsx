import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiArrowLeft,
  FiBox,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiCheck,
  FiX,
  FiSave,
  FiFilter,
  FiArrowUp,
  FiArrowDown,
  FiRotateCcw,
  FiRotateCw,
  FiLayers,
  FiMenu,
  FiCheckCircle,
  FiAlertCircle,
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
import './UserGuidePage.css';
import './InventoryTableGuide.css';

const DEMO_ITEMS = [
  { id: '1', catalog_number: 'CAT-1024', serial: 'SN-88721', description: 'מתאם רשת אלחוטי', manufacturer: 'Cisco', location: 'A-03-12', current_stock: 15, target_site: 'אתר צפון', purpose: 'תקשורת', notes: '', collections: 2, allocations: ['פרויקט אלפא'] },
  { id: '2', catalog_number: 'CAT-2048', serial: 'SN-44102', description: 'ממיר אותות דיגיטלי', manufacturer: 'TP-Link', location: 'B-07-04', current_stock: 3, target_site: 'אתר מרכז', purpose: 'תשתיות', notes: 'דורש בדיקה', collections: 0, allocations: [] },
  { id: '3', catalog_number: 'CAT-3072', serial: 'SN-11503', description: 'כבל סיב אופטי 10M', manufacturer: 'Corning', location: 'C-01-08', current_stock: 120, target_site: 'אתר דרום', purpose: 'תשתיות', notes: '', collections: 1, allocations: ['פרויקט בטא', 'פרויקט גמא'] },
  { id: '4', catalog_number: 'CAT-4096', serial: 'SN-67234', description: 'נתב תעשייתי', manufacturer: 'Juniper', location: 'A-03-12', current_stock: 7, target_site: 'אתר צפון', purpose: 'תקשורת', notes: 'חדש', collections: 3, allocations: ['פרויקט אלפא'] },
];

const sections = [
  { id: 'overview', label: 'סקירה כללית', icon: <FiBox /> },
  { id: 'live-demo', label: 'הטבלה האינטראקטיבית', icon: <FiGrid /> },
  { id: 'actions-header', label: 'סינון ומיון', icon: <FiFilter /> },
  { id: 'actions-edit', label: 'עריכת תאים', icon: <FiEdit /> },
  { id: 'actions-selection', label: 'בחירה ופעולות', icon: <FiMousePointer /> },
  { id: 'actions-context', label: 'תפריט קליק ימני', icon: <FiClipboard /> },
  { id: 'actions-undo', label: 'ביטול וחזרה', icon: <FiRotateCcw /> },
  { id: 'actions-keyboard', label: 'קיצורי מקלדת', icon: <FiCommand /> },
  { id: 'summary', label: 'סיכום', icon: <FiCheckCircle /> },
  { id: 'quiz', label: 'בדיקת הבנה', icon: <FiHelpCircle /> },
];

const InventoryTableGuide = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-150px 0px -60% 0px',
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="guide-wrapper" dir="rtl">
      <div className="guide-container">
        {/* Sidebar */}
        <aside className={`guide-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <h3>תוכן עניינים</h3>
            <button className="close-menu-btn" onClick={() => setIsMobileMenuOpen(false)}>
              <FiX />
            </button>
          </div>
          <nav className="guide-nav">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
              >
                <span className="nav-icon">{section.icon}</span>
                <span className="nav-label">{section.label}</span>
                {activeSection === section.id && <FiArrowLeft className="active-arrow" />}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="help-card">
              <div className="help-icon"><FiArrowRight /></div>
              <h4>חזרה למדריך</h4>
              <p>למדריך המערכת המלא</p>
              <Link to="/guide" className="contact-btn">חזור למדריך הראשי</Link>
            </div>
          </div>
        </aside>

        {/* Mobile Toggle */}
        <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
          <FiMenu />
          <span>תוכן עניינים</span>
        </button>

        {/* Main Content */}
        <main className="guide-content">

          {/* Breadcrumb */}
          <div className="guide-breadcrumb">
            <Link to="/guide"><FiArrowRight /> מדריך למשתמש</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">טבלת ניהול המלאי</span>
          </div>

          {/* ========== OVERVIEW ========== */}
          <section id="overview" className="content-section">
            <div className="section-header">
              <h2 className="section-title">טבלת ניהול המלאי</h2>
              <p className="section-description">
                טבלת המלאי היא הכלי המרכזי לצפייה, עריכה וניהול של כל הפריטים במחסן. 
                ניתן לסנן, למיין, לערוך תאים בודדים בלחיצה כפולה, לבצע פעולות מרובות על מספר פריטים בו-זמנית,
                ולבטל כל פעולה בקלות עם Ctrl+Z. הכל במקום אחד, בלי לעזוב את המסך.
              </p>
            </div>

            <div className="cards-grid">
              <div className="feature-card">
                <h3 className="feature-card-header">
                  <div className="card-icon blue"><FiEdit /></div>
                  <span>עריכה מהירה</span>
                </h3>
                <p>לחיצה כפולה על כל תא ניתן-לעריכה פותחת שדה עריכה ישירות בטבלה. שמרו עם Enter או בטלו עם Escape.</p>
              </div>
              <div className="feature-card">
                <h3 className="feature-card-header">
                  <div className="card-icon purple"><FiRotateCcw /></div>
                  <span>ביטול וחזרה</span>
                </h3>
                <p>כל עריכה ומחיקה נשמרת בהיסטוריה. Ctrl+Z מבטל את הפעולה האחרונה, Ctrl+Y מחזיר אותה.</p>
              </div>
              <div className="feature-card">
                <h3 className="feature-card-header">
                  <div className="card-icon green"><FiLayers /></div>
                  <span>פעולות מרובות</span>
                </h3>
                <p>בחרו מספר פריטים ובצעו עריכה מרובה, מחיקה מרובה או שיוך לאוסף — הכל בלחיצה אחת.</p>
              </div>
            </div>
          </section>

          {/* ========== LIVE DEMO ========== */}
          <section id="live-demo" className="content-section">
            <div className="section-header">
              <h2 className="section-title">הטבלה האינטראקטיבית — מבט מקרוב</h2>
              <p className="section-description">
                לפניכם העתק חזותי של טבלת המלאי. לחצו על הנקודות הכחולות הפועמות כדי ללמוד מה כל אזור עושה.
              </p>
            </div>

            <div className="demo-table-note">
              <FiAlertCircle />
              <span>זוהי גרסת תצוגה בלבד — הנקודות הכחולות מסבירות את תפקיד כל אזור בטבלה האמיתית.</span>
            </div>

            <div className="demo-table-wrapper" style={{ position: 'relative' }}>
              {/* Hotspots — percentage-based for responsive positioning */}
              <HotspotMarker
                number={1}
                top="14px"
                left="96%"
                label="בחירת הכל (Checkbox)"
                description="לחיצה על התיבה בכותרת בוחרת את כל הפריטים בדף. שימושי לפני מחיקה מרובה או שיוך לאוסף."
              />
              <HotspotMarker
                number={2}
                top="14px"
                left="80%"
                label='מיון לפי עמודה'
                description='לחיצה על כותרת עמודה ממיינת את הטבלה בסדר עולה. לחיצה נוספת — סדר יורד. חץ קטן מציין את הכיוון.'
              />
              <HotspotMarker
                number={3}
                top="55px"
                left="71%"
                label="שורת סינון"
                description="הקלידו טקסט בשדה הסינון שבכל עמודה כדי לצמצם את התוצאות. הסינון מופעל אוטומטית תוך חצי שנייה."
              />
              <HotspotMarker
                number={4}
                top="105px"
                left="96%"
                label="בחירת פריט בודד"
                description="סמנו שורה אחת או יותר. Ctrl+Click מוסיף לבחירה, Shift+Click בוחר טווח שורות רצוף."
              />
              <HotspotMarker
                number={5}
                top="105px"
                left="39%"
                label="תא ניתן לעריכה"
                description="לחיצה כפולה פותחת שדה עריכה. הקלידו ערך חדש ולחצו Enter לשמירה או Escape לביטול."
              />
              <HotspotMarker
                number={6}
                top="145px"
                left="80%"
                label="תא לקריאה בלבד"
                description='שדות כמו מק"ט, סריאלי ומיקום אינם ניתנים לעריכה. לחיצה כפולה מעתיקה את הערך ללוח.'
              />
              <HotspotMarker
                number={7}
                top="235px"
                left="17%"
                label="שריון פרויקטים"
                description="תגיות צבעוניות מציגות לאילו פרויקטים הפריט משוריין. מוצגים עד 3, והשאר מסומנים כ-+עוד."
              />
              <HotspotMarker
                number={8}
                top="185px"
                left="9%"
                label="משוייך לצוותים"
                description="מספר שניתן ללחוץ עליו. פותח חלונית המציגה לאילו אוספים (צוותים) שוייך הפריט."
              />

              {/* Demo Table */}
              <table className="demo-table">
                <thead>
                  <tr>
                    <th className="th-checkbox th-frozen"><input type="checkbox" disabled /></th>
                    <th className="th-frozen">מק&quot;ט ▼</th>
                    <th className="th-frozen">סריאלי</th>
                    <th>תיאור</th>
                    <th>יצרן</th>
                    <th>מיקום</th>
                    <th>מלאי</th>
                    <th>אתר יעד</th>
                    <th>יעוד</th>
                    <th>שריון פרויקטים</th>
                    <th>צוותים</th>
                    <th>הערות</th>
                  </tr>
                  <tr className="filter-row">
                    <td></td>
                    <td><input type="text" placeholder="סנן..." disabled /></td>
                    <td><input type="text" placeholder="סנן..." disabled /></td>
                    <td><input type="text" placeholder="סנן..." disabled /></td>
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
                  {DEMO_ITEMS.map((item) => (
                    <tr key={item.id}>
                      <td className="td-checkbox td-frozen"><input type="checkbox" disabled /></td>
                      <td className="td-frozen"><span className="demo-cell-immutable">{item.catalog_number}</span></td>
                      <td className="td-frozen"><span className="demo-cell-immutable">{item.serial}</span></td>
                      <td><span className="demo-cell-editable">{item.description}</span></td>
                      <td><span className="demo-cell-immutable">{item.manufacturer}</span></td>
                      <td><span className="demo-cell-immutable">{item.location}</span></td>
                      <td><span className="demo-cell-editable">{item.current_stock}</span></td>
                      <td><span className="demo-cell-editable">{item.target_site}</span></td>
                      <td><span className="demo-cell-editable">{item.purpose}</span></td>
                      <td>
                        {item.allocations.length > 0 ? (
                          item.allocations.map((a, i) => <span key={i} className="demo-tag">{a}</span>)
                        ) : (
                          <span className="demo-cell-immutable">—</span>
                        )}
                      </td>
                      <td>
                        {item.collections > 0 ? (
                          <span className="demo-link-btn">{item.collections}</span>
                        ) : '—'}
                      </td>
                      <td><span className="demo-cell-editable">{item.notes || '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ========== ACTIONS: HEADER & FILTERING ========== */}
          <section id="actions-header" className="content-section">
            <div className="section-header">
              <h2 className="section-title">סינון, מיון וחיפוש</h2>
              <p className="section-description">
                הטבלה מציגה עשרות ואף מאות פריטים. הנה כיצד למצוא בדיוק מה שאתם מחפשים.
              </p>
            </div>

            <div className="action-cards-grid">
              <ActionMapCard
                icon={<FiCheckCircle />}
                elementName="בחירת הכל (Checkbox)"
                action="לחיצה על תיבת הסימון בכותרת בוחרת (או מבטלת את הבחירה של) כל הפריטים בדף הנוכחי. הפריטים שנבחרו מסומנים בצבע רקע כהה."
                useCase="כשאתם רוצים לבצע פעולה על כל הפריטים בדף — למשל מחיקה מרובה או שיוך לאוסף."
              />
              <ActionMapCard
                icon={<FiArrowUp />}
                elementName="מיון לפי עמודה"
                action='לחיצה על כותרת עמודה ממיינת בסדר עולה (A→Z, 1→9). לחיצה נוספת מחליפה לסדר יורד. חץ קטן מציג את כיוון המיון הנוכחי.'
                useCase='כשאתם רוצים לזהות את הפריטים עם מלאי הכי נמוך, או למיין לפי יצרן.'
              />
              <ActionMapCard
                icon={<FiFilter />}
                elementName="שורת סינון"
                action="שדה טקסט חופשי בראש כל עמודה. הקלידו ערך והטבלה תסונן תוך חצי שנייה אוטומטית (Debounce). ניתן לסנן מספר עמודות בו-זמנית."
                useCase='כשאתם מחפשים פריט ספציפי לפי מק"ט, יצרן, מיקום או כל שדה אחר.'
              />
            </div>
          </section>

          {/* ========== ACTIONS: CELL EDITING ========== */}
          <section id="actions-edit" className="content-section">
            <div className="section-header">
              <h2 className="section-title">עריכת תאים בטבלה</h2>
              <p className="section-description">
                עריכה ישירה בתוך הטבלה — בלי חלונות קופצים ובלי טפסים חיצוניים. פשוט לחצו פעמיים ותתחילו להקליד.
              </p>
            </div>

            <div className="action-cards-grid">
              <ActionMapCard
                icon={<FiEdit />}
                elementName="לחיצה כפולה על תא ניתן לעריכה"
                action="נפתח שדה עריכה בתוך התא. הקלידו את הערך החדש. לחצו Enter או את כפתור ה-✓ לשמירה, או Escape / ✗ לביטול. השינוי נשמר מיידית ונכנס להיסטוריית ביטול."
                useCase="כשאתם צריכים לעדכן ערך בודד — שם, כמות, הערה, יעוד וכו'."
              />
              <ActionMapCard
                icon={<FiCopy />}
                elementName='לחיצה כפולה על תא לקריאה בלבד'
                action='שדות כמו מק"ט, סריאלי, מיקום ויצרן אינם ניתנים לעריכה. לחיצה כפולה מעתיקה את תוכן התא ללוח (Clipboard). מופיעה הודעת "הועתק ללוח".'
                useCase='כשצריך להעתיק מק"ט או סריאלי כדי לחפש אותו במערכת אחרת.'
              />
              <ActionMapCard
                icon={<FiArrowDown />}
                elementName="אתר יעד (Dropdown)"
                action='בעת עריכת שדה "אתר יעד", נפתחת רשימה נפתחת (Select) עם אתרים מוגדרים מראש. בחרו אתר מהרשימה והוא יישמר.'
                useCase="כשאתם רוצים לשייך פריט לאתר פריסה ספציפי."
              />
              <ActionMapCard
                icon={<FiLayers />}
                elementName="משוייך לצוותים (קישור)"
                action='לחיצה על המספר בעמודה "משוייך לצוותים" פותחת חלונית שמציגה רשימה של כל האוספים והצוותים שהפריט שוייך אליהם.'
                useCase="כשאתם רוצים לדעת מי משתמש בפריט מסוים ובאילו פרויקטים."
              />
            </div>

            <div className="tip-box">
              <div className="tip-icon"><FiAlertCircle /></div>
              <div className="tip-content">
                <h4>💡 עריכה עם מקלדת</h4>
                <p>אפשר לנווט בין תאים עם חצי המקלדת, Tab למעבר לתא הבא, ו-Enter לכניסה למצב עריכה — בלי לגעת בעכבר.</p>
              </div>
            </div>
          </section>

          {/* ========== ACTIONS: SELECTION & BULK ========== */}
          <section id="actions-selection" className="content-section">
            <div className="section-header">
              <h2 className="section-title">בחירה ופעולות מרובות</h2>
              <p className="section-description">
                בחרו פריט אחד, מספר פריטים, או טווח שלם — ובצעו פעולות על כולם יחד.
              </p>
            </div>

            <div className="action-cards-grid">
              <ActionMapCard
                icon={<FiMousePointer />}
                elementName="Checkbox בשורה"
                action="לחיצה על תיבת הסימון בצד ימין של כל שורה בוחרת את הפריט. ניתן לסמן מספר פריטים."
                useCase="כשאתם רוצים לבחור פריטים ספציפיים לעריכה מרובה, מחיקה או שיוך."
              />
              <ActionMapCard
                icon={<FiCommand />}
                elementName="Ctrl + Click (בחירת נפרדים)"
                action="החזיקו Ctrl ולחצו על שורות שונות כדי להוסיף או להסיר פריטים מהבחירה, ללא לאבד את הקודמים."
                useCase="כשאתם צריכים לבחור פריטים שאינם רצופים — למשל פריט 2, 5 ו-8."
              />
              <ActionMapCard
                icon={<FiArrowDown />}
                elementName="Shift + Click (בחירת טווח)"
                action="לחצו על פריט ראשון, החזיקו Shift, ולחצו על פריט אחרון — כל הפריטים ביניהם ייבחרו אוטומטית."
                useCase="כשאתם צריכים לבחור טווח רצוף — למשל 20 פריטים רצופים."
              />
              <ActionMapCard
                icon={<FiEdit />}
                elementName="עריכה מרובה (Bulk Edit)"
                action='בחרו פריטים ← קליק ימני ← "עריכה". נפתח חלון שמאפשר לעדכן שדות (יעוד, הערות, אתר יעד) לכל הפריטים שנבחרו בבת-אחת.'
                useCase="כשאתם צריכים לעדכן הערה או אתר יעד ל-50 פריטים — במקום לערוך אחד-אחד."
              />
              <ActionMapCard
                icon={<FiTrash2 />}
                elementName="מחיקה מרובה (Bulk Delete)"
                action='בחרו פריטים ← קליק ימני ← "מחיקה". נפתח חלון אישור שמבקש סיבת מחיקה. לאחר אישור, כל הפריטים נמחקים. ניתן לבטל עם Ctrl+Z!'
                useCase="כשיש פריטים שהוצאו מהמלאי ויש להסירם מהמערכת."
              />
            </div>

            <div className="tip-box highlight">
              <div className="tip-icon"><FiAlertCircle /></div>
              <div className="tip-content">
                <h4>⚡ לא לפחד ממחיקה</h4>
                <p>כל מחיקה ניתנת לביטול באמצעות Ctrl+Z מיד לאחר הביצוע. ההודעה "המחיקה בוצעה בהצלחה (Ctrl+Z לביטול)" תזכיר לכם את זה.</p>
              </div>
            </div>
          </section>

          {/* ========== ACTIONS: CONTEXT MENU ========== */}
          <section id="actions-context" className="content-section">
            <div className="section-header">
              <h2 className="section-title">תפריט קליק ימני (Context Menu)</h2>
              <p className="section-description">
                לחיצה ימנית בכל מקום בטבלה פותחת תפריט פעולות מהיר. הנה מה שתמצאו בו:
              </p>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start', marginTop: '1.5rem' }}>
              {/* Visual Demo */}
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

              {/* Action Cards */}
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div className="action-cards-grid">
                  <ActionMapCard
                    icon={<FiCopy />}
                    elementName="העתק תאים"
                    action="מעתיק את כל התאים שנבחרו (Drag על תאים) ללוח, בפורמט Tab-separated — מוכן להדבקה באקסל."
                    useCase="כשצריך להעביר נתונים מהטבלה לגיליון אקסל או מסמך."
                  />
                  <ActionMapCard
                    icon={<FiEdit />}
                    elementName="ערוך נבחרים"
                    action="פותח חלון עריכה מרובה לכל הפריטים שסומנו. ניתן לעדכן יעוד, הערות ואתר יעד."
                    useCase="כשצריך לעדכן שדה משותף למספר פריטים."
                  />
                  <ActionMapCard
                    icon={<FiTrash2 />}
                    elementName="מחק נבחרים"
                    action="פותח חלון אישור מחיקה עם שדה סיבה. לאחר אישור — הפריטים נמחקים. ניתן לבטל עם Ctrl+Z."
                    useCase="להסרת פריטים שכבר לא במלאי."
                  />
                  <ActionMapCard
                    icon={<FiLayers />}
                    elementName="שייך למלאי שלי"
                    action='פותח תת-תפריט עם רשימת האוספים שלכם. בחרו אוסף — והפריטים המסומנים יתווספו אליו.'
                    useCase="כשאתם מכינים רשימת ציוד לפרויקט ורוצים להוסיף פריטים מהמלאי הראשי."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ========== ACTIONS: UNDO/REDO ========== */}
          <section id="actions-undo" className="content-section">
            <div className="section-header">
              <h2 className="section-title">ביטול וחזרה (Undo / Redo)</h2>
              <p className="section-description">
                כל פעולת עריכה ומחיקה נשמרת בהיסטוריה. ניתן לבטל וליחזר כמה שלבים אחורה.
              </p>
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
              <ActionMapCard
                icon={<FiRotateCcw />}
                elementName="ביטול (Undo — Ctrl+Z)"
                action="מחזיר את הפעולה האחרונה לקדמותה. עובד על עריכות בודדות וגם על מחיקות מרובות. הפריטים שנמחקו משוחזרים."
                useCase="טעיתם בערך שהקלדתם או מחקתם פריט בטעות."
              />
              <ActionMapCard
                icon={<FiRotateCw />}
                elementName="חזרה (Redo — Ctrl+Y)"
                action="מבצע מחדש פעולה שבוטלה. כלומר — אם ביטלתם עריכה ורוצים להחזיר אותה, Ctrl+Y יעשה את זה."
                useCase="ביטלתם בטעות? Ctrl+Y מחזיר את מה שביטלתם."
              />
            </div>

            <div className="tip-box">
              <div className="tip-icon"><FiAlertCircle /></div>
              <div className="tip-content">
                <h4>💡 הסרגל מופיע רק כשיש מה לבטל</h4>
                <p>סרגל הביטול/חזרה מוצג רק כאשר יש פעולות בהיסטוריה. אם אין מה לבטל — הוא מוסתר.</p>
              </div>
            </div>
          </section>

          {/* ========== KEYBOARD SHORTCUTS ========== */}
          <section id="actions-keyboard" className="content-section">
            <div className="section-header">
              <h2 className="section-title">קיצורי מקלדת</h2>
              <p className="section-description">
                עבדו מהר יותר עם קיצורי המקלדת הבאים — בלי לגעת בעכבר.
              </p>
            </div>

            <div className="shortcuts-grid">
              <div className="shortcut-item">
                <span className="key-combo">Ctrl + Z</span>
                <span className="key-desc">ביטול פעולה אחרונה</span>
              </div>
              <div className="shortcut-item">
                <span className="key-combo">Ctrl + Y</span>
                <span className="key-desc">חזרה על פעולה שבוטלה</span>
              </div>
              <div className="shortcut-item">
                <span className="key-combo">Ctrl + C</span>
                <span className="key-desc">העתקת תאים נבחרים</span>
              </div>
              <div className="shortcut-item">
                <span className="key-combo">Enter</span>
                <span className="key-desc">שמירת עריכה ומעבר למטה</span>
              </div>
              <div className="shortcut-item">
                <span className="key-combo">Escape</span>
                <span className="key-desc">ביטול עריכה נוכחית</span>
              </div>
              <div className="shortcut-item">
                <span className="key-combo">Tab</span>
                <span className="key-desc">מעבר לתא הבא</span>
              </div>
              <div className="shortcut-item">
                <span className="key-combo">F2</span>
                <span className="key-desc">כניסה למצב עריכה</span>
              </div>
              <div className="shortcut-item">
                <span className="key-combo">חצים ↑↓←→</span>
                <span className="key-desc">ניווט בין תאים</span>
              </div>
              <div className="shortcut-item">
                <span className="key-combo">לחיצה כפולה</span>
                <span className="key-desc">עריכה / העתקה (לפי סוג התא)</span>
              </div>
            </div>
          </section>

          {/* ========== SUMMARY ========== */}
          <section id="summary" className="content-section">
            <div className="section-header">
              <h2 className="section-title">סיכום מנהלים</h2>
              <p className="section-description">
                תהליך העבודה המרכזי עם טבלת המלאי — ב-6 משפטים.
              </p>
            </div>

            <div className="summary-box">
              <h3><FiZap /> תהליך עבודה מרכזי</h3>
              <ol className="summary-list">
                <li><strong>צפו בטבלה</strong> — כל הפריטים מוצגים עם מיון ברירת מחדל לפי תאריך עדכון.</li>
                <li><strong>סננו ומיינו</strong> — השתמשו בשדות הסינון ובכותרות העמודות למצוא מה שמחפשים.</li>
                <li><strong>ערכו ישירות</strong> — לחיצה כפולה על תא ניתן-לעריכה פותחת שדה מהיר. Enter שומר.</li>
                <li><strong>בחרו ופעלו</strong> — סמנו פריטים ובצעו עריכה/מחיקה מרובה דרך קליק ימני.</li>
                <li><strong>שייכו לפרויקט</strong> — דרך "שייך למלאי שלי" הוסיפו פריטים לאוספים האישיים שלכם.</li>
                <li><strong>בטלו אם צריך</strong> — Ctrl+Z מבטל כל פעולה, כולל מחיקות. אין מה לפחד לנסות.</li>
              </ol>
            </div>
          </section>

          {/* ========== QUIZ ========== */}
          <section id="quiz" className="content-section">
            <div className="section-header">
              <h2 className="section-title">בדיקת הבנה</h2>
              <p className="section-description">
                ענו על 3 שאלות קצרות כדי לוודא שהבנתם את העקרונות. התשובה תתגלה רק לאחר הלחיצה.
              </p>
            </div>

            <div className="quiz-section-grid">
              <QuizCard
                question='מה קורה כשלוחצים פעמיים על תא שאינו ניתן לעריכה (כמו מק"ט)?'
                options={[
                  'הערך מועתק ללוח (Clipboard)',
                  'נפתח שדה עריכה',
                  'לא קורה כלום'
                ]}
                correctIndex={0}
                explanation='שדות כמו מק"ט, סריאלי ומיקום הם לקריאה בלבד. לחיצה כפולה מעתיקה את הערך ללוח ומציגה הודעת "הועתק ללוח".'
              />

              <QuizCard
                question="איך מבטלים פעולת מחיקה?"
                options={[
                  'רענון הדף',
                  'לחיצה על Ctrl+Z',
                  'לא ניתן לבטל מחיקה'
                ]}
                correctIndex={1}
                explanation='כל מחיקה נשמרת בהיסטוריה. לחיצה על Ctrl+Z מיד לאחר המחיקה משחזרת את הפריטים. גם הודעת ההצלחה מזכירה: "Ctrl+Z לביטול".'
              />

              <QuizCard
                question="נכון או לא נכון: ניתן לבחור טווח שורות רצוף באמצעות Shift+Click."
                options={[
                  'נכון — Shift+Click בוחר מהשורה האחרונה שנבחרה עד השורה שנלחצה',
                  'לא נכון — צריך לסמן כל שורה בנפרד'
                ]}
                correctIndex={0}
                explanation="Shift+Click בוחר טווח רצוף של שורות. לחצו על שורה ראשונה, החזיקו Shift, ולחצו על השורה האחרונה — כל מה שביניהם ייבחר."
              />
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default InventoryTableGuide;
