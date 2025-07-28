import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';

export function useMyNotes() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['my-notes', user?.pubkey],
    queryFn: async (c) => {
      if (!user?.pubkey) {
        throw new Error('User not logged in');
      }

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Calculate timestamp for 1 month ago
      const oneMonthAgo = Math.floor((Date.now() - (30 * 24 * 60 * 60 * 1000)) / 1000);

      // Query for the user's text notes (kind 1) from the last month
      const events = await nostr.query([
        {
          kinds: [1],
          authors: [user.pubkey],
          since: oneMonthAgo,
          limit: 500,
        }
      ], { signal });

      // Sort by creation date (newest first)
      return events.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!user?.pubkey,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}