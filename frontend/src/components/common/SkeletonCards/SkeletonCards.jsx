import React from 'react';
import Skeleton from '../Skeleton/Skeleton';
import './SkeletonCards.css';

const SkeletonCards = ({ 
  count = 3,
  variant = 'collection' // 'collection' or 'card'
}) => {
  const cards = Array(count).fill(0);

  if (variant === 'collection') {
    return (
      <div className="skeleton-cards skeleton-cards--collection">
        {cards.map((_, index) => (
          <div key={index} className="skeleton-card skeleton-card--collection">
            <Skeleton width="100%" height="150px" />
            <div className="skeleton-card-content">
              <Skeleton width="80%" height="1.25rem" style={{ marginBottom: '0.5rem' }} />
              <Skeleton width="60%" height="1rem" />
              <div className="skeleton-card-footer">
                <Skeleton width="40%" height="0.875rem" />
                <Skeleton width="30%" height="0.875rem" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="skeleton-cards">
      {cards.map((_, index) => (
        <div key={index} className="skeleton-card">
          <Skeleton width="100%" height="100%" />
        </div>
      ))}
    </div>
  );
};

export default SkeletonCards;
