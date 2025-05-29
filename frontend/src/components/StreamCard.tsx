import { AspectRatio } from "./ui/aspect-ratio"

interface StreamCardProps {
  thumbnail: string
  title: string
  username: string
  onClick?: () => void
}

export function StreamCard({ thumbnail, title, username, onClick }: StreamCardProps) {
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
          {/* Live indicator */}
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
            LIVE
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
