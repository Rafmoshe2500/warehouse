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

  // Sections Configuration - filtered by permissions
  const baseSections = [
    { id: 'intro', label: 'מבוא למערכת', icon: <FiBox />, visible: true },
    { id: 'dashboard', label: 'דשבורד', icon: <FiLayout />, visible: true },
    { id: 'interface', label: 'ממשק וטבלאות', icon: <FiLayout />, visible: hasInventoryAccess },
    { id: 'collections', label: 'המלאי שלי', icon: <FiLayers />, visible: hasInventoryAccess },
    { id: 'stale-items', label: 'פריטים ישנים', icon: <FiArchive />, visible: hasInventoryAccess },
    { id: 'procurement', label: 'רכש והצטיידות', icon: <FiShoppingCart />, visible: hasProcurementAccess },
    { id: 'audit-logs', label: 'יומן פעילות', icon: <FiClipboard />, visible: true },
    { id: 'pro-tips', label: 'טיפים למתקדמים', icon: <FiZap />, visible: true },
    { id: 'faq', label: 'שאלות נפוצות', icon: <FiHelpCircle />, visible: true },
  ];

  const sections = baseSections.filter(s => s.visible);

  // Scroll Spy Effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // Offset for header

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= scrollPosition && (element.offsetTop + element.offsetHeight) > scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100, // Offset for sticky header
        behavior: 'smooth'
      });
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
                <div className="card-icon blue"><FiBox /></div>
                <h3>ניהול מלאי</h3>
                <p>צפייה בזמן אמת בכמויות, מיקומים וסטטוסים של פריטים במחסן המרכזי.</p>
              </div>
              <div className="feature-card">
                <div className="card-icon purple"><FiLayers /></div>
                <h3>אוספים אישיים</h3>
                <p>יצירת רשימות ציוד מותאמות לפרויקטים עליהם אתם עובדים.</p>
              </div>
              <div className="feature-card">
                <div className="card-icon green"><FiShoppingCart /></div>
                <h3>תהליכי רכש</h3>
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
                  האזור האישי שלכם לניהול פרויקטים. כאן אתם בונים את ה-"BOM" (רשימת חומרים) שלכם.
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

              <div className="feature-block">
                 <h3>איך משייכים פריטים לאוסף?</h3>
                 <p>הדרך הקלה ביותר היא דרך מסך המלאי הראשי:</p>
                 <ol className="modern-list">
                   <li>סמנו את הפריטים הרצויים בטבלה (Ctrl / Shift לבחירה מרובה).</li>
                   <li>לחצו <strong>קליק ימני</strong> על אחד הפריטים המסומנים.</li>
                   <li>עמדו על <strong>"שייך למלאי שלי"</strong> ובחרו את האוסף הרצוי מהרשימה.</li>
                   <li>זהו! הפריטים ממתינים לכם באוסף.</li>
                 </ol>
              </div>
            </section>
          )}

          {/* Dashboard Section */}
          <section id="dashboard" className="content-section accent-bg">
            <div className="section-header">
              <h2 className="section-title">דשבורד - מרכז הבקרה</h2>
              <p className="section-description">
                דשבורד הבית מציג סקירה כללית של מצב המערכת, מטרים חשובים וקישורים מהירים.
              </p>
            </div>

            <div className="guide-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>כרטיסי מטרים (KPIs)</h3>
                <p>כרטיסים בראש העמוד מציגים מספרים חשובים:</p>
                  <ul className="feature-list">
                    <li><FiCheckCircle className="list-icon" /> <strong>סך הפריטים:</strong> מספר כל הפריטים במלאי + שינוי מאתמול</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>סך ההזמנות:</strong> כמות הזמנות פתוחות</li>
                    <li><FiCheckCircle className="list-icon" /> <strong>משתמשים פעילים:</strong> כמה משתמשים משתמשים כרגע</li>
                  </ul>
              </div>
            </div>

            <div className="guide-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>תרשימים ותרends</h3>
                <p>הגרפים מציגים מגמות על פני הזמן. ניתן להמתין מעל גרף לראות ערכים מדויקים בתאריכים ספציפיים.</p>
              </div>
            </div>

            <div className="guide-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>התראות וביוטי ❗</h3>
                <p>בחלק התחתון תראו הודעות על דברים החשובים:</p>
                  <ul className="feature-list">
                    <li><FiAlertCircle className="list-icon" /> פריטים עם מלאי נמוך</li>
                    <li><FiAlertCircle className="list-icon" /> הזמנות שדורשות תשומת לב</li>
                    <li><FiAlertCircle className="list-icon" /> פריטים שלא עודכנו זמן רב</li>
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
                  ניהול כל תהליך הרכש, מדרישה ועד קליטה במחסן.
                </p>
              </div>
              
              <div className="guide-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>יצירת הזמנה חדשה</h3>
                  <p>לחצו על כפתור "הזמנה חדשה" בראש הדף. מלאו את הפרטים:</p>
                    <ul className="feature-list">
                      <li><FiCheckCircle className="list-icon" /> <strong>מק"ט ויצרן:</strong> זהות הפריט</li>
                      <li><FiCheckCircle className="list-icon" /> <strong>תיאור:</strong> פרטים נוספים</li>
                      <li><FiCheckCircle className="list-icon" /> <strong>כמות וסכום:</strong> כמה להזמין ובאיזה תקציב</li>
                      <li><FiCheckCircle className="list-icon" /> <strong>סטטוס:</strong> המצב ההתחלתי של ההזמנה</li>
                    </ul>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>מעקב אחר סטטוסים</h3>
                  <p>כל הזמנה עובדת דרך שלבים:</p>
                    <ul className="feature-list">
                      <li>⏳ <strong>בהמתנה:</strong> הזמנה חדשה שעדיין בעריכה</li>
                      <li>📤 <strong>בהזמנה:</strong> שודרה לספק</li>
                      <li>📦 <strong>בדרך:</strong> בהשהיה לקליטה</li>
                      <li>✅ <strong>הגיעה:</strong> קלוטה ברשותנו</li>
                    </ul>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>הוספת קבצים</h3>
                  <p>לכל הזמנה ניתן להוסיף קבצים - חשמליות, EMF, BOM, דוקומנטציה. לחצו על ההזמנה לפתיחת הפרטים, ואז "הוסף קבצים".</p>
                </div>
              </div>

              <div className="tip-box highlight">
                <div className="tip-icon"><FiAlertCircle /></div>
                <div className="tip-content">
                  <h4>💡 עצה: סמנו כשהגיע</h4>
                  <p>כאשר קבלתם את ההזמנה, סמנו "BOM התקבל" ו"EMF התקבל" כדי שהמערכת תדע שהתהליך הושלם.</p>
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
