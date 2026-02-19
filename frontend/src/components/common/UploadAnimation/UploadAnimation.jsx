import React from 'react';
import './UploadAnimation.css';

/**
 * UploadAnimation Component
 * Displays different animations based on upload type and progress
 * - S3: Floating Cloud animation (elegant, minimalist)
 * - Excel: Scan Lines animation (shows processing/scanning)
 */
const UploadAnimation = ({ 
  type = 's3', // 's3' or 'excel'
  status = 'uploading', // 'uploading', 'scanning', 'success'
  fileName = '',
  progress = 0 // 0-100 for optional progress indicator
}) => {
  const isExcel = type === 'excel';
  const isSuccess = status === 'success';

  return (
    <div className="upload-animation-container">
      {/* S3 Upload - Floating Cloud */}
      {!isExcel && (
        <div className="floating-cloud-wrapper">
          <div className="cloud-background">
            {/* Cloud SVG */}
            <svg
              viewBox="0 0 100 100"
              className="cloud-icon"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#64B5F6" />
                  <stop offset="100%" stopColor="#42A5F5" />
                </linearGradient>
              </defs>
              <path
                d="M 30 60 Q 20 60 20 50 Q 20 40 30 40 Q 35 25 50 25 Q 70 25 75 40 Q 85 40 85 50 Q 85 60 75 60 Z"
                fill="url(#cloudGradient)"
                opacity="0.9"
              />
            </svg>

            {/* Glow effect */}
            <div className="cloud-glow"></div>
          </div>

          {/* Upload document icon - moves from top and shrinks into cloud */}
          <div className={`floating-document ${isSuccess ? 'success' : 'uploading-motion'}`}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 2H5C3.9 2 3 2.9 3 4V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V10H15C13.9 10 13 9.1 13 8V2M9 2H15V8H21M9 2V8H15"
                stroke="#2196F3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {isSuccess && (
            <div className="success-checkmark">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 13L9 17L19 7"
                  stroke="#4CAF50"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Excel Import - Scan Lines */}
      {isExcel && (
        <div className="scan-lines-wrapper">
          <div className="excel-sheet">
            <div className="sheet-header">📄 Excel</div>
            <div className="sheet-content">
              <div className="sheet-row"></div>
              <div className="sheet-row"></div>
              <div className="sheet-row"></div>
              <div className="sheet-row"></div>
              <div className="sheet-row"></div>
            </div>

            {/* Scan lines animation */}
            <div className={`scan-line ${status === 'success' ? 'complete' : ''}`}></div>

            {/* Progress indicator */}
            {progress > 0 && (
              <div className="scan-progress">
                <span>{Math.round(progress)}%</span>
              </div>
            )}
          </div>

          {isSuccess && (
            <div className="scan-success-badge">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 13L9 17L19 7"
                  stroke="#4CAF50"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* File name and status */}
      <div className="upload-info">
        {fileName && <p className="file-name">{fileName}</p>}
        <p className="upload-status">
          {isExcel ? (
            status === 'scanning' ? 'סורק את הקובץ...' : 'מעלה לשרת...'
          ) : (
            'משדרג לענן...'
          )}
        </p>
      </div>
    </div>
  );
};

export default UploadAnimation;
