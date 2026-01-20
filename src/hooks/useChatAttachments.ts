import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  validateUpload, 
  detectFileType, 
  processImageForAI, 
  extractTextFromFile,
  getFileExtension 
} from '@/lib/fileProcessing';
import { toast } from 'sonner';

export interface ChatAttachment {
  id: string;
  type: 'file' | 'image' | 'code';
  name: string;
  url?: string;
  content?: string;
  base64?: string;
  mimeType: string;
  size: number;
}

export const useChatAttachments = () => {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File, userId: string): Promise<ChatAttachment | null> => {
    const validation = validateUpload(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return null;
    }

    const fileCategory = detectFileType(file);
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      if (fileCategory === 'image') {
        // For images, get base64 for AI and optionally upload to storage
        const base64 = await processImageForAI(file);
        
        // Upload to storage for persistence
        const filePath = `${userId}/${id}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, file);
        
        if (error) {
          console.warn('Storage upload failed, using base64 only:', error);
        }
        
        const url = data ? supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath).data.publicUrl : undefined;
        
        return {
          id,
          type: 'image',
          name: file.name,
          url,
          base64,
          mimeType: file.type,
          size: file.size,
        };
      } else {
        // For code/text files, extract content
        const content = await extractTextFromFile(file);
        
        return {
          id,
          type: fileCategory === 'code' ? 'code' : 'file',
          name: file.name,
          content,
          mimeType: file.type || `text/${getFileExtension(file.name)}`,
          size: file.size,
        };
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
      return null;
    }
  }, []);

  const addFiles = useCallback(async (files: File[], userId: string) => {
    if (!userId) {
      toast.error('Please sign in to upload files');
      return;
    }

    setIsUploading(true);
    
    try {
      const results = await Promise.all(
        files.map(file => uploadFile(file, userId))
      );
      
      const validAttachments = results.filter((a): a is ChatAttachment => a !== null);
      setAttachments(prev => [...prev, ...validAttachments]);
      
      if (validAttachments.length > 0) {
        toast.success(`Added ${validAttachments.length} file(s)`);
      }
    } finally {
      setIsUploading(false);
    }
  }, [uploadFile]);

  const handlePaste = useCallback(async (event: ClipboardEvent, userId: string): Promise<boolean> => {
    const items = event.clipboardData?.items;
    if (!items) return false;

    const files: File[] = [];
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          // Rename pasted images with timestamp
          const renamedFile = new File(
            [file], 
            `screenshot-${Date.now()}.${file.type.split('/')[1] || 'png'}`,
            { type: file.type }
          );
          files.push(renamedFile);
        }
      }
    }

    if (files.length > 0) {
      await addFiles(files, userId);
      return true;
    }
    
    return false;
  }, [addFiles]);

  const handleDrop = useCallback(async (event: DragEvent, userId: string) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files || []);
    if (files.length > 0) {
      await addFiles(files, userId);
    }
  }, [addFiles]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const addCodeSnippet = useCallback((code: string, filename: string = 'snippet.tsx') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const attachment: ChatAttachment = {
      id,
      type: 'code',
      name: filename,
      content: code,
      mimeType: `text/${getFileExtension(filename)}`,
      size: new Blob([code]).size,
    };
    setAttachments(prev => [...prev, attachment]);
  }, []);

  return {
    attachments,
    isUploading,
    addFiles,
    handlePaste,
    handleDrop,
    removeAttachment,
    clearAttachments,
    addCodeSnippet,
  };
};
