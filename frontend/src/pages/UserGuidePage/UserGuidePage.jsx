import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiBox, 
  FiLayers, 
  FiShoppingCart, 
  FiZap, 
  FiLayout, 
  FiSearch, 
  FiMenu, 
  FiX,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiHelpCircle,
  FiArchive,
  FiClipboard,
  FiSettings,
  FiUsers,
  FiChevronsRight
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './UserGuidePage.css';

const UserGuidePage = () => {
  const [activeSection, setActiveSection] = useState('intro');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { hasPermission, hasProcurementAccess, isAdmin } = useAuth();

  // Check permissions
  const hasInventoryAccess = hasPermission('inventory:ro') || hasPermission('inventory:rw');
  const procurementAccess = hasProcurementAccess();

  // Sections Configuration - filtered by permissions and matching DOM order
  const sections = React.useMemo(() => {
    const baseSections = [
      { id: 'intro', label: 'מבוא למערכת', icon: <FiBox />, visible: true },
      { id: 'navigation', label: 'ניווט במערכת', icon: <FiChevronsRight />, visible: true },
      { id: 'interface', label: 'ממשק וטבלאות', icon: <FiLayout />, visible: hasInventoryAccess },
      { id: 'collections', label: 'המלאי שלי', icon: <FiLayers />, visible: hasInventoryAccess },
      { id: 'dashboard', label: 'דשבורד', icon: <FiLayout />, visible: true },
      { id: 'stale-items', label: 'פריטים ישנים', icon: <FiArchive />, visible: hasInventoryAccess },
      { id: 'audit-logs', label: 'יומן פעילות', icon: <FiClipboard />, visible: true },
      { id: 'admin', label: 'ניהול מערכת', icon: <FiSettings />, visible: isAdmin },
      { id: 'procurement', label: 'רכש והצטיידות', icon: <FiShoppingCart />, visible: procurementAccess },
      { id: 'pro-tips', label: 'טיפים למתקדמים', icon: <FiZap />, visible: true },
      { id: 'faq', label: 'שאלות נפוצות', icon: <FiHelpCircle />, visible: true },
    ];
    return baseSections.filter(s => s.visible);
  }, [hasInventoryAccess, procurementAccess, isAdmin]);

  // Scroll Spy Effect using IntersectionObserver
  useEffect(() => {
    const observerOptions = {
      root: null, // use viewport (or closest scroll container)
      rootMargin: '-150px 0px -60% 0px', // Trigger when section passes the top offset
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
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [sections]);

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
        {/* Sidebar Navigation - Sticky */}
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
              <div className="help-icon"><FiHelpCircle /></div>
              <h4>צריכים עזרה נוספת?</h4>
              <p>צוות התמיכה זמין עבורכם</p>
              <button className="contact-btn">צור קשר</button>
            </div>
          </div>
        </aside>

        {/* Mobile Toggle */}
        <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
          <FiMenu />
          <span>תוכן עניינים</span>
        </button>

        {/* Main Content Area */}
        <main className="guide-content">
          
          {/* Intro Section */}
          <section id="intro" className="content-section">
            <div className="section-header">
              <h2 className="section-title">ברוכים הבאים למערכת הניהול</h2>
              <p className="section-description">
                מערכת ה-Warehouse נועדה להעניק לכם שליטה מלאה על שרשרת האספקה, החל מניהול המלאי במחסן ועד להזמנות רכש מורכבות.
              </p>
            </div>
            
            <div className="cards-grid">
              <div className="feature-card">
                <h3 className="feature-card-header">
                  <div className="card-icon blue"><FiBox /></div>
                  <span>ניהול מלאי</span>
                </h3>
                <p>צפייה בזמן אמת בכמויות, מיקומים וסטטוסים של פריטים במחסן המרכזי.</p>
              </div>
              <div className="feature-card">
                <h3 className="feature-card-header">
                  <div className="card-icon purple"><FiLayers /></div>
                  <span>אוספים אישיים</span>
                </h3>
                <p>יצירת רשימות ציוד מותאמות לפרויקטים עליהם אתם עובדים.</p>
              </div>
              <div className="feature-card">
                <h3 className="feature-card-header">
                  <div className="card-icon green"><FiShoppingCart /></div>
                  <span>תהליכי רכש</span>
                </h3>
                <p>ביצוע הזמנות, מעקב אחר סטטוסים וניהול ספקים במקום אחד.</p>
              </div>
            </div>
          </section>

          {/* Navigation Section */}
          <section id="navigation" className="content-section">
            <div className="section-header">
              <h2 className="section-title">ניווט במערכת</h2>
              <p className="section-description">
                המערכת משתמשת בתפריט צד אנכי (Sidebar) לניווט בין העמודים, וסרגל עליון דק (TopBar) לפעולות מהירות.
              </p>
            </div>

            <div className="guide-step">
              <div className="step-number">01</div>
              <div className="step-content">
                <h3>תפריט צד (Sidebar)</h3>
                <p>בצד ימין של המסך מופיע תפריט ניווט אנכי. לחצו על כל פריט כדי לנווט לעמוד הרלוונטי:</p>
                <ul className="feature-list">
                  <li><FiCheckCircle className="list-icon" /> <strong>דשבורד:</strong> מרכז הבקרה ומידע כללי</li>
                  <li><FiCheckCircle className="list-icon" /> <strong>מלאי:</strong> ניהול מלאי — כולל תת-פריטים: מלאי נוכחי, מלאי ישן, קטלוג, תנועות</li>
                  <li><FiCheckCircle className="list-icon" /> <strong>המלאי שלי:</strong> אוספים אישיים ורשימות פרויקטים</li>
                  <li><FiCheckCircle className="list-icon" /> <strong>רכש:</strong> ניהול הזמנות — כולל תת-פריטים: בתהליך, הסתיים, אנליטיקס, השוואת מחירים</li>
                  <li><FiCheckCircle className="list-icon" /> <strong>ניהול (Admin):</strong> ניהול משתמשים, לוגים וכלי AI</li>
                  <li><FiCheckCircle className="list-icon" /> <strong>מדריך למשתמש:</strong> מדריך זה שאתם קוראים כרגע</li>
                </ul>
              </div>
            </div>

            <div className="guide-step">
              <div className="step-number">02</div>
              <div className="step-content">
                <h3>כיווץ והרחבת התפריט</h3>
                <p>
                  לחצו על כפתור <strong>החץ</strong> בראש התפריט, או השתמשו בקיצור <strong>Ctrl+B</strong>, כדי לכווץ את התפריט לאייקונים בלבד.
                  במצב מכווץ, העבירו את העכבר מעל אייקון כדי לראות <strong>Tooltip</strong> עם שם העמוד. עבור פריטים עם תת-תפריט, יופיע תפריט מרחף עם כל האפשרויות.
                </p>
              </div>
            </div>

            <div className="guide-step">
              <div className="step-number">03</div>
              <div className="step-content">
                <h3>סרגל עליון (TopBar)</h3>
                <p>בראש המסך מופיע סרגל דק הכולל:</p>
                <ul className="feature-list">
                  <li><FiCheckCircle className="list-icon" /> <strong>לוגו:</strong> לחצו על לוגו 890 Warehouse לחזרה לדשבורד</li>
                  <li><FiCheckCircle className="list-icon" /> <strong>חיפוש (Ctrl+K):</strong> פתיחת חלון חיפוש גלובלי</li>
                  <li><FiCheckCircle className="list-icon" /> <strong>תפריט משתמש:</strong> מעבר בין מצב כהה/בהיר, ערכת נושא, ויציאה מהמערכת</li>
                </ul>
              </div>
            </div>

            <div className="tip-box">
              <div className="tip-icon"><FiAlertCircle /></div>
              <div className="tip-content">
                <h4>💡 ניווט מהיר</h4>
                <p>במסכים קטנים או בטלפונים, התפריט מופיע כשכבת-על (Overlay). לחצו על האייקון בפינה כדי לפתוח ולסגור אותו.</p>
              </div>
            </div>
          </section>

          {/* Interface Section - Only for inventory access */}
          {hasInventoryAccess && (
            <section id="interface" className="content-section">
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
                  <p>
                    לחיצה ימנית על כל שורה בטבלה תפתח תפריט פעולות עשיר:
                  </p>
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
                  <p>
                    כל שורה בטבלת המלאי מציגה כפתור <strong>⋯</strong> בעמודה הימנית — גלויה בריחוף מעל השורה. לחיצה עליו פותחת תפריט נפתח עם הפעולות הנפוצות ביותר:
                  </p>
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
          )}

          {/* Collections Section - Only for inventory access */}
          {hasInventoryAccess && (
            <section id="collections" className="content-section accent-bg">
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
                  <p>רוצים ללמוד לעומק כל אינטראקציה — שדות מותאמים, הרשאות, ייצוא ועוד? <Link to="/guide/collections" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>למדריך האינטראקטיבי המלא →</Link></p>
                </div>
              </div>
            </section>
          )}

          {/* Dashboard Section */}
          <section id="dashboard" className="content-section accent-bg">
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

          {/* Stale Items Section - Only for inventory access */}
          {hasInventoryAccess && (
            <section id="stale-items" className="content-section">
              <div className="section-header">
                <h2 className="section-title">פריטים ישנים</h2>
                <p className="section-description">
                  דף שמציג פריטים שלא עודכנו במשך זמן, כדי לזהות מלאי מתיישן או שגוי. העמוד כולל את כל יכולות ניהול המלאי (למעט יבוא) — חיפוש, סינון, ייצוא, עריכה ומחיקה.
                </p>
              </div>

              <div className="guide-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>בחירת טווח זמן</h3>
                  <p>בסרגל הכלים בחרו כמה ימים - "לא עודכנו למעלה מ-X ימים". ברירת המחדל היא 30 ימים.</p>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>חיפוש וסינון</h3>
                  <p>ניתן לשלב חיפוש חופשי ופילטרים לפי עמודות, בדיוק כמו בעמוד המלאי הראשי:</p>
                    <ul className="feature-list">
                      <li><FiCheckCircle className="list-icon" /> <strong>חיפוש חופשי:</strong> מחפש בכל השדות בו-זמנית</li>
                      <li><FiCheckCircle className="list-icon" /> <strong>פילטרים:</strong> סינון לפי עמודה ספציפית (מק"ט, מיקום, יצרן ועוד)</li>
                      <li><FiCheckCircle className="list-icon" /> <strong>הצגת/הסתרת עמודות:</strong> התאמה אישית של העמודות המוצגות</li>
                    </ul>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>עריכה ומחיקה</h3>
                  <p>ניתן לבצע את כל פעולות העריכה והמחיקה ישירות מהטבלה:</p>
                    <ul className="feature-list">
                      <li><FiCheckCircle className="list-icon" /> <strong>עריכה בתוך התא:</strong> לחצו על תא כדי לערוך ישירות</li>
                      <li><FiCheckCircle className="list-icon" /> <strong>עריכה מרובה:</strong> סמנו מספר פריטים ועדכנו בבת אחת</li>
                      <li><FiCheckCircle className="list-icon" /> <strong>מחיקה:</strong> מחיקת פריט בודד או מספר פריטים מסומנים</li>
                      <li><FiCheckCircle className="list-icon" /> <strong>ביטול (Ctrl+Z):</strong> ביטול עריכה או מחיקה אחרונה</li>
                    </ul>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>ייצוא לאקסל</h3>
                  <p>לחצו על כפתור "ייצוא" כדי להוריד את הפריטים הישנים לקובץ Excel. הייצוא מכבד את החיפוש והפילטרים הפעילים.</p>
                </div>
              </div>

              <div className="tip-box highlight">
                <div className="tip-icon"><FiAlertCircle /></div>
                <div className="tip-content">
                  <h4>💡 עצה: בדקו באופן קבוע</h4>
                  <p>בדיקה שבועית של פריטים ישנים עוזרת לשמור על נתונים עדכניים ונקיים.</p>
                </div>
              </div>
            </section>
          )}

          {/* Audit Logs Section */}
          <section id="audit-logs" className="content-section">
            <div className="section-header">
              <h2 className="section-title">יומן פעילות (Audit Logs)</h2>
              <p className="section-description">
                רישום של כל הפעולות שבוצעו במערכת - מי עשה מה ובאיזה זמן.
              </p>
            </div>

            <div className="guide-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>סינון יומנים</h3>
                <p>אתם יכולים לסנן לפי:</p>
                  <ul className="feature-list">
                    <li><FiCheckCircle className="list-icon" /> <strong>משתמש:</strong> מי ביצע את הפעולה</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>סוג פעולה:</strong> יצירה, עריכה, מחיקה, כניסה</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>תאריך:</strong> בטווח מסוים</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>משאב:</strong> איזה פריט/משתמש/הזמנה</li>
                  </ul>
              </div>
            </div>

            <div className="guide-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>צפייה בפרטים</h3>
                <p>לחצו על כל שורה ביומן כדי לראות פרטים מלאים על השינויים שבוצעו. זה שימושי לדיבוגינג או הבנת מה השתנה בדיוק.</p>
              </div>
            </div>

            <div className="guide-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>ייצוא דוח</h3>
                <p>אתם יכולים לייצא את היומן ל-CSV לצורכי דיווח או ניתוח עתידי.</p>
              </div>
            </div>
          </section>

          {/* Admin Section - Only for admin users */}
          {isAdmin && (
            <section id="admin" className="content-section">
              <div className="section-header">
                <h2 className="section-title">ניהול מערכת (Admin)</h2>
                <p className="section-description">
                  ממשק הניהול מאפשר לנהל משתמשים, קבוצות הרשאות וכלי AI. נגיש רק למנהלים. העמודים הנגישים דרך תפריט הצד תחת "ניהול".
                </p>
              </div>

              <div className="guide-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>ניהול משתמשים</h3>
                  <p>עמוד <strong>"ניהול משתמשים וקבוצות"</strong> מציג את כל המשתמשים הרשומים:</p>
                  <ul className="feature-list">
                    <li><FiCheckCircle className="list-icon" /> <strong>יצירת משתמש:</strong> הגדרת שם, סיסמה, תפקיד (User/Admin) והרשאות מפורטות</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>עריכת משתמש:</strong> שינוי תפקיד, איפוס סיסמה, עדכון הרשאות</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>מחיקת משתמש:</strong> הסרת משתמש (לא ניתן למחוק Admin אחרון או SuperAdmin)</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>חיפוש וסינון:</strong> חיפוש מהיר לפי שם משתמש</li>
                  </ul>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>ניהול קבוצות הרשאה</h3>
                  <p>קבוצות מאפשרות להגדיר חבילות הרשאות ולשייך אותן למשתמשים:</p>
                  <ul className="feature-list">
                    <li><FiCheckCircle className="list-icon" /> <strong>יצירת קבוצה:</strong> הגדרת שם ובחירת הרשאות (מלאי, רכש, ספקים ספציפיים)</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>שיוך משתמשים:</strong> הוספת משתמשים לקבוצה — ההרשאות ממוזגות אוטומטית</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>הרשאות ספקים:</strong> ניתן להגדיר גישה לספקים ספציפיים (Dell, HPE, NetApp, Cisco, Commvault)</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>הרשאות מחירים:</strong> <em>procurement:view_prices</em> ו-<em>procurement:compare_prices</em> לשליטה בנראות מחירים</li>
                  </ul>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>לוגים (יומן פעילות מנהלים)</h3>
                  <p>עמוד <strong>"לוגים"</strong> (נגיש מתפריט הצד תחת ניהול) מציג את כל הפעולות הניהוליות — יצירה, עדכון ומחיקה של משתמשים וקבוצות. ניתן לסנן לפי סוג פעולה, משתמש ותאריך.</p>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>כלי AI (SuperAdmin בלבד)</h3>
                  <p>עמוד <strong>"כלי AI"</strong> (נגיש מתפריט הצד תחת ניהול) זמין רק למנהלי-על ומאפשר:</p>
                  <ul className="feature-list">
                    <li><FiCheckCircle className="list-icon" /> <strong>אימון מחדש:</strong> הפעלת אימון מחדש של מודל סיווג הרכיבים (AI Classifier) על בסיס הקטלוג העדכני</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>מדדי ביצועים:</strong> צפייה באחוז דיוק המודל, מספר דוגמאות האימון ונתיב המודל</li>
                  </ul>
                </div>
              </div>

              <div className="tip-box highlight">
                <div className="tip-icon"><FiAlertCircle /></div>
                <div className="tip-content">
                  <h4>💡 הרשאות מצטברות</h4>
                  <p>משתמש מקבל את כל ההרשאות שלו + כל ההרשאות מהקבוצות שהוא חבר בהן. לא צריך להגדיר הרשאות ידנית אם הקבוצה כבר מכילה אותן.</p>
                </div>
              </div>
            </section>
          )}

          {/* Procurement Section - Only for procurement access */}
          {procurementAccess && (
            <section id="procurement" className="content-section">
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
                    <li><FiCheckCircle className="list-icon" /> <strong>שלח לדרך (משאית):</strong> מעבר לסטטוס "רכש יצא" — מוצג רק כשמחכה שרכש ייצא</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>סמן כהגיע (וי):</strong> מעבר לסטטוס "רכש הגיע" — מוצג רק כשסטטוס "רכש יצא"</li>
                  </ul>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">5</div>
                <div className="step-content">
                  <h3>קבצים ומסמכים</h3>
                  <p>לכל הזמנה ניתן לצרף קבצים — EMF, BOM, חשבוניות ותמונות. לחצו על אייקון <strong>המהדק</strong> (📎) בטור הקבצים לניהול המסמכים.</p>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">6</div>
                <div className="step-content">
                  <h3>סורק הצעות מחיר (BOM Scanner)</h3>
                  <p>ייבוא מהיר של קבצי Excel/CSV מהספקים השונים:</p>
                  <ul className="feature-list">
                    <li><FiCheckCircle className="list-icon" /> זיהוי אוטומטי של עמודות (מק"ט, כמות, תיאור ומחיר) לפורמטים של יצרנים כמו Dell, HPE, NetApp ו-Cisco</li>
                    <li><FiCheckCircle className="list-icon" /> גרירה ושחרור קבצים (Drag & Drop) ויצירת קבוצות רכש לפי היצרן באופן אוטומטי</li>
                    <li><FiAlertCircle className="list-icon" /> התרעה והצגת פריטים שאינם קיימים במאגר (Unknown Parts) למניעת שגיאות בהזמנה</li>
                  </ul>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">5א</div>
                <div className="step-content">
                  <h3>סיווג אוטומטי חכם (AI / ML)</h3>
                  <p>
                    המערכת מפעילה מנוע בינה מלאכותית שמנתח את תיאור כל רכיב BOM ומסווג אותו אוטומטית לקטגוריה:
                  </p>
                  <ul className="feature-list">
                    <li><FiCheckCircle className="list-icon" /> <strong>קטגוריות נתמכות (16):</strong> שרת אחסון, שרת, מתג, כרטיסיה, דיסק, מדף דיסקים, כבל, ג׳יביק (SFP/QSFP), מעבד, זכרונות, מאוורר, ספק כח, רישוי נפח, רישוי תוכנה, תמיכה, אחר</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>חילוץ מאפיינים:</strong> מהירות (400G/100G/25G/10G), אורך כבל, סוג סיב (SMF/MMF), מחבר (MPO/LC), קיבולת דיסק, תדר מעבד, נפח זיכרון, הספק ספק כח ועוד — ומציג תיאור מובנה בעברית</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>זיהוי ג'יביקים (Transceivers):</strong> תמיכה בכל צורות ה-QSFP — OSFP, QSFP-DD, QSFP112, QSFP56, QSFP28, QSFP, SFP28, SFP+ ו-SFP עם מהירות ומחבר בתיאור</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>תג ביטחון (Confidence):</strong> כל רכיב מקבל ציון ביטחון — ירוק (גבוה) / צהוב (בינוני) / אדום (נמוך). פריט עם תג <strong>⚠ ביטחון נמוך</strong> סיווגו טעון אימות ידני</li>
                    <li><FiCheckCircle className="list-icon" /> ניתן לתקן קטגוריה שגויה ידנית בחלון "רכיבים שלא זוהו" לפני אישור סופי</li>
                  </ul>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">5ב</div>
                <div className="step-content">
                  <h3>עריכה ישירה של פריטי BOM</h3>
                  <p>
                    למשתמשים עם הרשאת כתיבה לספק, ניתן לערוך פריטים ישירות מתוך תוצאות הסריקה:
                  </p>
                  <ul className="feature-list">
                    <li><FiCheckCircle className="list-icon" /> לחצו על <strong>אייקון ✏️ (עיפרון)</strong> בפינה הימנית העליונה של כרטיס המערכת כדי להיכנס למצב עריכה</li>
                    <li><FiCheckCircle className="list-icon" /> לחצו <strong>ישירות על תיאור הרכיב</strong> לעריכה מוטמעת (contentEditable) — ללא שדות נפרדים</li>
                    <li><FiCheckCircle className="list-icon" /> בחרו <strong>קטגוריה</strong> מהרשימה הנגללת שמופיעה מתחת לתיאור</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>עריכה זמינה גם בחלון הצגת BOM</strong> בדף ההזמנות (Procurement) — לחצו כפתור "הצג BOM" בהזמנה שנשמרה</li>
                    <li><FiCheckCircle className="list-icon" /> השינויים נשמרים בקטלוג ומשפרים את דיוק המודל בסריקות הבאות</li>
                    <li><FiAlertCircle className="list-icon" /> כפתור העריכה מופיע רק למי שיש לו הרשאת כתיבה (rw) לספק הרלוונטי</li>
                  </ul>
                </div>
              </div>

              <div className="tip-box highlight">
                <div className="tip-icon"><FiAlertCircle /></div>
                <div className="tip-content">
                  <h4>⚠ חשוב — אמת את תוצאות ה-AI לפני שמירה</h4>
                  <p>
                    המודל עובד היטב על פריטים נפוצים, אך <strong>אינו מושלם</strong>. לפני שמירת הסיווג בדקו:
                  </p>
                  <ul className="feature-list" style={{ marginTop: '0.5rem' }}>
                    <li><FiAlertCircle className="list-icon" /> <strong>הקטגוריה נכונה?</strong> — האם הרכיב אכן כבל / ג׳יביק / רישוי / מעבד?</li>
                    <li><FiAlertCircle className="list-icon" /> <strong>התיאור בעברית נכון?</strong> — האורך / המהירות / הפורטים חולצו נכון?</li>
                    <li><FiAlertCircle className="list-icon" /> <strong>שימו לב לתג ביטחון אדום</strong> — אלו הפריטים הנוטים ביותר לסיווג שגוי</li>
                    <li><FiCheckCircle className="list-icon" /> השתמשו בכפתור <strong>"עריכה"</strong> בכרטיס המערכת לתיקון קטגוריות ותיאורים ישירות בממשק</li>
                  </ul>
                </div>
              </div>

              <div className="tip-box highlight">
                <div className="tip-icon"><FiAlertCircle /></div>
                <div className="tip-content">
                  <h4>🔧 מנהל מערכת — כלי AI (Superadmin)</h4>
                  <p>
                    מנהלי-על (Superadmin) יכולים לגשת ל<strong>לשונית "כלי AI"</strong> בדף ניהול הגישה (<strong>Admin → כלי AI</strong>)
                    ולהפעיל אימון מחדש של מנוע הסיווג בכל עת — ללא צורך לבצע סריקת BOM חדשה.
                    מומלץ להריץ אחרי עדכון קטלוג משמעותי.
                  </p>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">6א</div>
                <div className="step-content">
                  <h3>רצועת נתוני חודש שוטף (Analytics Strip) — חדש!</h3>
                  <p>בתחתית עמוד הרכש מוצגת <strong>רצועה קבועה</strong> עם 4 מדדים על החודש הנוכחי:</p>
                  <ul className="feature-list">
                    <li><FiCheckCircle className="list-icon" /> <strong>💰 סה"כ הוצאה:</strong> סכום כל ההזמנות שנפתחו החודש (מוצג בש"ח, K או M)</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>⏱ ממוצע ימי אספקה:</strong> זמן אספקה ממוצע להזמנות שהושלמו החודש</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>📦 מספר הזמנות:</strong> כמות ההזמנות שנפתחו בחודש הנוכחי</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>🏆 ספק מוביל:</strong> הספק עם הכי הרבה הזמנות החודש</li>
                  </ul>
                  <p>הרצועה מתרעננת אוטומטית ומשקפת תמיד את הנתונים העדכניים.</p>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">6</div>
                <div className="step-content">
                  <h3>השוואת מחירים (Price Intel)</h3>
                  <p>לשונית השוואת המחירים מאפשרת מעקב וניתוח מחירי הרכש לאורך זמן:</p>
                  <ul className="feature-list">
                    <li><FiCheckCircle className="list-icon" /> <strong>גרף השוואת מחירים:</strong> הוסיפו מק"טים לגרף כדי לעקוב אחר מחיר כל מוצר לאורך זמן. תומך בחיפוש אוטומטי (Autocomplete).</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>רזולוציה וזמן:</strong> בחרו להציג ביומי, חודשי או שנתי. ניתן לסנן לפי טווח תאריכים מדויק.</li>
                    <li><FiLayers className="list-icon" /> <strong>השוואה מתקדמת — שרשרת מוצר:</strong> לחצו כפתור "השוואה מתקדמת" כדי לבנות שרשרת מוצר. כל שרשרת מכילה דורות של מוצר — לדוגמה AFF-A800 ואחריו AFF-A90. כל דור יכול לכלול גם רכיבים משניים (כמו דיסקים ורשת). כל דורות השרשרת מופיעים כקו אחד רציף על הגרף.</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>גרף הוצאות לפי יצרן:</strong> גרף עמודות נוסף בתחתית הדשבורד מציג את סכומי הרכש לפי יצרן (NetApp, Dell, HPE וכו') מחולק לפי הרזולוציה הנבחרת.</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>בנה היסטוריה:</strong> לחצו "בנה היסטוריה" כדי לסרוק את כל הזמנות העבר ולמלא את מסד הנתונים — נדרש פעם אחת בלבד.</li>
                  </ul>
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
                  <p>רוצים ללמוד לעומק — סורק BOM, סיווג AI, מסלול סטטוסים, השוואת מחירים ועוד? <Link to="/guide/procurement" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>למדריך האינטראקטיבי המלא →</Link></p>
                </div>
              </div>
            </section>
          )}

          {/* Pro Tips Section */}
          <section id="pro-tips" className="content-section">
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
          <section id="faq" className="content-section">
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

        </main>
      </div>
    </div>
  );
};

export default UserGuidePage;
