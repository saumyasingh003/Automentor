import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Ban, VideoIcon } from "lucide-react";  // ✅ Ban instead of BanIcon
import Link from "next/link";                   // ✅ Correct import for Link


export const ProcessingState = ()=> {
  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
      <EmptyState
        image="/processing.svg"
        title="Meeting has completed"
        description="This meetimg was completed, a summary will appear soon.."
      />

    </div>
  );
};
