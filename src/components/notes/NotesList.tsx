import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NoteContent } from '@/components/NoteContent';
import { QuotedBoostDialog } from './QuotedBoostDialog';
import { useSpacedRepetition } from '@/hooks/useSpacedRepetition';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { formatDistanceToNow } from '@/lib/dateUtils';
import { Clock, CheckCircle, RotateCcw, Repeat2, ChevronDown, Quote, Copy } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import type { TimeRange } from '@/hooks/useMyNotes';

interface NotesListProps {
  notes: NostrEvent[];
  isLoading: boolean;
  timeRange?: TimeRange;
  isUsingCustomRelay?: boolean;
}

export function NotesList({ notes, isLoading, timeRange = 'month', isUsingCustomRelay = false }: NotesListProps) {
  const [quotedBoostNote, setQuotedBoostNote] = useState<NostrEvent | null>(null);
  const { getReviewProgress, markReviewed, resetProgress } = useSpacedRepetition();
  const { mutate: createEvent } = useNostrPublish();
  const { toast } = useToast();

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
    const loadingMessage = isUsingCustomRelay
      ? 'Searching selected relay for notes...'
      : 'Loading notes...';

    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <div className="text-sm text-muted-foreground">{loadingMessage}</div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-2 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    let emptyMessage = timeRange === 'all-time'
      ? "No notes found. Write some notes in your favorite Nostr client to start revisiting!"
      : "No notes found from the last month. Write some notes in your favorite Nostr client to start revisiting!";

    if (timeRange === 'all-time' && !isUsingCustomRelay) {
      emptyMessage = "No notes found on your default relay. Try selecting a different relay above to search for older notes that might be stored elsewhere.";
    } else if (timeRange === 'all-time' && isUsingCustomRelay) {
      emptyMessage = "No notes found on the selected relay. Try choosing a different relay to search for your notes.";
    }

    return (
      <Card className="border-dashed">
        <CardContent className="py-12 px-8 text-center">
          <div className="max-w-sm mx-auto space-y-4">
            <p className="text-muted-foreground">
              {emptyMessage}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {notes.map((note) => {
        const progress = getReviewProgress(note);
        const createdAt = new Date(note.created_at * 1000);

        return (
          <Card key={note.id} className={progress.isDue ? 'border-orange-200 bg-orange-50/50' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(createdAt, { addSuffix: true })}
                  </span>
                  {progress.isDue && (
                    <Badge variant="destructive" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Due for Revisit
                    </Badge>
                  )}
                  {progress.isMastered && (
                    <Badge variant="default" className="text-xs bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" title="Boost options">
                        <Repeat2 className="h-4 w-4" />
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleBoost(note)}>
                        <Repeat2 className="h-4 w-4 mr-2" />
                        Boost
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setQuotedBoostNote(note)}>
                        <Quote className="h-4 w-4 mr-2" />
                        Quote Boost
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {!progress.isMastered && (
                    <Button
                      size="sm"
                      variant={progress.isDue ? "default" : "outline"}
                      onClick={() => markReviewed(note.id)}
                    >
                      Mark Revisited
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyNevent(note)}
                    title="Copy note reference"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resetProgress(note.id)}
                    title="Reset progress"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="whitespace-pre-wrap break-words">
                <NoteContent event={note} className="text-sm" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress: {progress.level}/{progress.maxLevel}</span>
                  <span>{Math.round(progress.progress)}% complete</span>
                </div>
                <Progress value={progress.progress} className="h-2" />

                {progress.nextReview && !progress.isMastered && (
                  <div className="text-xs text-muted-foreground">
                    Next revisit: {formatDistanceToNow(progress.nextReview, { addSuffix: true })}
                  </div>
                )}

                {progress.reviewCount > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Revisited {progress.reviewCount} time{progress.reviewCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
        })}
      </div>

      <QuotedBoostDialog
        open={!!quotedBoostNote}
        onOpenChange={(open) => !open && setQuotedBoostNote(null)}
        note={quotedBoostNote}
      />
    </>
  );
}