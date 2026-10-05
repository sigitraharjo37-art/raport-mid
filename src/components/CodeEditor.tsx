import React, { useState, useEffect, useRef, useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css';

import {
  Save,
  Search,
  RotateCcw,
  Copy,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Minimize2,
  FileCode,
} from 'lucide-react';
import { ProjectFile, EditorTab } from '../types';

interface CodeEditorProps {
  file: ProjectFile;
  tabs: EditorTab[];
  activePath: string;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onSaveContent: (path: string, newContent: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  tabs,
  activePath,
  onSelectTab,
  onCloseTab,
  onSaveContent,
}) => {
  const [content, setContent] = useState(file.content);
  const [isDirty, setIsDirty] = useState(false);
  const [copied, setCopied] = useState(false);

  // Find & Replace state
  const [showFind, setShowFind] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  // Cursor state
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // Sync content when active file changes
  useEffect(() => {
    setContent(file.content);
    setIsDirty(false);
  }, [file.path, file.content]);

  // Handle Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFind(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file.path, content]);

  const handleSave = () => {
    onSaveContent(file.path, content);
    setIsDirty(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setIsDirty(val !== file.content);
    updateCursorPosition();
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = content.substring(0, pos);
    const lines = textBefore.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Language detection for Prism
  const language = useMemo(() => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
        return 'css';
      case 'js':
      case 'jsx':
      case 'mjs':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'clike';
    }
  }, [file.name]);

  // Syntax highlighted code
  const highlightedCode = useMemo(() => {
    try {
      const gram = Prism.languages[language] || Prism.languages.clike || Prism.languages.javascript;
      if (gram) {
        return Prism.highlight(content, gram, language);
      }
      return content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    } catch {
      return content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }, [content, language]);

  // Line numbers calculation
  const lineCount = useMemo(() => {
    return content.split('\n').length;
  }, [content]);

  // Handle Tab key insertion (2 spaces)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const updated = content.substring(0, start) + '  ' + content.substring(end);
      setContent(updated);
      setIsDirty(true);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
        updateCursorPosition();
      }, 0);
    }
  };

  // Find & Replace
  useEffect(() => {
    if (!findText) {
      setMatchCount(0);
      return;
    }
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = content.match(new RegExp(escaped, 'gi'));
    setMatchCount(matches ? matches.length : 0);
  }, [findText, content]);

  const handleReplaceAll = () => {
    if (!findText) return;
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const updated = content.replace(new RegExp(escaped, 'g'), replaceText);
    setContent(updated);
    setIsDirty(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFormatJson = () => {
    if (file.name.endsWith('.json')) {
      try {
        const parsed = JSON.parse(content);
        const formatted = JSON.stringify(parsed, null, 2);
        setContent(formatted);
        setIsDirty(true);
      } catch (err) {
        alert('JSON tidak valid. Periksa format kode terlebih dahulu.');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1d1f21] text-slate-100 font-mono relative overflow-hidden">
      {/* Tab Bar */}
      <div className="flex items-center bg-[#181a1b] border-b border-slate-800 overflow-x-auto select-none no-scrollbar">
        {tabs.map((tab) => {
          const fileName = tab.path.split('/').pop() || tab.path;
          const isActive = tab.path === activePath;

          return (
            <div
              key={tab.path}
              onClick={() => onSelectTab(tab.path)}
              className={`flex items-center gap-2 px-3 py-2 text-xs border-r border-slate-800 cursor-pointer transition-colors shrink-0 ${
                isActive
                  ? 'bg-[#1d1f21] text-white border-t-2 border-t-blue-500 font-medium'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate max-w-[140px]">{fileName}</span>
              {isActive && isDirty && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Ada perubahan belum disimpan" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.path);
                }}
                className="p-0.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor Sub-toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1c1d] border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[11px] truncate max-w-sm">{file.path}</span>
          {isDirty && (
            <span className="text-amber-400 text-[11px] font-sans font-medium flex items-center gap-1">
              ● Belum disimpan
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 font-sans">
          <button
            onClick={() => setShowFind(!showFind)}
            title="Cari & Ganti (Ctrl+F)"
            className={`p-1.5 rounded transition ${
              showFind ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {file.name.endsWith('.json') && (
            <button
              onClick={handleFormatJson}
              title="Format JSON"
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition"
            >
              Format
            </button>
          )}

          <button
            onClick={handleCopy}
            title="Salin semua kode"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleSave}
            disabled={!isDirty}
            title="Simpan berkas (Ctrl + S)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
              isDirty
                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan</span>
          </button>
        </div>
      </div>

      {/* Floating Find & Replace Bar */}
      {showFind && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-[#25282a] border-b border-slate-700 text-xs font-sans z-20 shadow-lg">
          <div className="flex items-center bg-slate-900 rounded border border-slate-700 px-2 py-1">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <input
              type="text"
              placeholder="Cari kata..."
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              className="bg-transparent text-white text-xs outline-none w-36"
              autoFocus
            />
            {matchCount > 0 && (
              <span className="text-[10px] text-slate-400 ml-1 font-mono">
                {matchCount} hasil
              </span>
            )}
          </div>

          <div className="flex items-center bg-slate-900 rounded border border-slate-700 px-2 py-1">
            <input
              type="text"
              placeholder="Ganti dengan..."
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              className="bg-transparent text-white text-xs outline-none w-36"
            />
          </div>

          <button
            onClick={handleReplaceAll}
            disabled={!findText || matchCount === 0}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded text-[11px] font-medium"
          >
            Ganti Semua
          </button>

          <button
            onClick={() => setShowFind(false)}
            className="p-1 text-slate-400 hover:text-white rounded ml-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Main Canvas with Synchronized Highlighting */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Line Numbers Gutter */}
        <div className="w-12 bg-[#181a1b] text-slate-600 select-none py-3 pr-2 text-right font-mono text-[12px] border-r border-slate-800/80 shrink-0 overflow-hidden leading-[1.6]">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div
              key={i}
              className={`${
                cursorPos.line === i + 1 ? 'text-blue-400 font-bold bg-slate-800/40' : ''
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Content Area */}
        <div className="flex-1 relative h-full overflow-hidden">
          {/* Syntax Highlight Layer */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 m-0 py-3 px-3 font-mono text-[12px] leading-[1.6] pointer-events-none select-none overflow-hidden whitespace-pre tab-2"
            dangerouslySetInnerHTML={{ __html: highlightedCode + '\n' }}
          />

          {/* Editable Textarea Layer */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onScroll={handleScroll}
            onClick={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className="absolute inset-0 w-full h-full m-0 py-3 px-3 font-mono text-[12px] leading-[1.6] bg-transparent text-transparent caret-white selection:bg-blue-600/40 outline-none resize-none overflow-auto whitespace-pre tab-2"
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#181a1b] border-t border-slate-800 text-[11px] text-slate-400 font-sans select-none">
        <div className="flex items-center gap-3">
          <span>
            Baris {cursorPos.line}, Kolom {cursorPos.col}
          </span>
          <span className="text-slate-600">|</span>
          <span>{lineCount} baris</span>
          <span className="text-slate-600">|</span>
          <span>{content.length} karakter</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="uppercase text-slate-300 font-medium">{language}</span>
          <span className="text-slate-600">|</span>
          <span>UTF-8</span>
          <span className="text-slate-600">|</span>
          <span>2 Spasi Tab</span>
        </div>
      </div>
    </div>
  );
};
