import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/app/api/trpc/client";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateAvatarUri } from "@/lib/avatar";
import { format } from "date-fns";
import Highlighter from "react-highlight-words";

interface Props {
  meetingId: string;
}

const Transcript = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.meetings.getTranscript.queryOptions({ id: meetingId })
  );

  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = (data ?? []).filter((item) =>
    item.text?.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg border px-4 py-5 flex flex-col gap-y-4 w-full">
      <p className="text-sm font-medium">Transcript</p>

      {/* Search */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search Transcript"
          className="pl-7 h-9 w-[240px]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      </div>

      {/* Transcript List */}
      <ScrollArea className="flex flex-col gap-y-4">
        {filteredData.map((item) => (
          <div key={item.start_ts}>
            <div className="flex flex-col gap-y-2 hover:bg-muted p-4 rounded-md border">
              <div className="flex gap-x-2 items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      item.user?.image ??
                      generateAvatarUri({
                        seed: item.user?.name ?? "Unknown",
                        variant: "initials",
                      })
                    }
                    alt={item.user?.name ?? "User Avatar"}
                  />
                  <AvatarFallback>
                    {item.user?.name?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium">{item.user?.name ?? "Unknown"}</p>
                <p className="text-sm text-blue-500 font-medium">
                  {format(new Date(item.start_ts), "mm:ss")}
                </p>
              </div>
              <Highlighter
                className="text-sm text-neutral-700"
                highlightClassName="bg-yellow-200"
                searchWords={[searchQuery]}
                autoEscape={true}
                textToHighlight={item.text ?? ""}
              />
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default Transcript;
