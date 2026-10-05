import React from 'react';
import { X, CheckCircle, HelpCircle, FileArchive, Code, Play, Download } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Panduan Edit File ZIP di ZipStudio
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-300">
          <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-blue-200 leading-relaxed">
            <strong>Ya, Anda bisa mengedit aplikasi yang tersimpan di dalam ZIP secara langsung di sini!</strong>{' '}
            ZipStudio mengekstrak file arsip di dalam browser Anda, memungkinkan Anda mengedit kode, melihat live preview, lalu mengunduh kembali versi ZIP yang sudah diperbarui.
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-800 rounded-lg text-blue-400 shrink-0">
                <FileArchive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 mb-0.5">1. Unggah File ZIP</h4>
                <p className="text-slate-400">
                  Klik tombol <strong>"Unggah ZIP"</strong> di atas atau seret (drag-and-drop) file ZIP aplikasi Anda. Seluruh folder, subfolder, file kode, dan gambar akan otomatis diekstrak.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-800 rounded-lg text-amber-400 shrink-0">
                <Code className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 mb-0.5">2. Buka & Edit Kode</h4>
                <p className="text-slate-400">
                  Klik berkas yang ingin diedit di sidebar (HTML, CSS, JS, JSON, dll.). Gunakan shortcut <strong>Ctrl + S</strong> (atau tombol Simpan) untuk menyimpan perubahan berkas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-800 rounded-lg text-emerald-400 shrink-0">
                <Play className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 mb-0.5">3. Live Preview & Konsol Debug</h4>
                <p className="text-slate-400">
                  Panel kanan menampilkan pratinjau live aplikasi web Anda. Dilengkapi switch viewport (Desktop, Tablet, Mobile) dan konsol error internal.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-800 rounded-lg text-purple-400 shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 mb-0.5">4. Unduh File ZIP Baru</h4>
                <p className="text-slate-400">
                  Setelah selesai mengedit, klik <strong>"Unduh ZIP"</strong>. Semua perubahan dan berkas baru akan dikemas kembali menjadi file ZIP yang siap digunakan atau di-deploy.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-950/70 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
          >
            Mengerti & Mulai Edit
          </button>
        </div>
      </div>
    </div>
  );
};
