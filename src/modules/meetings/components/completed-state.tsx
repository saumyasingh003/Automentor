import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeetingGetOne } from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  BookOpenTextIcon,
  ClockFadingIcon,
  FileTextIcon,
  FileVideoIcon,
  SparklesIcon,
} from "lucide-react";
import GeneratedAvatar from "@/components/generative-avatar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import Transcript from "./transcript";
import { ChatProvider } from "./chat-provider";

interface Props {
  data: MeetingGetOne;
}

const CompletedState = ({ data }: Props) => {
  return (
    <div className="flex flex-col gap-y-4">
      <Tabs defaultValue="summary">
        {/* Tabs Header */}
        <div className="bg-white rounded-lg border px-3">
          <ScrollArea>
            <TabsList className="p-0 bg-background justify-start rounded-none h-13">
              <TabsTrigger
                value="summary"
                className="text-muted-foreground rounded-none bg-background 
                  data-[state=active]:shadow-none border-b-4
                  data-[state=active]:border-b-green-500 
                  data-[state=active]:text-accent-foreground 
                  h-full hover:text-accent-foreground"
              >
                <BookOpenTextIcon className="mr-2 h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger
                value="transcript"
                className="text-muted-foreground rounded-none bg-background 
                  data-[state=active]:shadow-none border-b-4
                  data-[state=active]:border-b-green-500 
                  data-[state=active]:text-accent-foreground 
                  h-full hover:text-accent-foreground"
              >
                <FileTextIcon className="mr-2 h-4 w-4" />
                Transcript
              </TabsTrigger>
              <TabsTrigger
                value="recording"
                className="text-muted-foreground rounded-none bg-background 
                  data-[state=active]:shadow-none border-b-4
                  data-[state=active]:border-b-green-500 
                  data-[state=active]:text-accent-foreground 
                  h-full hover:text-accent-foreground"
              >
                <FileVideoIcon className="mr-2 h-4 w-4" />
                Recording
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="text-muted-foreground rounded-none bg-background 
                  data-[state=active]:shadow-none border-b-4
                  data-[state=active]:border-b-green-500 
                  data-[state=active]:text-accent-foreground 
                  h-full hover:text-accent-foreground"
              >
                <SparklesIcon className="mr-2 h-4 w-4" />
                Ask AI
              </TabsTrigger>
            </TabsList>
          </ScrollArea>
        </div>

        {/* Recording Tab */}
        <TabsContent value="recording">
          <div className="bg-white rounded-lg border px-4 py-5">
            <video
              src={data.recordingUrl!}
              controls
              className="w-full rounded-lg"
            />
          </div>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <div className="bg-white rounded-lg border p-5 flex flex-col gap-y-5">
            {/* Title */}
            <h2 className="text-2xl font-medium capitalize">{data.name}</h2>

            {/* Agent Info */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={`/agents/${data.agent.id}`}
                className="flex items-center gap-x-2 underline underline-offset-4 text-xl font-bold capitalize"
              >
                <GeneratedAvatar
                  variant="botttsNeutral"
                  seed={data.agent.name}
                  className="size-6"
                />
                {data.agent.name}
              </Link>

              <p className="text-gray-600">
                {data.startedAt ? format(data.startedAt, "PPP") : ""}
              </p>

              <div className="flex items-center gap-x-2 text-gray-700">
                <SparklesIcon className="size-4" />
                <p>General summary</p>
              </div>

              <Badge
                variant="outline"
                className="flex items-center gap-x-2 [&>svg]:size-4"
              >
                <ClockFadingIcon className="text-blue-700" />
                {data.duration ? formatDuration(data.duration) : "No duration"}
              </Badge>
            </div>

            {/* Markdown Summary */}
            <div className="prose prose-sm max-w-none text-gray-800">
              <ReactMarkdown
                components={{
                  h1: (props) => (
                    <h1 className="text-2xl font-medium mb-6" {...props} />
                  ),
                  h2: (props) => (
                    <h2 className="text-xl font-medium mb-6" {...props} />
                  ),
                  h3: (props) => (
                    <h3 className="text-lg font-medium mb-6" {...props} />
                  ),
                  h4: (props) => (
                    <h4 className="text-base font-medium mb-6" {...props} />
                  ),
                  p: (props) => (
                    <p className="leading-relaxed mb-6" {...props} />
                  ),
                  ul: (props) => (
                    <ul className="list-disc list-inside mb-6 " {...props} />
                  ),
                  strong: (props) => (
                    <strong className="font-semibold " {...props} />
                  ),
                }}
              >
                {data.summary}
              </ReactMarkdown>
            </div>
          </div>
        </TabsContent>

        {/* transcript */}
        <TabsContent value="transcript">
          <Transcript meetingId={data.id}/>
        </TabsContent>


         {/* chat */}
        <TabsContent value="chat">
          <ChatProvider meetingId={data.id} meetingName={data.name}/>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompletedState;
