import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiArrowLeft,
  FiBox,
  FiEdit,
  FiTrash2,
  FiX,
  FiPlus,
  FiMenu,
  FiCheckCircle,
  FiAlertCircle,
  FiHelpCircle,
  FiZap,
  FiCommand,
  FiGrid,
  FiTruck,
  FiClock,
  FiUpload,
  FiFileText,
  FiDollarSign,
  FiPackage,
  FiArrowDown,
  FiBarChart2,
  FiPaperclip,
  FiShield
} from 'react-icons/fi';
import HotspotMarker from '../../components/guide/HotspotMarker/HotspotMarker';
import QuizCard from '../../components/guide/QuizCard/QuizCard';
import ActionMapCard from '../../components/guide/ActionMapCard/ActionMapCard';
import './UserGuidePage.css';
import './ProcurementGuide.css';

const sections = [
  { id: 'overview', label: 'סקירה כללית', icon: <FiBox /> },
  { id: 'live-demo', label: 'כרטיס הזמנה — מבט מקרוב', icon: <FiGrid /> },
  { id: 'status-workflow', label: 'מסלול סטטוסים', icon: <FiTruck /> },
  { id: 'order-creation', label: 'יצירת הזמנה', icon: <FiPlus /> },
  { id: 'bom-scanner', label: 'סורק BOM', icon: <FiUpload /> },
  { id: 'order-management', label: 'ניהול הזמנות', icon: <FiEdit /> },
  { id: 'price-comparison', label: 'השוואת מחירים', icon: <FiDollarSign /> },
  { id: 'summary', label: 'סיכום', icon: <FiCheckCircle /> },
  { id: 'quiz', label: 'בדיקת הבנה', icon: <FiHelpCircle /> },
];

const ProcurementGuide = () => {
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
            <span className="breadcrumb-current">רכש והצטיידות</span>
          </div>

          {/* ========== OVERVIEW ========== */}
          <section id="overview" className="content-section">
            <div className="section-header">
              <h2 className="section-title">רכש והצטיידות</h2>
              <p className="section-description">
                מודול הרכש מנהל את כל מחזור חיי ההזמנה — מיצירה, דרך סריקת BOM אוטומטית וסיווג AI,
                ועד קליטה במחסן. כל הזמנה עוברת מסלול סטטוסים ברור, עם קבצים מצורפים, היסטוריה מלאה,
                ומנוע השוואת מחירים לניתוח הוצאות לאורך זמן.
              </p>
            </div>

            <div className="cards-grid">
              <div className="feature-card">
                <h3 className="feature-card-header">
                  <div className="card-icon blue"><FiTruck /></div>
                  <span>מסלול סטטוסים</span>
                </h3>
                <p>כל הזמנה עוברת 5 שלבים ברורים — ממתינה למסמכים, מחכה ליציאה, יצאה לדרך, הגיעה. ניתן לראות בדיוק איפה כל הזמנה.</p>
              </div>
              <div className="feature-card">
                <h3 className="feature-card-header">
                  <div className="card-icon purple"><FiUpload /></div>
                  <span>סורק BOM + AI</span>
                </h3>
                <p>גררו קובץ Excel של הצעת מחיר — המערכת מזהה אוטומטית את הפורמט (Dell, HPE, NetApp, Cisco), מסווגת רכיבים עם AI ויוצרת הזמנות.</p>
              </div>
              <div className="feature-card">
                <h3 className="feature-card-header">
                  <div className="card-icon green"><FiDollarSign /></div>
                  <span>השוואת מחירים</span>
                </h3>
                <p>עקבו אחר מחירי רכיבים לאורך זמן, השוו בין דורות מוצר, נתחו הוצאות לפי יצרן — הכל בגרפים ויזואליים.</p>
              </div>
            </div>

            <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', color: 'var(--text-primary)' }}>יצרנים נתמכים</h3>
            <div className="demo-vendor-colors">
              <div className="demo-vendor-chip"><div className="demo-vendor-dot netapp" /> NetApp</div>
              <div className="demo-vendor-chip"><div className="demo-vendor-dot dell" /> Dell</div>
              <div className="demo-vendor-chip"><div className="demo-vendor-dot hpe" /> HPE</div>
              <div className="demo-vendor-chip"><div className="demo-vendor-dot cisco" /> Cisco</div>
            </div>
          </section>

          {/* ========== LIVE DEMO ========== */}
          <section id="live-demo" className="content-section">
            <div className="section-header">
              <h2 className="section-title">כרטיס הזמנה — מבט מקרוב</h2>
              <p className="section-description">
                כל הזמנה מוצגת ככרטיס עם 3 שורות: כותרת (יצרן + תאריך), פריטים (תגי רכיבים), ופייפליין סטטוסים.
              </p>
            </div>

            <div className="demo-table-note">
              <FiAlertCircle />
              <span>זוהי גרסת תצוגה בלבד — הנקודות הכחולות מסבירות את תפקיד כל אלמנט בכרטיס האמיתי.</span>
            </div>

            <div className="demo-order-card" style={{ position: 'relative' }}>
              <HotspotMarker
                number={1}
                top="12px"
                left="92%"
                label="זיהוי צבעוני של יצרן"
                description="נקודה צבעונית ושם היצרן (NetApp כחול, Dell תכלת, HPE ירוק, Cisco תכלת). מזהה במבט מי הספק."
              />
              <HotspotMarker
                number={2}
                top="12px"
                left="12%"
                label="תאריך יצירה"
                description="התאריך שבו ההזמנה נוצרה במערכת. מוצג בפורמט יום/חודש/שנה."
              />
              <HotspotMarker
                number={3}
                top="55px"
                left="55%"
                label="רשימת פריטים (תגיות)"
                description='כל רכיב בהזמנה מוצג כתגית עם מק"ט וכמות. מוצגים עד 4 תגיות, השאר מסומנים כ"+עוד".'
              />
              <HotspotMarker
                number={4}
                top="108px"
                left="55%"
                label="פייפליין סטטוסים"
                description="עיגולי שלבים: ירוק = הושלם, כחול מואר = שלב נוכחי, אפור מקווקו = עתידי. לחיצה על שלב מתקדם את ההזמנה."
              />
              <HotspotMarker
                number={5}
                top="108px"
                left="12%"
                label="כפתורי פעולה"
                description="2×2 כפתורים: עריכה (עיפרון), מחיקה (פח), היסטוריה (שעון), ושלח לדרך/סמן כהגיע (לפי הסטטוס הנוכחי)."
              />

              <div className="demo-order-header">
                <div className="demo-order-vendor">
                  <div className="demo-vendor-dot netapp" />
                  <span className="demo-vendor-name">NetApp</span>
                </div>
                <span className="demo-order-date">15/01/2025</span>
              </div>
              <div className="demo-order-items">
                <span className="demo-order-item-tag">AFF-A90 <span className="demo-order-item-qty">×2</span></span>
                <span className="demo-order-item-tag">DS460C <span className="demo-order-item-qty">×4</span></span>
                <span className="demo-order-item-tag">X6589-R6 <span className="demo-order-item-qty">×24</span></span>
                <span className="demo-order-item-tag" style={{ color: 'var(--text-muted)' }}>+3 נוספים</span>
              </div>
              <div className="demo-pipeline-row">
                <div className="demo-pipeline">
                  <div className="demo-pipeline-step done">✓</div>
                  <div className="demo-pipeline-line done" />
                  <div className="demo-pipeline-step done">✓</div>
                  <div className="demo-pipeline-line done" />
                  <div className="demo-pipeline-step current">3</div>
                  <div className="demo-pipeline-line" />
                  <div className="demo-pipeline-step pending">4</div>
                  <div className="demo-pipeline-line" />
                  <div className="demo-pipeline-step pending">5</div>
                </div>
                <div className="demo-order-actions">
                  <div className="demo-action-btn edit"><FiEdit /></div>
                  <div className="demo-action-btn delete"><FiTrash2 /></div>
                  <div className="demo-action-btn history"><FiClock /></div>
                  <div className="demo-action-btn ship"><FiTruck /></div>
                </div>
              </div>
            </div>
          </section>

          {/* ========== STATUS WORKFLOW ========== */}
          <section id="status-workflow" className="content-section">
            <div className="section-header">
              <h2 className="section-title">מסלול הסטטוסים</h2>
              <p className="section-description">
                כל הזמנה עוברת 5 שלבים מובנים. הסטטוס מתעדכן אוטומטית כשמסמכים מסומנים כהתקבלו, או ידנית כשלוחצים על כפתורי הפעולה.
              </p>
            </div>

            <div className="status-legend">
              <div className="status-legend-item">
                <span className="status-badge red">🔴 מחכה ל-BOM ו-EMF</span>
                <span className="status-desc">סטטוס התחלתי — ממתין לשני המסמכים. ההזמנה עדיין לא מוכנה ליציאה.</span>
              </div>
              <div className="status-legend-item">
                <span className="status-badge yellow">🟡 מחכה ל-EMF / BOM</span>
                <span className="status-desc">אחד המסמכים התקבל, ממתין לשני. עדכון אוטומטי כשמסמנים קובץ.</span>
              </div>
              <div className="status-legend-item">
                <span className="status-badge blue">🔵 מחכה שרכש ייצא</span>
                <span className="status-desc">שני המסמכים התקבלו. כפתור המשאית ("שלח לדרך") הופך פעיל.</span>
              </div>
              <div className="status-legend-item">
                <span className="status-badge green">🚛 רכש יצא</span>
                <span className="status-desc">ההזמנה נשלחה לספק. כפתור הווי ("סמן כהגיע") מופיע.</span>
              </div>
              <div className="status-legend-item">
                <span className="status-badge done">✅ רכש הגיע</span>
                <span className="status-desc">ההזמנה נקלטה במחסן. עוברת לטאב "הסתיים" ונסגרת.</span>
              </div>
            </div>

            <div className="tip-box">
              <div className="tip-icon"><FiAlertCircle /></div>
              <div className="tip-content">
                <h4>💡 הסטטוס מתעדכן אוטומטית</h4>
                <p>כשמסמנים BOM ו-EMF כהתקבלו, הסטטוס עולה אוטומטית. לא צריך לשנות סטטוס ידנית בשלבים הראשונים.</p>
              </div>
            </div>
          </section>

          {/* ========== ORDER CREATION ========== */}
          <section id="order-creation" className="content-section">
            <div className="section-header">
              <h2 className="section-title">יצירת הזמנה חדשה</h2>
              <p className="section-description">
                שתי דרכים ליצור הזמנה — באמצעות סורק BOM (אוטומטי) או ידנית. בשתי הדרכים נפתח אותו חלון עריכה.
              </p>
            </div>

            <div className="action-cards-grid">
              <ActionMapCard
                icon={<FiUpload />}
                elementName='יצירה מ-BOM (אוטומטי)'
                action='לחצו על טאב "סורק BOM", גררו קובץ Excel של הצעת מחיר, בחרו יצרן. המערכת מזהה את הרכיבים ויוצרת הזמנה מוכנה עם כל הפריטים.'
                useCase="הדרך המהירה ביותר — כשיש לכם הצעת מחיר מיצרן בפורמט Excel."
              />
              <ActionMapCard
                icon={<FiPlus />}
                elementName='יצירה ידנית'
                action='לחצו "+ הזמנה חדשה", בחרו BOM או ידנית. בחרו יצרן, הוסיפו פריטים בשדות חיפוש autocomplete. מלאו כמויות ולחצו "שמור".'
                useCase="כשאין קובץ או כשצריך ליצור הזמנה קטנה עם מספר פריטים ידוע."
              />
              <ActionMapCard
                icon={<FiPackage />}
                elementName='בחירת סוג: BOM / ידני'
                action='חלון בחירת סוג נפתח בלחיצה על "+ הזמנה חדשה". BOM = יבוא מקובץ עם סיווג AI. ידני = שדות חיפוש פריטים עם autocomplete.'
                useCase="BOM לקבצי הצעות מחיר, ידני להזמנות קטנות ומהירות."
              />
            </div>
          </section>

          {/* ========== BOM SCANNER ========== */}
          <section id="bom-scanner" className="content-section">
            <div className="section-header">
              <h2 className="section-title">סורק BOM — ייבוא אוטומטי</h2>
              <p className="section-description">
                טאב "סורק BOM" מאפשר לייבא הצעות מחיר בגרירה ושחרור. המערכת מזהה את פורמט היצרן, מסווגת עם AI, ומציגה תצוגה מקדימה לאישור.
              </p>
            </div>

            <h3 style={{ marginBottom: '0.8rem', color: 'var(--text-primary)' }}>תהליך הסריקה</h3>
            <div className="bom-flow">
              <div className="bom-flow-step"><FiUpload /> גרירת קובץ Excel</div>
              <span className="bom-flow-arrow">←</span>
              <div className="bom-flow-step">בחירת יצרן</div>
              <span className="bom-flow-arrow">←</span>
              <div className="bom-flow-step highlight"><FiZap /> סיווג AI אוטומטי</div>
              <span className="bom-flow-arrow">←</span>
              <div className="bom-flow-step">תצוגה מקדימה</div>
              <span className="bom-flow-arrow">←</span>
              <div className="bom-flow-step"><FiCheckCircle /> אישור ושמירה</div>
            </div>

            <div className="action-cards-grid">
              <ActionMapCard
                icon={<FiUpload />}
                elementName="אזור גרירה (Drop Zone)"
                action='גררו קובץ Excel/CSV לאזור המסומן, או לחצו "בחר קובץ". המערכת מזהה אוטומטית את מבנה העמודות לפי פורמט היצרן (Dell, HPE, NetApp, Cisco).'
                useCase="כשקיבלתם הצעת מחיר מספק ורוצים ליצור הזמנה מהירה."
              />
              <ActionMapCard
                icon={<FiZap />}
                elementName="סיווג AI (אוטומטי)"
                action='לאחר הסריקה, המערכת מסווגת כל רכיב ל-16 קטגוריות (שרת, דיסק, כבל, ג׳יביק...). כל רכיב מקבל תג ביטחון: ירוק (גבוה), צהוב (בינוני), אדום (נמוך).'
                useCase="לזהות איזה סוג ציוד נכלל בהצעת המחיר — ללא קריאה ידנית של מאות שורות."
              />
              <ActionMapCard
                icon={<FiAlertCircle />}
                elementName='רכיבים שלא זוהו (Unknown Parts)'
                action='רכיבים שלא נמצאו בקטלוג מוצגים בנפרד עם סימן אזהרה. ניתן לסווג אותם ידנית, לערוך את התיאור, או לדלג עליהם לפני שמירה.'
                useCase="כשקובץ ה-BOM מכיל פריטים חדשים שהמערכת לא מכירה — בדקו ותקנו לפני אישור."
              />
              <ActionMapCard
                icon={<FiEdit />}
                elementName="עריכת תוצאות הסריקה"
                action='לחצו על אייקון ✏️ בכרטיס מערכת, ואז ישירות על תיאור הרכיב לעריכה. בחרו קטגוריה מרשימה נפתחת. השינויים נשמרים בקטלוג ומשפרים סריקות עתידיות.'
                useCase="כשה-AI סיווג רכיב בצורה לא מדויקת — תקנו ידנית ושפרו את המודל."
              />
            </div>

            <div className="tip-box highlight">
              <div className="tip-icon"><FiAlertCircle /></div>
              <div className="tip-content">
                <h4>⚠ אמתו את תוצאות ה-AI לפני שמירה</h4>
                <p>המודל עובד היטב על רכיבים נפוצים, אך שימו לב לתגי ביטחון אדומים — אלו הפריטים הכי נוטים לסיווג שגוי. תקנו ידנית לפני אישור.</p>
              </div>
            </div>
          </section>

          {/* ========== ORDER MANAGEMENT ========== */}
          <section id="order-management" className="content-section">
            <div className="section-header">
              <h2 className="section-title">ניהול הזמנות — פעולות</h2>
              <p className="section-description">
                כרטיסי ההזמנות בטאבים "בתהליך" ו"הסתיים" תומכים בפעולות הבאות:
              </p>
            </div>

            <div className="action-cards-grid">
              <ActionMapCard
                icon={<FiEdit />}
                elementName='עריכה (אייקון עיפרון)'
                action='פותח חלון עריכת הזמנה — שינוי פריטים, כמויות, הערות. זמין רק עד סטטוס "מחכה שרכש ייצא". לאחר שיצאה לדרך — העריכה נעולה.'
                useCase="כשהתגלתה טעות בכמות או שצריך להוסיף פריט להזמנה פתוחה."
              />
              <ActionMapCard
                icon={<FiTrash2 />}
                elementName='מחיקה (אייקון פח)'
                action='פותח חלון אישור מחיקה. ההזמנה נמחקת לצמיתות. זמינה רק עד סטטוס "מחכה שרכש ייצא".'
                useCase="כשהזמנה נוצרה בטעות או שהיא כבר לא נדרשת."
              />
              <ActionMapCard
                icon={<FiClock />}
                elementName='היסטוריה (אייקון שעון)'
                action='פותח חלון שמציג את כל השינויים שנעשו בהזמנה — מי שינה, מה שינה, ומתי. כולל שינויי סטטוס, עריכות ומחיקות פריטים.'
                useCase="כשצריך לעקוב מי שינה פריט או מתי ההזמנה עברה סטטוס."
              />
              <ActionMapCard
                icon={<FiTruck />}
                elementName='שלח לדרך (אייקון משאית)'
                action='מעביר את ההזמנה לסטטוס "רכש יצא". הכפתור מופיע רק כשהסטטוס הוא "מחכה שרכש ייצא" (שני המסמכים התקבלו).'
                useCase="כשההזמנה נשלחה בפועל לספק."
              />
              <ActionMapCard
                icon={<FiCheckCircle />}
                elementName='סמן כהגיע (אייקון ✓)'
                action='מעביר את ההזמנה לסטטוס "רכש הגיע". ההזמנה עוברת לטאב "הסתיים" ונסגרת. הכפתור מופיע רק כשהסטטוס הוא "רכש יצא".'
                useCase="כשהציוד נקלט פיזית במחסן."
              />
              <ActionMapCard
                icon={<FiPaperclip />}
                elementName='קבצים (אייקון מהדק)'
                action='לחיצה פותחת מנהל קבצים — העלאת BOM, EMF, חשבוניות ותמונות. גרירה ושחרור או בחירת קובץ. סימון קובץ BOM/EMF כהתקבל מעדכן סטטוס אוטומטית.'
                useCase="לצרף מסמכים מקוריים להזמנה — להפניה עתידית ולמעקב."
              />
            </div>

            <div className="tip-box">
              <div className="tip-icon"><FiAlertCircle /></div>
              <div className="tip-content">
                <h4>💡 עריכה ומחיקה ננעלות אחרי "רכש יצא"</h4>
                <p>ברגע שההזמנה עברה לסטטוס "רכש יצא", לא ניתן עוד לערוך או למחוק אותה. ודאו שהפרטים נכונים לפני שליחה.</p>
              </div>
            </div>
          </section>

          {/* ========== PRICE COMPARISON ========== */}
          <section id="price-comparison" className="content-section">
            <div className="section-header">
              <h2 className="section-title">השוואת מחירים (Price Intel)</h2>
              <p className="section-description">
                לשונית "השוואת מחירים" מאפשרת ניתוח ומעקב אחר מחירי רכיבים לאורך זמן — כולל גרפים, שרשראות מוצר והוצאות לפי יצרן.
              </p>
            </div>

            <div className="action-cards-grid">
              <ActionMapCard
                icon={<FiBarChart2 />}
                elementName='גרף השוואת מחירים'
                action='הוסיפו מק"טים לגרף באמצעות שדה חיפוש Autocomplete. כל מוצר מוצג כקו בגרף עם מחיר לאורך זמן. ניתן לבחור רזולוציה: יומי, חודשי או שנתי.'
                useCase="לעקוב אחר מגמות מחיר ולבחור את הזמן הנכון לרכוש."
              />
              <ActionMapCard
                icon={<FiArrowDown />}
                elementName='סינון לפי טווח תאריכים'
                action='בחרו תאריך התחלה וסיום כדי לצמצם את הנתונים המוצגים בגרף. לחצו "זמן נוכחי" לאיפוס.'
                useCase="כשצריך לנתח את המחירים ברבעון האחרון בלבד."
              />
              <ActionMapCard
                icon={<FiPackage />}
                elementName='השוואה מתקדמת — שרשרת מוצר'
                action='לחצו "השוואה מתקדמת" כדי לבנות שרשרת מוצר — סדרת דורות (למשל AFF-A800 ← AFF-A90). כל דור יכול לכלול רכיבים משניים. כל השרשרת מוצגת כקו רציף אחד בגרף.'
                useCase="להשוות מחירים בין מוצרים שמחליפים אחד את השני לאורך השנים."
              />
              <ActionMapCard
                icon={<FiDollarSign />}
                elementName='גרף הוצאות לפי יצרן'
                action='גרף עמודות בתחתית הדף מציג סכומי רכש מחולקים לפי יצרן (NetApp, Dell, HPE, Cisco) ולפי הרזולוציה הנבחרת.'
                useCase="לזיהוי לאיזה יצרן הולכות רוב ההוצאות ולתכנון תקציב."
              />
              <ActionMapCard
                icon={<FiZap />}
                elementName='כפתור "בנה היסטוריה"'
                action='סורק את כל הזמנות העבר וממלא את מסד נתוני המחירים. נדרש פעם אחת בלבד. לאחר מכן, כל הזמנה חדשה מעדכנת אוטומטית.'
                useCase="בפעם הראשונה שמשתמשים בהשוואת מחירים — כדי לייבא נתונים היסטוריים."
              />
            </div>
          </section>

          {/* ========== SUMMARY ========== */}
          <section id="summary" className="content-section">
            <div className="section-header">
              <h2 className="section-title">סיכום מנהלים</h2>
              <p className="section-description">
                תהליך הרכש מקצה לקצה — ב-6 משפטים.
              </p>
            </div>

            <div className="summary-box">
              <h3><FiZap /> תהליך עבודה מרכזי</h3>
              <ol className="summary-list">
                <li><strong>צרו הזמנה</strong> — סרקו BOM מקובץ Excel או צרו הזמנה ידנית עם פריטים אחד-אחד.</li>
                <li><strong>צרפו מסמכים</strong> — העלו BOM ו-EMF דרך מנהל הקבצים. עם קבלתם, הסטטוס מתעדכן אוטומטית.</li>
                <li><strong>שלחו לדרך</strong> — כששני המסמכים התקבלו, לחצו על כפתור המשאית לסמן שההזמנה יצאה לספק.</li>
                <li><strong>סמנו כהגיע</strong> — כשהציוד נקלט פיזית, לחצו ✓ להעביר ל"הסתיים".</li>
                <li><strong>עקבו אחר מחירים</strong> — בלשונית "השוואת מחירים" נתחו מגמות ובנו שרשראות מוצר.</li>
                <li><strong>ודאו סיווג AI</strong> — בדקו תגי ביטחון אדומים, תקנו ידנית ושפרו את המודל לסריקות הבאות.</li>
              </ol>
            </div>
          </section>

          {/* ========== QUIZ ========== */}
          <section id="quiz" className="content-section">
            <div className="section-header">
              <h2 className="section-title">בדיקת הבנה</h2>
              <p className="section-description">
                ענו על 3 שאלות כדי לוודא שהבנתם את תהליך הרכש.
              </p>
            </div>

            <div className="quiz-section-grid">
              <QuizCard
                question='מתי כפתור "שלח לדרך" (משאית) הופך פעיל?'
                options={[
                  'מיד אחרי יצירת ההזמנה',
                  'כששני המסמכים (BOM + EMF) סומנו כהתקבלו',
                  'רק מנהל מערכת יכול להפעיל אותו'
                ]}
                correctIndex={1}
                explanation='כפתור המשאית מופיע רק כשהסטטוס הוא "מחכה שרכש ייצא" — כלומר שני המסמכים (BOM ו-EMF) כבר סומנו כהתקבלו. רק אז ניתן לשלוח את ההזמנה.'
              />

              <QuizCard
                question='מה קורה כשתג ביטחון AI הוא אדום?'
                options={[
                  'הרכיב נמחק אוטומטית',
                  'הסיווג כנראה שגוי — מומלץ לבדוק ולתקן ידנית',
                  'הרכיב לא ייכלל בהזמנה'
                ]}
                correctIndex={1}
                explanation='תג ביטחון אדום = ביטחון נמוך. המשמעות: הסיווג האוטומטי עלול להיות שגוי. מומלץ ללחוץ על כפתור העריכה, לבדוק את הקטגוריה והתיאור, ולתקן אם צריך.'
              />

              <QuizCard
                question="נכון או לא נכון: ניתן לערוך הזמנה שכבר יצאה לדרך."
                options={[
                  'נכון — אפשר לערוך בכל שלב',
                  'לא נכון — עריכה ומחיקה ננעלות לאחר סטטוס "רכש יצא"'
                ]}
                correctIndex={1}
                explanation='ברגע שההזמנה עברה לסטטוס "רכש יצא", כפתורי העריכה והמחיקה ננעלים. ודאו שהפרטים נכונים לפני שליחה.'
              />
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default ProcurementGuide;
