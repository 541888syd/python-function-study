import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { practiceApi } from '../api';
import type { PracticeFunction } from '../types';

interface PracticeResult {
  func: PracticeFunction;
  userInput: string;
  correct: boolean;
  correctAnswer: string;
  timeSpent: number;
  skipped: boolean;
}

const MODE_LABELS: Record<string, { label: string; icon: string }> = {
  name2usage: { label: '函数→描述', icon: '📝' },
  usage2name: { label: '描述→函数', icon: '🔍' },
};

export default function Practice() {
  const navigate = useNavigate();
  const [funcs, setFuncs] = useState<PracticeFunction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());
  const [sessionStart] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [waitingConfirm, setWaitingConfirm] = useState(false);

  useEffect(() => {
    practiceApi.start()
      .then(res => {
        setFuncs(res.functions);
        setStartTime(Date.now());
        if (res.functions.length === 0) {
          alert('暂无可练习的函数，请先去函数库添加函数！');
          navigate('/functions');
        }
      })
      .catch(err => {
        console.error(err);
        alert('加载练习失败，请重试');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    const el = currentFunc?.mode === 'name2usage' ? textareaRef.current : inputRef.current;
    if (el && !feedback) el.focus();
  }, [currentIndex, feedback]);

  const currentFunc = funcs[currentIndex];

  const handleSubmit = useCallback(async (skip: boolean = false) => {
    if (!currentFunc || feedback) return;
    const timeSpent = (Date.now() - startTime) / 1000;
    const input = skip ? '' : userInput;
    try {
      const res = await practiceApi.submit({
        functionId: currentFunc.id,
        userInput: input,
        mode: currentFunc.mode,
        timeSpent,
        skip,
      });
      setCorrectAnswer(res.correctAnswer);
      setResults(prev => [...prev, {
        func: currentFunc, userInput: input,
        correct: res.correct, correctAnswer: res.correctAnswer,
        timeSpent, skipped: skip,
      }]);
      if (res.correct) {
        setFeedback('correct');
        setTimeout(() => goNext(), 600);
      } else {
        setFeedback('wrong');
        setWaitingConfirm(true);
      }
    } catch (err) { console.error(err); }
  }, [currentFunc, userInput, startTime, feedback]);

  const goNext = () => {
    if (currentIndex + 1 >= funcs.length) {
      navigate('/practice/result', {
        state: { results: [...results], totalTime: (Date.now() - sessionStart) / 1000 },
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
      if (waitingConfirm) { goNext(); return; }
      // For textarea, Shift+Enter to submit; for input, Enter to submit
      if (currentFunc?.mode === 'name2usage' && e.shiftKey) return;
      if (currentFunc?.mode !== 'name2usage' || e.shiftKey || !e.shiftKey) {
        e.preventDefault();
        handleSubmit(false);
      }
    }
    if (e.key === 'Escape') handleSubmit(true);
  };

  if (loading) return <div className="text-center py-12 text-gray-400">准备练习中...</div>;
  if (!currentFunc) return <div className="text-center py-12 text-gray-400">没有更多题目了</div>;

  const progress = ((currentIndex + (feedback ? 1 : 0)) / funcs.length) * 100;
  const modeInfo = MODE_LABELS[currentFunc.mode];
  const isDescribe = currentFunc.mode === 'name2usage';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">✍️ 练习中</h1>
          <span className="text-sm text-gray-400">{currentIndex + 1} / {funcs.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-primary-500 h-2 rounded-full transition-all duration-300"
               style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className={`card mb-4 transition-all duration-200 ${
        feedback === 'correct' ? 'ring-2 ring-green-400 bg-green-50' :
        feedback === 'wrong' ? 'ring-2 ring-red-400 bg-red-50' : ''
      }`}>
        {/* Mode indicator */}
        <div className="text-center mb-4">
          <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600">
            {modeInfo.icon} {modeInfo.label}
          </span>
        </div>

        {/* Prompt */}
        <div className="text-center mb-6">
          {isDescribe ? (
            <div>
              <p className="text-2xl font-bold text-gray-800 font-mono">{currentFunc.prompt}</p>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 mt-1 inline-block">
                {currentFunc.library}
              </span>
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-800">{currentFunc.prompt}</p>
          )}
        </div>

        {/* Input */}
        <div className="relative">
          {isDescribe ? (
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!!feedback}
              placeholder="描述这个函数的功能，大概说明白就行..."
              className={`input-field text-center py-4 min-h-[80px] ${
                feedback === 'correct' ? 'border-green-400 bg-green-50' :
                feedback === 'wrong' ? 'border-red-400 bg-red-50' : ''
              }`}
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!!feedback}
              placeholder="输入函数名..."
              className={`input-field text-center text-xl py-4 ${
                feedback === 'correct' ? 'border-green-400 bg-green-50' :
                feedback === 'wrong' ? 'border-red-400 bg-red-50' : ''
              }`}
              autoComplete="off"
            />
          )}

          {/* Feedback */}
          {feedback && (
            <div className={`text-center mt-4 py-3 rounded-lg ${
              feedback === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <div className="text-2xl font-bold mb-1">
                {feedback === 'correct' ? '✅ 正确！' : '❌ 错误'}
              </div>
              {feedback === 'wrong' && (
                <div className="text-lg">
                  <div className="text-red-500 line-through mb-1">{userInput || '(空)'}</div>
                  <div className="font-bold text-green-700 font-mono">{correctAnswer}</div>
                  <div className="text-sm mt-2 text-gray-500">
                    {isDescribe ? (
                      <span>以上为参考答案，意思差不多就算对</span>
                    ) : (
                      <>{currentFunc.library}.{correctAnswer} — {currentFunc.description}</>
                    )}
                  </div>
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
        <button onClick={() => handleSubmit(false)}
          disabled={!!feedback || !userInput.trim()} className="btn-primary text-lg px-8 py-3">
          确认 (Enter)
        </button>
        <button onClick={() => handleSubmit(true)}
          disabled={!!feedback} className="btn-secondary text-lg px-8 py-3">
          跳过 (Esc)
        </button>
      </div>

      {/* Status */}
      {currentFunc.status !== 'new' && (
        <div className="text-center mt-3 text-xs text-gray-400">
          复习 · 掌握度 {Math.round(currentFunc.mastery * 100)}%
        </div>
      )}
    </div>
  );
}
