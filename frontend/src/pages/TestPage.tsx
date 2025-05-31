import { StreamCardWithActions } from "@/components/StreamCardWithActions";
import Thumbnail from "@/assets/stream.jpg"

export default function TestPage() {
  return (    <div className="flex items-center justify-center h-screen">      <StreamCardWithActions
        streamId={1}
        thumbnail={Thumbnail}
        title="Test Streamggdsgsgds"
        description="This is a test stream description."
        username="testuser"
        status="LIVE"
        onClick={() => console.log("Stream clicked")}
        onEdit={(title, description) => console.log("Edit:", title, description)}
        onDelete={async () => console.log("Stream deleted")}
      />
    </div>
  );
}
