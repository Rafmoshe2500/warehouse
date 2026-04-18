import React, { useState } from 'react';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import './QuizCard.css';

const QuizCard = ({ question, options, correctIndex, explanation }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleCheck = () => {
    if (selectedIndex === null) return;
    setIsRevealed(true);
  };

  const handleReset = () => {
    setSelectedIndex(null);
    setIsRevealed(false);
  };

  const isCorrect = selectedIndex === correctIndex;

  return (
    <div className="quiz-card">
      <div className="quiz-question">{question}</div>
      <div className="quiz-options">
        {options.map((option, idx) => {
          let optionClass = 'quiz-option';
          if (isRevealed && idx === correctIndex) optionClass += ' correct';
          if (isRevealed && idx === selectedIndex && idx !== correctIndex) optionClass += ' incorrect';
          if (!isRevealed && idx === selectedIndex) optionClass += ' selected';

          return (
            <button
              key={idx}
              className={optionClass}
              onClick={() => !isRevealed && setSelectedIndex(idx)}
              disabled={isRevealed}
            >
              <span className="quiz-option-letter">{String.fromCharCode(1488 + idx)}</span>
              <span className="quiz-option-text">{option}</span>
              {isRevealed && idx === correctIndex && <FiCheckCircle className="quiz-result-icon correct" />}
              {isRevealed && idx === selectedIndex && idx !== correctIndex && <FiXCircle className="quiz-result-icon incorrect" />}
            </button>
          );
        })}
      </div>

      {!isRevealed ? (
        <button
          className="quiz-check-btn"
          onClick={handleCheck}
          disabled={selectedIndex === null}
        >
          בדוק תשובה
        </button>
      ) : (
        <div
          className={`quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`}
          role="alert"
          aria-live="polite"
        >
          <div className="quiz-feedback-header">
            {isCorrect ? (
              <><FiCheckCircle /> <span>תשובה נכונה!</span></>
            ) : (
              <><FiXCircle /> <span>לא בדיוק...</span></>
            )}
          </div>
          {explanation && <p className="quiz-explanation">{explanation}</p>}
          <button className="quiz-retry-btn" onClick={handleReset}>נסה שוב</button>
        </div>
      )}
    </div>
  );
};

export default QuizCard;
