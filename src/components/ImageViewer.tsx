import React, { useState } from 'react';
import { ProjectFile } from '../types';
import { ZoomIn, ZoomOut, RotateCw, Download, FileImage } from 'lucide-react';

interface ImageViewerProps {
  file: ProjectFile;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ file }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = file.content;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <FileImage className="w-4 h-4 text-purple-400" />
          <span className="font-medium text-slate-200">{file.name}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">{formatSize(file.size)}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">{file.mimeType}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))}
            title="Zoom Out"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-slate-400 min-w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(4, z + 0.2))}
            title="Zoom In"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            title="Putar 90°"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            title="Unduh Gambar"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gambar Canvas */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        <div
          className="transition-transform duration-100 ease-out shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-slate-900/60 p-2"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
        >
          <img
            src={file.content}
            alt={file.name}
            className="max-h-[65vh] max-w-[80vw] object-contain block mx-auto rounded"
          />
        </div>
      </div>
    </div>
  );
};
