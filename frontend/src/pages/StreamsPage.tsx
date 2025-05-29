import { StreamCard } from "../components/StreamCard"
import { useStreams } from "../hooks/useStreams"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { StreamsResponse } from "@/services/streamService"

export function StreamsPage() {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useStreams({ limit: 12 })

  const handleStreamClick = (streamId: number) => {
    console.log(`Clicked on stream ${streamId}`)
    // Handle navigation to stream page
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Các live hiện có</h1>
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Live Streams</h1>
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              Failed to load streams: {error?.message || 'Unknown error'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }  // Flatten all streams from all pages
  const allStreams = (data?.pages as StreamsResponse[])?.flatMap(page => page.items) ?? []

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Live Streams</h1>
      
      {allStreams.length === 0 ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <p className="text-gray-600 text-lg">No streams available at the moment.</p>
        </div>
      ) : (
        <>
          {/* Streams Grid */}          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allStreams.map((stream) => (
              <StreamCard
                key={stream.streamId}
                thumbnail="/src/assets/stream.jpg" // Using placeholder as mentioned
                title={stream.title}
                username={stream.creator} // Using creator field from API
                status={stream.status}
                onClick={() => handleStreamClick(stream.streamId)}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                size="lg"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
