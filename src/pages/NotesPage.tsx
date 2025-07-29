import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NotesList } from '@/components/notes/NotesList';
import { ReviewQueue } from '@/components/notes/ReviewQueue';
import { NotesRelaySelector } from '@/components/NotesRelaySelector';
import { useMyNotes, type TimeRange } from '@/hooks/useMyNotes';
import { useSpacedRepetition } from '@/hooks/useSpacedRepetition';
import { useExportNotes } from '@/hooks/useExportNotes';
import { Download, Clock, Infinity as InfinityIcon, ChevronDown, Wifi } from 'lucide-react';

export default function NotesPage() {
  const { user } = useCurrentUser();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedRelay, setSelectedRelay] = useState<string | undefined>(undefined);
  const [showRelaySelector, setShowRelaySelector] = useState(false);
  const { data: notes, isLoading: notesLoading } = useMyNotes({ timeRange, specificRelay: selectedRelay });
  const { getNotesForReview, getReviewStats } = useSpacedRepetition();
  const { exportNotes } = useExportNotes();

  // Auto-expand relay selector when switching to all-time for the first time
  useEffect(() => {
    if (timeRange === 'all-time' && !selectedRelay) {
      setShowRelaySelector(true);
    }
  }, [timeRange, selectedRelay]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-3xl font-bold">NostRecall</h1>
          <p className="text-muted-foreground">
            Review your notes to pick up on past conversations, boost your best content and remember important info.
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
              Revisit your notes and conversations
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-3">
                  <Label htmlFor="time-range-toggle" className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Last Month
                  </Label>
                  <Switch
                    id="time-range-toggle"
                    checked={timeRange === 'all-time'}
                    onCheckedChange={(checked) => setTimeRange(checked ? 'all-time' : 'month')}
                  />
                  <Label htmlFor="time-range-toggle" className="text-sm font-medium flex items-center gap-2">
                    <InfinityIcon className="h-4 w-4" />
                    All Time
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>All Time mode allows you to choose a specific relay to search for older notes</p>
              </TooltipContent>
            </Tooltip>
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
        </div>

        {/* Relay selector for all-time queries */}
        {timeRange === 'all-time' && (
          <Card>
            <CardHeader>
              <Collapsible open={showRelaySelector} onOpenChange={setShowRelaySelector}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      <span className="font-medium">Choose Relay to Search</span>
                      {selectedRelay && (
                        <span className="text-sm text-muted-foreground">
                          (custom relay selected)
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showRelaySelector ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Choose a specific relay to search for your notes. Different relays may have different historical data available.
                    </p>
                    <NotesRelaySelector
                      selectedRelay={selectedRelay}
                      onSelectionChange={setSelectedRelay}
                      placeholder="Choose a relay to search for notes..."
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardHeader>
          </Card>
        )}

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
            <TabsTrigger value="all" className="relative">
              All Notes
              {notes && notes.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notes.length}
                </span>
              )}
            </TabsTrigger>
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
            {!notesLoading && notes && notes.length > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>
                  Showing {notes.length} notes {timeRange === 'all-time' ? 'from all time' : 'from the last month'}
                  {timeRange === 'all-time' && selectedRelay && (
                    <span className="ml-1">
                      (from selected relay)
                    </span>
                  )}
                </span>
              </div>
            )}
            <NotesList
              notes={notes || []}
              isLoading={notesLoading}
              timeRange={timeRange}
              isUsingCustomRelay={!!selectedRelay}
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
