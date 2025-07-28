import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { NoteContent } from '@/components/NoteContent';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { formatDistanceToNow } from '@/lib/dateUtils';
import { Quote } from 'lucide-react';

interface QuotedBoostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NostrEvent | null;
}

export function QuotedBoostDialog({ open, onOpenChange, note }: QuotedBoostDialogProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutate: createEvent } = useNostrPublish();
  const { toast } = useToast();
  const author = useAuthor(note?.pubkey);

  if (!note) {
    return null;
  }

  const authorName = author.data?.metadata?.name ?? genUserName(note.pubkey);
  const createdAt = new Date(note.created_at * 1000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast({
        title: "Error",
        description: "Please add a comment for your quoted boost.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a kind 1 note with the quoted content
      // Format: user comment + quoted note content
      const quotedContent = `${comment.trim()}\n\nnostr:${nip19.neventEncode({ id: note.id, author: note.pubkey })}`;

      createEvent({
        kind: 1,
        content: quotedContent,
        tags: [
          ['e', note.id, '', 'mention'], // Reference to the quoted note
          ['p', note.pubkey], // Reference to the original author
          ['q', note.id], // Quote tag (NIP-18 extension for quote posts)
        ],
      });

      toast({
        title: "Quoted Boost Sent!",
        description: "Your quoted boost has been published.",
      });

      setComment('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create quoted boost:', error);
      toast({
        title: "Error",
        description: "Failed to publish quoted boost. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Quote className="h-5 w-5" />
            Quote Boost
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comment">Your Comment</Label>
            <Textarea
              id="comment"
              placeholder="Add your thoughts about this note..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Preview of the quoted note */}
          <div className="space-y-2">
            <Label>Quoting</Label>
            <Card className="border-l-4 border-l-blue-500 bg-muted/50">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">{authorName}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
                  </div>
                  <div className="whitespace-pre-wrap break-words text-sm">
                    <NoteContent event={note} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !comment.trim()}>
              {isSubmitting ? 'Publishing...' : 'Quote Boost'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}