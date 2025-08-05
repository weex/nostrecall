import { useState, useEffect } from 'react';
import { Star, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { useAppContext } from '@/hooks/useAppContext';
import { cn } from '@/lib/utils';

// Default feedback recipient - configurable in code
const DEFAULT_FEEDBACK_NPUB = 'npub17dmmwz9dcs6rehfwvr4yd35r7fg8na6hu5fqfnhrs80q7etjveyq24tduz';

interface FeedbackPopupProps {
  /** The npub to send feedback to (overrides config and default) */
  feedbackRecipient?: string;
  /** Whether to show the popup initially */
  isOpen?: boolean;
  /** Callback when popup is closed */
  onClose?: () => void;
}

export function FeedbackPopup({
  feedbackRecipient,
  isOpen = false,
  onClose
}: FeedbackPopupProps) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [improvements, setImprovements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { toast } = useToast();
  const { config } = useAppContext();

  // Use prop, then config, then default
  const recipientNpub = feedbackRecipient || config.feedbackRecipient || DEFAULT_FEEDBACK_NPUB;

  // Check if user has already submitted feedback this session
  useEffect(() => {
    const submitted = sessionStorage.getItem('feedback-submitted');
    if (submitted) {
      setHasSubmitted(true);
    }
  }, []);

  // Auto-show popup after 30 seconds if user is logged in and hasn't submitted feedback
  useEffect(() => {
    if (!user || hasSubmitted || isVisible) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [user, hasSubmitted, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to submit feedback.",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!user.signer.nip44) {
      toast({
        title: "Encryption Not Supported",
        description: "Please upgrade your signer extension to a version that supports NIP-44 encryption.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Decode the recipient npub to get the pubkey
      const { nip19 } = await import('nostr-tools');
      const decoded = nip19.decode(recipientNpub);

      if (decoded.type !== 'npub') {
        throw new Error('Invalid feedback recipient npub');
      }

      const recipientPubkey = decoded.data;

      // Create feedback message
      const feedbackMessage = {
        rating,
        improvements: improvements.trim(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      const messageContent = `App Feedback:

Rating: ${rating}/5 stars

What could be improved:
${improvements || 'No suggestions provided'}

Submitted: ${feedbackMessage.timestamp}
URL: ${feedbackMessage.url}`;

      // Encrypt the message
      const encryptedContent = await user.signer.nip44.encrypt(recipientPubkey, messageContent);

      // Publish encrypted DM (kind 4)
      await publishEvent({
        kind: 4,
        content: encryptedContent,
        tags: [
          ['p', recipientPubkey],
          ['subject', 'App Feedback'],
        ],
      });

      // Mark as submitted for this session
      sessionStorage.setItem('feedback-submitted', 'true');
      setHasSubmitted(true);

      toast({
        title: "Feedback Sent!",
        description: "Thank you for your feedback. It has been sent securely.",
      });

      handleClose();
    } catch (error) {
      console.error('Failed to send feedback:', error);
      toast({
        title: "Failed to Send Feedback",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    // Mark as submitted to prevent auto-showing again this session
    sessionStorage.setItem('feedback-submitted', 'true');
    setHasSubmitted(true);
    handleClose();
  };

  if (!isVisible || hasSubmitted) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">How are we doing?</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
              aria-label="Close feedback popup"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Rate your experience:</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={cn(
                      "h-6 w-6 transition-colors",
                      (hoveredRating >= star || rating >= star)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Improvement Suggestions */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">What could we improve?</p>
            <Textarea
              placeholder="Share your thoughts and suggestions..."
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {improvements.length}/500
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="flex-1"
            >
              Not now
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              size="sm"
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-3 w-3 mr-2" />
                  Send Feedback
                </>
              )}
            </Button>
          </div>

          {!user && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              Login required to send feedback
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}