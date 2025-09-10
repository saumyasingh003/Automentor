import { and, eq, not, desc } from "drizzle-orm";
import OpenAi from "openai";
import { NextRequest, NextResponse } from "next/server";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

import {
  MessageNewEvent,
  CallEndedEvent,
  CallSessionParticipantLeftEvent,
  CallSessionStartedEvent,
  CallRecordingReadyEvent,
  CallTranscriptionReadyEvent,
} from "@stream-io/node-sdk";

import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { streamVideo } from "@/lib/stream.video";
import { inngest } from "@/app/inngest/client";
import { generateAvatarUri } from "@/lib/avatar";
import { streamChat } from "@/lib/stream-chat";

const openaiClient = new OpenAi({ apiKey: process.env.OPENAI_API_KEY! });

function verifySignatureWithSDK(body: string, signature: string): boolean {
  // For Stream Video events
  return streamVideo.verifyWebhook(body, signature);
}



export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature");
  const apiKey = req.headers.get("x-api-key");

  if (!signature || !apiKey) {
    return NextResponse.json(
      { message: "Missing signature or apikey!!" },
      { status: 400 }
    );
  }

  const body = await req.text();

  // For now, let's use the original Stream Video verification for all events
  // This should work for call.* events which are the main ones we need
  if (!verifySignatureWithSDK(body, signature)) {
    console.log("Signature verification failed");
    return NextResponse.json({ message: "Invalid Signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const eventType = (payload as { type: string })?.type;
  
  console.log(`Received webhook event: ${eventType}`);

  if (eventType === "call.session_started") {
    console.log("Processing call.session_started event");
    const event = payload as CallSessionStartedEvent;
    const meetingId = event.call.custom?.meetingId;

    console.log(`Meeting ID from event: ${meetingId}`);

    if (!meetingId) {
      console.log("Missing meetingId in custom field");
      return NextResponse.json(
        { message: "Missing meetingId in custom field" },
        { status: 400 }
      );
    }

    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.id, meetingId),
          not(eq(meetings.status, "completed")),
          not(eq(meetings.status, "active")),
          not(eq(meetings.status, "cancelled")),
          not(eq(meetings.status, "processing"))
        )
      );

    if (!existingMeeting) {
      console.log(`Meeting not found for ID: ${meetingId}`);
      return NextResponse.json(
        { message: "Meeting not found" },
        { status: 404 }
      );
    }

    console.log(`Found meeting: ${existingMeeting.id}, current status: ${existingMeeting.status}`);

    await db
      .update(meetings)
      .set({ status: "active", startedAt: new Date() })
      .where(eq(meetings.id, existingMeeting.id));

    console.log(`Meeting ${meetingId} status updated to active`);

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, existingMeeting.agentId));

    if (!existingAgent) {
      console.log(`Agent not found: ${existingMeeting.agentId}`);
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    console.log(`Found agent: ${existingAgent.id} (${existingAgent.name})`);

    try {
      const call = streamVideo.video.call("default", meetingId);
      console.log(`Connecting OpenAI agent to call: ${meetingId}`);
      
      const realtimeClient = await streamVideo.video.connectOpenAi({
        call,
        openAiApiKey: process.env.OPENAI_API_KEY!,
        agentUserId: existingAgent.id,
      });

      console.log(`OpenAI agent connected successfully`);

      realtimeClient.updateSession({
        instructions: existingAgent.instructions,
      });

      console.log(`Agent instructions updated`);
    } catch (error) {
      console.error(`Error connecting OpenAI agent:`, error);
      return NextResponse.json(
        { message: "Failed to connect agent to call" },
        { status: 500 }
      );
    }
  } else if (eventType === "call.session_participant_left") {
    const event = payload as CallSessionParticipantLeftEvent;
    // Extract the call ID from call_cid, then get the custom meetingId
    const callId = event.call_cid.split(":")[1];
    
    console.log(`Processing participant_left for call: ${callId}`);
    
    // We need to get the custom meetingId from the call
    const call = streamVideo.video.call("default", callId);
    let meetingId: string | undefined;
    
    try {
      const callState = await call.get();
      meetingId = callState.call.custom?.meetingId;
      console.log(`Call state for ${callId}:`, {
        callId: callState.call.id,
        custom: callState.call.custom,
        extractedMeetingId: meetingId
      });
    } catch (error) {
      console.error(`Error getting call state for ${callId}:`, error);
    }

    if (!meetingId) {
      console.log(`Missing meetingId in custom field for call ${callId}`);
      
      // Fallback: try to find an active meeting that might correspond to this call
      console.log(`Attempting fallback: looking for active meetings`);
      const activeMeetings = await db
        .select()
        .from(meetings)
        .where(eq(meetings.status, "active"))
        .orderBy(desc(meetings.startedAt));
        
      console.log(`Found ${activeMeetings.length} active meetings:`, activeMeetings.map(m => ({ id: m.id, name: m.name, startedAt: m.startedAt })));
      
      if (activeMeetings.length === 1) {
        meetingId = activeMeetings[0].id;
        console.log(`Using fallback meetingId: ${meetingId}`);
      } else {
        return NextResponse.json(
          { message: "Missing meetingId in custom field and cannot determine from active meetings" },
          { status: 400 }
        );
      }
    }
    
    console.log(`Participant left meeting: ${meetingId} (call: ${callId})`);
    
    // Check if this meeting is actually active before processing
    const [currentMeeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId));
      
    if (!currentMeeting) {
      console.log(`Meeting ${meetingId} not found in database`);
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
    }
    
    console.log(`Current meeting ${meetingId} status: ${currentMeeting.status}`);
    
    if (currentMeeting.status !== "active") {
      console.log(`Meeting ${meetingId} is not active (status: ${currentMeeting.status}), skipping participant_left processing`);
      return NextResponse.json({ status: "ok" });
    }
    
    try {
      // Get fresh call state to check participants
      const freshCallState = await call.get();
      
      // Only end the call if there are no more human participants
      // Filter out agents (which have IDs from the agents table)
      const allParticipants = freshCallState.call.session?.participants || [];
      console.log(`All participants:`, allParticipants.map(p => ({ id: p.user?.id, name: p.user?.name })));
      
      // Get all agent IDs from database to properly filter them out
      const allAgents = await db.select({ id: agents.id }).from(agents);
      const agentIds = new Set(allAgents.map(a => a.id));
      
      const humanParticipants = allParticipants.filter(p => {
        const userId = p.user?.id;
        const isAgent = userId && agentIds.has(userId);
        console.log(`Participant ${userId} (${p.user?.name}): isAgent=${isAgent}`);
        return !isAgent;
      });
      
      console.log(`Human participants remaining: ${humanParticipants.length}`);
      
      // Alternative approach: Check if the meeting creator left
      const meetingCreatorId = currentMeeting.userId;
      const participantWhoLeft = (payload as any).participant?.user?.id;
      
      console.log(`Meeting creator: ${meetingCreatorId}, Participant who left: ${participantWhoLeft}`);
      
      // End the call if either:
      // 1. No human participants left, OR
      // 2. The meeting creator left (more reliable indicator)
      const shouldEndCall = humanParticipants.length === 0 || participantWhoLeft === meetingCreatorId;
      
      if (shouldEndCall) {
        console.log(`Ending call ${callId} for meeting ${meetingId} - reason: ${humanParticipants.length === 0 ? 'no human participants' : 'creator left'}`);
        await call.end();
        
        // Also update meeting status directly since call.ended might not fire
        console.log(`Updating meeting ${meetingId} status to processing`);
        const [updatedMeeting] = await db
          .update(meetings)
          .set({ status: "processing", endedAt: new Date() })
          .where(and(eq(meetings.id, meetingId), eq(meetings.status, "active")))
          .returning();
          
        if (updatedMeeting) {
          console.log(`Meeting ${meetingId} status updated to processing via participant_left`);
        } else {
          console.log(`Failed to update meeting ${meetingId} - might not be in active state`);
        }
      } else {
        console.log(`Not ending call - human participants: ${humanParticipants.length}, creator left: ${participantWhoLeft === meetingCreatorId}`);
      }
    } catch (error) {
      console.error(`Error handling participant left for meeting ${meetingId}:`, error);
    }
  } else if (eventType === "call.ended") {
    const event = payload as CallEndedEvent;
    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
      console.log("Missing meetingId in call.ended event");
      return NextResponse.json(
        { message: "Missing meetingId " },
        { status: 400 }
      );
    }
    
    console.log(`Call ended for meeting: ${meetingId}`);
    
    // Update meeting status to processing when call ends
    const [updatedMeeting] = await db
      .update(meetings)
      .set({ status: "processing", endedAt: new Date() })
      .where(and(eq(meetings.id, meetingId), eq(meetings.status, "active")))
      .returning();
      
    if (updatedMeeting) {
      console.log(`Meeting ${meetingId} status updated to processing`);
    } else {
      console.log(`Failed to update meeting ${meetingId} - meeting might not be in active state`);
      // Check current status
      const [currentMeeting] = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, meetingId));
      if (currentMeeting) {
        console.log(`Current meeting status: ${currentMeeting.status}`);
      }
    }
  } else if (eventType === "call.transcription_ready") {
    const event = payload as CallTranscriptionReadyEvent;
    // Extract the call ID from call_cid, then get the custom meetingId
    const callId = event.call_cid.split(":")[1];
    
    console.log(`Processing transcription_ready for call: ${callId}`);
    
    // We need to get the custom meetingId from the call
    const call = streamVideo.video.call("default", callId);
    let meetingId: string | undefined;
    
    try {
      const callState = await call.get();
      meetingId = callState.call.custom?.meetingId;
      console.log(`Call state for ${callId}:`, {
        callId: callState.call.id,
        custom: callState.call.custom,
        extractedMeetingId: meetingId
      });
    } catch (error) {
      console.error(`Error getting call state for ${callId}:`, error);
    }

    if (!meetingId) {
      console.log(`Missing meetingId in custom field for call ${callId}`);
      
      // Fallback: try to find a processing meeting that might correspond to this call
      console.log(`Attempting fallback: looking for processing meetings`);
      const processingMeetings = await db
        .select()
        .from(meetings)
        .where(eq(meetings.status, "processing"))
        .orderBy(desc(meetings.endedAt));
        
      console.log(`Found ${processingMeetings.length} processing meetings:`, processingMeetings.map(m => ({ id: m.id, name: m.name, endedAt: m.endedAt })));
      
      if (processingMeetings.length === 1) {
        meetingId = processingMeetings[0].id;
        console.log(`Using fallback meetingId: ${meetingId}`);
      } else {
        return NextResponse.json(
          { message: "Missing meetingId in custom field and cannot determine from processing meetings" },
          { status: 400 }
        );
      }
    }
    
    console.log(`Transcription ready for meeting: ${meetingId} (call: ${callId})`);
    
    // First, check current meeting status
    const [currentMeeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId));
      
    if (!currentMeeting) {
      return NextResponse.json(
        { message: "Meeting not found" },
        { status: 404 }
      );
    }
    
    console.log(`Current meeting status: ${currentMeeting.status}`);
    
    // If meeting is still active, update it to processing first
    if (currentMeeting.status === "active") {
      console.log(`Meeting ${meetingId} still active, updating to processing`);
      await db
        .update(meetings)
        .set({ status: "processing", endedAt: new Date() })
        .where(eq(meetings.id, meetingId));
    }
    
    const [updatedMeeting] = await db
      .update(meetings)
      .set({
        transcriptUrl: event.call_transcription.url,
      })
      .where(eq(meetings.id, meetingId))
      .returning();

    if (!updatedMeeting) {
      return NextResponse.json(
        { message: "Meeting not found" },
        { status: 404 }
      );
    }

    console.log(`Triggering processing for meeting: ${meetingId}`);
    
    await inngest.send({
      name: "meetings/processing",
      data: {
        meetingId: updatedMeeting.id,
        transcriptUrl: updatedMeeting.transcriptUrl,
      },
    });
  } else if (eventType === "call.recording_ready") {
    const event = payload as CallRecordingReadyEvent;
    // Extract the call ID from call_cid, then get the custom meetingId
    const callId = event.call_cid.split(":")[1];
    
    // We need to get the custom meetingId from the call
    const call = streamVideo.video.call("default", callId);
    let meetingId: string | undefined;
    
    try {
      const callState = await call.get();
      meetingId = callState.call.custom?.meetingId;
    } catch (error) {
      console.error(`Error getting call state for ${callId}:`, error);
    }
    if (!meetingId) {
      console.log(`Missing meetingId in custom field for call ${callId}`);
      return NextResponse.json(
        { message: "Missing meetingId in custom field" },
        { status: 400 }
      );
    }
    
    console.log(`Recording ready for meeting: ${meetingId} (call: ${callId})`);
    
    await db
      .update(meetings)
      .set({
        recordingUrl: event.call_recording.url,
      })
      .where(eq(meetings.id, meetingId));
  } else if (eventType === "message.new") {
    const event = payload as MessageNewEvent;

    const userId = event.user?.id;
    const channelId = event.channel_id;
    const text = event.message?.text;

    console.log(`New message from user ${userId} in channel ${channelId}: ${text}`);

    if (!userId || !channelId || !text) {
      console.log("Missing required fields for message_new event");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.id, channelId), eq(meetings.status, "completed")));

    if (!existingMeeting) {
      console.log(`Meeting not found or not completed for channel: ${channelId}`);
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, existingMeeting.agentId));

    if (!existingAgent) {
      console.log(`Agent not found: ${existingMeeting.agentId}`);
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Only respond if the message is not from the agent itself
    if (userId !== existingAgent.id) {
      console.log(`Processing message for agent response`);
      
      // Check if meeting has a summary
      if (!existingMeeting.summary || existingMeeting.summary.trim() === '') {
        console.log(`Meeting ${channelId} has no summary yet`);
        return NextResponse.json(
          { error: "Meeting summary not available yet. Please wait for processing to complete." },
          { status: 400 }
        );
      }
      
      try {
      const instructions = `
      You are an AI assistant helping the user revisit a recently completed meeting.
      Below is a summary of the meeting, generated from the transcript:
      
      ${existingMeeting.summary}
      
      The following are your original instructions from the live meeting assistant. Please continue to follow these behavioral guidelines as you assist the user:
      
      ${existingAgent.instructions}
      
      The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
      Always base your responses on the meeting summary above.
      
      You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.
      
      If the summary does not contain enough information to answer a question, politely let the user know.
      
      Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.
      `;

        // Fix the channel type - should be "messaging" not "messageing"
        const channel = streamChat.channel("messaging", channelId);
        
        try {
          await channel.watch();
          console.log(`Channel watched successfully: ${channelId}`);
        } catch (watchError) {
          console.error(`Failed to watch channel ${channelId}:`, watchError);
          throw new Error(`Channel watch failed: ${watchError}`);
        }

        console.log(`Channel watched, fetching message history`);

        const previousMessages = channel.state.messages
          .slice(-5)
          .filter((msg) => msg.text && msg.text.trim() !== "")
          .map<ChatCompletionMessageParam>((message) => ({
            role: message.user?.id === existingAgent.id ? "assistant" : "user",
            content: message.text || "",
          }));

        console.log(`Found ${previousMessages.length} previous messages`);

        const GPTResponse = await openaiClient.chat.completions.create({
          messages: [
            { role: "system", content: instructions },
            ...previousMessages,
            { role: "user", content: text },
          ],
          model: "gpt-4o",
        });

        const GPTResponseText = GPTResponse.choices[0].message.content;

        if (!GPTResponseText) {
          console.log("No response from GPT");
          return NextResponse.json(
            { error: "No response from GPT" },
            { status: 400 }
          );
        }

        console.log(`Generated response: ${GPTResponseText.substring(0, 100)}...`);

        const avatarUrl = generateAvatarUri({
          seed: existingAgent.name,
          variant: "botttsNeutral",
        });

        const messageResponse = await channel.sendMessage({
          text: GPTResponseText,
          user: {
            id: existingAgent.id,
            name: existingAgent.name,
            image: avatarUrl,
          },
        });

        console.log(`Message sent successfully: ${messageResponse.message?.id}`);
        
      } catch (error) {
        console.error("Error processing message_new event:", error);
        return NextResponse.json(
          { error: "Failed to process message" },
          { status: 500 }
        );
      }
    } else {
      console.log("Message from agent itself, skipping response");
    }
  } else if (eventType === "message.read") {
    // Sometimes Stream sends message.read instead of message.new
    // Let's log this and ignore it for now
    console.log("Received message.read event - this is not the event we need for Ask AI");
    console.log("We need message.new events. Check your Stream Chat webhook configuration.");
  } else if (eventType === "call.transcription_stopped" || 
             eventType === "call.recording_stopped" || 
             eventType === "call.closed_captions_stopped" ||
             eventType === "call.stats_report_ready") {
    // These are informational events we don't need to handle
    console.log(`Received informational event: ${eventType}`);
  } else {
    // Log any unhandled events to help debug
    console.log(`Unhandled webhook event type: ${eventType}`);
    if (eventType && eventType.startsWith('call.')) {
      console.log("This is a call event we might need to handle");
      // Only log payload for truly unknown events to reduce noise
      if (!eventType.includes('stopped') && !eventType.includes('ready')) {
        console.log("Event payload:", JSON.stringify(payload, null, 2));
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}