"use client";

import { useTRPC } from "@/app/api/trpc/client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useSuspenseQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/empty-state";
import { useAgentsFilters } from "@/app/(dashboard)/agents/hooks/use-agent-filters";
import { useRouter } from "next/navigation";
import { columns } from "../../components/columns";
import { DataTable } from "@/components/data-table";
import DataPagination from "../../components/dataPagination";

export const AgentsView = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const [filters, setFilters] = useAgentsFilters();

  const { data } = useSuspenseQuery(
    trpc.agents.getMany.queryOptions({
      page: filters.page,
      search: filters.search || undefined,
      pageSize: 5,
    })
  );

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      <DataTable
        data={data.items}
        columns={columns}
        onRowClick={(row) => router.push(`/agents/${row.id}`)}
      />

      {data.totalPages > 1 && (
        <DataPagination
          page={filters.page}
          totalPages={data.totalPages}
          onPageChange={(page) => setFilters({ page })}
        />
      )}

      {data.items.length === 0 && (
        <EmptyState
          title="Create your First Agent"
          description="Create an agent to join your meeting. Each agent will follow your instructions and interact with participants during the call."
        />
      )}
    </div>
  );
};

export const AgentsViewLoading = () => (
  <LoadingState
    title="Loading Agents"
    description="This may take a few seconds..."
  />
);

export const AgentsViewError = () => (
  <ErrorState
    title="Error Loading Agents"
    description="Something went wrong"
  />
);
