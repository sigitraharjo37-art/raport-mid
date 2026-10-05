export interface ProjectFile {
  path: string; // e.g. "index.html" or "css/style.css"
  name: string; // "style.css"
  content: string; // text content or base64 data URL for images/binaries
  isBinary: boolean;
  size: number;
  lastModified?: number;
  mimeType: string;
}

export interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: TreeNode[];
  file?: ProjectFile;
}

export interface EditorTab {
  path: string;
  isDirty?: boolean;
}

export interface ConsoleLogItem {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export type ViewportMode = 'responsive' | 'desktop' | 'tablet' | 'mobile';
