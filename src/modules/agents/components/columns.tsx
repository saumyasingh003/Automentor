"use client";

import { ColumnDef } from "@tanstack/react-table";
import GeneratedAvatar from "@/components/generative-avatar";
import { ClockFadingIcon, CornerDownRightIcon, VideoIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import humanizeDuration from "humanize-duration";

function formatDuration(seconds: number) {
  return humanizeDuration(seconds * 1000, {
    largest: 1,
    round: true,
    units: ["h", "m", "s"],
  });
}

export const columns: ColumnDef<{
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  instructions: string;
  meetingCount: number;
  duration?: number; // ✅ added duration to match your column
}>[] = [
  {
    accessorKey: "name",
    header: "Agent name",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <div className="flex items-center gap-x-2">
          <GeneratedAvatar
            variant="botttsNeutral"
            seed={row.original.name}
            className="size-6"
          />
          <span className="font-semibold capitalize">{row.original.name}</span>
        </div>
        <div className="flex items-center gap-x-2">
          <CornerDownRightIcon className="size-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground max-w-[200px] truncate capitalize">
            {row.original?.instructions}
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "meetingCount",
    header: "Meetings",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="flex items-center gap-x-2 [&>svg]:size-4"
      >
        <VideoIcon className="text-blue-500" />
        {row.original?.meetingCount}{" "}
        {row.original?.meetingCount === 1 ? "Meeting" : "Meetings"}
      </Badge>
    ),
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="capitalize [&>svg]:size-4 flex items-center gap-x-2"
      >
        <ClockFadingIcon className="text-blue-700" />
        {row.original.duration
          ? formatDuration(row.original.duration)
          : "No duration"}
      </Badge>
    ),
  },
];
