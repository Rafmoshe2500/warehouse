import React from 'react';
import Skeleton from '../Skeleton/Skeleton';
import './SkeletonTable.css';

const SkeletonTable = ({ 
  rows = 8, 
  columns = 7,
  rowHeight = '2.5rem'
}) => {
  const skeletonRows = Array(rows).fill(0);
  const skeletonCells = Array(columns).fill(0);

  return (
    <div className="skeleton-table">
      <table>
        <thead>
          <tr>
            {skeletonCells.map((_, colIndex) => (
              <th key={colIndex}>
                <Skeleton width="80%" height="1rem" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skeletonRows.map((_, rowIndex) => (
            <tr key={rowIndex} className="skeleton-row">
              {skeletonCells.map((_, colIndex) => (
                <td key={`${rowIndex}-${colIndex}`}>
                  <Skeleton 
                    width={colIndex === 0 ? '60%' : '85%'} 
                    height="1rem"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SkeletonTable;
