import { and, eq } from "drizzle-orm";
import OpenAi from "openai";
import { NextRequest, NextResponse } from "next/server";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { generateAvatarUri } from "@/lib/avatar";
import { streamChat } from "@/lib/stream-chat";

const openaiClient = new OpenAi({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature");
  
  if (!signature) {
    return NextResponse.json(
      { message: "Missing signature" },
      { status: 400 }
    );
  }

  const body = await req.text();

  // For now, skip signature verification for Stream Chat
  // You might need to implement proper Stream Chat signature verification
  console.log("Stream Chat webhook received");

  let payload: unknown;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const eventType = (payload as { type: string })?.type;
  
  console.log(`Received Stream Chat webhook event: ${eventType}`);

  if (eventType === "message.new") {
    const event = payload as any; // Using any for now since we don't have Stream Chat types

    const userId = event.user?.id;
    const channelId = event.channel_id;
    const text = event.message?.text;

    console.log(`New message from user ${userId} in channel ${channelId}: ${text}`);

    if (!userId || !channelId || !text) {
      console.log("Missing required fields for message.new event");
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
        console.error("Error processing message.new event:", error);
        return NextResponse.json(
          { error: "Failed to process message" },
          { status: 500 }
        );
      }
    } else {
      console.log("Message from agent itself, skipping response");
    }
  } else {
    console.log(`Unhandled Stream Chat event type: ${eventType}`);
  }

  return NextResponse.json({ status: "ok" });
}