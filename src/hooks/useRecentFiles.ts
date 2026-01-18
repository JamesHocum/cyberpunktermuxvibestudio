import { useState, useEffect, useCallback } from 'react';

export interface RecentFile {
  path: string;
  name: string;
  extension: string;
  timestamp: number;
}

const STORAGE_KEY = 'cyberpunk-ide-recent-files';
const DEFAULT_MAX_FILES = 10;

export const useRecentFiles = (maxFiles: number = DEFAULT_MAX_FILES) => {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentFiles(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load recent files:', error);
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentFiles));
    } catch (error) {
      console.error('Failed to save recent files:', error);
    }
  }, [recentFiles]);

  // Add file to recent list (deduplicates and moves to top)
  const addRecentFile = useCallback((path: string) => {
    if (!path) return;
    
    const name = path.split('/').pop() || path;
    const extensionMatch = name.match(/\.([^.]+)$/);
    const extension = extensionMatch ? extensionMatch[1] : '';

    setRecentFiles(prev => {
      // Remove existing entry for this path
      const filtered = prev.filter(f => f.path !== path);
      // Add to top with new timestamp
      const newFile: RecentFile = {
        path,
        name,
        extension,
        timestamp: Date.now(),
      };
      return [newFile, ...filtered].slice(0, maxFiles);
    });
  }, [maxFiles]);

  // Clear all recent files
  const clearRecentFiles = useCallback(() => {
    setRecentFiles([]);
  }, []);

  // Remove specific file from recent list
  const removeRecentFile = useCallback((path: string) => {
    setRecentFiles(prev => prev.filter(f => f.path !== path));
  }, []);

  return {
    recentFiles,
    addRecentFile,
    clearRecentFiles,
    removeRecentFile,
  };
};
