"use client";

import { useTRPC } from "@/app/api/trpc/client";
import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { columns } from "../../components/column";
import { EmptyState } from "@/components/empty-state";
import { useRouter } from "next/navigation";
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";
import DataPagination from "../../components/meetingdatapagination";

const MeetingsViewContent = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const [filters, setFilters] = useMeetingsFilters();

  const { data } = useSuspenseQuery(
    trpc.meetings.getMany.queryOptions({
      page: filters.page,
      search: filters.search || undefined,
      pageSize: 5, // use your DEFAULT_PAGE_SIZE constant if you want
      status: filters.status || undefined,
      agentId: filters.agentId || undefined,
    })
  );

  if (data.items.length === 0) {
    return (
      <EmptyState
        title="Create your First Meeting"
        description="Schedule a meeting to connect with others. Each meeting lets you collaborate, 
        share ideas and interact with participants in real time."
      />
    );
  }

  return (
    <div className="flex flex-col gap-y-4">
      <DataTable
        data={data.items}
        columns={columns}
        onRowClick={(row) => router.push(`/meetings/${row.id}`)}
      />
      {data.totalPages > 1 && (
        <DataPagination
          page={filters.page}
          totalPages={data.totalPages}
          onPageChange={(page) => setFilters({ ...filters, page })}
        />
      )}
    </div>
  );
};

const MeetingsView = () => {
  return (
    <Suspense fallback={<MeetingsViewLoading />}>
      <MeetingsViewContent />
    </Suspense>
  );
};

export default MeetingsView;

export const MeetingsViewLoading = () => (
  <LoadingState
    title="Loading Meetings"
    description="This may take a few seconds..."
  />
);

export const MeetingsViewError = () => (
  <ErrorState
    title="Error Loading Meetings"
    description="Something went wrong"
  />
);
