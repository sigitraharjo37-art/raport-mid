import { ProjectFile } from '../types';

/**
 * Normalizes a relative path against a base file directory.
 * e.g. base: "sub/index.html", relative: "./style.css" -> "sub/style.css"
 * e.g. base: "sub/index.html", relative: "../images/pic.png" -> "images/pic.png"
 */
function resolveRelativePath(baseFilePath: string, relativePath: string): string {
  // Strip query params or hash
  const cleanRelative = relativePath.split('?')[0].split('#')[0].trim();
  if (cleanRelative.startsWith('/') || cleanRelative.startsWith('http://') || cleanRelative.startsWith('https://') || cleanRelative.startsWith('data:')) {
    return cleanRelative;
  }

  const baseParts = baseFilePath.split('/');
  baseParts.pop(); // remove file name, keep directory

  const relParts = cleanRelative.split('/');

  for (const part of relParts) {
    if (part === '.' || part === '') {
      continue;
    } else if (part === '..') {
      if (baseParts.length > 0) {
        baseParts.pop();
      }
    } else {
      baseParts.push(part);
    }
  }

  return baseParts.join('/');
}

/**
 * Generates an inlined, self-contained HTML bundle for preview in a sandboxed iframe.
 */
export function buildPreviewHtml(entryFile: ProjectFile, allFiles: ProjectFile[]): string {
  let html = entryFile.content;

  // File lookup map by clean relative path
  const fileMap = new Map<string, ProjectFile>();
  for (const f of allFiles) {
    fileMap.set(f.path, f);
    // Also store by just the filename for fallback matching
    if (!fileMap.has(f.name)) {
      fileMap.set(f.name, f);
    }
  }

  // Helper to find a file by relative or filename
  const findProjectFile = (ref: string): ProjectFile | undefined => {
    const directResolved = resolveRelativePath(entryFile.path, ref);
    if (fileMap.has(directResolved)) return fileMap.get(directResolved);
    if (fileMap.has(ref)) return fileMap.get(ref);
    const fileName = ref.split('/').pop() || '';
    if (fileName && fileMap.has(fileName)) return fileMap.get(fileName);
    return undefined;
  };

  // 1. Process and inline CSS files
  html = html.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi, (match) => {
    const hrefMatch = match.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) return match;
    const href = hrefMatch[1];
    if (href.startsWith('http://') || href.startsWith('https://')) return match;

    const cssFile = findProjectFile(href);
    if (cssFile) {
      let cssContent = cssFile.content;

      // Replace url(...) inside CSS with image data URLs if referenced
      cssContent = cssContent.replace(/url\(\s*["']?([^"')]+)["']?\s*\)/gi, (cssUrlMatch, urlParam) => {
        if (urlParam.startsWith('http') || urlParam.startsWith('data:')) return cssUrlMatch;
        const imgFile = findProjectFile(urlParam);
        if (imgFile && imgFile.isBinary) {
          return `url("${imgFile.content}")`;
        }
        return cssUrlMatch;
      });

      return `<style data-source="${cssFile.path}">\n/* Inlined from ${cssFile.path} */\n${cssContent}\n</style>`;
    }
    return match;
  });

  // 2. Process and inline JS scripts
  html = html.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (match, src) => {
    if (src.startsWith('http://') || src.startsWith('https://')) return match;

    const jsFile = findProjectFile(src);
    if (jsFile) {
      return `<script data-source="${jsFile.path}">\n// Inlined from ${jsFile.path}\n${jsFile.content}\n</script>`;
    }
    return match;
  });

  // 3. Process inline <img> tags
  html = html.replace(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi, (match, src) => {
    if (src.startsWith('http') || src.startsWith('data:')) return match;
    const imgFile = findProjectFile(src);
    if (imgFile) {
      return match.replace(src, imgFile.content);
    }
    return match;
  });

  // 4. Inject runtime console bridge & error logger
  const consoleScript = `
    <script>
      (function() {
        const _postLog = function(type, args) {
          try {
            const formatted = Array.from(args).map(arg => {
              if (typeof arg === 'object' && arg !== null) {
                try { return JSON.stringify(arg, null, 2); } catch(e) { return String(arg); }
              }
              return String(arg);
            }).join(' ');

            window.parent.postMessage({
              type: 'ZIP_STUDIO_CONSOLE',
              logType: type,
              message: formatted,
              timestamp: new Date().toLocaleTimeString()
            }, '*');
          } catch(e) {}
        };

        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        const originalInfo = console.info;

        console.log = function(...args) {
          _postLog('log', args);
          originalLog.apply(console, args);
        };
        console.warn = function(...args) {
          _postLog('warn', args);
          originalWarn.apply(console, args);
        };
        console.error = function(...args) {
          _postLog('error', args);
          originalError.apply(console, args);
        };
        console.info = function(...args) {
          _postLog('info', args);
          originalInfo.apply(console, args);
        };

        window.addEventListener('error', function(e) {
          _postLog('error', ['[Runtime Error]', e.message, 'at', e.filename + ':' + e.lineno]);
        });

        window.addEventListener('unhandledrejection', function(e) {
          _postLog('error', ['[Unhandled Promise Rejection]', e.reason ? (e.reason.message || String(e.reason)) : 'Unknown rejection']);
        });
      })();
    </script>
  `;

  // Inject console interceptor early in <head> or at top of document
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>\n${consoleScript}`);
  } else if (html.includes('<html>')) {
    html = html.replace('<html>', `<html>\n<head>${consoleScript}</head>`);
  } else {
    html = `${consoleScript}\n${html}`;
  }

  return html;
}
