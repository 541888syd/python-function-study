import type { PythonFunction } from '../types';

interface FunctionCardProps {
  func: PythonFunction;
  onEdit: (func: PythonFunction) => void;
  onDelete: (id: string) => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: '未学', color: 'bg-blue-100 text-blue-700' },
  learning: { label: '学习中', color: 'bg-yellow-100 text-yellow-700' },
  mastered: { label: '已掌握', color: 'bg-green-100 text-green-700' },
};

const difficultyLabels: Record<string, { label: string; color: string }> = {
  basic: { label: '基础', color: 'bg-green-100 text-green-700' },
  intermediate: { label: '中级', color: 'bg-yellow-100 text-yellow-700' },
  advanced: { label: '高级', color: 'bg-red-100 text-red-700' },
};

const LIBRARY_COLORS: Record<string, string> = {
  builtins: 'bg-purple-100 text-purple-700',
  os: 'bg-blue-100 text-blue-700',
  'os.path': 'bg-blue-100 text-blue-700',
  sys: 'bg-indigo-100 text-indigo-700',
  itertools: 'bg-cyan-100 text-cyan-700',
  functools: 'bg-pink-100 text-pink-700',
  collections: 'bg-orange-100 text-orange-700',
  datetime: 'bg-teal-100 text-teal-700',
  json: 'bg-lime-100 text-lime-700',
  pathlib: 'bg-emerald-100 text-emerald-700',
  re: 'bg-rose-100 text-rose-700',
};

function getLibraryColor(library: string): string {
  return LIBRARY_COLORS[library] || 'bg-gray-100 text-gray-700';
}

export default function FunctionCard({ func, onEdit, onDelete }: FunctionCardProps) {
  const status = statusLabels[func.status];
  const diff = func.difficulty ? difficultyLabels[func.difficulty] : null;

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Name + Library badge + Status */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 font-mono">{func.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getLibraryColor(func.library)}`}>
              {func.library}
            </span>
            {diff && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${diff.color}`}>
                {diff.label}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
              {status.label}
            </span>
          </div>

          {/* Signature (like phonetic was) */}
          {func.signature && (
            <p className="text-sm text-gray-400 font-mono mb-1">{func.signature}</p>
          )}

          {/* Description */}
          <p className="text-gray-600 mb-2 text-sm">{func.description}</p>

          {/* Code example preview (first one, expandable) */}
          {func.codeExamples && func.codeExamples.length > 0 && func.codeExamples[0].code && (
            <details className="mb-2">
              <summary className="text-xs text-primary-500 cursor-pointer hover:text-primary-600">
                查看代码示例
              </summary>
              <pre className="code-block mt-1 text-xs">{func.codeExamples[0].code}</pre>
              {func.codeExamples[0].output && (
                <p className="text-xs text-gray-400 mt-1">输出: {func.codeExamples[0].output}</p>
              )}
            </details>
          )}

          {/* Bottom row: category tags, etymology, source, stats */}
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            {func.categoryTags && func.categoryTags.length > 0 && (
              <span className="flex gap-1">
                {func.categoryTags.map(t => (
                  <span key={t} className="bg-gray-100 px-1.5 py-0.5 rounded">{t}</span>
                ))}
              </span>
            )}
            {func.etymology && (
              <span title={func.etymology} className="cursor-help border-b border-dotted border-gray-300">
                词源
              </span>
            )}
            {func.source && (
              <a href={func.source} target="_blank" rel="noopener noreferrer"
                 className="text-primary-500 hover:underline">
                文档
              </a>
            )}
            <span className="ml-auto">
              掌握: {Math.round(func.mastery * 100)}%
            </span>
            <span>练习 {func.reviewCount} 次</span>
          </div>

          {/* Mastery mini bar */}
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all ${
                func.mastery >= 0.8 ? 'bg-green-500' :
                func.mastery >= 0.3 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.round(func.mastery * 100)}%` }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 ml-4 shrink-0">
          <button
            onClick={() => onEdit(func)}
            className="text-gray-400 hover:text-primary-600 transition-colors p-1"
            title="编辑"
          >
            ✏️
          </button>
          <button
            onClick={() => {
              if (confirm(`确定删除 "${func.library}.${func.name}" 吗？`)) onDelete(func.id);
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
