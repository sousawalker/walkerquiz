import { QuizBurst } from './components/QuizBurst';
import { QuizQuestion } from './components/QuizQuestion';
import { CountdownTimer } from './components/CountdownTimer';
import { ChannelStamp } from './components/ChannelStamp';

function App() {
  return (
    <div className="quiz-container">
      <div className="quiz-content fade-in">
        <QuizBurst />
        
        <CountdownTimer />
        
        <QuizQuestion />

        <ChannelStamp />
      </div>
    </div>
  );
}

export default App;