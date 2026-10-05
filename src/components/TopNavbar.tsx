import React from 'react';
import {
  FolderArchive,
  Download,
  Upload,
  Play,
  Eye,
  EyeOff,
  Plus,
  HelpCircle,
  Code2,
} from 'lucide-react';

interface TopNavbarProps {
  projectName: string;
  onOpenUpload: () => void;
  onDownloadZip: () => void;
  onAddNewFile: () => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  onOpenHelp: () => void;
  totalFiles: number;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  projectName,
  onOpenUpload,
  onDownloadZip,
  onAddNewFile,
  showPreview,
  onTogglePreview,
  onOpenHelp,
  totalFiles,
}) => {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none shrink-0 z-30">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-slate-100 tracking-tight">
                ZipStudio
              </h1>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                v1.0
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Current Active Project */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
          <FolderArchive className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-slate-200 truncate max-w-[200px]" title={projectName}>
            {projectName}
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">{totalFiles} berkas</span>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAddNewFile}
          title="Tambah Berkas Baru"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
        >
          <Plus className="w-3.5 h-3.5 text-slate-400" />
          <span>Berkas Baru</span>
        </button>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
        >
          <Upload className="w-3.5 h-3.5 text-blue-400" />
          <span>Unggah ZIP</span>
        </button>

        <button
          onClick={onTogglePreview}
          title={showPreview ? 'Sembunyikan Pratinjau' : 'Tampilkan Pratinjau'}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            showPreview
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          {showPreview ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Pratinjau Live</span>
        </button>

        <button
          onClick={onDownloadZip}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-sm shadow-emerald-700/20 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Unduh ZIP</span>
        </button>

        <button
          onClick={onOpenHelp}
          title="Bantuan & Petunjuk"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
