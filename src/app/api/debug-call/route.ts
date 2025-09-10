import { NextRequest, NextResponse } from "next/server";
import { streamVideo } from "@/lib/stream.video";

// Debug endpoint to test call state retrieval
// Usage: GET /api/debug-call?callId=your-call-id

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const callId = searchParams.get('callId');

  if (!callId) {
    return NextResponse.json(
      { error: "Missing callId parameter" },
      { status: 400 }
    );
  }

  try {
    console.log(`Debug: Getting call state for ${callId}`);
    
    const call = streamVideo.video.call("default", callId);
    const callState = await call.get();
    
    const result = {
      callId: callState.call.id,
      custom: callState.call.custom,
      created_by: callState.call.created_by,
      created_at: callState.call.created_at,
      settings: callState.call.settings,
      // Add any other relevant fields
    };
    
    console.log(`Debug: Call state result:`, result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error(`Debug: Error getting call state:`, error);
    return NextResponse.json(
      { error: "Failed to get call state", details: error },
      { status: 500 }
    );
  }
}

// POST endpoint to test call creation
export async function POST(req: NextRequest) {
  try {
    const { meetingId, meetingName } = await req.json();
    
    if (!meetingId) {
      return NextResponse.json(
        { error: "Missing meetingId" },
        { status: 400 }
      );
    }
    
    console.log(`Debug: Creating call for meeting ${meetingId}`);
    
    const call = streamVideo.video.call("default", meetingId);
    
    await call.create({
      data: {
        created_by_id: "debug-user",
        custom: {
          meetingId: meetingId,
          meetingName: meetingName || "Debug Meeting",
        },
      },
    });
    
    // Immediately retrieve to verify
    const callState = await call.get();
    
    const result = {
      callId: callState.call.id,
      custom: callState.call.custom,
      created_by: callState.call.created_by,
    };
    
    console.log(`Debug: Created call result:`, result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error(`Debug: Error creating call:`, error);
    return NextResponse.json(
      { error: "Failed to create call", details: error },
      { status: 500 }
    );
  }
}