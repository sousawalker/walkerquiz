module.exports = (generatedQuestion) => {
  const { question, options } = generatedQuestion;

  const shuffledOptions = options
    .map((option) => ({ ...option, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ text, correct }) => ({ text, correct }));

  return `
import { useState, useEffect } from 'react';

interface Option {
  text: string;
  correct: boolean;
}

export const QuizQuestion = () => {
  const [highlight, setHighlight] = useState<boolean>(false);

  const options: Option[] = ${JSON.stringify(shuffledOptions)};
  const question: string = ${JSON.stringify(question)};

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
  `;
};
