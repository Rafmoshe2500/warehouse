import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './HotspotMarker.css';

const HotspotMarker = ({ top, left, label, description, number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});
  const [openDirection, setOpenDirection] = useState('below');
  const tooltipRef = useRef(null);
  const markerRef = useRef(null);

  const computePosition = useCallback(() => {
    if (!markerRef.current || !tooltipRef.current) return;
    const markerRect = markerRef.current.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;
    const tipW = tooltipEl.offsetWidth;
    const tipH = tooltipEl.offsetHeight;
    const gap = 10;
    const edgePad = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Decide vertical direction
    const spaceBelow = vh - markerRect.bottom - gap;
    const spaceAbove = markerRect.top - gap;
    const goAbove = spaceBelow < tipH + edgePad && spaceAbove > spaceBelow;
    setOpenDirection(goAbove ? 'above' : 'below');

    let tipTop = goAbove
      ? markerRect.top - tipH - gap
      : markerRect.bottom + gap;

    // Horizontal — center on marker, clamp to viewport
    const markerCenterX = markerRect.left + markerRect.width / 2;
    let tipLeft = markerCenterX - tipW / 2;
    tipLeft = Math.max(edgePad, Math.min(tipLeft, vw - tipW - edgePad));

    // Clamp vertical
    tipTop = Math.max(edgePad, Math.min(tipTop, vh - tipH - edgePad));

    setTooltipStyle({
      position: 'fixed',
      top: `${tipTop}px`,
      left: `${tipLeft}px`,
      width: `${tipW}px`,
    });

    // Arrow position — follow marker center relative to tooltip
    const arrowLeft = markerCenterX - tipLeft;
    setArrowStyle({ left: `${arrowLeft}px` });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    // Initial compute after paint
    requestAnimationFrame(computePosition);

    const handleClickOutside = (e) => {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target) &&
        markerRef.current && !markerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => setIsOpen(false);
    const handleResize = () => setIsOpen(false);

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, computePosition]);

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
      {isOpen && createPortal(
        <div
          ref={tooltipRef}
          className={`hotspot-tooltip hotspot-tooltip--${openDirection}`}
          style={tooltipStyle}
        >
          <div className="hotspot-tooltip-arrow" style={arrowStyle} />
          <div className="hotspot-tooltip-title">{label}</div>
          <div className="hotspot-tooltip-desc">{description}</div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default HotspotMarker;
