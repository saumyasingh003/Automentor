import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Ban, VideoIcon } from "lucide-react";  // ✅ Ban instead of BanIcon
import Link from "next/link";                   // ✅ Correct import for Link

interface Props {
  meetingId: string;
}

export const ActiveState = ({
  meetingId,
}: Props) => {
  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
      <EmptyState
        image="/upcoming.svg"
        title="Meeting is Active"
        description="Meeting will end once all participants have left.."
      />

      <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full">
  
        <Button
          asChild
         
          className="w-full lg:w-auto bg-green-600 hover:bg-green-700"
        >
          <Link href={`/call/${meetingId}`}>
            <VideoIcon className="mr-2 h-4 w-4" />
            Join meeting
          </Link>
        </Button>
      </div>
    </div>
  );
};
