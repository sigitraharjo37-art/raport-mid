import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  Maximize2,
  Terminal,
  FileCode2,
} from 'lucide-react';
import { ProjectFile, ViewportMode, ConsoleLogItem } from '../types';
import { buildPreviewHtml } from '../utils/previewBuilder';
import { ConsoleDrawer } from './ConsoleDrawer';

interface LivePreviewProps {
  files: ProjectFile[];
  activeEntryPath?: string;
  onSelectEntryPath?: (path: string) => void;
  consoleLogs: ConsoleLogItem[];
  onClearConsole: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  files,
  activeEntryPath,
  onSelectEntryPath,
  consoleLogs,
  onClearConsole,
}) => {
  const [viewport, setViewport] = useState<ViewportMode>('responsive');
  const [iframeKey, setIframeKey] = useState(0);
  const [showConsole, setShowConsole] = useState(false);
  const [compiledSrcDoc, setCompiledSrcDoc] = useState('');

  // Find all candidate HTML entry files
  const htmlFiles = files.filter(
    (f) => f.name.endsWith('.html') || f.name.endsWith('.htm')
  );

  // Pick primary entry file
  const currentEntryFile =
    files.find((f) => f.path === activeEntryPath) ||
    files.find((f) => f.name.toLowerCase() === 'index.html') ||
    htmlFiles[0];

  // Rebuild preview bundle when files change or entry changes
  useEffect(() => {
    if (!currentEntryFile) {
      setCompiledSrcDoc('');
      return;
    }
    const html = buildPreviewHtml(currentEntryFile, files);
    setCompiledSrcDoc(html);
  }, [files, currentEntryFile]);

  const refreshPreview = () => {
    setIframeKey((k) => k + 1);
  };

  const openInNewWindow = () => {
    if (!compiledSrcDoc) return;
    const blob = new Blob([compiledSrcDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-[375px] h-[667px] shadow-2xl rounded-2xl border-4 border-slate-700';
      case 'tablet':
        return 'w-[768px] h-[85vh] shadow-2xl rounded-xl border-4 border-slate-700';
      case 'desktop':
        return 'w-[1024px] h-[90vh] shadow-2xl rounded-lg border-2 border-slate-700';
      case 'responsive':
      default:
        return 'w-full h-full';
    }
  };

  const errorCount = consoleLogs.filter((l) => l.type === 'error').length;

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800">
      {/* Toolbar Atas */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        {/* Entry File Picker */}
        <div className="flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-400 font-medium">Pratinjau:</span>
          {htmlFiles.length > 1 ? (
            <select
              value={currentEntryFile?.path || ''}
              onChange={(e) => onSelectEntryPath?.(e.target.value)}
              className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs outline-none"
            >
              {htmlFiles.map((f) => (
                <option key={f.path} value={f.path}>
                  {f.path}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-slate-200 font-medium truncate max-w-[150px]">
              {currentEntryFile?.name || 'Belum ada file HTML'}
            </span>
          )}
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
          <button
            onClick={() => setViewport('responsive')}
            title="Responsif Penuh"
            className={`p-1.5 rounded transition ${
              viewport === 'responsive'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('desktop')}
            title="Desktop (1024px)"
            className={`p-1.5 rounded transition ${
              viewport === 'desktop'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            title="Tablet (768px)"
            className={`p-1.5 rounded transition ${
              viewport === 'tablet'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            title="Ponsel (375px)"
            className={`p-1.5 rounded transition ${
              viewport === 'mobile'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={refreshPreview}
            title="Muat ulang pratinjau"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={openInNewWindow}
            title="Buka di tab terpisah"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowConsole(!showConsole)}
            title="Buka Konsol Log"
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition ${
              showConsole
                ? 'bg-slate-800 text-blue-400'
                : errorCount > 0
                ? 'bg-rose-950/60 text-rose-400 border border-rose-800'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3 h-3" />
            <span>Konsol</span>
            {errorCount > 0 && (
              <span className="bg-rose-600 text-white text-[9px] px-1 rounded-full font-bold">
                {errorCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-slate-900/50 flex items-center justify-center overflow-auto p-2 relative">
        {currentEntryFile ? (
          <div
            className={`bg-white transition-all duration-200 overflow-hidden flex flex-col ${getViewportWidth()}`}
          >
            <iframe
              key={iframeKey}
              srcDoc={compiledSrcDoc}
              title="Live App Preview"
              sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
              className="w-full h-full border-none bg-white"
            />
          </div>
        ) : (
          <div className="text-center p-8 max-w-sm text-slate-500">
            <FileCode2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <h4 className="text-sm font-semibold text-slate-300 mb-1">
              Tidak Ada File HTML Ditemukan
            </h4>
            <p className="text-xs text-slate-500">
              Pastikan berkas .zip memiliki file <code className="text-blue-400">index.html</code> atau tambahkan file HTML baru untuk melihat pratinjau live.
            </p>
          </div>
        )}
      </div>

      {/* Konsol Terbuka */}
      <ConsoleDrawer
        logs={consoleLogs}
        isOpen={showConsole}
        onToggle={() => setShowConsole(false)}
        onClear={onClearConsole}
      />
    </div>
  );
};
