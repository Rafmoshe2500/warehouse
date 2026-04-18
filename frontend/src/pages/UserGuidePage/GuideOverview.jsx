import React from 'react';
import { Link } from 'react-router-dom';
import { FiBox, FiLayers, FiShoppingCart, FiCheckCircle, FiAlertCircle, FiChevronsRight } from 'react-icons/fi';
import GuidePageLayout from './GuidePageLayout';

const GuideOverview = () => {
  return (
    <GuidePageLayout>
      {/* Intro Section */}
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">ברוכים הבאים למערכת הניהול</h2>
          <p className="section-description">
            מערכת ה-Warehouse נועדה להעניק לכם שליטה מלאה על שרשרת האספקה, החל מניהול המלאי במחסן ועד להזמנות רכש מורכבות.
          </p>
        </div>
        
        <div className="cards-grid">
          <Link to="/guide/interface" className="feature-card" style={{ textDecoration: 'none' }}>
            <h3 className="feature-card-header">
              <div className="card-icon blue"><FiBox /></div>
              <span>ניהול מלאי</span>
            </h3>
            <p>צפייה בזמן אמת בכמויות, מיקומים וסטאטוסים של פריטים במחסן המרכזי.</p>
          </Link>
          <Link to="/guide/collections" className="feature-card" style={{ textDecoration: 'none' }}>
            <h3 className="feature-card-header">
              <div className="card-icon purple"><FiLayers /></div>
              <span>אוספים אישיים</span>
            </h3>
            <p>יצירת רשימות ציוד מותאמות לפרויקטים עליהם אתם עובדים.</p>
          </Link>
          <Link to="/guide/procurement" className="feature-card" style={{ textDecoration: 'none' }}>
            <h3 className="feature-card-header">
              <div className="card-icon green"><FiShoppingCart /></div>
              <span>תהליכי רכש</span>
            </h3>
            <p>ביצוע הזמנות, מעקב אחר סטאטוסים וניהול ספקים במקום אחד.</p>
          </Link>
        </div>
      </section>

      {/* Navigation Section */}
      <section className="content-section">
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
    </GuidePageLayout>
  );
};

export default GuideOverview;
