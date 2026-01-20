export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export type FileCategory = 'image' | 'code' | 'text' | 'other';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_SIZE = 1 * 1024 * 1024; // 1MB

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'];
const CODE_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt', 'scala', 'vue', 'svelte'];
const TEXT_EXTENSIONS = ['txt', 'md', 'json', 'xml', 'yaml', 'yml', 'toml', 'csv', 'html', 'css', 'scss', 'sass', 'less', 'sql', 'sh', 'bash', 'zsh', 'env', 'gitignore', 'dockerfile'];

export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
};

export const detectFileType = (file: File): FileCategory => {
  const extension = getFileExtension(file.name);
  
  if (file.type.startsWith('image/') || IMAGE_EXTENSIONS.includes(extension)) {
    return 'image';
  }
  
  if (CODE_EXTENSIONS.includes(extension)) {
    return 'code';
  }
  
  if (TEXT_EXTENSIONS.includes(extension) || file.type.startsWith('text/')) {
    return 'text';
  }
  
  return 'other';
};

export const validateUpload = (file: File): FileValidationResult => {
  const category = detectFileType(file);
  
  if (category === 'image') {
    if (file.size > MAX_IMAGE_SIZE) {
      return { valid: false, error: `Image too large. Maximum size is 10MB.` };
    }
    return { valid: true };
  }
  
  if (category === 'code' || category === 'text') {
    if (file.size > MAX_TEXT_SIZE) {
      return { valid: false, error: `File too large. Maximum size is 1MB.` };
    }
    return { valid: true };
  }
  
  return { valid: false, error: `Unsupported file type: ${file.type || getFileExtension(file.name)}` };
};

export const processImageForAI = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};

export const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getLanguageFromExtension = (extension: string): string => {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    vue: 'vue',
    svelte: 'svelte',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash',
    yaml: 'yaml',
    yml: 'yaml',
  };
  
  return languageMap[extension] || 'plaintext';
};
