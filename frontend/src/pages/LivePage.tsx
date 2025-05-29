"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useRouterState } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Copy, CheckCircle, Video, VideoOff, Square, Mic, MicOff, Monitor } from "lucide-react"
import type { CreateStreamResponse } from "@/services/streamService"

export function LivePage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [videoKey, setVideoKey] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  // Effect to handle video playing (global fallback)
  useEffect(() => {
    const video = videoRef.current
    if (video && video.srcObject && video.paused) {
      const playVideo = async () => {
        try {
          await video.play()
          console.log('Global effect: Video playing successfully')
        } catch (error) {
          console.error('Global effect: Error playing video:', error)
        }
      }
      
      // Small delay to allow other event handlers to complete first
      const timer = setTimeout(playVideo, 100)
      return () => clearTimeout(timer)
    }
  }, [hasPermission, isVideoLoading])

  // Cleanup effect for video events
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleError = (error: Event) => {
      console.error('Global video error:', error)
    }

    const handleLoadStart = () => {
      console.log('Global: Video load started')
    }

    video.addEventListener('error', handleError)
    video.addEventListener('loadstart', handleLoadStart)

    return () => {
      video.removeEventListener('error', handleError)
      video.removeEventListener('loadstart', handleLoadStart)
    }
  }, [])

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // Clean up media stream when component unmounts
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop())
      }
    }
  }, [])

  // Get the stream data from router state
  const state = useRouterState({ select: s => s.location.state }) as { streamData?: CreateStreamResponse }
  const streamData = state?.streamData
  
  // If no stream data, redirect back to create stream
  if (!streamData) {
    router.navigate({ to: "/stream/create" })
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Đang chuyển hướng...</CardTitle>
            <CardDescription>Không tìm thấy thông tin stream. Đang chuyển về trang tạo stream...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Construct RTMP URL with JWT
  const rtmpUrl = `rtmp://${streamData.streamUrl}/stream/${streamData.streamId}?jwt=${streamData.mediamtxJwt}`
  
  // Construct WebRTC URL
  const webrtcUrl = `http://${streamData.streamUrl}:8889/stream/${streamData.streamId}/publish`
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(rtmpUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy to clipboard:", err)
    }  }

  // Webcam functions
  const startWebcam = async () => {
    setIsVideoLoading(true)
    setVideoKey(k => k + 1)
    try {
      // Stop previous stream if exists
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop())
      }

      console.log('Requesting webcam access...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: true 
      })
      console.log('Webcam access granted, setting up video...')
      mediaStreamRef.current = stream
      
      // Set permission first so video element gets rendered
      setHasPermission(true)
      setIsCameraOn(true)
      setIsMicOn(true)
      setIsScreenSharing(false)
      
      console.log("videoRef.current before timeout: ", videoRef.current)
      
      // Wait for React to re-render and create the video element
      setTimeout(() => {
        console.log("videoRef.current after timeout: ", videoRef.current)
        
        if (videoRef.current) {
          const video = videoRef.current
          video.srcObject = stream
          
          console.log('Webcam: Setting up video after timeout...')
          
          // Immediate attempt to play
          video.play().then(() => {
            console.log('Webcam: Immediate play success')
            setIsVideoLoading(false)
          }).catch((error) => {
            console.log('Webcam: Immediate play failed:', error)
            
            // Set up event listeners for retry
            const onCanPlay = () => {
              console.log('Webcam: canplay event fired')
              video.play().then(() => {
                console.log('Webcam: Play after canplay success')
                setIsVideoLoading(false)
              }).catch(console.error)
            }

            const onLoadedData = () => {
              console.log('Webcam: loadeddata event fired')
              video.play().then(() => {
                console.log('Webcam: Play after loadeddata success')
                setIsVideoLoading(false)
              }).catch(console.error)
            }

            video.addEventListener('canplay', onCanPlay, { once: true })
            video.addEventListener('loadeddata', onLoadedData, { once: true })
            console.log('Webcam: Event listeners added for retry')
          })

          // Fallback timeout - always clear loading after 2 seconds
          setTimeout(() => {
            console.log('Webcam: Fallback timeout triggered, clearing loading state')
            setIsVideoLoading(false)
          }, 2000)
        } else {
          console.error('Webcam: Video element still not available after timeout')
          setIsVideoLoading(false)
        }
      }, 100) // Wait 100ms for React to re-render
      
      console.log('Webcam setup complete')    } catch (error: any) {
      console.error('Error accessing webcam:', error)
      if (error?.name === 'NotAllowedError' || error?.name === 'AbortError') {
        setHasPermission(null)
      } else {
        setHasPermission(false)
      }
      setIsVideoLoading(false)
    }
  }

  const startScreenShare = async () => {
    setIsVideoLoading(true)
    setVideoKey(k => k + 1)
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop())
      }
      console.log('Requesting screen share access...')
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, 
        audio: true 
      })
      console.log('Screen share access granted, setting up video...')
      mediaStreamRef.current = stream
      
      // Set permission first so video element gets rendered
      setHasPermission(true)
      setIsScreenSharing(true)
      setIsCameraOn(false)
      setIsMicOn(true)
      
      // Wait for React to re-render and create the video element
      setTimeout(() => {
        if (videoRef.current) {
          const video = videoRef.current
          video.srcObject = stream
          
          console.log('ScreenShare: Setting up video after timeout...')
          
          // Immediate attempt to play
          video.play().then(() => {
            console.log('ScreenShare: Immediate play success')
            setIsVideoLoading(false)
          }).catch((error) => {
            console.log('ScreenShare: Immediate play failed:', error)
            
            // Set up event listeners for retry
            const onCanPlay = () => {
              console.log('ScreenShare: canplay event fired')
              video.play().then(() => {
                console.log('ScreenShare: Play after canplay success')
                setIsVideoLoading(false)
              }).catch(console.error)
            }

            const onLoadedData = () => {
              console.log('ScreenShare: loadeddata event fired')
              video.play().then(() => {
                console.log('ScreenShare: Play after loadeddata success')
                setIsVideoLoading(false)
              }).catch(console.error)
            }

            video.addEventListener('canplay', onCanPlay, { once: true })
            video.addEventListener('loadeddata', onLoadedData, { once: true })
            console.log('ScreenShare: Event listeners added for retry')
          })

          // Fallback timeout - always clear loading after 2 seconds
          setTimeout(() => {
            console.log('ScreenShare: Fallback timeout triggered, clearing loading state')
            setIsVideoLoading(false)
          }, 2000)
        } else {
          console.error('ScreenShare: Video element still not available after timeout')
          setIsVideoLoading(false)
        }
      }, 100) // Wait 100ms for React to re-render
      
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        setIsScreenSharing(false)
        setHasPermission(null)
        setIsVideoLoading(false)
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
      })
      console.log('Screen share setup complete')
    } catch (error: any) {
      console.error('Error accessing screen share:', error)
      if (error?.name === 'NotAllowedError' || error?.name === 'AbortError') {
        setHasPermission(null)
      } else {
        setHasPermission(false)
      }
      setIsVideoLoading(false)
    }
  }
  const toggleCamera = async () => {
    if (!hasPermission) return
    
    if (isScreenSharing) {
      // Switch from screen share to camera
      await startWebcam()
    } else {
      // Toggle camera on/off
      if (mediaStreamRef.current) {
        const videoTracks = mediaStreamRef.current.getVideoTracks()
        videoTracks.forEach((track: MediaStreamTrack) => {
          track.enabled = !isCameraOn
        })
        setIsCameraOn(!isCameraOn)
      }
    }
  }

  const toggleMicrophone = () => {
    if (!hasPermission || !mediaStreamRef.current) return
    
    const audioTracks = mediaStreamRef.current.getAudioTracks()
    audioTracks.forEach((track: MediaStreamTrack) => {
      track.enabled = !isMicOn
    })
    setIsMicOn(!isMicOn)
  }
  const stopWebcam = () => {
    // Stop all tracks in the current stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop())
      mediaStreamRef.current = null
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.load() // Force reset the video element
    }
    
    // Reset all states
    setIsStreaming(false)
    setHasPermission(null)
    setIsCameraOn(true)
    setIsMicOn(true)
    setIsScreenSharing(false)
    setIsVideoLoading(false)
    
    console.log('All media stopped and states reset')
  }

  const startBrowserStream = async () => {
    if (!mediaStreamRef.current) return
    
    try {
      // Here you would implement WebRTC streaming to the server
      // For now, we'll simulate the streaming process
      console.log('Starting WebRTC stream to:', webrtcUrl)
      console.log('Stream data:', streamData)
      
      // Simulate WebRTC connection
      setIsStreaming(true)
        // In a real implementation, you would:
      // 1. Create RTCPeerConnection
      // 2. Add local stream tracks
      // 3. Create offer/answer with server
      // 4. Send stream to webrtcUrl endpoint
      
    } catch (error) {
      console.error('Error starting WebRTC stream:', error)
    }
  }

  const stopBrowserStream = () => {
    setIsStreaming(false)
    console.log('Stopping WebRTC stream')
    // In real implementation, close RTCPeerConnection
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Bắt Đầu Live Stream</CardTitle>
          <CardDescription>
            Stream ID: {streamData.streamId} - Chọn phương thức phát sóng của bạn
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
                <h3 className="text-lg font-semibold">Phát sóng bằng phần mềm RTMP</h3>
                <p className="text-sm text-gray-600">
                  Sử dụng phần mềm như OBS Studio, XSplit hoặc các ứng dụng khác hỗ trợ RTMP để phát sóng.
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
                    <p className="text-sm text-green-600">Đã sao chép vào clipboard!</p>
                  )}
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">Hướng dẫn thiết lập:</h4>
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
                <h3 className="text-lg font-semibold">Phát sóng từ trình duyệt</h3>
                <p className="text-sm text-gray-600">
                  Sử dụng webcam, microphone hoặc chia sẻ màn hình để phát sóng trực tiếp qua WebRTC.
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
                        Không thể truy cập camera, microphone hoặc màn hình. Vui lòng kiểm tra cài đặt trình duyệt.
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
                          {isVideoLoading ? "Đang tải..." : "Thử lại Chia sẻ màn hình"}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {hasPermission && (
                    <div className="space-y-4">
                      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                        <video
                          key={videoKey}
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          controls={false}
                          preload="metadata"
                          className="w-full h-full object-cover"
                          style={{ backgroundColor: '#000' }}
                          onLoadStart={() => console.log('Video load started')}
                          onCanPlay={() => console.log('Video can play')}
                          onPlay={() => console.log('Video started playing')}
                          onError={(e) => console.error('Video element error:', e)}
                        />
                        
                        {/* Loading overlay */}
                        {isVideoLoading && (
                          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                              <div className="text-sm">Đang khởi tạo video...</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Waiting for stream overlay */}
                        {hasPermission && !isVideoLoading && !mediaStreamRef.current && (
                          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="text-sm">Đang chờ video stream...</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Stream attached but video not playing overlay */}
                        {hasPermission && !isVideoLoading && mediaStreamRef.current && videoRef.current?.srcObject && videoRef.current?.paused && (
                          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="text-sm">Đang kết nối video...</div>
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
                          variant={isCameraOn && !isScreenSharing ? "default" : "outline"}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {isCameraOn && !isScreenSharing ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                          {isScreenSharing ? "Chuyển sang Webcam" : (isCameraOn ? "Camera" : "Bật Camera")}
                        </Button>
                        
                        <Button
                          onClick={startScreenShare}
                          disabled={isVideoLoading}
                          variant={isScreenSharing ? "default" : "outline"}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Monitor className="h-4 w-4" />
                          {isVideoLoading ? "Đang tải..." : (isScreenSharing ? "Đang chia sẻ" : "Chia sẻ màn hình")}
                        </Button>
                        
                        {/* Microphone control */}
                        <Button
                          onClick={toggleMicrophone}
                          variant={isMicOn ? "default" : "outline"}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
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
                            variant="destructive"
                            className="flex items-center gap-2"
                          >
                            <Square className="h-4 w-4" />
                            Dừng phát sóng
                          </Button>
                        )}
                        
                        <Button
                          onClick={stopWebcam}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <VideoOff className="h-4 w-4" />
                          Dừng tất cả
                        </Button>
                      </div>
                      
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <h4 className="font-medium text-blue-900 mb-2">Thông tin WebRTC:</h4>
                        <p className="text-sm text-blue-800 mb-2">
                          URL phát sóng: <code className="bg-blue-100 px-1 rounded">{webrtcUrl}</code>
                        </p>
                        <p className="text-sm text-blue-700">
                          Phát sóng qua WebRTC protocol trực tiếp từ trình duyệt đến server.
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
  )
}
