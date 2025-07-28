import { useMemo, useCallback } from 'react';
import { type NostrEvent } from '@nostrify/nostrify';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { Copy } from 'lucide-react';

interface NoteContentProps {
  event: NostrEvent;
  className?: string;
}

/** Parses content of text note events so that URLs, hashtags, images, and videos are rendered properly. */
export function NoteContent({
  event,
  className,
}: NoteContentProps) {
  const { toast } = useToast();

  // Helper function to copy nevent to clipboard
  const handleCopyNevent = useCallback(async (nostrId: string) => {
    try {
      await navigator.clipboard.writeText(nostrId);
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
  }, [toast]);

  // Helper function to check if URL is an image
  const isImageUrl = (url: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
  };

  // Helper function to check if URL is a video
  const isVideoUrl = (url: string): boolean => {
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
  };

  // Helper function to get YouTube video ID
  const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Helper function to check if URL is a note link
  const isNoteUrl = (url: string): boolean => {
    return url.includes('njump.me') ||
           url.includes('nostr.com') ||
           url.includes('iris.to') ||
           url.includes('snort.social') ||
           url.includes('nostrgram.co') ||
           /\/note1[023456789acdefghjklmnpqrstuvwxyz]+/.test(url) ||
           /\/nevent1[023456789acdefghjklmnpqrstuvwxyz]+/.test(url);
  };

  // Process the content to render mentions, links, etc.
  const content = useMemo(() => {
    const text = event.content;

    // Regex to find URLs, Nostr references, and hashtags
    const regex = /(https?:\/\/[^\s]+)|nostr:(npub1|note1|nprofile1|nevent1)([023456789acdefghjklmnpqrstuvwxyz]+)|(#\w+)/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyCounter = 0;

    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, url, nostrPrefix, nostrData, hashtag] = match;
      const index = match.index;

      // Add text before this match
      if (index > lastIndex) {
        parts.push(text.substring(lastIndex, index));
      }

      if (url) {
        // Handle different types of URLs
        if (isImageUrl(url)) {
          // Render images
          parts.push(
            <div key={`image-${keyCounter++}`} className="my-2">
              <img
                src={url}
                alt="Embedded image"
                className="max-w-full h-auto rounded-lg border"
                loading="lazy"
                onError={(e) => {
                  // Fallback to link if image fails to load
                  const target = e.target as HTMLImageElement;
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${url}</a>`;
                  }
                }}
              />
            </div>
          );
        } else if (isVideoUrl(url)) {
          // Render videos
          parts.push(
            <div key={`video-${keyCounter++}`} className="my-2">
              <video
                controls
                className="max-w-full h-auto rounded-lg border"
                preload="metadata"
              >
                <source src={url} />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {url}
                </a>
              </video>
            </div>
          );
        } else if (getYouTubeVideoId(url)) {
          // Render YouTube embeds
          const videoId = getYouTubeVideoId(url);
          parts.push(
            <div key={`youtube-${keyCounter++}`} className="my-2">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          );
        } else if (isNoteUrl(url)) {
          // Handle note links - open in njump.me
          const njumpUrl = url.includes('njump.me') ? url : `https://njump.me${url.split('.')[0].split('/').pop()}`;
          parts.push(
            <a
              key={`note-link-${keyCounter++}`}
              href={njumpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-500 hover:underline font-medium break-all"
            >
              📝 {url}
            </a>
          );
        } else {
          // Handle regular URLs
          parts.push(
            <a
              key={`url-${keyCounter++}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline break-all"
            >
              {url}
            </a>
          );
        }
      } else if (nostrPrefix && nostrData) {
        // Handle Nostr references
        try {
          const nostrId = `${nostrPrefix}${nostrData}`;
          const decoded = nip19.decode(nostrId);

          if (decoded.type === 'npub') {
            const pubkey = decoded.data;
            parts.push(
              <NostrMention key={`mention-${keyCounter++}`} pubkey={pubkey} />
            );
          } else if (decoded.type === 'note' || decoded.type === 'nevent') {
            // For note references, show link with copy option
            parts.push(
              <span key={`note-${keyCounter++}`} className="inline-flex items-start gap-1 max-w-full">
                <a
                  href={`https://njump.me/${nostrId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-500 hover:underline font-medium break-all min-w-0 flex-1"
                >
                  📝 {fullMatch}
                </a>
                <button
                  onClick={() => handleCopyNevent(nostrId)}
                  className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                  title="Copy note reference"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </span>
            );
          } else {
            // For other types, show as internal link
            parts.push(
              <Link
                key={`nostr-${keyCounter++}`}
                to={`/${nostrId}`}
                className="text-blue-500 hover:underline break-all"
              >
                {fullMatch}
              </Link>
            );
          }
        } catch {
          // If decoding fails, just render as text
          parts.push(fullMatch);
        }
      } else if (hashtag) {
        // Handle hashtags
        const tag = hashtag.slice(1); // Remove the #
        parts.push(
          <Link
            key={`hashtag-${keyCounter++}`}
            to={`/t/${tag}`}
            className="text-blue-500 hover:underline break-all"
          >
            {hashtag}
          </Link>
        );
      }

      lastIndex = index + fullMatch.length;
    }

    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    // If no special content was found, just use the plain text
    if (parts.length === 0) {
      parts.push(text);
    }

    return parts;
  }, [event, handleCopyNevent]);

  return (
    <div className={cn("whitespace-pre-wrap break-words overflow-hidden", className)}>
      {content.length > 0 ? content : event.content}
    </div>
  );
}

// Helper component to display user mentions
function NostrMention({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const npub = nip19.npubEncode(pubkey);
  const hasRealName = !!author.data?.metadata?.name;
  const displayName = author.data?.metadata?.name ?? genUserName(pubkey);

  return (
    <Link
      to={`/${npub}`}
      className={cn(
        "font-medium hover:underline",
        hasRealName
          ? "text-blue-500"
          : "text-gray-500 hover:text-gray-700"
      )}
    >
      @{displayName}
    </Link>
  );
}