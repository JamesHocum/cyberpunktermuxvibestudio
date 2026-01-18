import {
  FileText,
  FileCode,
  FileJson,
  FileType,
  Image,
  File,
  FileCode2,
  Settings,
  Database,
  Globe,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  extension: string;
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  // TypeScript/JavaScript
  tsx: FileCode,
  ts: FileCode,
  jsx: FileCode,
  js: FileCode,
  mjs: FileCode,
  cjs: FileCode,
  
  // Data formats
  json: FileJson,
  yaml: FileJson,
  yml: FileJson,
  toml: Settings,
  
  // Markup/Documentation
  md: FileText,
  mdx: FileText,
  txt: FileText,
  
  // Styles
  css: Palette,
  scss: Palette,
  sass: Palette,
  less: Palette,
  
  // Web
  html: Globe,
  htm: Globe,
  xml: FileCode2,
  svg: Image,
  
  // Images
  png: Image,
  jpg: Image,
  jpeg: Image,
  gif: Image,
  webp: Image,
  ico: Image,
  
  // Config
  env: Settings,
  gitignore: Settings,
  eslintrc: Settings,
  prettierrc: Settings,
  
  // Database
  sql: Database,
};

export const FileIcon = ({ extension, className }: FileIconProps) => {
  const Icon = iconMap[extension.toLowerCase()] || File;
  return <Icon className={cn("h-4 w-4 text-primary", className)} />;
};

export default FileIcon;
