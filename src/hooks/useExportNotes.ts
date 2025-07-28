import { useCallback } from 'react';
import JSZip from 'jszip';
import type { NostrEvent } from '@nostrify/nostrify';
import { useToast } from './useToast';
import { formatDistanceToNow } from '@/lib/dateUtils';

export function useExportNotes() {
  const { toast } = useToast();

  const convertToMarkdown = useCallback((note: NostrEvent): string => {
    const date = new Date(note.created_at * 1000);
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeAgo = formatDistanceToNow(date, { addSuffix: true });
    
    // Extract hashtags from content for categorization
    const hashtags = note.content.match(/#\w+/g) || [];
    
    // Create markdown content
    let markdown = `# Note from ${formattedDate}\n\n`;
    markdown += `**Created:** ${date.toLocaleString()}\n`;
    markdown += `**Time ago:** ${timeAgo}\n`;
    
    if (hashtags.length > 0) {
      markdown += `**Tags:** ${hashtags.join(', ')}\n`;
    }
    
    markdown += `**Note ID:** \`${note.id}\`\n\n`;
    markdown += `---\n\n`;
    markdown += `${note.content}\n`;
    
    return markdown;
  }, []);

  const getNoteFolderName = useCallback((note: NostrEvent): string => {
    // Extract hashtags to determine folder
    const hashtags = note.content.match(/#\w+/g);
    
    if (hashtags && hashtags.length > 0) {
      // Use the first hashtag as folder name (remove #)
      return hashtags[0].slice(1);
    }
    
    // If no hashtags, categorize by date (year-month)
    const date = new Date(note.created_at * 1000);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const getNoteFileName = useCallback((note: NostrEvent): string => {
    const date = new Date(note.created_at * 1000);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    
    // Create a safe filename from the first line of content
    const firstLine = note.content.split('\n')[0];
    const safeTitle = firstLine
      .slice(0, 50) // Limit length
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase();
    
    return `${dateStr}_${timeStr}_${safeTitle || 'note'}.md`;
  }, []);

  const exportNotes = useCallback(async (notes: NostrEvent[]) => {
    try {
      if (notes.length === 0) {
        toast({
          title: "No notes to export",
          description: "You don't have any notes to export.",
          variant: "destructive",
        });
        return;
      }

      const zip = new JSZip();
      
      // Group notes by folder
      const folderGroups: Record<string, NostrEvent[]> = {};
      
      notes.forEach(note => {
        const folderName = getNoteFolderName(note);
        if (!folderGroups[folderName]) {
          folderGroups[folderName] = [];
        }
        folderGroups[folderName].push(note);
      });

      // Add notes to zip, organized by folders
      Object.entries(folderGroups).forEach(([folderName, folderNotes]) => {
        const folder = zip.folder(folderName);
        
        if (folder) {
          folderNotes.forEach(note => {
            const fileName = getNoteFileName(note);
            const markdown = convertToMarkdown(note);
            folder.file(fileName, markdown);
          });
        }
      });

      // Create a summary file
      let summary = `# Notes Export Summary\n\n`;
      summary += `**Export Date:** ${new Date().toLocaleString()}\n`;
      summary += `**Total Notes:** ${notes.length}\n`;
      summary += `**Folders:** ${Object.keys(folderGroups).length}\n\n`;
      
      summary += `## Folder Breakdown\n\n`;
      Object.entries(folderGroups).forEach(([folderName, folderNotes]) => {
        summary += `- **${folderName}**: ${folderNotes.length} notes\n`;
      });
      
      summary += `\n## About This Export\n\n`;
      summary += `This export contains your Nostr notes organized into folders and converted to Markdown format. `;
      summary += `Notes are grouped by their primary hashtag, or by year-month if no hashtags are present.\n\n`;
      summary += `Each note includes metadata such as creation date, note ID, and any hashtags found in the content.\n`;
      
      zip.file('README.md', summary);

      // Generate and download the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `nostr-notes-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful!",
        description: `Exported ${notes.length} notes in ${Object.keys(folderGroups).length} folders.`,
      });
    } catch (error) {
      console.error('Failed to export notes:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your notes. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, convertToMarkdown, getNoteFolderName, getNoteFileName]);

  return { exportNotes };
}