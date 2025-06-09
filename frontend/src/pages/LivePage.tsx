"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { WHIPClient } from "whip-whep/whip.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Copy,
  CheckCircle,
  Video,
  VideoOff,
  Square,
  Mic,
  MicOff,
  Monitor,
} from "lucide-react";
import type { CreateStreamResponse } from "@/services/streamService";

export function LivePage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const whipClientRef = useRef<WHIPClient | null>(null);

  // Callback ref to handle video element creation
  const videoCallbackRef = (element: HTMLVideoElement | null) => {
    videoRef.current = element;

    // If we have a pending stream and the video element is now available, set it up
    if (element && pendingStreamRef.current) {
      console.log("Video element now available, setting up pending stream...");
      setupVideoStream(element, pendingStreamRef.current);
      pendingStreamRef.current = null; // Clear pending stream
    }
  };
  // Helper function to set up video stream
  const setupVideoStream = async (
    video: HTMLVideoElement,
    stream: MediaStream
  ) => {
    video.srcObject = stream;

    console.log("Setting up video stream...");

    // Immediate attempt to play
    try {
      await video.play();
      console.log("Video playing successfully");
      setIsVideoLoading(false);
    } catch (error) {
      console.log("Immediate play failed:", error);

      // Set up event listeners for retry
      const onCanPlay = async () => {
        console.log("canplay event fired");
        try {
          await video.play();
          console.log("Play after canplay success");
          setIsVideoLoading(false);
        } catch (err) {
          console.error("Play after canplay failed:", err);
        }
      };

      const onLoadedData = async () => {
        console.log("loadeddata event fired");
        try {
          await video.play();
          console.log("Play after loadeddata success");
          setIsVideoLoading(false);
        } catch (err) {
          console.error("Play after loadeddata failed:", err);
        }
      };

      video.addEventListener("canplay", onCanPlay, { once: true });
      video.addEventListener("loadeddata", onLoadedData, { once: true });
      console.log("Event listeners added for retry");
    }

    // Fallback timeout - always clear loading after 2 seconds
    setTimeout(() => {
      console.log("Fallback timeout triggered, clearing loading state");
      setIsVideoLoading(false);
    }, 2000);
  };
  // Effect to handle video playing (global fallback)
  useEffect(() => {
    const video = videoRef.current;
    if (video && video.srcObject && video.paused) {
      const playVideo = async () => {
        try {
          await video.play();
          console.log("Global effect: Video playing successfully");
        } catch (error) {
          console.error("Global effect: Error playing video:", error);
        }
      };

      // Small delay to allow other event handlers to complete first
      const timer = setTimeout(playVideo, 100);
      return () => clearTimeout(timer);
    }
  }, [hasPermission, isVideoLoading]);

  // Cleanup effect for video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleError = (error: Event) => {
      console.error("Global video error:", error);
    };

    const handleLoadStart = () => {
      console.log("Global: Video load started");
    };

    video.addEventListener("error", handleError);
    video.addEventListener("loadstart", handleLoadStart);

    return () => {
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadstart", handleLoadStart);
    };
  }, []); // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // Clean up media stream when component unmounts
      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop());
      }

      // Clean up WHIP client when component unmounts
      console.log(
        "Cleaning up WHIP client... Current client:",
        whipClientRef.current
      );
      if (whipClientRef.current) {
        whipClientRef.current.stop().catch((error: Error) => {
          console.error("Error stopping WHIP client during cleanup:", error);
        });
        whipClientRef.current = null;
      }

      // Clean up peer connection when component unmounts
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, []);

  // Get the stream data from router state
  const state = useRouterState({ select: (s) => s.location.state }) as {
    streamData?: CreateStreamResponse;
  };
  const streamData = state?.streamData;

  // If no stream data, redirect back to create stream
  if (!streamData) {
    router.navigate({ to: "/stream/mine" });
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Đang chuyển hướng...</CardTitle>
            <CardDescription>
              Không tìm thấy thông tin stream. Đang chuyển về trang tạo
              stream...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Construct RTMP URL with JWT
  const rtmpUrl = `rtmp://${streamData.streamUrl}/stream/${streamData.streamId}?jwt=${streamData.mediamtxJwt}`;

  // Construct WebRTC URL
  const webrtcUrl = `http://${streamData.streamUrl}:8889/stream/${streamData.streamId}/whip`;
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(rtmpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };
  // Webcam functions
  const startWebcam = async () => {
    setIsVideoLoading(true);
    setVideoKey((k) => k + 1);
    try {
      // Stop previous stream if exists
      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop());
      }
      console.log("Requesting webcam access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      console.log("Webcam access granted, setting up video...");
      mediaStreamRef.current = stream;

      // Set permission first so video element gets rendered
      setHasPermission(true);
      setIsCameraOn(true);
      setIsMicOn(true);
      setIsScreenSharing(false);

      // Check if video element is already available
      if (videoRef.current) {
        console.log("Video element already available, setting up immediately");
        await setupVideoStream(videoRef.current, stream);
      } else {
        console.log(
          "Video element not available yet, storing stream for callback ref"
        );
        pendingStreamRef.current = stream;
      }

      console.log("Webcam setup complete");
    } catch (error: any) {
      console.error("Error accessing webcam:", error);
      if (error?.name === "NotAllowedError" || error?.name === "AbortError") {
        setHasPermission(null);
      } else {
        setHasPermission(false);
      }
      setIsVideoLoading(false);
    }
  };
  const startScreenShare = async () => {
    setIsVideoLoading(true);
    setVideoKey((k) => k + 1);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop());
      }
      console.log("Requesting screen share access...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });
      console.log("Screen share access granted, setting up video...");
      mediaStreamRef.current = stream;

      // Set permission first so video element gets rendered
      setHasPermission(true);
      setIsScreenSharing(true);
      setIsCameraOn(false);
      setIsMicOn(true);

      // Check if video element is already available
      if (videoRef.current) {
        console.log("Video element already available, setting up immediately");
        await setupVideoStream(videoRef.current, stream);
      } else {
        console.log(
          "Video element not available yet, storing stream for callback ref"
        );
        pendingStreamRef.current = stream;
      }

      stream.getVideoTracks()[0].addEventListener("ended", () => {
        setIsScreenSharing(false);
        setHasPermission(null);
        setIsVideoLoading(false);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      });
      console.log("Screen share setup complete");
    } catch (error: any) {
      console.error("Error accessing screen share:", error);
      if (error?.name === "NotAllowedError" || error?.name === "AbortError") {
        setHasPermission(null);
      } else {
        setHasPermission(false);
      }
      setIsVideoLoading(false);
    }
  };  const replaceStreamTracks = async (newStream: MediaStream) => {
    if (!peerConnectionRef.current) return;

    const pc = peerConnectionRef.current;
    const senders = pc.getSenders();

    // Replace existing tracks with new ones
    for (const sender of senders) {
      if (sender.track) {
        const trackKind = sender.track.kind;
        const newTrack = newStream.getTracks().find(track => track.kind === trackKind);
        
        if (newTrack) {
          try {
            await sender.replaceTrack(newTrack);
            console.log(`Replaced ${trackKind} track in peer connection`);
            
            // Set bitrate for video tracks
            if (trackKind === "video") {
              try {
                const params = sender.getParameters();
                if (!params.encodings) {
                  params.encodings = [{}];
                }
                
                // Set bitrate to 5 Mbps (5,000,000 bits per second)
                params.encodings[0].maxBitrate = 5000000;
                
                await sender.setParameters(params);
                console.log("Set video bitrate to 5 Mbps on replaced track");
              } catch (error) {
                console.log("Could not set video encoding parameters on replaced track:", error);
              }
            }
          } catch (error) {
            console.error(`Error replacing ${trackKind} track:`, error);
          }
        }
      }
    }
  };

  const switchToWebcam = async () => {
    if (isStreaming) {
      setIsVideoLoading(true);
      setVideoKey((k) => k + 1);
      
      try {
        // Stop previous stream
        if (mediaStreamRef.current) {
          mediaStreamRef.current
            .getTracks()
            .forEach((track: MediaStreamTrack) => track.stop());
        }

        // Get new webcam stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });

        mediaStreamRef.current = stream;
        setIsCameraOn(true);
        setIsMicOn(true);
        setIsScreenSharing(false);

        // Update video element
        if (videoRef.current) {
          await setupVideoStream(videoRef.current, stream);
        } else {
          pendingStreamRef.current = stream;
        }

        // Replace tracks in existing peer connection
        await replaceStreamTracks(stream);
        
        console.log("Successfully switched to webcam while streaming");
      } catch (error) {
        console.error("Error switching to webcam:", error);
        setIsVideoLoading(false);
      }
    } else {
      // Not streaming, just start webcam normally
      await startWebcam();
    }
  };

  const switchToScreenShare = async () => {
    if (isStreaming) {
      setIsVideoLoading(true);
      setVideoKey((k) => k + 1);
      
      try {
        // Stop previous stream
        if (mediaStreamRef.current) {
          mediaStreamRef.current
            .getTracks()
            .forEach((track: MediaStreamTrack) => track.stop());
        }

        // Get new screen share stream
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: true,
        });

        mediaStreamRef.current = stream;
        setIsScreenSharing(true);
        setIsCameraOn(false);
        setIsMicOn(true);

        // Update video element
        if (videoRef.current) {
          await setupVideoStream(videoRef.current, stream);
        } else {
          pendingStreamRef.current = stream;
        }

        // Replace tracks in existing peer connection
        await replaceStreamTracks(stream);

        // Handle screen share end
        stream.getVideoTracks()[0].addEventListener("ended", () => {
          setIsScreenSharing(false);
          if (!isStreaming) {
            setHasPermission(null);
            setIsVideoLoading(false);
            if (videoRef.current) {
              videoRef.current.srcObject = null;
            }
          }
        });
        
        console.log("Successfully switched to screen share while streaming");
      } catch (error) {
        console.error("Error switching to screen share:", error);
        setIsVideoLoading(false);
      }
    } else {
      // Not streaming, just start screen share normally
      await startScreenShare();
    }
  };

  const toggleCamera = async () => {
    if (!hasPermission) return;

    if (isScreenSharing) {
      // Switch from screen share to camera
      await switchToWebcam();
    } else {
      // Toggle camera on/off
      if (mediaStreamRef.current) {
        const videoTracks = mediaStreamRef.current.getVideoTracks();
        videoTracks.forEach((track: MediaStreamTrack) => {
          track.enabled = !isCameraOn;
        });
        setIsCameraOn(!isCameraOn);
      }
    }
  };

  const toggleMicrophone = () => {
    if (!hasPermission || !mediaStreamRef.current) return;

    const audioTracks = mediaStreamRef.current.getAudioTracks();
    audioTracks.forEach((track: MediaStreamTrack) => {
      track.enabled = !isMicOn;
    });
    setIsMicOn(!isMicOn);
  };
  const stopWebcam = () => {
    // Stop all tracks in the current stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track: MediaStreamTrack) => track.stop());
      mediaStreamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load(); // Force reset the video element
    }

    // Reset all states
    setIsStreaming(false);
    setHasPermission(null);
    setIsCameraOn(true);
    setIsMicOn(true);
    setIsScreenSharing(false);
    setIsVideoLoading(false);
    console.log("All media stopped and states reset");
  };
  const startBrowserStream = async () => {
    console.log("mediaStreamRef.current", mediaStreamRef.current);
    if (!mediaStreamRef.current) return;

    try {
      console.log("Starting WebRTC stream to:", webrtcUrl);
      console.log("Stream data:", streamData);

      // Create peer connection with optimal configuration for H.264
      const pc = new RTCPeerConnection({
        bundlePolicy: "max-bundle",
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      // Store peer connection reference for cleanup
      peerConnectionRef.current = pc;

      // Configure H.264 codec preference before adding tracks
      const setH264PreferenceOnTransceivers = () => {
        try {
          const capabilities = RTCRtpSender.getCapabilities("video");
          if (capabilities && capabilities.codecs) {
            const h264Codecs = capabilities.codecs.filter((codec) =>
              codec.mimeType.toLowerCase().includes("h264")
            );
            const otherCodecs = capabilities.codecs.filter(
              (codec) => !codec.mimeType.toLowerCase().includes("h264")
            );

            if (h264Codecs.length > 0) {
              const preferredCodecs = [...h264Codecs, ...otherCodecs];
              console.log(
                "H.264 codec available, will be preferred:",
                h264Codecs
              );
              return preferredCodecs;
            }
          }
        } catch (error) {
          console.log("Could not get video capabilities:", error);
        }
        return null;
      };

      const preferredCodecs = setH264PreferenceOnTransceivers();      // Add all tracks from the media stream to the peer connection
      for (const track of mediaStreamRef.current.getTracks()) {
        console.log(`Adding ${track.kind} track to peer connection`);
        const transceiver = pc.addTransceiver(track, {
          direction: "sendonly",
        });

        // Set H.264 codec preference and bitrate on video transceivers
        if (track.kind === "video") {
          if (preferredCodecs) {
            try {
              transceiver.setCodecPreferences(preferredCodecs);
              console.log("Set H.264 codec preference on video transceiver");
            } catch (error) {
              console.log(
                "Could not set codec preferences on transceiver:",
                error
              );
            }
          }

          // Set video encoding parameters with 5 Mbps bitrate
          const sender = transceiver.sender;
          if (sender) {
            try {
              const params = sender.getParameters();
              if (!params.encodings) {
                params.encodings = [{}];
              }
              
              // Set bitrate to 5 Mbps (5,000,000 bits per second)
              params.encodings[0].maxBitrate = 5000000;
              
              await sender.setParameters(params);
              console.log("Set video bitrate to 5 Mbps");
            } catch (error) {
              console.log("Could not set video encoding parameters:", error);
            }
          }
        }
      }

      // Create WHIP client
      const whipClient = new WHIPClient();
      whipClientRef.current = whipClient;      // Hook into WHIP client's onOffer to modify SDP for H.264 preference
      whipClient.onOffer = (sdp: string) => {
        console.log("Original SDP offer generated");
        const modifiedSdp = preferH264InSDP(sdp);
        console.log("SDP modified to prefer H.264 codec");
        return modifiedSdp;
      };
      
      // Listen for peer connection state changes
      const setupPeerConnectionEvents = (peerConnection: RTCPeerConnection) => {
        console.log("Setting up peer connection event listeners...");
        
        peerConnection.onconnectionstatechange = () => {
          console.log("Peer connection state:", peerConnection.connectionState);
          switch (peerConnection.connectionState) {
            case "connected":
              console.log("WebRTC stream connected successfully!");
              setIsStreaming(true);
              break;
            case "disconnected":
            case "failed":
              console.log("WebRTC stream disconnected or failed");
              setIsStreaming(false);
              break;
            case "closed":
              console.log("WebRTC stream closed");
              setIsStreaming(false);
              break;
          }
        };

        peerConnection.oniceconnectionstatechange = () => {
          console.log("ICE connection state:", peerConnection.iceConnectionState);
        };

        peerConnection.onicegatheringstatechange = () => {
          console.log("ICE gathering state:", peerConnection.iceGatheringState);
        };
      };      // Set up events on our peer connection
      setupPeerConnectionEvents(pc);

      console.log("Initial peer connection state:", pc.connectionState);
      console.log("Initial ICE connection state:", pc.iceConnectionState);

      // Helper function to modify SDP to prefer H.264
      const preferH264InSDP = (sdp: string): string => {
        const lines = sdp.split("\r\n");
        let videoMLineIndex = -1;

        // Find the video m-line
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith("m=video")) {
            videoMLineIndex = i;
            break;
          }
        }

        if (videoMLineIndex === -1) return sdp;

        const mLine = lines[videoMLineIndex];
        const codecNumbers = mLine.split(" ").slice(3);

        // Find H.264 payload types
        const h264PayloadTypes: string[] = [];
        const otherPayloadTypes: string[] = [];

        for (const codecNumber of codecNumbers) {
          let isH264 = false;
          // Look for the rtpmap line for this codec
          for (const line of lines) {
            if (
              line.startsWith(`a=rtpmap:${codecNumber}`) &&
              line.toLowerCase().includes("h264")
            ) {
              isH264 = true;
              break;
            }
          }

          if (isH264) {
            h264PayloadTypes.push(codecNumber);
          } else {
            otherPayloadTypes.push(codecNumber);
          }
        }

        // Reorder codec numbers to prefer H.264
        if (h264PayloadTypes.length > 0) {
          const reorderedCodecs = [...h264PayloadTypes, ...otherPayloadTypes];
          const mLineParts = mLine.split(" ");
          const newMLine = `${mLineParts[0]} ${mLineParts[1]} ${
            mLineParts[2]
          } ${reorderedCodecs.join(" ")}`;
          lines[videoMLineIndex] = newMLine;
          console.log("Reordered SDP codecs to prefer H.264");
        }

        return lines.join("\r\n");
      };      // Start publishing to WHIP endpoint
      console.log("Publishing stream to WHIP endpoint...");
      await whipClient.publish(pc, webrtcUrl, streamData.mediamtxJwt);      // After publish, check if WHIP client has its own peer connection and set up events there too
      if (whipClient.pc && whipClient.pc !== pc) {
        console.log("WHIP client created its own peer connection, setting up events there too...");
        setupPeerConnectionEvents(whipClient.pc);
      }      // Log final peer connection states
      console.log("Final our peer connection state:", pc.connectionState);
      console.log("Final our ICE connection state:", pc.iceConnectionState);
      if (whipClient.pc) {
        console.log("Final WHIP peer connection state:", whipClient.pc.connectionState);
        console.log("Final WHIP ICE connection state:", whipClient.pc.iceConnectionState);
      }

      // Set up periodic monitoring to catch state changes
      const monitoringInterval = setInterval(() => {
        const ourPc = peerConnectionRef.current;
        const whipPc = whipClientRef.current?.pc;
        
        if (ourPc) {
          console.log("Monitor - Our PC state:", ourPc.connectionState, "ICE:", ourPc.iceConnectionState);
        }
        if (whipPc && whipPc !== ourPc) {
          console.log("Monitor - WHIP PC state:", whipPc.connectionState, "ICE:", whipPc.iceConnectionState);
        }
        
        // Check if we need to manually update streaming state
        if (ourPc?.connectionState === "connected" || whipPc?.connectionState === "connected") {
          if (!isStreaming) {
            console.log("Detected connected state via monitoring, updating UI...");
            setIsStreaming(true);
          }
        }
      }, 2000);

      // Clean up monitoring after 30 seconds
      setTimeout(() => {
        clearInterval(monitoringInterval);
        console.log("Stopped peer connection monitoring");
      }, 30000);

      console.log("WebRTC streaming setup complete!");
    } catch (error) {
      console.error("Error starting WebRTC stream:", error);
      // Clean up on error
      if (whipClientRef.current) {
        try {
          await whipClientRef.current.stop();
        } catch (cleanupError) {
          console.error("Error during WHIP client cleanup:", cleanupError);
        }
        whipClientRef.current = null;
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setIsStreaming(false);
    }
  };

  const stopBrowserStream = async () => {
    console.log("Stopping WebRTC stream");

    // Clean up WHIP client
    if (whipClientRef.current) {
      try {
        await whipClientRef.current.stop();
        console.log("WHIP client stopped");
      } catch (error) {
        console.error("Error stopping WHIP client:", error);
      }
      whipClientRef.current = null;
    }

    // Clean up peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      console.log("Peer connection closed");
      peerConnectionRef.current = null;
    }
    setIsStreaming(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Bắt Đầu Live Stream</CardTitle>
          <CardDescription>
            Stream ID: {streamData.streamId} - Chọn phương thức phát sóng của
            bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="rtmp" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rtmp">RTMP</TabsTrigger>
              <TabsTrigger value="webcam">Browser webcam</TabsTrigger>
            </TabsList>

            <TabsContent value="rtmp" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Phát sóng bằng phần mềm RTMP
                </h3>
                <p className="text-sm text-gray-600">
                  Sử dụng phần mềm như OBS Studio, XSplit hoặc các ứng dụng khác
                  hỗ trợ RTMP để phát sóng.
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-medium">RTMP URL:</label>
                  <div className="flex gap-2">
                    <Input
                      value={rtmpUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                      title="Sao chép URL"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {copied && (
                    <p className="text-sm text-green-600">
                      Đã sao chép vào clipboard!
                    </p>
                  )}
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Hướng dẫn thiết lập:
                  </h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Mở phần mềm phát sóng (OBS Studio, XSplit, v.v.)</li>
                    <li>Sao chép URL RTMP ở trên (đã bao gồm JWT token)</li>
                    <li>Dán vào trường Server URL trong phần mềm</li>
                    <li>Bắt đầu phát sóng từ phần mềm của bạn</li>
                  </ol>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="webcam" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Phát sóng từ trình duyệt
                </h3>
                <p className="text-sm text-gray-600">
                  Sử dụng webcam, microphone hoặc chia sẻ màn hình để phát sóng
                  trực tiếp qua WebRTC.
                </p>

                <div className="space-y-4">
                  {!hasPermission && (
                    <div className="text-center space-y-4">
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={startWebcam}
                          disabled={isVideoLoading}
                          className="flex items-center gap-2"
                        >
                          <Video className="h-4 w-4" />
                          {isVideoLoading ? "Đang tải..." : "Webcam"}
                        </Button>
                        <Button
                          onClick={startScreenShare}
                          disabled={isVideoLoading}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Monitor className="h-4 w-4" />
                          {isVideoLoading ? "Đang tải..." : "Chia sẻ màn hình"}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Chọn nguồn video để bắt đầu phát sóng.
                      </p>
                    </div>
                  )}

                  {hasPermission === false && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md text-center">
                      <p className="text-red-700">
                        Không thể truy cập camera, microphone hoặc màn hình. Vui
                        lòng kiểm tra cài đặt trình duyệt.
                      </p>
                      <div className="flex gap-2 justify-center mt-2">
                        <Button
                          variant="outline"
                          onClick={startWebcam}
                          disabled={isVideoLoading}
                          size="sm"
                        >
                          {isVideoLoading ? "Đang tải..." : "Thử lại Webcam"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={startScreenShare}
                          disabled={isVideoLoading}
                          size="sm"
                        >
                          {isVideoLoading
                            ? "Đang tải..."
                            : "Thử lại Chia sẻ màn hình"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {hasPermission && (
                    <div className="space-y-4">
                      <div
                        className="relative bg-black rounded-lg overflow-hidden"
                        style={{ aspectRatio: "16/9" }}
                      >
                        {" "}
                        <video
                          key={videoKey}
                          ref={videoCallbackRef}
                          autoPlay
                          playsInline
                          muted
                          controls={false}
                          preload="metadata"
                          className="w-full h-full object-cover"
                          style={{ backgroundColor: "#000" }}
                          onLoadStart={() => console.log("Video load started")}
                          onCanPlay={() => console.log("Video can play")}
                          onPlay={() => console.log("Video started playing")}
                          onError={(e) =>
                            console.error("Video element error:", e)
                          }
                        />
                        {/* Loading overlay */}
                        {isVideoLoading && (
                          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                              <div className="text-sm">
                                Đang khởi tạo video...
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Waiting for stream overlay */}
                        {hasPermission &&
                          !isVideoLoading &&
                          !mediaStreamRef.current && (
                            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                              <div className="text-white text-center">
                                <div className="text-sm">
                                  Đang chờ video stream...
                                </div>
                              </div>
                            </div>
                          )}
                        {/* Stream attached but video not playing overlay */}
                        {hasPermission &&
                          !isVideoLoading &&
                          mediaStreamRef.current &&
                          videoRef.current?.srcObject &&
                          videoRef.current?.paused && (
                            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                              <div className="text-white text-center">
                                <div className="text-sm">
                                  Đang kết nối video...
                                </div>
                              </div>
                            </div>
                          )}
                        {isStreaming && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium flex items-center gap-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            LIVE
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-1">
                          {isScreenSharing && (
                            <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                              Màn hình
                            </div>
                          )}
                          {!isCameraOn && !isScreenSharing && (
                            <div className="bg-gray-500 text-white px-2 py-1 rounded text-xs">
                              Camera tắt
                            </div>
                          )}
                          {!isMicOn && (
                            <div className="bg-gray-500 text-white px-2 py-1 rounded text-xs">
                              Mic tắt
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex flex-wrap gap-2 justify-center">
                        {/* Camera/Screen controls */}
                        <Button
                          onClick={toggleCamera}
                          variant={
                            isCameraOn && !isScreenSharing
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {isCameraOn && !isScreenSharing ? (
                            <Video className="h-4 w-4" />
                          ) : (
                            <VideoOff className="h-4 w-4" />
                          )}
                          {isScreenSharing
                            ? "Chuyển sang Webcam"
                            : isCameraOn
                            ? "Camera"
                            : "Bật Camera"}
                        </Button>                        <Button
                          onClick={isStreaming ? switchToScreenShare : startScreenShare}
                          disabled={isVideoLoading}
                          variant={isScreenSharing ? "default" : "outline"}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Monitor className="h-4 w-4" />
                          {isVideoLoading
                            ? "Đang tải..."
                            : isScreenSharing
                            ? "Đang chia sẻ"
                            : "Chia sẻ màn hình"}
                        </Button>

                        {/* Microphone control */}
                        <Button
                          onClick={toggleMicrophone}
                          variant={isMicOn ? "default" : "outline"}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {isMicOn ? (
                            <Mic className="h-4 w-4" />
                          ) : (
                            <MicOff className="h-4 w-4" />
                          )}
                          {isMicOn ? "Micro" : "Micro tắt"}
                        </Button>
                      </div>

                      {/* Streaming controls */}
                      <div className="flex gap-2 justify-center pt-2 border-t">
                        {!isStreaming ? (
                          <Button
                            onClick={startBrowserStream}
                            className="flex items-center gap-2"
                          >
                            <Video className="h-4 w-4" />
                            Bắt đầu phát sóng WebRTC
                          </Button>
                        ) : (
                          <Button
                            onClick={stopBrowserStream}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Square className="h-4 w-4" />
                            Dừng phát sóng
                          </Button>
                        )}

                        {!isStreaming && <Button
                          onClick={stopWebcam}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <VideoOff className="h-4 w-4" />
                          Dừng tất cả
                        </Button>}
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <h4 className="font-medium text-blue-900 mb-2">
                          Thông tin WebRTC:
                        </h4>
                        <p className="text-sm text-blue-800 mb-2">
                          URL phát sóng:{" "}
                          <code className="bg-blue-100 px-1 rounded">
                            {webrtcUrl}
                          </code>
                        </p>
                        <p className="text-sm text-blue-700">
                          Phát sóng qua WebRTC protocol trực tiếp từ trình duyệt
                          đến server.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-4 mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => router.navigate({ to: "/" })}
            >
              Quay Lại Danh Sách Stream
            </Button>
            <Button
              variant="outline"
              onClick={() => router.navigate({ to: "/stream/create" })}
            >
              Tạo Stream Mới
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
