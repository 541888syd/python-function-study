import { useState, useEffect, useCallback } from 'react';
import { wordsApi } from '../api';
import type { Word } from '../types';
import WordCard from '../components/WordCard';

export default function WordList() {
  const [words, setWords] = useState<Word[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [addForm, setAddForm] = useState({ word: '', meaning: '', phonetic: '', tags: '', source: '' });
  const [batchText, setBatchText] = useState('');
  const [showBatch, setShowBatch] = useState(false);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await wordsApi.list({
        search: search || undefined,
        tag: tagFilter || undefined,
        status: statusFilter || undefined,
      });
      setWords(res.words);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, tagFilter, statusFilter]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  useEffect(() => {
    wordsApi.tags().then(res => setTags(res.tags)).catch(() => {});
  }, []);

  const handleAdd = async () => {
    if (!addForm.word.trim() || !addForm.meaning.trim()) return;
    try {
      await wordsApi.add({
        word: addForm.word,
        meaning: addForm.meaning,
        phonetic: addForm.phonetic || undefined,
        tags: addForm.tags ? addForm.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        source: addForm.source || undefined,
      });
      setShowAddModal(false);
      setAddForm({ word: '', meaning: '', phonetic: '', tags: '', source: '' });
      fetchWords();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = async () => {
    if (!editingWord) return;
    try {
      await wordsApi.update(editingWord.id, {
        word: editingWord.word,
        meaning: editingWord.meaning,
        phonetic: editingWord.phonetic,
        tags: editingWord.tags,
        source: editingWord.source,
      });
      setEditingWord(null);
      fetchWords();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await wordsApi.delete(id);
      fetchWords();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBatchAdd = async () => {
    const lines = batchText.trim().split('\n').filter(Boolean);
    const inputs = lines.map(line => {
      // Support: "word meaning" or "word,meaning" or "word\tmeaning"
      const parts = line.split(/[,，\t\s]+/);
      return { word: parts[0], meaning: parts.slice(1).join(' ') };
    }).filter(i => i.word && i.meaning);

    if (inputs.length === 0) {
      alert('请按格式输入：每行 "单词 释义"');
      return;
    }

    try {
      const result = await wordsApi.batchAdd(inputs);
      alert(`成功添加 ${result.added.length} 个单词${result.skipped.length > 0 ? `，跳过 ${result.skipped.length} 个重复` : ''}`);
      setBatchText('');
      setShowBatch(false);
      fetchWords();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📖 单词本</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowBatch(!showBatch)} className="btn-secondary text-sm">
            批量导入
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
            + 添加单词
          </button>
        </div>
      </div>

      {/* Batch import */}
      {showBatch && (
        <div className="card mb-4">
          <p className="text-sm text-gray-500 mb-2">
            每行一个单词，格式：<code>单词 释义</code>（空格、逗号或制表符分隔）
          </p>
          <textarea
            value={batchText}
            onChange={e => setBatchText(e.target.value)}
            placeholder={`ubiquitous 无处不在的\nparadigm 范例，典范\n`}
            className="input-field h-32 font-mono text-sm mb-2"
          />
          <div className="flex gap-2">
            <button onClick={handleBatchAdd} disabled={!batchText.trim()} className="btn-primary text-sm">
              导入
            </button>
            <button onClick={() => setShowBatch(false)} className="btn-secondary text-sm">取消</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="搜索单词或释义..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field max-w-xs"
        />
        <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="input-field max-w-[140px]">
          <option value="">全部标签</option>
          {tags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field max-w-[140px]">
          <option value="">全部状态</option>
          <option value="new">新词</option>
          <option value="learning">学习中</option>
          <option value="mastered">已掌握</option>
        </select>
        <span className="text-sm text-gray-400 self-center ml-auto">
          共 {words.length} 个单词
        </span>
      </div>

      {/* Word list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : words.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">📭 还没有单词</p>
          <p className="text-gray-300 text-sm">点击"添加单词"或使用导航栏的"快速添加"来记录你的第一个单词吧</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {words.map(w => (
            <WordCard
              key={w.id}
              word={w}
              onEdit={setEditingWord}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">添加单词</h2>
            <div className="space-y-3">
              <input type="text" placeholder="英文单词 *" value={addForm.word} onChange={e => setAddForm(f => ({ ...f, word: e.target.value }))} className="input-field" />
              <input type="text" placeholder="中文释义 *" value={addForm.meaning} onChange={e => setAddForm(f => ({ ...f, meaning: e.target.value }))} className="input-field" />
              <input type="text" placeholder="音标 (可选)" value={addForm.phonetic} onChange={e => setAddForm(f => ({ ...f, phonetic: e.target.value }))} className="input-field" />
              <input type="text" placeholder="标签，逗号分隔 (可选)" value={addForm.tags} onChange={e => setAddForm(f => ({ ...f, tags: e.target.value }))} className="input-field" />
              <input type="text" placeholder="来源 (可选)" value={addForm.source} onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))} className="input-field" />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">取消</button>
              <button onClick={handleAdd} disabled={!addForm.word.trim() || !addForm.meaning.trim()} className="btn-primary">添加</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingWord && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setEditingWord(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">编辑单词</h2>
            <div className="space-y-3">
              <label className="block text-sm text-gray-500">英文</label>
              <input type="text" value={editingWord.word} onChange={e => setEditingWord(w => w ? { ...w, word: e.target.value } : null)} className="input-field" />
              <label className="block text-sm text-gray-500">释义</label>
              <input type="text" value={editingWord.meaning} onChange={e => setEditingWord(w => w ? { ...w, meaning: e.target.value } : null)} className="input-field" />
              <label className="block text-sm text-gray-500">音标</label>
              <input type="text" value={editingWord.phonetic || ''} onChange={e => setEditingWord(w => w ? { ...w, phonetic: e.target.value } : null)} className="input-field" />
              <label className="block text-sm text-gray-500">标签 (逗号分隔)</label>
              <input type="text" value={editingWord.tags.join(', ')} onChange={e => setEditingWord(w => w ? { ...w, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } : null)} className="input-field" />
              <label className="block text-sm text-gray-500">来源</label>
              <input type="text" value={editingWord.source || ''} onChange={e => setEditingWord(w => w ? { ...w, source: e.target.value } : null)} className="input-field" />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setEditingWord(null)} className="btn-secondary">取消</button>
              <button onClick={handleEdit} className="btn-primary">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
