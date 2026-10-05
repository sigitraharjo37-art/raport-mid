import React from 'react';
import { ConsoleLogItem } from '../types';
import { Terminal, Trash2, X, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface ConsoleDrawerProps {
  logs: ConsoleLogItem[];
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
}

export const ConsoleDrawer: React.FC<ConsoleDrawerProps> = ({
  logs,
  isOpen,
  onToggle,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <div className="h-48 border-t border-slate-800 bg-slate-950 flex flex-col font-mono text-xs select-text">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-slate-300">Konsol Pengembang (In-App)</span>
          <span className="text-[11px] text-slate-500">· {logs.length} entri</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            title="Bersihkan log"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggle}
            title="Tutup konsol"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Daftar Log */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic py-2 text-center text-xs">
            Belum ada output konsol atau error dari aplikasi yang dipratinjau.
          </div>
        ) : (
          logs.map((log) => {
            let color = 'text-slate-300';
            let icon = <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />;

            if (log.type === 'warn') {
              color = 'text-amber-300 bg-amber-950/20';
              icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
            } else if (log.type === 'error') {
              color = 'text-rose-300 bg-rose-950/20';
              icon = <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />;
            }

            return (
              <div
                key={log.id}
                className={`flex items-start gap-2 px-2 py-1 rounded border border-transparent hover:border-slate-800 ${color}`}
              >
                {icon}
                <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">
                  {log.timestamp}
                </span>
                <pre className="whitespace-pre-wrap break-all flex-1 font-mono text-[11.5px]">
                  {log.message}
                </pre>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
