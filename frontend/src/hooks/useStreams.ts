import { useInfiniteQuery } from '@tanstack/react-query'
import { streamService, type StreamsResponse, type StreamsParams } from '@/services/streamService'

interface UseStreamsOptions {
  limit?: number
}

export function useStreams(options: UseStreamsOptions = {}) {
  const { limit = 12 } = options

  return useInfiniteQuery<StreamsResponse, Error>({
    queryKey: ['streams', { limit }],
    queryFn: ({ pageParam }) => 
      streamService.getStreams({ 
        cursor: pageParam as string | undefined, 
        limit 
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}
