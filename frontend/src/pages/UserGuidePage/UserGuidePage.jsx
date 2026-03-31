import React, { useState, useEffect } from 'react';
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
  FiClipboard
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './UserGuidePage.css';

const UserGuidePage = () => {
  const [activeSection, setActiveSection] = useState('intro');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { hasPermission } = useAuth();

  // Check permissions
  const hasInventoryAccess = hasPermission('inventory:ro') || hasPermission('inventory:rw');
  const hasProcurementAccess = hasPermission('procurement:ro') || hasPermission('procurement:rw');

  // Sections Configuration - filtered by permissions and matching DOM order
  const sections = React.useMemo(() => {
    const baseSections = [
      { id: 'intro', label: 'מבוא למערכת', icon: <FiBox />, visible: true },
      { id: 'interface', label: 'ממשק וטבלאות', icon: <FiLayout />, visible: hasInventoryAccess },
      { id: 'collections', label: 'המלאי שלי', icon: <FiLayers />, visible: hasInventoryAccess },
      { id: 'dashboard', label: 'דשבורד', icon: <FiLayout />, visible: true },
      { id: 'stale-items', label: 'פריטים ישנים', icon: <FiArchive />, visible: hasInventoryAccess },
      { id: 'audit-logs', label: 'יומן פעילות', icon: <FiClipboard />, visible: true },
      { id: 'procurement', label: 'רכש והצטיידות', icon: <FiShoppingCart />, visible: hasProcurementAccess },
      { id: 'pro-tips', label: 'טיפים למתקדמים', icon: <FiZap />, visible: true },
      { id: 'faq', label: 'שאלות נפוצות', icon: <FiHelpCircle />, visible: true },
    ];
    return baseSections.filter(s => s.visible);
  }, [hasInventoryAccess, hasProcurementAccess]);

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

          {/* Interface Section - Only for inventory access */}
          {hasInventoryAccess && (
            <section id="interface" className="content-section">
              <div className="section-header">
                <h2 className="section-title">ממשק וטבלאות חכמות</h2>
                <p className="section-description">
                  טבלאות המערכת הן כלי העבודה המרכזי שלכם. הן מאפשרות סינון, מיון, עריכה ופעולות מהירות.
                </p>
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
            </section>
          )}

          {/* Dashboard Section */}
          <section id="dashboard" className="content-section accent-bg">
            <div className="section-header">
              <h2 className="section-title">דשבורד - מרכז הבקרה</h2>
              <p className="section-description">
                דשבורד הבית מציג סקירה כללית חיה של כל המערכת — מלאי, רכש ופעילות אחרונה.
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
                <h3>כרטיסי מלאי (KPIs)</h3>
                <p>שורת כרטיסים צבעוניים מציגה נתוני מלאי בזמן אמת:</p>
                  <ul className="feature-list">
                    <li><FiCheckCircle className="list-icon" /> <strong>סה"כ פריטים:</strong> סך הפריטים הפעילים במחסן</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>שריונים פעילים:</strong> פריטים ששוריינו לפרויקטים</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>ציוד סריאלי:</strong> פריטים עם מעקב אישי (SN)</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>ציוד נלווה:</strong> פריטים בניהול כמותי</li>
                  </ul>
              </div>
            </div>

            <div className="guide-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>כרטיסי רכש (KPIs)</h3>
                <p>שורת כרטיסים נוספת מציגה נתוני רכש (לבעלי הרשאת רכש):</p>
                  <ul className="feature-list">
                    <li><FiCheckCircle className="list-icon" /> <strong>סך הכל רכש:</strong> הוצאות מצטברות בתקופה</li>
                    <li><FiAlertCircle className="list-icon" /> <strong>ממתין ל-EMF:</strong> הזמנות שעעדיין לא קיבלו מספר EMF</li>
                    <li><FiAlertCircle className="list-icon" /> <strong>ממתין ל-BOM:</strong> הזמנות שממתינות לאישור BOM</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>בדרך אלינו:</strong> הזמנות שכבר יצאו מהספק</li>
                  </ul>
              </div>
            </div>

            <div className="guide-step">
              <div className="step-number">4</div>
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
          </section>

          {/* Stale Items Section - Only for inventory access */}
          {hasInventoryAccess && (
            <section id="stale-items" className="content-section">
              <div className="section-header">
                <h2 className="section-title">פריטים ישנים</h2>
                <p className="section-description">
                  דף שמציג פריטים שלא עודכנו במשך זמן, כדי לזהות מלאי מתיישן או שגוי.
                </p>
              </div>

              <div className="guide-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>בחירת טווח זמן</h3>
                  <p>בראש העמוד בחרו כמה ימים - "הצג פריטים שלא עודכנו למעלה מ-X ימים". ברירת המחדל היא 30 ימים.</p>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>מעקב אחר פריטים</h3>
                  <p>הטבלה מציגה רשימה של פריטים שלא עודכנו. תוכלו:</p>
                    <ul className="feature-list">
                      <li><FiCheckCircle className="list-icon" /> לחזור לעריכת פריט כדי לעדכן אותו</li>
                      <li><FiCheckCircle className="list-icon" /> להסתיר פריטים שאינם רלוונטיים</li>
                      <li><FiCheckCircle className="list-icon" /> לייצא לאקסל לעדכון בעיבוד שורי</li>
                    </ul>
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

          {/* Procurement Section - Only for procurement access */}
          {hasProcurementAccess && (
            <section id="procurement" className="content-section">
              <div className="section-header">
                <h2 className="section-title">רכש והצטיידות</h2>
                <p className="section-description">
                  ניהול כל תהליך הרכש — מיצירת הזמנה ועד קליטתה במחסן.
                </p>
              </div>

              <div className="guide-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>טאבים: בתהליך / הסתיים</h3>
                  <p>הדף מחולק לשני טאבים:</p>
                  <ul className="feature-list">
                    <li><FiCheckCircle className="list-icon" /> <strong>בתהליך:</strong> כל ההזמנות הפעילות (שטרם התקבלו)</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>הסתיים:</strong> הזמנות שהגיעו ונסגרו</li>
                  </ul>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">2</div>
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
                <div className="step-number">3</div>
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
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>קבצים ומסמכים</h3>
                  <p>לכל הזמנה ניתן לצרף קבצים — EMF, BOM, חשבוניות ותמונות. לחצו על אייקון <strong>המהדק</strong> (📎) בטור הקבצים לניהול המסמכים.</p>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">5</div>
                <div className="step-content">
                  <h3>סורק הצעות מחיר (BOM Scanner)</h3>
                  <p>ייבוא מהיר של קבצי Excel/CSV מהספקים השונים:</p>
                  <ul className="feature-list">
                    <li><FiCheckCircle className="list-icon" /> זיהוי אוטומטי של עמודות (מק"ט, כמות, תיאור ומחיר) לפורמטים של יצרנים כמו Dell, HPE, NetApp</li>
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
                    <li><FiCheckCircle className="list-icon" /> <strong>קטגוריות נתמכות:</strong> כבל, ג׳יביק / משדר (SFP/QSFP), כרטיסיה (IO Module), דיסק, מדף דיסקים, מתג, שרת אחסון, רישוי ותמיכה, ציוד נלווה</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>חילוץ מאפיינים:</strong> מהירות (100G/25G), אורך כבל (5m, 10m), מספר פורטים (Dual/Quad), קיבולת דיסק (15.3TB, NVMe) — ומציג תיאור מובנה בעברית</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>תג ביטחון (Confidence):</strong> כל רכיב מקבל ציון ביטחון — ירוק (גבוה) / צהוב (בינוני) / אדום (נמוך). פריט עם תג <strong>⚠ ביטחון נמוך</strong> סיווגו טעון אימות ידני</li>
                    <li><FiCheckCircle className="list-icon" /> ניתן לתקן קטגוריה שגויה ידנית בחלון "רכיבים שלא זוהו" לפני אישור סופי</li>
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
                    <li><FiAlertCircle className="list-icon" /> <strong>הקטגוריה נכונה?</strong> — האם הרכיב אכן כבל / ג׳יביק / רישוי?</li>
                    <li><FiAlertCircle className="list-icon" /> <strong>התיאור בעברית נכון?</strong> — האורך / המהירות / הפורטים חולצו נכון?</li>
                    <li><FiAlertCircle className="list-icon" /> <strong>שימו לב לתג ביטחון אדום</strong> — אלו הפריטים הנוטים ביותר לסיווג שגוי</li>
                    <li><FiCheckCircle className="list-icon" /> ניתן לדרוס את הסיווג ידנית בחלון "רכיבים שלא זוהו" לפני אישור</li>
                  </ul>
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

            {hasProcurementAccess && (
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
                    <p>השתמשו בטאבים למעל ("בתהליך" ו"הסתיים") כדי למיין בחזקה בין הזמנות פתוחות ובחסום.</p>
                  </div>
                </div>
              </>
            )}
            
            <div className="shortcuts-grid">
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
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default UserGuidePage;
