import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { statsApi, practiceApi, functionsApi } from '../api';
import type { OverviewStats, TodayProgress, PythonFunction } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [progress, setProgress] = useState<TodayProgress | null>(null);
  const [recentFuncs, setRecentFuncs] = useState<PythonFunction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      statsApi.overview(),
      practiceApi.getToday(),
      functionsApi.list(),
    ]).then(([s, p, f]) => {
      setStats(s);
      setProgress(p);
      setRecentFuncs(f.functions.slice(0, 5));
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  const percent = progress ? Math.round((progress.completed / progress.goal) * 100) : 0;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📊 仪表盘</h1>

      {/* Start Practice CTA */}
      <div className="card mb-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">
              {progress && progress.completed >= progress.goal
                ? '🎉 今日目标已完成！'
                : progress && progress.completed > 0
                ? `今日进度 ${progress.completed}/${progress.goal}`
                : '开始今日练习'}
            </h2>
            <p className="text-primary-100 text-sm">
              {progress && progress.completed < progress.goal
                ? `还有 ${progress.goal - progress.completed} 个函数等你练习`
                : '继续保持，巩固记忆！'}
            </p>
          </div>
          <button
            onClick={() => navigate('/practice')}
            className="bg-white text-primary-600 px-6 py-3 rounded-xl font-bold text-lg hover:bg-primary-50 transition-colors shadow-lg"
          >
            {progress && progress.completed > 0 ? '继续练习' : '开始练习'}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-3xl mb-1">📦</div>
          <div className="text-2xl font-bold text-gray-800">{stats?.totalFunctions || 0}</div>
          <div className="text-sm text-gray-400">函数总数</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-1">✅</div>
          <div className="text-2xl font-bold text-green-600">{progress?.completed || 0}</div>
          <div className="text-sm text-gray-400">今日已练</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-1">🔥</div>
          <div className="text-2xl font-bold text-orange-500">{stats?.streak || 0}</div>
          <div className="text-sm text-gray-400">连续打卡</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-1">🎯</div>
          <div className="text-2xl font-bold text-primary-600">
            {stats ? Math.round((stats.masteredFunctions / Math.max(stats.totalFunctions, 1)) * 100) : 0}%
          </div>
          <div className="text-sm text-gray-400">掌握率</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Progress Ring */}
        <div className="card flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4">今日进度</h3>
          <div className="relative w-48 h-48">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle cx="96" cy="96" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
              <circle
                cx="96" cy="96" r={radius} fill="none"
                stroke={percent >= 100 ? '#22c55e' : '#3b82f6'}
                strokeWidth="12" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-800">{percent}%</span>
              <span className="text-sm text-gray-400">{progress?.completed || 0}/{progress?.goal || 20}</span>
            </div>
          </div>
        </div>

        {/* Recent Functions */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">最近添加</h3>
          {recentFuncs.length === 0 ? (
            <p className="text-gray-400 text-sm">还没有函数，快去添加吧</p>
          ) : (
            <div className="space-y-2">
              {recentFuncs.map(f => (
                <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono mr-1">{f.library}</span>
                    <span className="font-medium text-gray-800">{f.name}</span>
                    <span className="text-gray-400 mx-2">—</span>
                    <span className="text-gray-500 text-sm">{f.description}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    f.status === 'new' ? 'bg-blue-100 text-blue-600' :
                    f.status === 'learning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {f.status === 'new' ? '未学' : f.status === 'learning' ? '学习中' : '已掌握'}
                  </span>
                </div>
              ))}
              <Link to="/functions" className="block text-center text-sm text-primary-500 hover:text-primary-600 mt-2">
                查看全部 →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
