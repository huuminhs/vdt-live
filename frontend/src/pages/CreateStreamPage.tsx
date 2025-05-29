"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { streamService } from "@/services/streamService"
import { useAuthHeader, useAuthActions } from "@/stores/authStore"
import type { CreateStreamResponse } from "@/services/streamService"

const createStreamSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề là bắt buộc")
    .min(3, "Tiêu đề phải có ít nhất 3 ký tự")
    .max(100, "Tiêu đề phải ít hơn 100 ký tự"),
  description: z
    .string()
    .min(1, "Mô tả là bắt buộc")
    .min(10, "Mô tả phải có ít nhất 10 ký tự")
    .max(500, "Mô tả phải ít hơn 500 ký tự"),
})

type CreateStreamFormData = z.infer<typeof createStreamSchema>

export function CreateStreamPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<CreateStreamResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const authHeader = useAuthHeader()
  const { checkTokenExpiry } = useAuthActions()
  const router = useRouter()
  const form = useForm<CreateStreamFormData>({
    resolver: zodResolver(createStreamSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })
  
  const onSubmit = async (data: CreateStreamFormData) => {
    // Check token expiry before making the request
    if (checkTokenExpiry()) {
      setError("Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.")
      return
    }

    if (!authHeader) {
      setError("Bạn phải đăng nhập để tạo stream")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await streamService.createStream(data, authHeader)
      setResult(response)
      form.reset()
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        err.message || 
        "Không thể tạo stream. Vui lòng thử lại."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Tạo Stream Thành Công!</CardTitle>
            <CardDescription>
              Stream của bạn đã được tạo và sẵn sàng để sử dụng.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">ID Stream:</p>
              <p className="text-lg font-mono">{result.streamId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">URL Stream:</p>
              <p className="text-lg font-mono">{result.streamUrl}</p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setResult(null)}>
                Tạo Stream Khác
              </Button>
              <Button variant="outline" onClick={() => router.navigate({ to: "/" })}>
                Quay Lại Danh Sách
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">      <Card>
        <CardHeader>
          <CardTitle>Tạo Stream Mới</CardTitle>
          <CardDescription>
            Điền thông tin bên dưới để tạo một live stream mới.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiêu Đề Stream</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nhập tiêu đề stream của bạn" 
                        {...field} 
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Đặt một tiêu đề hấp dẫn mô tả nội dung stream của bạn.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô Tả</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Mô tả nội dung stream của bạn..."
                        className="resize-none"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Cung cấp mô tả chi tiết về nội dung stream của bạn.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang Tạo Stream...
                    </>
                  ) : (
                    "Tạo Stream"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.navigate({ to: "/" })}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
