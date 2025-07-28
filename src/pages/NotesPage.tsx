import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotesList } from '@/components/notes/NotesList';
import { ReviewQueue } from '@/components/notes/ReviewQueue';
import { useMyNotes } from '@/hooks/useMyNotes';
import { useSpacedRepetition } from '@/hooks/useSpacedRepetition';
import { useExportNotes } from '@/hooks/useExportNotes';
import { Download } from 'lucide-react';

export default function NotesPage() {
  const { user } = useCurrentUser();
  const { data: notes, isLoading: notesLoading } = useMyNotes();
  const { getNotesForReview, getReviewStats } = useSpacedRepetition();
  const { exportNotes } = useExportNotes();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-3xl font-bold">Note Revisitor</h1>
          <p className="text-muted-foreground">
            Review your notes to see which might fit the current vibe.
          </p>
          <LoginArea className="max-w-60 mx-auto" />
        </div>
      </div>
    );
  }

  const reviewNotes = getNotesForReview(notes || []);
  const stats = getReviewStats(notes || []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Notes</h1>
            <p className="text-muted-foreground">
              Revisit your thoughts and find your vibe
            </p>
          </div>
          {notes && notes.length > 0 && (
            <Button
              variant="outline"
              onClick={() => exportNotes(notes)}
              disabled={notesLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Notes
            </Button>
          )}
        </div>

        <Tabs defaultValue="review" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="review" className="relative">
              Revisit
              {reviewNotes.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {reviewNotes.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Notes</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revisit Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewQueue
                  notes={reviewNotes}
                  isLoading={notesLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <NotesList
              notes={notes || []}
              isLoading={notesLoading}
            />
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revisiting Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Notes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{stats.dueForReview}</div>
                    <div className="text-sm text-muted-foreground">Due for Revisit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{stats.mastered}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{stats.learning}</div>
                    <div className="text-sm text-muted-foreground">Exploring</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}