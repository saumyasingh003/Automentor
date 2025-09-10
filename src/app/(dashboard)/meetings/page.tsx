import { getQueryClient, trpc } from "@/app/api/trpc/server";
import MeetingsView, {
  MeetingsViewError,
  MeetingsViewLoading,
} from "@/modules/meetings/ui/server/meetingsView";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { MeetingsListHeader } from "@/modules/meetings/components/meetings-list-header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { loadSearchParams } from "@/modules/agents/params";
import type { SearchParams } from "nuqs/server";
import { redirect } from "next/navigation";

 interface Props {
    searchParams :Promise<SearchParams>;
  }

const Meetings = async ({searchParams}: Props) => {
  const filters = await loadSearchParams(searchParams);
  const queryClient = getQueryClient();
  const session = await auth.api.getSession({
    headers : await headers()
  })

 

  if(!session){
    redirect('/sign-in');
  }
  await queryClient.prefetchQuery(trpc.meetings.getMany.queryOptions({...filters}));

  return (
    <>
    <MeetingsListHeader/>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<MeetingsViewLoading />}>
          <ErrorBoundary fallback={<MeetingsViewError />}>
            <MeetingsView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
};

export default Meetings;

