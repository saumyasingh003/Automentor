"use client";
import { useTRPC } from "@/app/api/trpc/client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import MeetingIdViewHeader from "../../components/MeetingIdViewHeader";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";
import { useState } from "react";
import { UpdateMeetingDialog } from "../../components/update-meeting-dialog copy";
import { UpcomingState } from "../../components/upcoming-state";
import { ActiveState } from "../../components/active-state";
import { CancelledState } from "../../components/cancelled-state";
import { ProcessingState } from "../../components/processing-state";
import CompletedState from "../../components/completed-state";

interface Props {
  meetingId: string;
}

export const MeetingIdView = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [UpdateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false);

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Are you sure?",
    "The following action will remove this meeting"
  );

  const { data } = useSuspenseQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId })
  );

  const RemoveMeeting = useMutation(
    trpc.meetings.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({}));
        router.push("/meetings");
      },
    })
  );

  const handleRemoveMeeting = async () => {
    const confirmed = await confirmRemove();
    if (!confirmed) return;

    await RemoveMeeting.mutateAsync({ id: meetingId });
  };

  // ✅ Move status checks here so they are available in JSX
  const isActive = data.status === "active";
  const isUpcoming = data.status === "upcoming";
  const isCancelled = data.status === "cancelled";
  const isProcessing = data.status === "processing";
  const isCompleted = data.status === "completed";

  return (
    <>
      <RemoveConfirmation />
      <UpdateMeetingDialog
        open={UpdateMeetingDialogOpen}
        onOpenChange={setUpdateMeetingDialogOpen}
        initialValues={data}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <MeetingIdViewHeader
          meetingId={meetingId}
          meetingName={data.name}
          onEdit={() => setUpdateMeetingDialogOpen(true)}
          onRemove={handleRemoveMeeting}
        />

        {isCancelled && (<CancelledState/>)}
        {isProcessing && (<ProcessingState/>)}
        {isActive &&  (<ActiveState meetingId={meetingId}/>)}
        {isUpcoming && (
          <UpcomingState
            meetingId={meetingId}
            onCancelMeeting={() => {}}
            isCancelling={false}
          />
        )}
        {isCompleted && (<CompletedState data={data}/>)}
      </div>
    </>
  );
};

export const MeetingsIdViewLoading = () => (
  <LoadingState
    title="Loading Meetings"
    description="This may take a few seconds..."
  />
);

export const MeetingsIdViewError = () => (
  <ErrorState
    title="Error Loading Meetings"
    description="Something went wrong"
  />
);
