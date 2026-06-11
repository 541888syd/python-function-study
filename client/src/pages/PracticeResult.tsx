import { useLocation, useNavigate, Link } from 'react-router-dom';
import type { PracticeWord } from '../types';

interface Result {
  word: PracticeWord;
  userInput: string;
  correct: boolean;
  correctAnswer: string;
  timeSpent: number;
  skipped: boolean;
}

export default function PracticeResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { results: Result[]; totalTime: number } | null;

  if (!state || !state.results) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">没有练习数据</p>
        <Link to="/practice" className="btn-primary">去练习</Link>
      </div>
    );
  }

  const { results, totalTime } = state;
  const correctCount = results.filter(r => r.correct).length;
  const skippedCount = results.filter(r => r.skipped).length;
  const wrongCount = results.filter(r => !r.correct && !r.skipped).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
  const avgTime = results.length > 0 ? (results.reduce((s, r) => s + r.timeSpent, 0) / results.length).toFixed(1) : '0';

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">🎯 练习完成！</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-gray-800">{results.length}</div>
          <div className="text-xs text-gray-400">总题数</div>
        </div>
        <div className="card text-center py-4 bg-green-50">
          <div className="text-3xl font-bold text-green-600">{correctCount}</div>
          <div className="text-xs text-green-500">正确</div>
        </div>
        <div className="card text-center py-4 bg-red-50">
          <div className="text-3xl font-bold text-red-500">{wrongCount}</div>
          <div className="text-xs text-red-400">错误</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-primary-600">{accuracy}%</div>
          <div className="text-xs text-gray-400">正确率</div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex justify-between text-sm text-gray-500">
          <span>总用时: {Math.floor(totalTime / 60)}分{Math.round(totalTime % 60)}秒</span>
          <span>平均每题: {avgTime}秒</span>
          <span>跳过: {skippedCount}题</span>
        </div>
      </div>

      {/* Result List */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-3">答题详情</h2>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded-lg ${
                r.correct ? 'bg-green-50' : r.skipped ? 'bg-gray-50' : 'bg-red-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={r.correct ? 'text-green-500' : r.skipped ? 'text-gray-400' : 'text-red-500'}>
                  {r.correct ? '✅' : r.skipped ? '⏭️' : '❌'}
                </span>
                <div>
                  <span className="font-medium">{r.word.word}</span>
                  <span className="text-gray-400 mx-1">—</span>
                  <span className="text-gray-500 text-sm">{r.word.meaning}</span>
                </div>
              </div>
              <div className="text-sm">
                {!r.correct && !r.skipped && (
                  <div className="text-right">
                    <div className="text-red-500 line-through">{r.userInput || '(空)'}</div>
                    <div className="text-green-600">{r.correctAnswer}</div>
                  </div>
                )}
                <div className="text-gray-400 text-xs text-right">{r.timeSpent.toFixed(1)}s</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <button onClick={() => navigate('/practice')} className="btn-primary text-lg px-6">
          再来一组
        </button>
        <button onClick={() => navigate('/')} className="btn-secondary text-lg px-6">
          返回首页
        </button>
      </div>
    </div>
  );
}
