import { useState, useEffect } from 'react';
import { statsApi } from '../api';
import type { OverviewStats, DailyStat, LibraryDistItem } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#eab308', '#22c55e'];
const LIB_COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
                     '#ec4899', '#6366f1', '#14b8a6', '#84cc16'];

export default function Stats() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [trend, setTrend] = useState<DailyStat[]>([]);
  const [distribution, setDistribution] = useState<LibraryDistItem[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      statsApi.overview(),
      statsApi.trend(days),
      statsApi.distribution(),
    ]).then(([o, t, d]) => {
      setOverview(o);
      setTrend(t.trend);
      setDistribution(d.distribution);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, [days]);

  const trendData = trend.map(t => ({ ...t, date: t.date.slice(5) }));

  const pieData = overview ? [
    { name: '未学', value: overview.newFunctions },
    { name: '学习中', value: overview.learningFunctions },
    { name: '已掌握', value: overview.masteredFunctions },
  ] : [];

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📈 学习统计</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold">{overview?.totalPractices || 0}</div>
          <div className="text-sm text-gray-400">总练习次数</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{overview?.masteredFunctions || 0}</div>
          <div className="text-sm text-gray-400">已掌握函数</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{overview?.learningFunctions || 0}</div>
          <div className="text-sm text-gray-400">学习中的函数</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{overview?.newFunctions || 0}</div>
          <div className="text-sm text-gray-400">未学函数</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Daily Practice Count */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">每日练习量</h2>
          <div className="flex items-center gap-2 mb-4">
            <select value={days} onChange={e => setDays(Number(e.target.value))} className="input-field max-w-[120px] text-sm">
              <option value={7}>近7天</option>
              <option value={30}>近30天</option>
              <option value={90}>近90天</option>
            </select>
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor(trendData.length / 7)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: number) => [`${value} 题`, '练习量']}
                  labelFormatter={(label: string) => `日期: ${label}`} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="练习量" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8">暂无数据</p>
          )}
        </div>

        {/* Correct Rate Trend */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">正确率趋势</h2>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor(trendData.length / 7)} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: number) => [`${value}%`, '正确率']}
                  labelFormatter={(label: string) => `日期: ${label}`} />
                <Line type="monotone" dataKey="correctRate" stroke="#22c55e"
                  strokeWidth={2} dot={{ r: 3 }} name="正确率" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8">暂无数据</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution Pie */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">函数库构成</h2>
          {overview && overview.totalFunctions > 0 ? (
            <div className="flex items-center">
              <ResponsiveContainer width="60%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    paddingAngle={3} dataKey="value"
                    label={({ name, value, percent }) => `${name} ${value} (${(percent * 100).toFixed(0)}%)`}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3 ml-4">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-sm text-gray-600">{d.name}: <strong>{d.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">还没有函数数据</p>
          )}
        </div>

        {/* Library Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">按库分布</h2>
          {distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={distribution.slice(0, 10)} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="library" tick={{ fontSize: 11 }} width={60} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: number) => [value, '函数数量']}
                  labelFormatter={(label: string) => `库: ${label}`} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {distribution.slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={LIB_COLORS[i % LIB_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8">暂无数据</p>
          )}
        </div>
      </div>
    </div>
  );
}
