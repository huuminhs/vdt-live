import { useInfiniteQuery } from '@tanstack/react-query'
import { streamService, type StreamsResponse } from '@/services/streamService'
import { useAuthStore } from '@/stores/authStore'

interface UseMyStreamsOptions {
  limit?: number
}

export function useMyStreams(options: UseMyStreamsOptions = {}) {
  const { limit = 6 } = options
  const { getAuthHeader, isAuthenticated } = useAuthStore()
  return useInfiniteQuery<StreamsResponse, Error>({
    queryKey: ['stream-mine', { limit }],
    queryFn: ({ pageParam }) => {
      const authHeader = getAuthHeader()
      if (!authHeader) {
        throw new Error('No authentication token available')
      }
      
      return streamService.getMyStreams({ 
        cursor: pageParam as string | undefined, 
        limit 
      }, authHeader)
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined
    },
    staleTime: 30 * 1000, // 30 seconds
    enabled: isAuthenticated, // Only run query if user is authenticated
  })
}
