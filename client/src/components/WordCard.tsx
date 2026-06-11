import type { Word } from '../types';

interface WordCardProps {
  word: Word;
  onEdit: (word: Word) => void;
  onDelete: (id: string) => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: '新词', color: 'bg-blue-100 text-blue-700' },
  learning: { label: '学习中', color: 'bg-yellow-100 text-yellow-700' },
  mastered: { label: '已掌握', color: 'bg-green-100 text-green-700' },
};

export default function WordCard({ word, onEdit, onDelete }: WordCardProps) {
  const status = statusLabels[word.status];

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{word.word}</h3>
            {word.phonetic && (
              <span className="text-sm text-gray-400">{word.phonetic}</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-gray-600 mb-2">{word.meaning}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {word.tags.length > 0 && (
              <span className="flex gap-1">
                {word.tags.map(t => (
                  <span key={t} className="bg-gray-100 px-1.5 py-0.5 rounded">{t}</span>
                ))}
              </span>
            )}
            {word.source && <span>来源: {word.source}</span>}
            <span className="ml-auto">
              掌握度: {Math.round(word.mastery * 100)}%
            </span>
            <span>练习 {word.reviewCount} 次</span>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={() => onEdit(word)}
            className="text-gray-400 hover:text-primary-600 transition-colors p-1"
            title="编辑"
          >
            ✏️
          </button>
          <button
            onClick={() => {
              if (confirm(`确定删除 "${word.word}" 吗？`)) onDelete(word.id);
            }}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
