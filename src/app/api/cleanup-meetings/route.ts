import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meetings } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";

// This endpoint can be called periodically to clean up stuck meetings
// You can set up a cron job or use Vercel Cron to call this endpoint

export async function POST(req: NextRequest) {
  try {
    console.log("Starting meeting cleanup process");
    
    // Find meetings stuck in "active" state for more than 10 minutes
    const stuckActiveMeetings = await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.status, "active"),
          lt(meetings.startedAt, new Date(Date.now() - 10 * 60 * 1000)) // 10 minutes ago
        )
      );

    console.log(`Found ${stuckActiveMeetings.length} stuck active meetings`);

    // Update stuck active meetings to processing
    for (const meeting of stuckActiveMeetings) {
      console.log(`Cleaning up stuck meeting: ${meeting.id}`);
      await db
        .update(meetings)
        .set({ 
          status: "processing", 
          endedAt: new Date() 
        })
        .where(eq(meetings.id, meeting.id));
    }

    // Find meetings stuck in "processing" state for more than 30 minutes
    const stuckProcessingMeetings = await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.status, "processing"),
          lt(meetings.endedAt, new Date(Date.now() - 30 * 60 * 1000)) // 30 minutes ago
        )
      );

    console.log(`Found ${stuckProcessingMeetings.length} stuck processing meetings`);

    // Update stuck processing meetings to completed with error message
    for (const meeting of stuckProcessingMeetings) {
      console.log(`Force completing stuck meeting: ${meeting.id}`);
      await db
        .update(meetings)
        .set({ 
          status: "completed",
          summary: "Meeting processing timed out. Transcript may not be available."
        })
        .where(eq(meetings.id, meeting.id));
    }

    const totalCleaned = stuckActiveMeetings.length + stuckProcessingMeetings.length;
    
    return NextResponse.json({ 
      success: true, 
      cleaned: totalCleaned,
      activeFixed: stuckActiveMeetings.length,
      processingFixed: stuckProcessingMeetings.length
    });

  } catch (error) {
    console.error("Error during meeting cleanup:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}

// GET endpoint for manual testing
export async function GET() {
  return NextResponse.json({ 
    message: "Meeting cleanup endpoint. Use POST to run cleanup." 
  });
}