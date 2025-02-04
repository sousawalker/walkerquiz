
import { useState, useEffect } from 'react';

interface Option {
  text: string;
  correct: boolean;
}

export const QuizQuestion = () => {
  const [highlight, setHighlight] = useState<boolean>(false);

  const options: Option[] = [{"text":"Girafa","correct":false},{"text":"Gato","correct":true},{"text":"Tartaruga","correct":false},{"text":"Camaleão","correct":false}];
  const question: string = "Qual é o único animal que consegue sobreviver a uma queda de qualquer altura sem se machucar?";

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHighlight(true);
    }, 15000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="question-container">
      <h2 className="question-text">
        {question}
      </h2>

      <div className="options-grid">
        {options.map((option: Option, index: number) => (
          <button
            key={index}
            className={
              "option-button fade-in-up delay-" + (index + 1) +
              (highlight && option.correct ? " correct correct-highlight" : "")
            }
            disabled
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
};
  