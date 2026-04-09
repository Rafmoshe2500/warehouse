import React, { useState, useRef, useEffect } from 'react';
import './HotspotMarker.css';

const HotspotMarker = ({ top, left, label, description, number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target) &&
        markerRef.current && !markerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="hotspot-marker" style={{ top, left }}>
      <button
        ref={markerRef}
        className={`hotspot-dot ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={label}
      >
        {number && <span className="hotspot-number">{number}</span>}
      </button>
      {isOpen && (
        <div ref={tooltipRef} className="hotspot-tooltip">
          <div className="hotspot-tooltip-title">{label}</div>
          <div className="hotspot-tooltip-desc">{description}</div>
        </div>
      )}
    </div>
  );
};

export default HotspotMarker;
