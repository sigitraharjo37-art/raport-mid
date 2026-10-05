import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FolderArchive,
  FolderOpen,
  Sparkles,
  X,
  FileCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { SAMPLE_TEMPLATES, ProjectTemplate } from '../utils/defaultTemplates';
import { ProjectFile } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onZipExtracted: (files: ProjectFile[], projectName: string) => void;
  onSelectTemplate: (template: ProjectTemplate) => void;
  onExtractZipFile: (file: File) => Promise<void>;
  isLoading: boolean;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onExtractZipFile,
  isLoading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setErrorMessage(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const firstFile = files[0];
      if (firstFile.name.endsWith('.zip')) {
        try {
          await onExtractZipFile(firstFile);
          onClose();
        } catch (err: any) {
          setErrorMessage(err.message || 'Gagal mengekstrak berkas ZIP.');
        }
      } else {
        setErrorMessage('Silakan unggah berkas berekstensi .zip');
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        await onExtractZipFile(file);
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message || 'Gagal mengekstrak berkas ZIP.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                Unggah File ZIP Aplikasi
              </h3>
              <p className="text-xs text-slate-400">
                Buka, telusuri, dan edit kode aplikasi web langsung di browser
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
              isDragOver
                ? 'border-blue-500 bg-blue-950/30'
                : 'border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                <span className="text-sm font-medium text-slate-200">
                  Sedang mengekstrak berkas ZIP...
                </span>
                <span className="text-xs text-slate-500">
                  Menyiapkan kode sumber dan aset gambar
                </span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-blue-600/10 text-blue-400 flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-medium text-slate-200 mb-1">
                  Tarik & Lepas File .ZIP Di Sini
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Atau klik untuk memilih file arsip <code className="text-blue-400">.zip</code> aplikasi web dari komputer Anda
                </p>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  Pilih File .ZIP
                </button>
              </>
            )}
          </div>

          {/* Atau gunakan template bawaan untuk demonstrasi */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">
                Atau mulai cepat dengan contoh proyek:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    onSelectTemplate(tmpl);
                    onClose();
                  }}
                  className="flex flex-col text-left p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-blue-500/50 hover:bg-slate-800/40 transition group"
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition">
                      {tmpl.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {tmpl.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {tmpl.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950/70 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
          <span>Semua proses ekstraksi dilakukan secara instan di browser Anda (aman & privat).</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
