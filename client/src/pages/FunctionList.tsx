import { useState, useEffect, useCallback } from 'react';
import { functionsApi } from '../api';
import type { PythonFunction } from '../types';
import FunctionCard from '../components/FunctionCard';

export default function FunctionList() {
  const [functions, setFunctions] = useState<PythonFunction[]>([]);
  const [libraries, setLibraries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [libraryFilter, setLibraryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFunc, setEditingFunc] = useState<PythonFunction | null>(null);
  const [addForm, setAddForm] = useState({
    name: '', library: '', description: '', signature: '',
    parameters: '', returnType: '', codeExample: '',
    etymology: '', relatedFunctions: '', categoryTags: '',
    difficulty: 'basic' as string, source: '', notes: '',
  });
  const [batchText, setBatchText] = useState('');
  const [showBatch, setShowBatch] = useState(false);

  const fetchFunctions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await functionsApi.list({
        search: search || undefined,
        library: libraryFilter || undefined,
        status: statusFilter || undefined,
      });
      setFunctions(res.functions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, libraryFilter, statusFilter]);

  useEffect(() => { fetchFunctions(); }, [fetchFunctions]);
  useEffect(() => {
    functionsApi.libraries().then(res => setLibraries(res.libraries)).catch(() => {});
  }, []);

  const resetAddForm = () => setAddForm({
    name: '', library: '', description: '', signature: '',
    parameters: '', returnType: '', codeExample: '',
    etymology: '', relatedFunctions: '', categoryTags: '',
    difficulty: 'basic', source: '', notes: '',
  });

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.library.trim() || !addForm.description.trim()) return;
    try {
      const params = addForm.parameters ? addForm.parameters.split(',').map((p, i) => {
        const parts = p.trim().split(':');
        return {
          name: parts[0]?.trim() || `param${i}`,
          type: parts[1]?.trim() || undefined,
          description: parts[2]?.trim() || undefined,
        };
      }).filter(p => p.name) : [];
      const codeExamples = addForm.codeExample.trim() ? [{ code: addForm.codeExample.trim() }] : [];
      await functionsApi.add({
        name: addForm.name, library: addForm.library, description: addForm.description,
        signature: addForm.signature || undefined,
        parameters: params.length > 0 ? params : undefined,
        returnType: addForm.returnType || undefined,
        codeExamples,
        etymology: addForm.etymology || undefined,
        relatedFunctions: addForm.relatedFunctions ? addForm.relatedFunctions.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        categoryTags: addForm.categoryTags ? addForm.categoryTags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        difficulty: addForm.difficulty,
        source: addForm.source || undefined,
        notes: addForm.notes || undefined,
      });
      setShowAddModal(false);
      resetAddForm();
      fetchFunctions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = async () => {
    if (!editingFunc) return;
    try {
      await functionsApi.update(editingFunc.id, {
        name: editingFunc.name,
        library: editingFunc.library,
        description: editingFunc.description,
        signature: editingFunc.signature,
        parameters: editingFunc.parameters,
        returnType: editingFunc.returnType,
        codeExamples: editingFunc.codeExamples,
        etymology: editingFunc.etymology,
        relatedFunctions: editingFunc.relatedFunctions,
        categoryTags: editingFunc.categoryTags,
        difficulty: editingFunc.difficulty,
        source: editingFunc.source,
        notes: editingFunc.notes,
      });
      setEditingFunc(null);
      fetchFunctions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await functionsApi.delete(id);
      fetchFunctions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBatchAdd = async () => {
    const lines = batchText.trim().split('\n').filter(Boolean);
    const inputs = lines.map(line => {
      const parts = line.split('|').map(s => s.trim());
      return {
        name: parts[0] || '',
        library: parts[0]?.includes('.') ? parts[0].split('.')[0] : '',
        description: parts[1] || '',
        categoryTags: parts[2] ? parts[2].split(',').map(t => t.trim()) : [],
      };
    }).filter(i => i.name && i.description);

    if (inputs.length === 0) {
      alert('请按格式输入：每行 "函数名 | 描述 | 分类标签"');
      return;
    }
    try {
      const result = await functionsApi.batchAdd(inputs);
      alert(`成功添加 ${result.added.length} 个函数${result.skipped.length > 0 ? `，跳过 ${result.skipped.length} 个重复` : ''}`);
      setBatchText('');
      setShowBatch(false);
      fetchFunctions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📦 函数库</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowBatch(!showBatch)} className="btn-secondary text-sm">批量导入</button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">+ 添加函数</button>
        </div>
      </div>

      {/* Batch import */}
      {showBatch && (
        <div className="card mb-4">
          <p className="text-sm text-gray-500 mb-2">
            每行一个函数，格式：<code>函数名 | 描述 | 分类标签</code>（竖线分隔）
          </p>
          <textarea
            value={batchText}
            onChange={e => setBatchText(e.target.value)}
            placeholder={`os.path.join | 拼接路径，自动使用操作系统路径分隔符 | 文件操作,路径`}
            className="input-field h-32 font-mono text-sm mb-2"
          />
          <div className="flex gap-2">
            <button onClick={handleBatchAdd} disabled={!batchText.trim()} className="btn-primary text-sm">导入</button>
            <button onClick={() => setShowBatch(false)} className="btn-secondary text-sm">取消</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input type="text" placeholder="搜索函数名、描述或库..." value={search}
          onChange={e => setSearch(e.target.value)} className="input-field max-w-xs" />
        <select value={libraryFilter} onChange={e => setLibraryFilter(e.target.value)} className="input-field max-w-[140px]">
          <option value="">全部库</option>
          {libraries.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field max-w-[140px]">
          <option value="">全部状态</option>
          <option value="new">未学</option>
          <option value="learning">学习中</option>
          <option value="mastered">已掌握</option>
        </select>
        <span className="text-sm text-gray-400 self-center ml-auto">共 {functions.length} 个函数</span>
      </div>

      {/* Function list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : functions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">📭 还没有函数</p>
          <p className="text-gray-300 text-sm">点击"添加函数"来记录你的第一个 Python 函数吧</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {functions.map(f => (
            <FunctionCard key={f.id} func={f} onEdit={setEditingFunc} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 overflow-y-auto py-8"
             onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto"
               onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">添加函数</h2>
            <div className="space-y-3">
              <input type="text" placeholder="函数名 * (如 os.path.join)" value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
              <input type="text" placeholder="所属库 * (如 os)" value={addForm.library}
                onChange={e => setAddForm(f => ({ ...f, library: e.target.value }))} className="input-field" />
              <input type="text" placeholder="功能描述 *" value={addForm.description}
                onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} className="input-field" />
              <input type="text" placeholder="函数签名 (可选，如 os.path.join(path, *paths))" value={addForm.signature}
                onChange={e => setAddForm(f => ({ ...f, signature: e.target.value }))} className="input-field" />
              <input type="text" placeholder="参数列表 (可选，格式: name:type:desc, name:type:desc)" value={addForm.parameters}
                onChange={e => setAddForm(f => ({ ...f, parameters: e.target.value }))} className="input-field" />
              <input type="text" placeholder="返回值类型 (可选)" value={addForm.returnType}
                onChange={e => setAddForm(f => ({ ...f, returnType: e.target.value }))} className="input-field" />
              <textarea placeholder="代码示例 (可选)" value={addForm.codeExample}
                onChange={e => setAddForm(f => ({ ...f, codeExample: e.target.value }))}
                className="input-field h-32 font-mono text-sm whitespace-pre overflow-x-auto resize-y" wrap="off" />
              <input type="text" placeholder="名字来源/缩写含义 (可选)" value={addForm.etymology}
                onChange={e => setAddForm(f => ({ ...f, etymology: e.target.value }))} className="input-field" />
              <input type="text" placeholder="相关函数，逗号分隔 (可选)" value={addForm.relatedFunctions}
                onChange={e => setAddForm(f => ({ ...f, relatedFunctions: e.target.value }))} className="input-field" />
              <input type="text" placeholder="分类标签，逗号分隔 (可选，如 文件操作,路径)" value={addForm.categoryTags}
                onChange={e => setAddForm(f => ({ ...f, categoryTags: e.target.value }))} className="input-field" />
              <select value={addForm.difficulty}
                onChange={e => setAddForm(f => ({ ...f, difficulty: e.target.value }))} className="input-field">
                <option value="basic">基础</option>
                <option value="intermediate">中级</option>
                <option value="advanced">高级</option>
              </select>
              <input type="text" placeholder="官方文档链接 (可选)" value={addForm.source}
                onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))} className="input-field" />
              <textarea placeholder="个人笔记 (可选)" value={addForm.notes}
                onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                className="input-field h-20 text-sm" />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">取消</button>
              <button onClick={handleAdd}
                disabled={!addForm.name.trim() || !addForm.library.trim() || !addForm.description.trim()}
                className="btn-primary">添加</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingFunc && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 overflow-y-auto py-8"
             onClick={() => setEditingFunc(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto"
               onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">编辑函数</h2>
            <div className="space-y-3">
              <label className="block text-sm text-gray-500">函数名</label>
              <input type="text" value={editingFunc.name}
                onChange={e => setEditingFunc(f => f ? { ...f, name: e.target.value } : null)} className="input-field" />
              <label className="block text-sm text-gray-500">所属库</label>
              <input type="text" value={editingFunc.library}
                onChange={e => setEditingFunc(f => f ? { ...f, library: e.target.value } : null)} className="input-field" />
              <label className="block text-sm text-gray-500">描述</label>
              <input type="text" value={editingFunc.description}
                onChange={e => setEditingFunc(f => f ? { ...f, description: e.target.value } : null)} className="input-field" />
              <label className="block text-sm text-gray-500">签名</label>
              <input type="text" value={editingFunc.signature || ''}
                onChange={e => setEditingFunc(f => f ? { ...f, signature: e.target.value } : null)} className="input-field" />
              <label className="block text-sm text-gray-500">代码示例</label>
              <textarea value={editingFunc.codeExamples?.[0]?.code || ''}
                onChange={e => {
                  const code = e.target.value;
                  setEditingFunc(f => f ? { ...f, codeExamples: code ? [{ code }] : [] } : null);
                }}
                className="input-field h-32 font-mono text-sm whitespace-pre overflow-x-auto resize-y" wrap="off" />
              <label className="block text-sm text-gray-500">名字来源</label>
              <input type="text" value={editingFunc.etymology || ''}
                onChange={e => setEditingFunc(f => f ? { ...f, etymology: e.target.value } : null)} className="input-field" />
              <label className="block text-sm text-gray-500">分类标签</label>
              <input type="text" value={editingFunc.categoryTags?.join(', ') || ''}
                onChange={e => setEditingFunc(f => f ? { ...f, categoryTags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } : null)} className="input-field" />
              <label className="block text-sm text-gray-500">来源</label>
              <input type="text" value={editingFunc.source || ''}
                onChange={e => setEditingFunc(f => f ? { ...f, source: e.target.value } : null)} className="input-field" />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setEditingFunc(null)} className="btn-secondary">取消</button>
              <button onClick={handleEdit} className="btn-primary">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
