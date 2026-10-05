import JSZip from 'jszip';
import { ProjectFile, TreeNode } from '../types';

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'avif',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'mp3', 'wav', 'ogg', 'mp4', 'webm',
  'pdf', 'wasm'
]);

export function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'html':
    case 'htm':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'js':
    case 'mjs':
      return 'application/javascript';
    case 'ts':
      return 'application/typescript';
    case 'tsx':
    case 'jsx':
      return 'text/jsx';
    case 'json':
      return 'application/json';
    case 'svg':
      return 'image/svg+xml';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'ico':
      return 'image/x-icon';
    case 'md':
      return 'text/markdown';
    case 'txt':
      return 'text/plain';
    case 'xml':
      return 'application/xml';
    default:
      return 'text/plain';
  }
}

export function isBinaryFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return BINARY_EXTENSIONS.has(ext);
}

/**
 * Extracts a ZIP file into an array of ProjectFiles.
 */
export async function extractZipFile(file: File): Promise<{ files: ProjectFile[]; rootDirName: string }> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  const files: ProjectFile[] = [];
  const entries = Object.keys(loadedZip.files);

  // Detect if all files are wrapped in a single root folder (e.g. "my-project/index.html")
  let commonPrefix = '';
  const nonDirEntries = entries.filter((p) => !loadedZip.files[p].dir);
  if (nonDirEntries.length > 0) {
    const firstParts = nonDirEntries[0].split('/');
    if (firstParts.length > 1) {
      const candidatePrefix = firstParts[0] + '/';
      const allSharePrefix = nonDirEntries.every((p) => p.startsWith(candidatePrefix));
      if (allSharePrefix) {
        commonPrefix = candidatePrefix;
      }
    }
  }

  for (const relativePath of entries) {
    const entry = loadedZip.files[relativePath];
    if (entry.dir) continue; // ignore pure folder entries

    // Remove macOS metadata garbage
    if (relativePath.includes('__MACOSX') || relativePath.endsWith('.DS_Store')) {
      continue;
    }

    const cleanPath = commonPrefix ? relativePath.substring(commonPrefix.length) : relativePath;
    if (!cleanPath) continue;

    const fileName = cleanPath.split('/').pop() || cleanPath;
    const isBinary = isBinaryFile(fileName);
    const mimeType = getMimeType(fileName);

    let content = '';
    let size = 0;

    if (isBinary) {
      const base64Data = await entry.async('base64');
      content = `data:${mimeType};base64,${base64Data}`;
      size = Math.round((base64Data.length * 3) / 4);
    } else {
      content = await entry.async('string');
      size = new Blob([content]).size;
    }

    files.push({
      path: cleanPath,
      name: fileName,
      content,
      isBinary,
      size,
      mimeType,
      lastModified: entry.date ? entry.date.getTime() : Date.now(),
    });
  }

  // Sort files logically
  files.sort((a, b) => a.path.localeCompare(b.path));

  const rootDirName = commonPrefix ? commonPrefix.replace('/', '') : file.name.replace(/\.zip$/i, '');
  return { files, rootDirName };
}

/**
 * Builds a hierarchical tree structure for file explorer navigation.
 */
export function buildFileTree(files: ProjectFile[]): TreeNode[] {
  const rootNodes: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split('/');
    let currentLevel = rootNodes;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      let existingNode = currentLevel.find((n) => n.name === part);

      if (!existingNode) {
        if (isLast) {
          existingNode = {
            name: part,
            path: currentPath,
            isFolder: false,
            file,
          };
        } else {
          existingNode = {
            name: part,
            path: currentPath,
            isFolder: true,
            children: [],
          };
        }
        currentLevel.push(existingNode);
      }

      if (!isLast && existingNode.children) {
        currentLevel = existingNode.children;
      }
    }
  }

  // Recursive sort: folders first, then alphabetically
  function sortNodes(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const node of nodes) {
      if (node.children) {
        sortNodes(node.children);
      }
    }
  }

  sortNodes(rootNodes);
  return rootNodes;
}

/**
 * Compiles all project files back into a downloadable ZIP file.
 */
export async function downloadProjectAsZip(files: ProjectFile[], zipName: string = 'project.zip'): Promise<void> {
  const zip = new JSZip();

  for (const file of files) {
    if (file.isBinary) {
      const base64Index = file.content.indexOf(';base64,');
      if (base64Index !== -1) {
        const rawBase64 = file.content.substring(base64Index + 8);
        zip.file(file.path, rawBase64, { base64: true });
      } else {
        zip.file(file.path, file.content);
      }
    } else {
      zip.file(file.path, file.content);
    }
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
