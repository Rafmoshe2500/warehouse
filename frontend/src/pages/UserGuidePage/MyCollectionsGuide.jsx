import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiArrowLeft,
  FiBox,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiPlus,
  FiX,
  FiFilter,
  FiLayers,
  FiMenu,
  FiCheckCircle,
  FiAlertCircle,
  FiHelpCircle,
  FiZap,
  FiMousePointer,
  FiCommand,
  FiGrid,
  FiSettings,
  FiUsers,
  FiShield,
  FiDownload,
  FiSearch,
  FiEye
} from 'react-icons/fi';
import HotspotMarker from '../../components/guide/HotspotMarker/HotspotMarker';
import QuizCard from '../../components/guide/QuizCard/QuizCard';
import ActionMapCard from '../../components/guide/ActionMapCard/ActionMapCard';
import './UserGuidePage.css';
import './MyCollectionsGuide.css';

const sections = [
  { id: 'overview', label: 'סקירה כללית', icon: <FiBox /> },
  { id: 'live-demo', label: 'הדשבורד — מבט מקרוב', icon: <FiGrid /> },
  { id: 'actions-dashboard', label: 'פעולות בדשבורד', icon: <FiPlus /> },
  { id: 'actions-items', label: 'טאב פריטים', icon: <FiLayers /> },
  { id: 'actions-settings', label: 'טאב הגדרות', icon: <FiSettings /> },
  { id: 'permissions', label: 'הרשאות ושיתוף', icon: <FiShield /> },
  { id: 'actions-keyboard', label: 'קיצורי מקלדת', icon: <FiCommand /> },
  { id: 'summary', label: 'סיכום', icon: <FiCheckCircle /> },
  { id: 'quiz', label: 'בדיקת הבנה', icon: <FiHelpCircle /> },
];

const MyCollectionsGuide = () => {
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
            <span className="breadcrumb-current">המלאי שלי (Collections)</span>
          </div>

          {/* ========== OVERVIEW ========== */}
          <section id="overview" className="content-section">
            <div className="section-header">
              <h2 className="section-title">המלאי שלי — Collections</h2>
              <p className="section-description">
                "המלאי שלי" הוא האזור האישי שלכם ליצירת אוספים (פרויקטים / צוותים). בכל אוסף ניתן
                לשייך פריטים מהמלאי הראשי, להוסיף שדות מותאמים אישית, לנהל הרשאות גישה, ולייצא BOM מוכן לאקסל.
                הפריטים באוסף הם <strong>קישורים חיים</strong> למלאי — כלומר עדכון במלאי הראשי ישתקף מיידית בכל האוספים.
              </p>
            </div>

            <div className="cards-grid">
              <div className="feature-card">
                <h3 className="feature-card-header">
                  <div className="card-icon blue"><FiLayers /></div>
                  <span>קישורים חיים</span>
                </h3>
                <p>הפריטים באוסף משקפים את מצב המלאי בזמן אמת. מחקתם פריט מהאוסף? הוא נשאר במחסן. עדכון במחסן? אתם רואים מיד.</p>
              </div>
              <div className="feature-card">
                <h3 className="feature-card-header">
                  <div className="card-icon purple"><FiSettings /></div>
                  <span>שדות מותאמים</span>
                </h3>
                <p>הוסיפו שדות מותאמים אישית לאוסף — מספרי חשבוניות, הערות פרויקט, סטטוסים ועוד — בלי לשנות את המבנה הכללי.</p>
              </div>
              <div className="feature-card">
                <h3 className="feature-card-header">
                  <div className="card-icon green"><FiShield /></div>
                  <span>הרשאות גמישות</span>
                </h3>
                <p>שתפו אוסף עם משתמשים וקבוצות. בעלים רואה ומנהל הכל, עורך יכול לערוך פריטים, וצופה יכול רק לקרוא.</p>
              </div>
            </div>
          </section>

          {/* ========== LIVE DEMO ========== */}
          <section id="live-demo" className="content-section">
            <div className="section-header">
              <h2 className="section-title">דשבורד האוספים — מבט מקרוב</h2>
              <p className="section-description">
                לפניכם העתק חזותי של דף "המלאי שלי". לחצו על הנקודות הכחולות כדי ללמוד מה כל אזור עושה.
              </p>
            </div>

            <div className="demo-table-note">
              <FiAlertCircle />
              <span>זוהי גרסת תצוגה בלבד — הנקודות הכחולות מסבירות את תפקיד כל אלמנט.</span>
            </div>

            <div className="demo-toolbar" style={{ position: 'relative' }}>
              <HotspotMarker
                number={1}
                top="calc(50% - 14px)"
                left="93%"
                label="כפתור יצירת אוסף חדש"
                description='לחיצה פותחת חלון יצירת אוסף — הזינו שם, תיאור וצבע. האוסף החדש יופיע בגריד.'
              />
              <HotspotMarker
                number={2}
                top="calc(50% - 14px)"
                left="52%"
                label="שדה חיפוש"
                description="מסנן את האוספים לפי שם בזמן אמת. מסתיר אוספים שלא תואמים את הטקסט."
              />
              <div className="demo-toolbar-item primary"><FiPlus /> צור אוסף חדש</div>
              <div className="demo-toolbar-item"><FiSearch /> חיפוש אוספים...</div>
            </div>

            {/* Demo Collection Cards Grid */}
            <div className="demo-collections-grid">
              <div className="demo-card-hotspot-wrapper">
                <HotspotMarker
                  number={3}
                  top="10px"
                  left="80%"
                  label="פס צבעוני + תג תפקיד"
                  description='פס צבעוני עליון מזהה כל אוסף. תג "בעלים" (כחול) או "צופה" / "עורך" (סגול) מציין את רמת ההרשאה שלכם.'
                />
                <div className="demo-collection-card">
                  <div className="demo-card-stripe owner" />
                  <div className="demo-card-body">
                    <h4 className="demo-card-title">פרויקט אלפא — שרתים</h4>
                    <span className="demo-card-role owner">בעלים</span>
                    <p className="demo-card-desc">ציוד שרתים לפריסה באתר צפון. כולל שרתי PowerEdge R760.</p>
                    <div className="demo-card-footer">
                      <span>24 פריטים</span>
                      <button className="demo-card-view-btn">צפה באוסף</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="demo-card-hotspot-wrapper">
                <HotspotMarker
                  number={4}
                  top="calc(100% - 30px)"
                  left="50%"
                  label="מונה פריטים + כפתור צפייה"
                  description='בתחתית הכרטיס מוצג מספר הפריטים באוסף. כפתור "צפה באוסף" פותח את דף הפרטים עם טאב פריטים ומגדרות.'
                />
                <div className="demo-collection-card">
                  <div className="demo-card-stripe shared" />
                  <div className="demo-card-body">
                    <h4 className="demo-card-title">פרויקט בטא — תשתיות</h4>
                    <span className="demo-card-role shared">עורך</span>
                    <p className="demo-card-desc">רכיבי תקשורת ותשתיות למרכז הנתונים החדש.</p>
                    <div className="demo-card-footer">
                      <span>58 פריטים</span>
                      <button className="demo-card-view-btn">צפה באוסף</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="demo-collection-card">
                <div className="demo-card-stripe owner" />
                <div className="demo-card-body">
                  <h4 className="demo-card-title">תחזוקה שנתית 2025</h4>
                  <span className="demo-card-role owner">בעלים</span>
                  <p className="demo-card-desc">חלקי חילוף לתחזוקה שוטפת — כרטיסיות, ספקי כח, מאווררים.</p>
                  <div className="demo-card-footer">
                    <span>12 פריטים</span>
                    <button className="demo-card-view-btn">צפה באוסף</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Details View Demo */}
            <h3 style={{ marginTop: '2.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>בתוך האוסף — שני הטאבים</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.95rem' }}>
              לחיצה על "צפה באוסף" פותחת דף פרטי האוסף עם שני טאבים:
            </p>

            <div className="demo-tabs" style={{ position: 'relative' }}>
              <HotspotMarker
                number={5}
                top="calc(50% - 14px)"
                left="90%"
                label='טאב "פריטים"'
                description="מציג את כל הפריטים באוסף בטבלה. ניתן לסנן, למיין, לבחור ולבצע פעולות מרובות — בדומה לטבלת המלאי."
              />
              <HotspotMarker
                number={6}
                top="calc(50% - 14px)"
                left="65%"
                label='טאב "הגדרות"'
                description="ניהול שם, תיאור, שדות מותאמים, הרשאות ומחיקת אוסף. זמין רק לבעלים ולעורכים."
              />
              <div className="demo-tab active"><FiLayers /> פריטים</div>
              <div className="demo-tab"><FiSettings /> הגדרות</div>
            </div>

            <div className="demo-toolbar" style={{ position: 'relative' }}>
              <HotspotMarker
                number={7}
                top="calc(50% - 14px)"
                left="92%"
                label="הוספת פריט (+)"
                description='פותח חלון חיפוש פריטים מהמלאי הראשי. חפשו לפי מק"ט או תיאור, ובחרו פריטים לשייך לאוסף.'
              />
              <HotspotMarker
                number={8}
                top="calc(50% - 14px)"
                left="72%"
                label="ייצוא לאקסל"
                description="מייצא את כל פריטי האוסף לקובץ Excel, כולל שדות מותאמים אישית."
              />
              <div className="demo-toolbar-item primary"><FiPlus /> הוסף פריט</div>
              <div className="demo-toolbar-item"><FiDownload /> ייצוא</div>
              <div className="demo-toolbar-item"><FiSearch /> חיפוש...</div>
            </div>
          </section>

          {/* ========== ACTIONS: DASHBOARD ========== */}
          <section id="actions-dashboard" className="content-section">
            <div className="section-header">
              <h2 className="section-title">פעולות בדשבורד האוספים</h2>
              <p className="section-description">
                כל מה שניתן לעשות מדף "המלאי שלי" הראשי — לפני שנכנסים לאוסף ספציפי.
              </p>
            </div>

            <div className="action-cards-grid">
              <ActionMapCard
                icon={<FiPlus />}
                elementName='כפתור "צור אוסף חדש"'
                action='לחיצה פותחת חלון יצירה. הזינו שם (חובה), תיאור (אופציונלי) וצבע. הכפתור "צור" שומר ומחזיר לדשבורד עם האוסף החדש.'
                useCase="כשאתם פותחים פרויקט חדש ורוצים לאגד לו ציוד ורכיבים."
              />
              <ActionMapCard
                icon={<FiSearch />}
                elementName="חיפוש אוספים"
                action="הקלידו בשדה החיפוש שבראש הדשבורד. האוספים מסוננים בזמן אמת לפי שם."
                useCase="כשיש לכם הרבה אוספים וצריך למצוא אחד ספציפי."
              />
              <ActionMapCard
                icon={<FiEye />}
                elementName='כפתור "צפה באוסף"'
                action="לחיצה על כפתור הצפייה בתחתית כל כרטיס פותחת את דף הפרטים עם טאבים: פריטים והגדרות."
                useCase="כשאתם רוצים לנהל את תוכן האוסף — לראות פריטים, להוסיף, לערוך או לייצא."
              />
              <ActionMapCard
                icon={<FiShield />}
                elementName="תגית תפקיד (בעלים / עורך / צופה)"
                action='בכל כרטיס מופיע תג צבעוני: "בעלים" (כחול) אם יצרתם את האוסף, "עורך" או "צופה" (סגול) אם שיתפו אתכם.'
                useCase="לזהות במהירות לאילו אוספים יש לכם הרשאת עריכה ולאילו רק צפייה."
              />
            </div>
          </section>

          {/* ========== ACTIONS: ITEMS TAB ========== */}
          <section id="actions-items" className="content-section">
            <div className="section-header">
              <h2 className="section-title">טאב פריטים — ניהול התוכן</h2>
              <p className="section-description">
                בטאב הפריטים מוצגת טבלה עם כל רכיבי האוסף. הזמנים, הכמויות וכל השדות הסטנדרטיים מתעדכנים מהמלאי הראשי בזמן אמת.
              </p>
            </div>

            <div className="action-cards-grid">
              <ActionMapCard
                icon={<FiPlus />}
                elementName='כפתור "הוסף פריט"'
                action='פותח חלון חיפוש פריטים מהמלאי הראשי. חפשו לפי מק"ט, תיאור או סריאלי, סמנו פריטים ולחצו "הוסף". הפריטים משוייכים כקישורים חיים.'
                useCase="כשאתם רוצים להוסיף ציוד חדש לאוסף מהמלאי המרכזי."
              />
              <ActionMapCard
                icon={<FiDownload />}
                elementName='כפתור "ייצוא"'
                action="מוריד קובץ Excel עם כל הפריטים באוסף, כולל שדות מותאמים אישית שהוגדרו בהגדרות."
                useCase="כשצריך לשלוח רשימת ציוד לגורם חיצוני, להכין BOM פנימי, או לגבות את הנתונים."
              />
              <ActionMapCard
                icon={<FiEdit />}
                elementName="עריכת שדות מותאמים"
                action='לחיצה כפולה על תא של שדה מותאם אישית פותחת שדה עריכה. הקלידו ערך חדש ולחצו Enter. השדות הסטנדרטיים (מק"ט, יצרן) הם לקריאה בלבד.'
                useCase="כשצריך לעדכן מספר חשבונית, הערת פרויקט או סטטוס לפריט באוסף."
              />
              <ActionMapCard
                icon={<FiCopy />}
                elementName="בחירת תאים וגרירה (Cell Selection)"
                action="גררו עם העכבר על תאים כדי לבחור טווח. Ctrl+C מעתיק בפורמט Tab-separated, מוכן להדבקה באקסל."
                useCase="כשצריך להעתיק קבוצת ערכים מהטבלה לגיליון חיצוני."
              />
              <ActionMapCard
                icon={<FiMousePointer />}
                elementName="בחירת מספר פריטים (Checkboxes)"
                action='סמנו שורות בתיבות הסימון. Shift+Click בוחר טווח רצוף, Ctrl+Click מוסיף לבחירה. לאחר הבחירה — קליק ימני פותח תפריט עם "ערוך נבחרים" ו"מחק נבחרים".'
                useCase="כשצריך לערוך שדה משותף ל-30 פריטים, או למחוק מספר פריטים מהאוסף."
              />
              <ActionMapCard
                icon={<FiTrash2 />}
                elementName="מחיקת פריטים מהאוסף"
                action='בחירת פריטים ← קליק ימני ← "מחק". הפריטים מוסרים מהאוסף בלבד — הם לא נמחקים מהמלאי הראשי!'
                useCase="כשפריט כבר לא רלוונטי לפרויקט, אך עדיין נמצא במחסן."
              />
            </div>

            <div className="tip-box highlight">
              <div className="tip-icon"><FiAlertCircle /></div>
              <div className="tip-content">
                <h4>💡 מחיקה מאוסף ≠ מחיקה מהמחסן</h4>
                <p>מחיקת פריט מאוסף אישי רק מסירה את הקישור. הפריט עצמו נשאר במלאי הראשי ובכל אוסף אחר שמשוייך אליו.</p>
              </div>
            </div>
          </section>

          {/* ========== ACTIONS: SETTINGS TAB ========== */}
          <section id="actions-settings" className="content-section">
            <div className="section-header">
              <h2 className="section-title">טאב הגדרות — התאמה אישית</h2>
              <p className="section-description">
                טאב ההגדרות זמין לבעלים ולעורכים. כאן מגדירים את שם האוסף, שדות מותאמים, הרשאות גישה ומחיקת אוסף.
              </p>
            </div>

            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>שדות מותאמים אישית (Custom Fields)</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.95rem' }}>
              הגדירו שדות ייחודיים שיתווספו כעמודות בטבלת הפריטים של האוסף:
            </p>

            <table className="demo-fields-table">
              <thead>
                <tr>
                  <th>שם השדה</th>
                  <th>מפתח</th>
                  <th>סוג</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>מספר חשבונית</td>
                  <td><span className="demo-key-mono">invoice_number</span></td>
                  <td><span className="demo-type-badge">טקסט</span></td>
                  <td><FiEdit style={{ color: 'var(--accent-primary)' }} /> <FiTrash2 style={{ color: '#ef4444' }} /></td>
                </tr>
                <tr>
                  <td>תאריך התקנה</td>
                  <td><span className="demo-key-mono">install_date</span></td>
                  <td><span className="demo-type-badge">טקסט</span></td>
                  <td><FiEdit style={{ color: 'var(--accent-primary)' }} /> <FiTrash2 style={{ color: '#ef4444' }} /></td>
                </tr>
                <tr>
                  <td>סטטוס QA</td>
                  <td><span className="demo-key-mono">qa_status</span></td>
                  <td><span className="demo-type-badge">טקסט</span></td>
                  <td><FiEdit style={{ color: 'var(--accent-primary)' }} /> <FiTrash2 style={{ color: '#ef4444' }} /></td>
                </tr>
              </tbody>
            </table>

            <div className="action-cards-grid" style={{ marginTop: '1.5rem' }}>
              <ActionMapCard
                icon={<FiPlus />}
                elementName='כפתור "הוסף שדה"'
                action='לחיצה מוסיפה שדה חדש עם שם ומפתח (Key). המפתח נוצר אוטומטית מהשם. השדה מופיע כעמודה חדשה בטבלת הפריטים.'
                useCase="כשאתם צריכים לעקוב אחר מאפיין שלא קיים במלאי הראשי — כמו סטטוס QA או מספר חשבונית."
              />
              <ActionMapCard
                icon={<FiEdit />}
                elementName="עריכת שדה קיים"
                action='לחיצה על אייקון העט ליד שדה מאפשרת לשנות את שמו. המפתח נשמר כדי לא לאבד נתונים קיימים.'
                useCase="כשטעיתם בשם השדה או שהשם צריך עדכון."
              />
              <ActionMapCard
                icon={<FiTrash2 />}
                elementName="מחיקת שדה"
                action='לחיצה על אייקון הפח מוחקת את השדה לצמיתות. כל הנתונים שהוזנו בשדה הזה לכל הפריטים — יימחקו!'
                useCase="כשהשדה כבר לא רלוונטי לפרויקט."
              />
            </div>

            <div className="tip-box">
              <div className="tip-icon"><FiAlertCircle /></div>
              <div className="tip-content">
                <h4>⚠ מחיקת שדה מותאם היא בלתי הפיכה</h4>
                <p>בניגוד למחיקת פריטים (שניתנת לביטול), מחיקת שדה מותאם מוחקת את כל הערכים שהוזנו בו לכל הפריטים באוסף — ללא אפשרות שחזור.</p>
              </div>
            </div>

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>אזור סכנה (Danger Zone)</h3>

            <div className="demo-danger-zone">
              <div className="demo-danger-title"><FiAlertCircle /> אזור סכנה</div>
              <p className="demo-danger-desc">
                מחיקת האוסף תסיר אותו לצמיתות, כולל כל הקישורים לפריטים וההגדרות. הפריטים עצמם נשארים במלאי הראשי.
              </p>
              <button className="demo-danger-btn"><FiTrash2 /> מחק אוסף</button>
            </div>
          </section>

          {/* ========== PERMISSIONS ========== */}
          <section id="permissions" className="content-section">
            <div className="section-header">
              <h2 className="section-title">הרשאות ושיתוף</h2>
              <p className="section-description">
                כל אוסף תומך בשלוש רמות הרשאה. הבעלים יכול לשתף עם משתמשים בודדים או עם קבוצות שלמות.
              </p>
            </div>

            <div className="demo-permissions-list">
              <div className="demo-permission-item">
                <div className="demo-avatar owner">דמ</div>
                <div className="demo-perm-info">
                  <div className="demo-perm-name">דני מזרחי</div>
                  <div className="demo-perm-role">בעלים — שליטה מלאה</div>
                </div>
                <span className="demo-card-role owner">בעלים</span>
              </div>
              <div className="demo-permission-item">
                <div className="demo-avatar user">יכ</div>
                <div className="demo-perm-info">
                  <div className="demo-perm-name">יעל כהן</div>
                  <div className="demo-perm-role">יכולה לערוך פריטים ושדות מותאמים</div>
                </div>
                <span className="demo-card-role shared">עורך</span>
              </div>
              <div className="demo-permission-item">
                <div className="demo-avatar group">קב</div>
                <div className="demo-perm-info">
                  <div className="demo-perm-name">צוות תשתיות <span className="demo-perm-badge">קבוצה</span></div>
                  <div className="demo-perm-role">יכולים לצפות בלבד</div>
                </div>
                <span className="demo-card-role shared">צופה</span>
              </div>
            </div>

            <div className="action-cards-grid">
              <ActionMapCard
                icon={<FiUsers />}
                elementName='כפתור "הוסף משתמש"'
                action='שדה Autocomplete — הקלידו שם משתמש או קבוצה. בחרו מהרשימה, הגדירו הרשאה (עורך/צופה) ולחצו "הוסף".'
                useCase="כשאתם רוצים לשתף את האוסף עם חבר צוות או מחלקה שלמה."
              />
              <ActionMapCard
                icon={<FiShield />}
                elementName="שינוי הרשאה"
                action='לחיצה על תג ההרשאה (עורך/צופה) ליד כל שם פותחת רשימה נפתחת לשנות את רמת הגישה.'
                useCase="כשתפקיד השותף השתנה — למשל צופה שהפך לעורך."
              />
              <ActionMapCard
                icon={<FiX />}
                elementName="הסרת שותף"
                action='אייקון X ליד כל שורת משתמש מסיר את הגישה שלו לאוסף. הפריטים שבאוסף לא משתנים.'
                useCase="כשחבר צוות עזב את הפרויקט ולא צריך גישה יותר."
              />
            </div>

            <div className="tip-box">
              <div className="tip-icon"><FiAlertCircle /></div>
              <div className="tip-content">
                <h4>💡 שיתוף עם קבוצה</h4>
                <p>שיתוף עם קבוצה חוסך שיתוף פרטני. כל מי שנוסף לקבוצה יקבל אוטומטית גישה לכל האוספים שהקבוצה שותפה בהם.</p>
              </div>
            </div>
          </section>

          {/* ========== KEYBOARD SHORTCUTS ========== */}
          <section id="actions-keyboard" className="content-section">
            <div className="section-header">
              <h2 className="section-title">קיצורי מקלדת</h2>
              <p className="section-description">
                קיצורים זמינים בטבלת הפריטים בתוך האוסף.
              </p>
            </div>

            <div className="shortcuts-grid">
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
                <span className="key-combo">Shift + Click</span>
                <span className="key-desc">בחירת טווח שורות רצוף</span>
              </div>
              <div className="shortcut-item">
                <span className="key-combo">Ctrl + Click</span>
                <span className="key-desc">הוספה / הסרה מהבחירה</span>
              </div>
              <div className="shortcut-item">
                <span className="key-combo">לחיצה כפולה</span>
                <span className="key-desc">עריכת שדה מותאם / העתקת שדה רגיל</span>
              </div>
              <div className="shortcut-item">
                <span className="key-combo">חצים ↑↓←→</span>
                <span className="key-desc">ניווט בין תאים בטבלה</span>
              </div>
            </div>
          </section>

          {/* ========== SUMMARY ========== */}
          <section id="summary" className="content-section">
            <div className="section-header">
              <h2 className="section-title">סיכום מנהלים</h2>
              <p className="section-description">
                תהליך העבודה עם המלאי שלי — ב-6 משפטים.
              </p>
            </div>

            <div className="summary-box">
              <h3><FiZap /> תהליך עבודה מרכזי</h3>
              <ol className="summary-list">
                <li><strong>צרו אוסף</strong> — לחצו "+ צור אוסף חדש" ותנו שם, תיאור וצבע.</li>
                <li><strong>הוסיפו פריטים</strong> — מהמלאי הראשי (קליק ימני → שייך) או מתוך האוסף (כפתור "+").</li>
                <li><strong>הגדירו שדות</strong> — בטאב הגדרות הוסיפו שדות מותאמים כמו "מספר חשבונית" או "סטטוס QA".</li>
                <li><strong>שתפו עם הצוות</strong> — הוסיפו משתמשים או קבוצות כבעלים, עורכים או צופים.</li>
                <li><strong>נהלו ועדכנו</strong> — ערכו שדות מותאמים בלחיצה כפולה, מחקו פריטים שלא רלוונטיים, בצעו פעולות מרובות.</li>
                <li><strong>ייצאו לאקסל</strong> — לחצו "ייצוא" כדי להוריד את כל הפריטים, כולל שדות מותאמים, לקובץ Excel מסודר.</li>
              </ol>
            </div>
          </section>

          {/* ========== QUIZ ========== */}
          <section id="quiz" className="content-section">
            <div className="section-header">
              <h2 className="section-title">בדיקת הבנה</h2>
              <p className="section-description">
                ענו על 3 שאלות כדי לוודא שהבנתם את עקרונות העבודה עם האוספים.
              </p>
            </div>

            <div className="quiz-section-grid">
              <QuizCard
                question="מה קורה כשמוחקים פריט מאוסף אישי?"
                options={[
                  'הפריט נמחק גם מהמלאי הראשי',
                  'הפריט מוסר מהאוסף בלבד — נשאר במלאי הראשי',
                  'הפריט מוסר מכל האוספים'
                ]}
                correctIndex={1}
                explanation='מחיקת פריט מאוסף מסירה רק את הקישור. הפריט ממשיך להתקיים במלאי הראשי ובכל אוסף אחר שמשוייך אליו.'
              />

              <QuizCard
                question='מי יכול לנהל הרשאות (להוסיף/להסיר שותפים) באוסף?'
                options={[
                  'רק הבעלים',
                  'בעלים ועורכים',
                  'כל מי שיש לו גישה'
                ]}
                correctIndex={0}
                explanation='רק הבעלים של האוסף יכול לשנות הרשאות ולהוסיף או להסיר שותפים. עורכים יכולים לערוך פריטים ושדות, אך לא הרשאות.'
              />

              <QuizCard
                question="נכון או לא נכון: שדה מותאם אישית שנמחק — ניתן לשחזור."
                options={[
                  'נכון — Ctrl+Z משחזר אותו',
                  'לא נכון — המחיקה היא בלתי הפיכה וכל הנתונים בשדה אבדו'
                ]}
                correctIndex={1}
                explanation='מחיקת שדה מותאם (Custom Field) מוחקת לצמיתות את כל הערכים שהוזנו בשדה הזה לכל הפריטים באוסף. אין אפשרות ביטול — לכן חשוב לוודא לפני מחיקה.'
              />
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default MyCollectionsGuide;
