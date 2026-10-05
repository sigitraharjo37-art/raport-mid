import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  Image as ImageIcon,
  File,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  Search,
  Upload
} from 'lucide-react';
import { TreeNode, ProjectFile } from '../types';

interface FileTreeProps {
  tree: TreeNode[];
  activeFilePath: string | null;
  onSelectFile: (file: ProjectFile) => void;
  onAddFile: (parentPath?: string) => void;
  onRenameNode: (oldPath: string, newName: string) => void;
  onDeleteNode: (path: string) => void;
  onUploadAdditionalFiles?: (files: FileList) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  tree,
  activeFilePath,
  onSelectFile,
  onAddFile,
  onRenameNode,
  onDeleteNode,
  onUploadAdditionalFiles,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ '': true });
  const [filterQuery, setFilterQuery] = useState('');
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'html':
      case 'htm':
        return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
      case 'css':
      case 'scss':
      case 'sass':
        return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'js':
      case 'jsx':
      case 'mjs':
        return <FileCode className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'ts':
      case 'tsx':
        return <FileCode className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'json':
        return <FileJson className="w-4 h-4 text-yellow-300 shrink-0" />;
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
      case 'ico':
        return <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />;
      default:
        return <File className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  const startRename = (node: TreeNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPath(node.path);
    setRenameValue(node.name);
  };

  const submitRename = (node: TreeNode) => {
    if (renameValue.trim() && renameValue !== node.name) {
      onRenameNode(node.path, renameValue.trim());
    }
    setEditingPath(null);
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders[node.path] ?? true;
    const isEditing = editingPath === node.path;
    const isActive = !node.isFolder && activeFilePath === node.path;

    if (filterQuery) {
      // If filtering, only show matching or parents of matching
      const matches = node.name.toLowerCase().includes(filterQuery.toLowerCase());
      const childMatches = node.children?.some(c => c.name.toLowerCase().includes(filterQuery.toLowerCase()));
      if (!matches && !childMatches) return null;
    }

    return (
      <div key={node.path} className="select-none text-xs">
        <div
          onClick={() => {
            if (node.isFolder) {
              toggleFolder(node.path);
            } else if (node.file) {
              onSelectFile(node.file);
            }
          }}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 cursor-pointer transition-colors ${
            isActive
              ? 'bg-blue-600/20 text-blue-300 font-medium border-l-2 border-blue-500'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {node.isFolder ? (
              <span className="text-slate-400 p-0.5">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            ) : (
              <span className="w-3.5" />
            )}

            {node.isFolder ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-amber-400 shrink-0" />
              )
            ) : (
              getFileIcon(node.name)
            )}

            {isEditing ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => submitRename(node)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename(node);
                  if (e.key === 'Escape') setEditingPath(null);
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 text-white text-xs px-1.5 py-0.5 rounded border border-blue-500 outline-none w-32"
              />
            ) : (
              <span className="truncate" title={node.path}>
                {node.name}
              </span>
            )}
          </div>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            {node.isFolder && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddFile(node.path);
                }}
                title="Tambah berkas di folder ini"
                className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-700/50"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => startRename(node, e)}
              title="Ganti nama"
              className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-700/50"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Hapus ${node.name}?`)) {
                  onDeleteNode(node.path);
                }
              }}
              title="Hapus"
              className="p-1 hover:text-rose-400 text-slate-400 rounded hover:bg-slate-700/50"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {node.isFolder && isExpanded && node.children && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-64 select-none shrink-0">
      {/* Header berkas */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Struktur Berkas
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAddFile()}
            title="Tambah Berkas Baru"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <Plus className="w-4 h-4" />
          </button>
          {onUploadAdditionalFiles && (
            <label
              title="Unggah berkas tambahan"
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onUploadAdditionalFiles(e.target.files);
                  }
                }}
              />
            </label>
          )}
        </div>
      </div>

      {/* Pencarian cepat berkas */}
      <div className="p-2 border-b border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari berkas..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 text-xs pl-7 pr-2 py-1.5 rounded border border-slate-800 focus:border-blue-500 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Daftar pohon berkas */}
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {tree.length === 0 ? (
          <div className="text-center text-slate-500 text-xs p-4">
            Tidak ada berkas. Unggah file .zip untuk memulai.
          </div>
        ) : (
          tree.map((node) => renderNode(node, 0))
        )}
      </div>

      {/* Footer info */}
      <div className="px-3 py-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between items-center">
        <span>{tree.length} direktori utama</span>
        <span className="text-slate-400">ZipStudio</span>
      </div>
    </div>
  );
};
