import JSONL from "jsonl-parse-stringify";
import { inngest } from "./client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { db } from "@/db";
import { eq, inArray } from "drizzle-orm";
import { agents, meetings, user } from "@/db/schema";
import { createAgent, openai, TextMessage } from "@inngest/agent-kit";

const summarize = createAgent({
  name: "Summarize Transcript",
  system: `
  You are an expert meeting summarizer. You write readable, concise, simple content based ONLY on the actual transcript provided. 

  IMPORTANT: Base your summary ONLY on the actual content and duration shown in the transcript. Do not make assumptions about meeting length or content not present in the transcript.

Use the following markdown structure for every output:

### Overview
Provide a concise summary of what actually happened in this meeting based on the transcript. Include the actual duration based on timestamps. Focus on key topics discussed, decisions made, and outcomes. Write in a narrative style using full sentences.

### Key Points
Break down the main discussion points in chronological order with relative timestamp references from the transcript (timestamps show time elapsed from meeting start):

#### [MM:SS - MM:SS] Topic/Section Name
- Key point or discussion item from transcript
- Decisions made or actions discussed
- Important insights or conclusions

### Action Items (if any)
List any specific action items, follow-ups, or next steps mentioned in the transcript.

Keep the summary proportional to the actual meeting length and content shown in the transcript.`.trim(),
  model: openai({ model: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY }),
});

export const meetingsProcessing = inngest.createFunction(
  { id: "meetings/processing" },
  { event: "meetings/processing" },
  async ({ event, step }) => {
    console.log(`Processing meeting: ${event.data.meetingId}`);
    
    const response = await step.run("fetch-transcript", async () => {
      const res = await fetch(event.data.transcriptUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch transcript: ${res.status} ${res.statusText}`);
      }
      return res.text();
    });

    const transcript = await step.run("parse-transcript", async () => {
      try {
        const parsed = JSONL.parse<StreamTranscriptItem>(response);
        console.log(`Parsed ${parsed.length} transcript items`);
        return parsed;
      } catch (error) {
        console.error("Failed to parse transcript:", error);
        throw new Error("Invalid transcript format");
      }
    });

    const transcriptWithSpeakers = await step.run("add-speakers", async () => {
      // Log first and last timestamps for debugging
      if (transcript.length > 0) {
        console.log(`First timestamp: ${transcript[0].start_ts} (type: ${typeof transcript[0].start_ts})`);
        console.log(`Last timestamp: ${transcript[transcript.length - 1].start_ts} (type: ${typeof transcript[transcript.length - 1].start_ts})`);
        // Calculate meeting duration for debugging
        const firstTs = new Date(transcript[0].start_ts).getTime();
        const lastTs = new Date(transcript[transcript.length - 1].start_ts).getTime();
        const durationSeconds = Math.floor((lastTs - firstTs) / 1000);
        console.log(`Meeting duration: ${durationSeconds} seconds`);
      }
      const speaker_id = [
        ...new Set(transcript.map((item) => item.speaker_id)),
      ];

      const userSpeakers = await db
        .select()
        .from(user)
        .where(inArray(user.id, speaker_id))
        .then((users) =>
          users.map((users) => ({
            ...users,
          }))
        );
      const agentSpeakers = await db
        .select()
        .from(agents)
        .where(inArray(agents.id, speaker_id))
        .then((agents) =>
          agents.map((agents) => ({
            ...agents,
          }))
        );
      const speakers = [...userSpeakers, ...agentSpeakers];

      return transcript.map((item) => {
        const speaker = speakers.find(
          (speaker) => speaker.id === item.speaker_id
        );

        if (!speaker) {
          return {
            ...item,
            user: {
              name: "Unknown",
            },
          };
        }

        return {
          ...item,
          user: {
            name: speaker.name,
          },
        };
      });
    });
    // Format transcript for better summarization with relative timestamps
    const formattedTranscript = transcriptWithSpeakers
      .map((item, index) => {
        try {
          // Handle different timestamp formats
          let startTimeMs, meetingStartTimeMs;
          
          // Check if timestamp is already in milliseconds (number) or needs parsing
          if (typeof item.start_ts === 'number') {
            startTimeMs = item.start_ts;
            meetingStartTimeMs = new Date(transcriptWithSpeakers[0].start_ts).getTime();
          } else {
            // Try parsing as date string
            startTimeMs = new Date(item.start_ts).getTime();
            meetingStartTimeMs = new Date(transcriptWithSpeakers[0].start_ts).getTime();
          }
          
          const relativeSeconds = Math.floor((startTimeMs - meetingStartTimeMs) / 1000);
          
          // Ensure we don't have negative times
          const adjustedSeconds = Math.max(0, relativeSeconds);
          
          // Format as MM:SS or HH:MM:SS
          const minutes = Math.floor(adjustedSeconds / 60);
          const seconds = adjustedSeconds % 60;
          const hours = Math.floor(minutes / 60);
          const displayMinutes = minutes % 60;
          
          let timeDisplay;
          if (hours > 0) {
            timeDisplay = `${hours.toString().padStart(2, '0')}:${displayMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          } else {
            timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }
          
          return `[${timeDisplay}] ${item.user.name}: ${item.text}`;
        } catch (error) {
          console.error(`Error formatting timestamp for item ${index}:`, error);
          // Fallback to index-based timing
          return `[${index}] ${item.user.name}: ${item.text}`;
        }
      })
      .join('\n');

    const { output } = await summarize.run(
      `Please summarize this meeting transcript. The meeting duration and content should be based ONLY on the actual transcript provided below:\n\n${formattedTranscript}`
    );

    await step.run("save-summary", async () => {
      const summaryContent = (output[0] as TextMessage).content as string;
      console.log(`Generated summary for meeting ${event.data.meetingId}`);
      
      const [updatedMeeting] = await db
        .update(meetings)
        .set({
          summary: summaryContent,
          status: "completed",
        })
        .where(eq(meetings.id, event.data.meetingId))
        .returning();
        
      if (!updatedMeeting) {
        throw new Error(`Failed to update meeting ${event.data.meetingId}`);
      }
      
      console.log(`Meeting ${event.data.meetingId} marked as completed`);
    });
  }
);
