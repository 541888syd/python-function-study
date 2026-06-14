import { useState, useEffect } from 'react';
import { settingsApi, dataApi } from '../api';
import type { Settings } from '../types';

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    dailyGoal: 20,
    newWordsPerDay: 5,
    practiceMode: 'mixed',
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    settingsApi.get()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await settingsApi.update(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) { alert(err.message); }
  };

  const handleExport = async () => {
    try {
      const data = await dataApi.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `python-function-study-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) { alert(err.message); }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await dataApi.import(data);
        alert('数据导入成功！');
        const s = await settingsApi.get();
        setSettings(s);
      } catch (err: any) { alert(`导入失败: ${err.message}`); }
    };
    input.click();
  };

  const handleReset = async () => {
    if (!confirm('确定要重置所有学习进度吗？函数库数据会保留，但练习记录和进度会被清除。此操作不可撤销！')) return;
    try {
      await dataApi.import({ records: { records: [] } });
      alert('进度已重置');
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">加载中...</div>;

  const modeOptions = [
    { value: 'mixed', label: '🔀 混合随机', desc: '随机切换5种模式' },
    { value: 'name2usage', label: '📝 函数→描述', desc: '看到函数名，描述用途' },
    { value: 'usage2name', label: '🔍 描述→函数', desc: '看到描述，回忆函数名' },
    { value: 'code2name', label: '💻 代码→函数', desc: '看到代码，识别函数' },
    { value: 'signature2name', label: '🔤 签名→函数', desc: '看到签名，命名函数' },
    { value: 'name2library', label: '🆔 函数→库', desc: '看到函数，回想所属库' },
  ];

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">⚙️ 设置</h1>

      {/* Practice Settings */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">练习设置</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              每日目标数量: <strong>{settings.dailyGoal}</strong> 题
            </label>
            <input type="range" min="5" max="50" step="5" value={settings.dailyGoal}
              onChange={e => setSettings(s => ({ ...s, dailyGoal: Number(e.target.value) }))}
              className="w-full" />
            <div className="flex justify-between text-xs text-gray-400"><span>5</span><span>50</span></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              每日新函数数量: <strong>{settings.newWordsPerDay}</strong> 个
            </label>
            <input type="range" min="1" max="20" step="1" value={settings.newWordsPerDay}
              onChange={e => setSettings(s => ({ ...s, newWordsPerDay: Number(e.target.value) }))}
              className="w-full" />
            <div className="flex justify-between text-xs text-gray-400"><span>1</span><span>20</span></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">练习模式</label>
            <div className="grid grid-cols-3 gap-2">
              {modeOptions.map(opt => (
                <button key={opt.value}
                  onClick={() => setSettings(s => ({ ...s, practiceMode: opt.value as Settings['practiceMode'] }))}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    settings.practiceMode === opt.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <button onClick={handleSave} className="btn-primary mt-4 w-full">
          {saved ? '✅ 已保存' : '保存设置'}
        </button>
      </div>

      {/* Data Management */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">数据管理</h2>
        <div className="space-y-3">
          <button onClick={handleExport} className="btn-secondary w-full text-left flex items-center gap-2">
            <span>📥</span>
            <div><div className="font-medium">导出数据</div>
            <div className="text-xs text-gray-400">备份所有函数和练习记录为 JSON 文件</div></div>
          </button>
          <button onClick={handleImport} className="btn-secondary w-full text-left flex items-center gap-2">
            <span>📤</span>
            <div><div className="font-medium">导入数据</div>
            <div className="text-xs text-gray-400">从 JSON 备份文件恢复数据</div></div>
          </button>
          <button onClick={handleReset} className="btn-danger w-full text-left flex items-center gap-2">
            <span>🔄</span>
            <div><div className="font-medium">重置学习进度</div>
            <div className="text-xs text-red-300">清除所有练习记录（函数库保留）</div></div>
          </button>
        </div>
      </div>
    </div>
  );
}
