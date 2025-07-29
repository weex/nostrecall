import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { NPool, NRelay1 } from '@nostrify/nostrify';

export type TimeRange = 'month' | 'all-time';

interface UseMyNotesOptions {
  timeRange?: TimeRange;
  specificRelay?: string;
}

export function useMyNotes(options: UseMyNotesOptions = {}) {
  const { timeRange = 'month', specificRelay } = options;
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['my-notes', user?.pubkey, timeRange, specificRelay],
    queryFn: async (c) => {
      if (!user?.pubkey) {
        throw new Error('User not logged in');
      }

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(15000)]);

      // Build the filter based on time range
      const filter: {
        kinds: number[];
        authors: string[];
        limit: number;
        since?: number;
      } = {
        kinds: [1],
        authors: [user.pubkey],
        limit: timeRange === 'all-time' ? 2000 : 500,
      };

      // Only add 'since' filter for month range
      if (timeRange === 'month') {
        // Calculate timestamp for 1 month ago
        const oneMonthAgo = Math.floor((Date.now() - (30 * 24 * 60 * 60 * 1000)) / 1000);
        filter.since = oneMonthAgo;
      }

      // If a specific relay is chosen, query only that relay
      if (specificRelay) {
        // Create a temporary pool for the specific relay
        const specificPool = new NPool({
          open(url: string) {
            return new NRelay1(url);
          },
          reqRouter(filters) {
            const relayMap = new Map();
            relayMap.set(specificRelay, filters);
            return relayMap;
          },
          eventRouter() {
            return [];
          },
        });

        try {
          // Query the specific relay
          const events = await specificPool.query([filter], { signal });

          // Sort by creation date (newest first)
          return events.sort((a, b) => b.created_at - a.created_at);
        } finally {
          // Clean up the temporary pool
          specificPool.close();
        }
      } else {
        // Use the default single relay query (current relay from config)
        const events = await nostr.query([filter], { signal });
        return events.sort((a, b) => b.created_at - a.created_at);
      }
    },
    enabled: !!user?.pubkey,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}