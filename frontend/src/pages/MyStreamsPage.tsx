import { StreamCardWithActions } from "../components/StreamCardWithActions";
import { useMyStreams } from "../hooks/useMyStreams";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { streamService, type StreamsResponse } from "@/services/streamService";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Thumbnail from "@/assets/stream.jpg";

export function MyStreamsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, getAuthHeader } = useAuthStore();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useMyStreams({ limit: 6 }); // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/auth/login" });
    }
  }, [isAuthenticated, navigate]);  const handleStreamClick = (streamId: number) => {
    navigate({ to: '/stream/watch/$streamId', params: { streamId: streamId.toString() } })
  };

  const handleEditStream = (
    _streamId: number,
    _title: string,
    _description: string
  ) => {    // This callback is called after successful edit by StreamCardWithActions
    // We just need to refresh the data
    queryClient.invalidateQueries({ queryKey: ["stream-mine"] });
  };
  const handleDeleteStream = async (streamId: number) => {
    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        toast.error("Không có quyền truy cập");
        return;
      }

      await streamService.deleteStream(streamId, authHeader);      // Invalidate and refetch the streams data
      queryClient.invalidateQueries({ queryKey: ["stream-mine"] });

      toast.success("Xóa stream thành công!");
    } catch (error: any) {
      console.error("Error deleting stream:", error);

      // Handle different error responses
      if (error.response?.status === 403) {
        toast.error("Bạn không có quyền xóa stream này.");
      } else {
        toast.error("Không thể xóa stream. Vui lòng thử lại.");
      }
    }
  };
  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Streams của tôi
        </h1>
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Streams của tôi
        </h1>
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              Không thể tải danh sách streams:{" "}
              {error?.message || "Lỗi không xác định"}
            </p>
            <Button onClick={() => window.location.reload()}>Thử lại</Button>
          </div>
        </div>
      </div>
    );
  }

  // Flatten all streams from all pages
  const allStreams =
    (data?.pages as StreamsResponse[])?.flatMap((page) => page.items) ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Live của tôi</h1>
      </div>
      {allStreams.length === 0 ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">
              Bạn chưa có stream nào.
            </p>
            <Button onClick={() => navigate({ to: "/stream/create" })}>
              Tạo stream đầu tiên
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Streams Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {" "}
            {allStreams.map((stream) => (
              <StreamCardWithActions
                key={stream.streamId}
                streamId={stream.streamId}
                thumbnail={Thumbnail} // Using placeholder as mentioned
                title={stream.title}
                description={stream.description}
                username={stream.creator} // Using creator field from API
                status={stream.status}
                onClick={() => handleStreamClick(stream.streamId)}
                onEdit={(title, description) =>
                  handleEditStream(stream.streamId, title, description)
                }
                onDelete={() => handleDeleteStream(stream.streamId)}
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
                    Đang tải...
                  </>
                ) : (
                  "Tải thêm"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
