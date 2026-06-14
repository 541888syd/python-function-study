import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { functionsApi } from '../api';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [funcName, setFuncName] = useState('');
  const [library, setLibrary] = useState('');
  const [description, setDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showQuickAdd && nameRef.current) {
      nameRef.current.focus();
    }
  }, [showQuickAdd]);

  // Auto-detect library from function name like "os.path.join" -> library="os.path"
  const handleNameChange = (val: string) => {
    setFuncName(val);
    // If name contains dots, extract library from first segments
    const parts = val.split('.');
    if (parts.length >= 2) {
      setLibrary(parts.slice(0, -1).join('.'));
    }
  };

  const handleQuickAdd = async () => {
    if (!funcName.trim() || !library.trim() || !description.trim()) return;
    setAdding(true);
    try {
      await functionsApi.add({
        name: funcName.trim(),
        library: library.trim(),
        description: description.trim(),
      });
      setFuncName('');
      setLibrary('');
      setDescription('');
      setShowQuickAdd(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && funcName.trim() && library.trim() && description.trim()) {
      handleQuickAdd();
    }
    if (e.key === 'Escape') {
      setShowQuickAdd(false);
    }
  };

  const links = [
    { to: '/', label: '仪表盘', icon: '📊' },
    { to: '/functions', label: '函数库', icon: '📦' },
    { to: '/practice', label: '练习', icon: '✍️' },
    { to: '/stats', label: '统计', icon: '📈' },
    { to: '/settings', label: '设置', icon: '⚙️' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary-700 shrink-0">
            🐍 Python函数学习
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
          <div className="py-3 border-t border-gray-100 flex items-center gap-3 flex-wrap">
            <input
              ref={nameRef}
              type="text"
              placeholder="函数名 (如 os.path.join)"
              value={funcName}
              onChange={e => handleNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-field flex-1 min-w-[160px]"
            />
            <input
              type="text"
              placeholder="所属库 (如 os)"
              value={library}
              onChange={e => setLibrary(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-field w-32"
            />
            <input
              type="text"
              placeholder="功能描述"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-field flex-1 min-w-[200px]"
            />
            <button
              onClick={handleQuickAdd}
              disabled={adding || !funcName.trim() || !library.trim() || !description.trim()}
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
