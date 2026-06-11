import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { practiceApi } from '../api';
import type { PracticeWord } from '../types';

interface PracticeResult {
  word: PracticeWord;
  userInput: string;
  correct: boolean;
  correctAnswer: string;
  timeSpent: number;
  skipped: boolean;
}

export default function Practice() {
  const navigate = useNavigate();
  const [words, setWords] = useState<PracticeWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());
  const [sessionStart] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const [waitingConfirm, setWaitingConfirm] = useState(false);

  useEffect(() => {
    practiceApi.start()
      .then(res => {
        setWords(res.words);
        setStartTime(Date.now());
        if (res.words.length === 0) {
          alert('暂无可练习的单词，请先去单词本添加单词！');
          navigate('/words');
        }
      })
      .catch(err => {
        console.error(err);
        alert('加载练习失败，请重试');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (inputRef.current && !feedback) {
      inputRef.current.focus();
    }
  }, [currentIndex, feedback]);

  const currentWord = words[currentIndex];

  const handleSubmit = useCallback(async (skip: boolean = false) => {
    if (!currentWord || feedback) return;

    const timeSpent = (Date.now() - startTime) / 1000;
    const input = skip ? '' : userInput;

    try {
      const res = await practiceApi.submit({
        wordId: currentWord.id,
        userInput: input,
        mode: currentWord.mode,
        timeSpent,
        skip,
      });

      setCorrectAnswer(res.correctAnswer);
      setResults(prev => [...prev, {
        word: currentWord,
        userInput: input,
        correct: res.correct,
        correctAnswer: res.correctAnswer,
        timeSpent,
        skipped: skip,
      }]);

      if (res.correct) {
        setFeedback('correct');
        // Auto-advance after 0.5s for correct answers
        setTimeout(() => {
          goNext();
        }, 500);
      } else {
        setFeedback('wrong');
        setWaitingConfirm(true);
      }
    } catch (err) {
      console.error(err);
    }
  }, [currentWord, userInput, startTime, feedback]);

  const goNext = () => {
    if (currentIndex + 1 >= words.length) {
      // Session complete - navigate to result page with data
      navigate('/practice/result', {
        state: {
          results: [...results],
          totalTime: (Date.now() - sessionStart) / 1000,
        },
      });
    } else {
      setCurrentIndex(i => i + 1);
      setUserInput('');
      setFeedback(null);
      setCorrectAnswer('');
      setStartTime(Date.now());
      setWaitingConfirm(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (waitingConfirm) {
        goNext();
      } else {
        handleSubmit(false);
      }
    }
    if (e.key === 'Escape') {
      handleSubmit(true); // Skip
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">准备练习题中...</div>;
  }

  if (!currentWord) {
    return <div className="text-center py-12 text-gray-400">没有更多题目了</div>;
  }

  const progress = ((currentIndex + (feedback ? 1 : 0)) / words.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">✍️ 练习中</h1>
          <span className="text-sm text-gray-400">
            {currentIndex + 1} / {words.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className={`card mb-4 transition-all duration-200 ${
        feedback === 'correct' ? 'ring-2 ring-green-400 bg-green-50' :
        feedback === 'wrong' ? 'ring-2 ring-red-400 bg-red-50' : ''
      }`}>
        {/* Mode indicator */}
        <div className="text-center mb-4">
          <span className={`text-xs px-3 py-1 rounded-full ${
            currentWord.mode === 'cn2en'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-purple-100 text-purple-600'
          }`}>
            {currentWord.mode === 'cn2en' ? '中 → 英' : '英 → 中'}
          </span>
        </div>

        {/* Prompt */}
        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-gray-800">{currentWord.prompt}</p>
          {currentWord.phonetic && currentWord.mode === 'en2cn' && (
            <p className="text-gray-400 mt-1">{currentWord.phonetic}</p>
          )}
        </div>

        {/* Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!!feedback}
            placeholder={currentWord.mode === 'cn2en' ? '输入英文单词...' : '输入中文释义...'}
            className={`input-field text-center text-xl py-4 ${
              feedback === 'correct' ? 'border-green-400 bg-green-50' :
              feedback === 'wrong' ? 'border-red-400 bg-red-50' : ''
            }`}
            autoComplete="off"
            autoCapitalize="off"
          />

          {/* Feedback overlay */}
          {feedback && (
            <div className={`text-center mt-4 py-3 rounded-lg ${
              feedback === 'correct' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>
              <div className="text-2xl font-bold mb-1">
                {feedback === 'correct' ? '✅ 正确！' : '❌ 错误'}
              </div>
              {currentWord.mode === 'cn2en' && (
                <div className="text-lg">
                  <span className="text-gray-500">{currentWord.meaning}</span>
                  {' = '}
                  <span className="font-bold">{correctAnswer}</span>
                  {currentWord.phonetic && <span className="text-sm text-gray-400 ml-1">{currentWord.phonetic}</span>}
                </div>
              )}
              {currentWord.mode === 'en2cn' && (
                <div className="text-lg">
                  <span className="font-bold">{currentWord.word}</span>
                  {' = '}
                  <span className="text-gray-500">{correctAnswer}</span>
                </div>
              )}
              {waitingConfirm && (
                <button onClick={goNext} className="btn-primary mt-3" autoFocus>
                  继续下一题 (Enter)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => handleSubmit(false)}
          disabled={!!feedback || !userInput.trim()}
          className="btn-primary text-lg px-8 py-3"
        >
          确认 (Enter)
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={!!feedback}
          className="btn-secondary text-lg px-8 py-3"
        >
          跳过 (Esc)
        </button>
      </div>

      {/* Word status indicator */}
      {currentWord.status !== 'new' && (
        <div className="text-center mt-3 text-xs text-gray-400">
          复习单词 · 掌握度 {Math.round(currentWord.mastery * 100)}%
        </div>
      )}
    </div>
  );
}
