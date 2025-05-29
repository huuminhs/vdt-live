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
import { register } from "@/services/authService"

export function RegisterPage({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp")
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }    setIsLoading(true)

    try {
      await register({ username, password })
      setSuccess("Tạo tài khoản thành công! Đang chuyển hướng đến trang đăng nhập...")
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.navigate({ to: '/auth/login' })
      }, 2000)    } catch (error) {
      setError(error instanceof Error ? error.message : 'Đăng ký thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>        <CardHeader>
          <CardTitle>Tạo tài khoản của bạn</CardTitle>
          <CardDescription>
            Nhập thông tin bên dưới để tạo tài khoản mới
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
              {success && (
                <div className="p-3 rounded-md bg-green-50 border border-green-200">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}              <div className="grid gap-3">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập của bạn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>              <div className="grid gap-3">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Nhập mật khẩu của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="Xác nhận mật khẩu của bạn"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>              <div className="flex flex-col gap-3">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
                </Button>
              </div>
            </div>            <div className="mt-4 text-center text-sm">
              Đã có tài khoản?{" "}
              <a href="/auth/login" className="underline underline-offset-4">
                Đăng nhập
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
