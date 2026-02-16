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
  FiHelpCircle
} from 'react-icons/fi';
import './UserGuidePage.css';

const UserGuidePage = () => {
  const [activeSection, setActiveSection] = useState('intro');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sections Configuration
  const sections = [
    { id: 'intro', label: 'מבוא למערכת', icon: <FiBox /> },
    { id: 'interface', label: 'ממשק וטבלאות', icon: <FiLayout /> },
    { id: 'collections', label: 'המלאי שלי', icon: <FiLayers /> },
    { id: 'procurement', label: 'רכש והצטיידות', icon: <FiShoppingCart /> },
    { id: 'pro-tips', label: 'טיפים למתקדמים', icon: <FiZap /> },
    { id: 'faq', label: 'שאלות נפוצות', icon: <FiHelpCircle /> },
  ];

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

          {/* Interface Section */}
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

          {/* Collections Section */}
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

          {/* Procurement Section */}
          <section id="procurement" className="content-section">
             <div className="section-header">
              <h2 className="section-title">רכש והצטיידות</h2>
              <p className="section-description">
                ניהול כל תהליך הרכש, מדרישה ועד קליטה במחסן.
              </p>
            </div>
            
            <div className="info-cards">
              <div className="info-card">
                <h4>1. יצירת דרישה</h4>
                <p>הקמת דרישת רכש חדשה, הגדרת פריטים, כמויות ותאריכי יעד.</p>
              </div>
              <div className="info-card">
                <h4>2. אישור תקציבי</h4>
                <p>הדרישה עוברת לאישור הגורמים הרלוונטיים במערכת.</p>
              </div>
              <div className="info-card">
                <h4>3. הזמנת רכש (PO)</h4>
                <p>הפקת הזמנה לספק ומעקב אחר סטטוס האספקה.</p>
              </div>
            </div>
          </section>

          {/* Pro Tips Section */}
          <section id="pro-tips" className="content-section">
            <div className="section-header">
              <h2 className="section-title">טיפים למקצוענים</h2>
            </div>
            
            <div className="shortcuts-grid">
              <div className="shortcut-item">
                <span className="key-combo">Ctrl + Z</span>
                <span className="key-desc">ביטול פעולה אחרונה (Undo)</span>
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
                <span className="key-combo">ESC</span>
                <span className="key-desc">ביטול עריכה / יציאה מחלונית</span>
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
