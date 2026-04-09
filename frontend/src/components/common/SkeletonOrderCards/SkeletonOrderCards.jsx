import React from 'react';
import Skeleton from '../Skeleton/Skeleton';
import './SkeletonOrderCards.css';

const SkeletonOrderCard = () => (
  <div className="skeleton-order-card">
    {/* Row 1: vendor dot + name, status pill, spacer, date, amount */}
    <div className="skeleton-oc-top">
      <Skeleton circle width="7px" height="7px" style={{ flexShrink: 0 }} />
      <Skeleton width="60px" height="0.8rem" />
      <Skeleton width="80px" height="1.3rem" style={{ borderRadius: '999px' }} />
      <div className="skeleton-oc-spacer" />
      <Skeleton width="90px" height="0.8rem" />
      <Skeleton width="70px" height="0.8rem" />
    </div>

    {/* Row 2: items grid 2-col */}
    <div className="skeleton-oc-items">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="skeleton-oc-item-row">
          <Skeleton circle width="7px" height="7px" style={{ flexShrink: 0 }} />
          <div className="skeleton-oc-item-info">
            <Skeleton width="70%" height="0.8rem" />
            <Skeleton width="45%" height="0.7rem" />
          </div>
          <Skeleton width="24px" height="0.75rem" />
        </div>
      ))}
    </div>

    {/* Row 3: pipeline + action icons */}
    <div className="skeleton-oc-bottom">
      <div className="skeleton-oc-pipeline">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <React.Fragment key={i}>
            <div className="skeleton-oc-step">
              <Skeleton circle width="10px" height="10px" />
              <Skeleton width="28px" height="0.65rem" />
            </div>
            {i < 5 && <div className="skeleton-oc-line" />}
          </React.Fragment>
        ))}
      </div>
      <div className="skeleton-oc-actions">
        {[0, 1, 2, 3].map(i => (
          <Skeleton key={i} circle width="26px" height="26px" />
        ))}
      </div>
    </div>
  </div>
);

const SkeletonOrderCards = ({ count = 6 }) => {
  return (
    <div className="skeleton-order-cards-list">
      {Array(count).fill(0).map((_, i) => (
        <SkeletonOrderCard key={i} />
      ))}
    </div>
  );
};

export default SkeletonOrderCards;
