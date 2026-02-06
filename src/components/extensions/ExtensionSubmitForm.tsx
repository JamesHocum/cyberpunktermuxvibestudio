import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ExtensionSubmitFormProps {
  onClose: () => void;
  onSubmitted: () => void;
}

export function ExtensionSubmitForm({ onClose, onSubmitted }: ExtensionSubmitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    author: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.url.trim()) {
      toast.error('Name and URL are required');
      return;
    }

    // Validate URL
    try {
      new URL(formData.url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('extensions')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          url: formData.url.trim(),
          author: formData.author.trim() || null,
          is_approved: false // Requires admin approval
        });

      if (error) {
        if (error.code === '42501') {
          toast.error('Please sign in to submit extensions');
        } else {
          toast.error('Failed to submit extension');
          console.error('Submit error:', error);
        }
        return;
      }

      toast.success('Extension submitted for review!');
      onSubmitted();
      onClose();
    } catch (err) {
      toast.error('Failed to submit extension');
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 cyber-border rounded-md bg-studio-terminal/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-terminal text-sm text-primary">Submit Extension</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="ext-name" className="text-xs">Name *</Label>
          <Input
            id="ext-name"
            placeholder="My Awesome Extension"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="cyber-border bg-studio-sidebar h-8 text-sm"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="ext-url" className="text-xs">URL *</Label>
          <Input
            id="ext-url"
            placeholder="https://cdn.example.com/extension.js"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            className="cyber-border bg-studio-sidebar h-8 text-sm"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="ext-author" className="text-xs">Author</Label>
          <Input
            id="ext-author"
            placeholder="Your name"
            value={formData.author}
            onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
            className="cyber-border bg-studio-sidebar h-8 text-sm"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="ext-desc" className="text-xs">Description</Label>
          <Textarea
            id="ext-desc"
            placeholder="What does your extension do?"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="cyber-border bg-studio-sidebar text-sm resize-none"
            rows={2}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            className="neon-button"
            disabled={isSubmitting}
          >
            <Send className="h-4 w-4 mr-1" />
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </form>

      <p className="text-xs text-muted-foreground mt-3">
        Extensions are reviewed before being published.
      </p>
    </div>
  );
}
