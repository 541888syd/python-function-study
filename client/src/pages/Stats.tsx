import { useState, useEffect } from 'react';
import { statsApi } from '../api';
import type { OverviewStats, DailyStat } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#eab308', '#22c55e'];

export default function Stats() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [trend, setTrend] = useState<DailyStat[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      statsApi.overview(),
      statsApi.trend(days),
    ]).then(([o, t]) => {
      setOverview(o);
      setTrend(t.trend);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, [days]);

  const trendData = trend.map(t => ({
    ...t,
    date: t.date.slice(5), // "MM-DD"
  }));

  const pieData = overview ? [
    { name: '新词', value: overview.newWords },
    { name: '学习中', value: overview.learningWords },
    { name: '已掌握', value: overview.masteredWords },
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
          <div className="text-2xl font-bold text-green-600">{overview?.masteredWords || 0}</div>
          <div className="text-sm text-gray-400">已掌握单词</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{overview?.learningWords || 0}</div>
          <div className="text-sm text-gray-400">学习中的单词</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{overview?.newWords || 0}</div>
          <div className="text-sm text-gray-400">未学新词</div>
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
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: number) => [`${value} 题`, '练习量']}
                  labelFormatter={(label: string) => `日期: ${label}`}
                />
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
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: number) => [`${value}%`, '正确率']}
                  labelFormatter={(label: string) => `日期: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="correctRate"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="正确率"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8">暂无数据</p>
          )}
        </div>
      </div>

      {/* Word Status Distribution */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">词库构成</h2>
        {overview && overview.totalWords > 0 ? (
          <div className="flex items-center">
            <ResponsiveContainer width="60%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value, percent }) =>
                    `${name} ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
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
          <p className="text-center text-gray-400 py-8">还没有单词数据</p>
        )}
      </div>
    </div>
  );
}
