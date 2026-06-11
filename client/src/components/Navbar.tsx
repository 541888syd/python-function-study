import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { wordsApi } from '../api';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showQuickAdd && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showQuickAdd]);

  const handleQuickAdd = async () => {
    if (!word.trim() || !meaning.trim()) return;
    setAdding(true);
    try {
      await wordsApi.add({ word: word.trim(), meaning: meaning.trim() });
      setWord('');
      setMeaning('');
      setShowQuickAdd(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && word.trim() && meaning.trim()) {
      handleQuickAdd();
    }
    if (e.key === 'Escape') {
      setShowQuickAdd(false);
    }
  };

  const links = [
    { to: '/', label: '仪表盘', icon: '📊' },
    { to: '/words', label: '单词本', icon: '📖' },
    { to: '/practice', label: '练习', icon: '✍️' },
    { to: '/stats', label: '统计', icon: '📈' },
    { to: '/settings', label: '设置', icon: '⚙️' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary-700 shrink-0">
            📚 英语学习
          </Link>

          <div className="flex items-center gap-1">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === l.to
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="hidden sm:inline">{l.icon} {l.label}</span>
                <span className="sm:hidden text-lg">{l.icon}</span>
              </Link>
            ))}
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="ml-2 btn-primary text-sm py-1.5"
            >
              + 快速添加
            </button>
          </div>
        </div>

        {/* Quick Add Panel */}
        {showQuickAdd && (
          <div className="py-3 border-t border-gray-100 flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              placeholder="英文单词"
              value={word}
              onChange={e => setWord(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-field flex-1"
            />
            <input
              type="text"
              placeholder="中文释义"
              value={meaning}
              onChange={e => setMeaning(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-field flex-1"
            />
            <button
              onClick={handleQuickAdd}
              disabled={adding || !word.trim() || !meaning.trim()}
              className="btn-primary shrink-0"
            >
              {adding ? '添加中...' : '添加'}
            </button>
            <button
              onClick={() => setShowQuickAdd(false)}
              className="btn-secondary shrink-0"
            >
              取消
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
