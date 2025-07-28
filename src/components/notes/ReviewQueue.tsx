import { useState, useMemo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NoteContent } from '@/components/NoteContent';
import { QuotedBoostDialog } from './QuotedBoostDialog';
import { useSpacedRepetition } from '@/hooks/useSpacedRepetition';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { formatDistanceToNow } from '@/lib/dateUtils';
import { CheckCircle, SkipForward, Repeat2, ChevronDown, Quote, Copy } from 'lucide-react';
import { nip19 } from 'nostr-tools';

interface ReviewQueueProps {
  notes: NostrEvent[];
  isLoading: boolean;
}

export function ReviewQueue({ notes, isLoading }: ReviewQueueProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quotedBoostNote, setQuotedBoostNote] = useState<NostrEvent | null>(null);
  const { markReviewed, getReviewProgress, isDueForReview } = useSpacedRepetition();
  const { mutate: createEvent } = useNostrPublish();
  const { toast } = useToast();

  // Filter notes that are actually due for review (this updates when spaced repetition state changes)
  const dueNotes = useMemo(() => {
    return notes.filter(isDueForReview);
  }, [notes, isDueForReview]);

  const handleBoost = (note: NostrEvent) => {
    try {
      createEvent({
        kind: 6, // Repost kind
        content: '',
        tags: [
          ['e', note.id],
          ['p', note.pubkey],
        ],
      });

      toast({
        title: "Boosted!",
        description: "Note has been boosted to your followers.",
      });
    } catch (error) {
      console.error('Failed to boost note:', error);
      toast({
        title: "Error",
        description: "Failed to boost note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyNevent = async (note: NostrEvent) => {
    try {
      const nevent = nip19.neventEncode({
        id: note.id,
        author: note.pubkey,
      });

      await navigator.clipboard.writeText(nevent);

      toast({
        title: "Copied!",
        description: "Note reference copied to clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy nevent:', error);
      toast({
        title: "Error",
        description: "Failed to copy note reference.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Loading revisit queue...</div>
      </div>
    );
  }

  if (dueNotes.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
        <div>
          <h3 className="text-lg font-semibold">All caught up!</h3>
          <p className="text-muted-foreground">
            No notes are due for revisiting right now. Check back later or write new notes in your favorite Nostr client.
          </p>
        </div>
      </div>
    );
  }

  // Reset current index if it's beyond the available due notes
  const safeCurrentIndex = currentIndex >= dueNotes.length ? 0 : currentIndex;
  const currentNote = dueNotes[safeCurrentIndex];
  const progress = getReviewProgress(currentNote);
  const createdAt = new Date(currentNote.created_at * 1000);

  const handleMarkReviewed = () => {
    markReviewed(currentNote.id);

    // After marking as reviewed, the note will be filtered out of dueNotes
    // So we need to adjust the current index accordingly
    const newDueNotes = dueNotes.filter(note => note.id !== currentNote.id);

    if (newDueNotes.length === 0) {
      // No more notes to review, component will show "all caught up"
      setCurrentIndex(0);
    } else if (safeCurrentIndex >= newDueNotes.length) {
      // Current index is beyond the new array, go to the last item
      setCurrentIndex(newDueNotes.length - 1);
    }
    // Otherwise, keep the same index (which will show the next note)
  };

  const handleSkip = () => {
    if (safeCurrentIndex < dueNotes.length - 1) {
      setCurrentIndex(safeCurrentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Note {safeCurrentIndex + 1} of {dueNotes.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSkip}
            disabled={dueNotes.length <= 1}
          >
            <SkipForward className="h-4 w-4 mr-1" />
            Skip
          </Button>
        </div>
      </div>

      <Progress value={((safeCurrentIndex + 1) / dueNotes.length) * 100} className="h-2" />

      {/* Current note */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Revisit Time</CardTitle>
              <Badge variant="destructive">
                Level {progress.level}/{progress.maxLevel}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Created {formatDistanceToNow(createdAt, { addSuffix: true })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" variant="outline" className="min-w-32">
                  <Repeat2 className="h-4 w-4 mr-2" />
                  Boost
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => handleBoost(currentNote)}>
                  <Repeat2 className="h-4 w-4 mr-2" />
                  Boost
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setQuotedBoostNote(currentNote)}>
                  <Quote className="h-4 w-4 mr-2" />
                  Quote Boost
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="lg"
              onClick={handleMarkReviewed}
              className="min-w-32"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Got It!
            </Button>
          </div>

          <div className="whitespace-pre-wrap break-words text-base leading-relaxed">
            <NoteContent event={currentNote} />
          </div>

          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              After marking as revisited, this note will appear again in{' '}
              {progress.level < 4 ?
                `${[1, 3, 7, 14][progress.level]} day${[1, 3, 7, 14][progress.level] !== 1 ? 's' : ''}` :
                'never (completed)'
              }
            </div>
            {progress.reviewCount > 0 && (
              <div className="text-xs text-muted-foreground">
                Previously revisited {progress.reviewCount} time{progress.reviewCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      {dueNotes.length > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex(Math.max(0, safeCurrentIndex - 1))}
              disabled={safeCurrentIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCopyNevent(currentNote)}
              title="Copy note reference"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
          <div className="flex gap-1">
            {dueNotes.slice(0, 5).map((_, i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === safeCurrentIndex ? 'bg-primary' : 'bg-muted'
                }`}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
            {dueNotes.length > 5 && (
              <span className="text-muted-foreground text-sm ml-2">
                +{dueNotes.length - 5} more
              </span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(Math.min(dueNotes.length - 1, safeCurrentIndex + 1))}
            disabled={safeCurrentIndex === dueNotes.length - 1}
          >
            Next
          </Button>
        </div>
      )}

      <QuotedBoostDialog
        open={!!quotedBoostNote}
        onOpenChange={(open) => !open && setQuotedBoostNote(null)}
        note={quotedBoostNote}
      />
    </div>
  );
}