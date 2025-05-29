import { useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/authStore"
import { login } from "@/services/authService"

export function LoginPage({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const router = useRouter()
  const { setAuth, setLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    setLoading(true)

    try {
      const response = await login({ username, password })
      setAuth(response.token, response.tokenType)
      
      // Redirect to home page after successful login
      router.navigate({ to: '/' })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Đăng nhập thất bại')
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Đăng nhập tài khoản</CardTitle>
          <CardDescription>
            Nhập tên đăng nhập và mật khẩu để truy cập tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <div className="grid gap-3">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập của bạn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Chưa có tài khoản?{" "}
              <a href="/auth/register" className="underline underline-offset-4">
                Đăng ký
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
