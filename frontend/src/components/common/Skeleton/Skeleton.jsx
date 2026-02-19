import React from 'react';
import './Skeleton.css';

const Skeleton = ({ 
  width = '100%', 
  height = '1rem', 
  className = '',
  circle = false,
  count = 1,
  style = {}
}) => {
  const skeletons = Array(count).fill(0).map((_, i) => (
    <div
      key={i}
      className={`skeleton ${circle ? 'skeleton--circle' : ''} ${className}`}
      style={{
        width,
        height,
        ...style
      }}
    />
  ));

  return count === 1 ? skeletons[0] : <>{skeletons}</>;
};

export default Skeleton;
