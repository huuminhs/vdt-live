"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "@tanstack/react-router"
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
import { Copy, CheckCircle, Video, VideoOff, Square } from "lucide-react"
import type { CreateStreamResponse } from "@/services/streamService"

export function LivePage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [streamData, setStreamData] = useState<CreateStreamResponse | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  
  useEffect(() => {
    // Get the stream data from localStorage
    const storedData = localStorage.getItem('currentStreamData')
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as CreateStreamResponse
        setStreamData(data)
        // Clear the data from localStorage after loading
        localStorage.removeItem('currentStreamData')
      } catch (error) {
        console.error('Failed to parse stream data:', error)
        router.navigate({ to: "/stream/create" })
      }
    } else {
      // If no stream data, redirect back to create stream
      router.navigate({ to: "/stream/create" })
    }
  }, [router])

  // If no stream data, show loading or redirect
  if (!streamData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Đang tải...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Construct RTMP URL
  const rtmpUrl = `rtmp://${streamData.streamUrl}/stream/${streamData.streamId}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(rtmpUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)    } catch (err) {
      console.error("Failed to copy to clipboard:", err)
    }
  }

  // Webcam functions
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      mediaStreamRef.current = stream
      setHasPermission(true)
    } catch (error) {
      console.error('Error accessing webcam:', error)
      setHasPermission(false)
    }
  }

  const stopWebcam = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsStreaming(false)
    setHasPermission(null)
  }

  const startBrowserStream = () => {
    // This would typically involve WebRTC or other streaming protocols
    // For now, we'll just simulate starting the stream
    setIsStreaming(true)
    console.log('Starting browser stream with data:', streamData)
  }

  const stopBrowserStream = () => {
    setIsStreaming(false)
    console.log('Stopping browser stream')
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Stream Key:</label>
                  <div className="flex gap-2">
                    <Input
                      value={streamData.mediamtxJwt}
                      readOnly
                      className="font-mono text-sm"
                      type="password"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(streamData.mediamtxJwt)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        } catch (err) {
                          console.error("Failed to copy stream key:", err)
                        }
                      }}
                      title="Sao chép Stream Key"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">Hướng dẫn thiết lập:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Mở phần mềm phát sóng (OBS Studio, XSplit, v.v.)</li>
                    <li>Thêm nguồn streaming với URL RTMP ở trên</li>
                    <li>Sử dụng Stream Key được cung cấp</li>
                    <li>Bắt đầu phát sóng từ phần mềm của bạn</li>
                  </ol>
                </div>
              </div>
            </TabsContent>
              <TabsContent value="webcam" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Phát sóng từ trình duyệt</h3>
                <p className="text-sm text-gray-600">
                  Sử dụng webcam và microphone của trình duyệt để phát sóng trực tiếp.
                </p>
                
                <div className="space-y-4">
                  {!hasPermission && (
                    <div className="text-center space-y-4">
                      <Button
                        onClick={startWebcam}
                        className="flex items-center gap-2"
                      >
                        <Video className="h-4 w-4" />
                        Cho phép truy cập Camera & Microphone
                      </Button>
                      <p className="text-sm text-gray-500">
                        Bạn cần cho phép truy cập camera và microphone để phát sóng.
                      </p>
                    </div>
                  )}
                  
                  {hasPermission === false && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md text-center">
                      <p className="text-red-700">
                        Không thể truy cập camera hoặc microphone. Vui lòng kiểm tra cài đặt trình duyệt.
                      </p>
                      <Button
                        variant="outline"
                        onClick={startWebcam}
                        className="mt-2"
                      >
                        Thử lại
                      </Button>
                    </div>
                  )}
                  
                  {hasPermission && (
                    <div className="space-y-4">
                      <div className="relative bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          className="w-full h-64 object-cover"
                        />
                        {isStreaming && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium flex items-center gap-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            LIVE
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 justify-center">
                        {!isStreaming ? (
                          <Button
                            onClick={startBrowserStream}
                            className="flex items-center gap-2"
                          >
                            <Video className="h-4 w-4" />
                            Bắt đầu phát sóng
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
                          Dừng camera
                        </Button>
                      </div>
                      
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <h4 className="font-medium text-yellow-900 mb-2">Lưu ý:</h4>
                        <p className="text-sm text-yellow-800">
                          Tính năng phát sóng từ trình duyệt hiện đang trong giai đoạn phát triển. 
                          Để có trải nghiệm tốt nhất, vui lòng sử dụng phương thức RTMP.
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
