import { useEffect, useRef, useState } from 'react';

export const CountdownTimer = () => {
  const countdownRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const countdownElement = countdownRef.current;
    if (countdownElement) {
      countdownElement.addEventListener('animationend', () => {
        setTimeout(() => {
          setIsVisible(false);
        }, 10000);
      });
    }
  }, []);

  return (
    <div ref={countdownRef} className={`countdown-container ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="countdown-number"></div>
      
      <svg className="countdown-svg" viewBox="0 0 40 40">
        <circle r="18" cx="20" cy="20"></circle>
      </svg>
    </div>
  );
};