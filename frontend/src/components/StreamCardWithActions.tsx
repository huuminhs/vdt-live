import { useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { toast } from "sonner"
import { AspectRatio } from "./ui/aspect-ratio"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { MoreVertical, Edit, Trash2, Play } from "lucide-react"
import { streamService } from "@/services/streamService"
import { useAuthStore } from "@/stores/authStore"

interface StreamCardWithActionsProps {
  streamId: number
  thumbnail: string
  title: string
  description?: string
  username: string
  status: 'LIVE' | 'ENDED' | 'CREATED'
  onClick?: () => void
  onEdit?: (title: string, description: string) => void
  onDelete?: () => Promise<void>
}

export function StreamCardWithActions({ 
  streamId,
  thumbnail, 
  title, 
  description = "",
  username, 
  status, 
  onClick,
  onEdit,
  onDelete
}: StreamCardWithActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editTitle, setEditTitle] = useState(title)
  const [editDescription, setEditDescription] = useState(description)
  const router = useRouter()
  const { getAuthHeader } = useAuthStore()

  // Determine the status color and text
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'LIVE':
        return { color: 'bg-red-600', text: 'LIVE' }
      case 'ENDED':
        return { color: 'bg-gray-600', text: 'ĐÃ KẾT THÚC' }
      case 'CREATED':
        return { color: 'bg-orange-500', text: 'SẮP LÊN SÓNG' }
      default:
        return { color: 'bg-gray-600', text: status }
    }
  }

  const statusConfig = getStatusConfig(status)
  const handleEditSubmit = () => {
    onEdit?.(editTitle, editDescription)
    setIsEditDialogOpen(false)
  }

  const handleDeleteConfirm = async () => {
    try {
      const authHeader = getAuthHeader()
      if (!authHeader) {
        toast("Không có quyền truy cập. Vui lòng đăng nhập lại.")
        setIsDeleteDialogOpen(false)
        return
      }

      // Call the parent's onDelete callback which handles the API call
      await onDelete?.()
      
      setIsDeleteDialogOpen(false)
    } catch (error: any) {
      console.error('Error deleting stream:', error)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleStartStream = async () => {
    try {
      const authHeader = getAuthHeader()
      if (!authHeader) {
        toast("Không có quyền truy cập. Vui lòng đăng nhập lại.")
        return
      }

      // Call the API to get stream JWT
      const response = await streamService.getStreamJwt(streamId, authHeader)
      
      // Navigate to live page with stream data
      router.navigate({ 
        to: "/stream/live",
        state: { streamData: response } as any
      })
    } catch (error: any) {
      console.error('Error getting stream JWT:', error)
      toast("Không thể bắt đầu phát trực tiếp. Vui lòng thử lại.")
    }
  }

  return (
    <>
      <div 
        className="group cursor-pointer transition-transform hover:scale-105"
        onClick={onClick}
      >
        {/* Stream Thumbnail */}
        <div className="relative overflow-hidden rounded-lg bg-gray-100">
          <AspectRatio ratio={16 / 9}>
            <img
              src={thumbnail}
              alt={`${title} stream thumbnail`}
              className="h-full w-full object-cover transition-transform group-hover:scale-110"
            />
            {/* Status indicator */}
            <div className={`absolute top-2 left-2 ${statusConfig.color} text-white text-xs font-semibold px-2 py-1 rounded`}>
              {statusConfig.text}
            </div>
          </AspectRatio>
        </div>
        
        {/* Stream Info */}
        <div className="mt-3 space-y-1">
          {/* Title with Dropdown */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight flex-1">
              {title}
            </h3>
            
            {/* Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleStartStream}>
                  <Play className="h-4 w-4" />
                  Phát trực tiếp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Xoá
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Username */}
          <p className="text-sm text-gray-600">
            {username}
          </p>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin stream</DialogTitle>
            <DialogDescription>
              Cập nhật tiêu đề và mô tả cho stream của bạn.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Tiêu đề</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Nhập tiêu đề stream..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Mô tả</Label>
              <Input
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Nhập mô tả stream..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleEditSubmit}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa stream</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa stream "{title}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
            >
              Xóa stream
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
