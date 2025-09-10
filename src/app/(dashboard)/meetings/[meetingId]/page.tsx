import { getQueryClient, trpc } from "@/app/api/trpc/server";
import { auth } from "@/lib/auth";
import { MeetingIdView, MeetingsIdViewError, MeetingsIdViewLoading } from "@/modules/meetings/ui/server/meeting-id-view";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
  params: Promise<{ meetingId: string }>;
}
const MeetingIdPage = async ({ params }: Props) => {
  const { meetingId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId })
  );
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<MeetingsIdViewLoading/>}>
        <ErrorBoundary fallback={<MeetingsIdViewError/>}>
          <MeetingIdView meetingId={meetingId} />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default MeetingIdPage;
