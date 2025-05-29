import { AspectRatio } from "./ui/aspect-ratio"

interface StreamCardProps {
  thumbnail: string
  title: string
  username: string
  status: 'LIVE' | 'ENDED' | 'CREATED'
  onClick?: () => void
}

export function StreamCard({ thumbnail, title, username, status, onClick }: StreamCardProps) {
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

  return (
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
        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">
          {title}
        </h3>
        
        {/* Username */}
        <p className="text-sm text-gray-600">
          {username}
        </p>
      </div>
    </div>
  )
}
