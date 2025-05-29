import { StreamCard } from "../components/StreamCard"

// Mock data for demonstration
const mockStreams = [
  {
    id: 1,
    thumbnail: "/src/assets/stream.jpg",
    title: "Epic Gaming Session - Playing the Latest AAA Game!",
    username: "GamerPro123"
  },
  {
    id: 2,
    thumbnail: "/src/assets/stream.jpg", 
    title: "Cooking Delicious Pasta from Scratch",
    username: "ChefMaster"
  },
  {
    id: 3,
    thumbnail: "/src/assets/stream.jpg",
    title: "Learning React and TypeScript - Beginner Friendly",
    username: "CodeTeacher"
  },
  {
    id: 4,
    thumbnail: "/src/assets/stream.jpg",
    title: "Music Production Live - Creating Beats",
    username: "BeatMaker99"
  },
  {
    id: 5,
    thumbnail: "/src/assets/stream.jpg",
    title: "Art Stream - Digital Painting Tutorial",
    username: "ArtistVibe"
  },
  {
    id: 6,
    thumbnail: "/src/assets/stream.jpg",
    title: "Just Chatting and Q&A with Viewers",
    username: "TalkShowHost"
  }
]

export function StreamsPage() {
  const handleStreamClick = (streamId: number) => {
    console.log(`Clicked on stream ${streamId}`)
    // Handle navigation to stream page
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Live Streams</h1>
      
      {/* Streams Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockStreams.map((stream) => (
          <StreamCard
            key={stream.id}
            thumbnail={stream.thumbnail}
            title={stream.title}
            username={stream.username}
            onClick={() => handleStreamClick(stream.id)}
          />
        ))}
      </div>
    </div>
  )
}
