import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { streamService } from "../services/streamService";
import { getStreamWatchUrl } from "../config";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export function WatchStreamPage() {
  const { streamId } = useParams({ from: "/stream/watch/$streamId" });
  const navigate = useNavigate();

  const {
    data: stream,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["stream", streamId],
    queryFn: () => streamService.getStreamById(Number(streamId)),
    retry: false,
  });
  // Redirect to home if stream not found (404 error)
  useEffect(() => {
    if (isError && error && typeof error === "object" && "response" in error) {
      const axiosError = error as any;
      if (axiosError.response?.status === 404) {
        navigate({ to: "/" });
      }
    }
  }, [isError, error, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (isError || !stream) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load stream</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Video Player */}
        <div className="mb-6">
          {" "}
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={getStreamWatchUrl(streamId, stream.serverId)}
              className="w-full h-full border-0"
              scrolling="no"
              title={`Stream ${streamId}`}
              allow="autoplay; fullscreen"
            />
          </div>
        </div>

        {/* Stream Information */}
        <div className="space-y-3">
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900">{stream.title}</h1>

          {/* Creator */}
          <div className="flex items-center justify-between">
            {/* <span className="text-lg font-medium text-gray-700">
              Streamer:
            </span> */}
            <span className="text-md text-gray-900">{stream.creator}</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                stream.status === "LIVE"
                  ? "bg-red-100 text-red-800"
                  : stream.status === "CREATED"
                  ? "bg-orange-100 text-orange-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {(() => {
                switch (stream.status) {
                  case "LIVE":
                    return "Live";
                  case "CREATED":
                    return "Sắp lên sóng";
                  default:
                    return "Đã kết thúc";
                }
              })()}
            </span>
          </div>

          {/* Description */}
          <div className="space-y-0.5">
            <h2 className="text-xl font-semibold text-gray-900">Mô tả</h2>
            <p className="text-gray-700 leading-relaxed">
              {stream.description || "Không có mô tả"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
