import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "@/tRPC/init";

import { z } from "zod";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  sql,
} from "drizzle-orm";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constant";
import { TRPCError } from "@trpc/server";
import {
  meetingsInsertSchema,
  meetingsUpdateSchema,
} from "@/modules/meetings/schemas";
import { agents, meetings, user } from "@/db/schema";
import { MeetingStatus, StreamTranscriptItem } from "../types";
import { generateAvatarUri } from "@/lib/avatar";
import { streamVideo } from "@/lib/stream.video";
import JSONL from "jsonl-parse-stringify";
import { streamChat } from "@/lib/stream-chat";

export const meetingsRouter = createTRPCRouter({
 generateChatToken: protectedProcedure.mutation(async ({ ctx }) => {
  const token = streamChat.createToken(ctx.auth.user.id);

  await streamChat.upsertUser({
    id: ctx.auth.user.id,
    role: "admin",
  });

  return token;
}),


getTranscript: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input, ctx }) => {
    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(
        and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id))
      );

    if (!existingMeeting) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Meeting not found",
      });
    }

    if (!existingMeeting.transcriptUrl) {
      return [];
    }

    // Fetch transcript from storage
    const transcript = await fetch(existingMeeting.transcriptUrl)
      .then((res) => res.text())
      .then((text) => JSONL.parse<StreamTranscriptItem>(text))
      .catch(() => {
        return [];
      });

    const speakerIds = [
      ...new Set(transcript.map((item) => item.speaker_id)),
    ];

    // Fetch speakers from user table
    const userSpeakers = await db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
      })
      .from(user)
      .where(inArray(user.id, speakerIds))
      .then((users) =>
        users.map((u) => ({
          id: u.id,
          name: u.name,
          image:
            u.image ??
            generateAvatarUri({ seed: u.name ?? "Unknown", variant: "initials" }),
        }))
      );

    // Fetch speakers from agents table (no image column here)
    const agentSpeakers = await db
      .select({
        id: agents.id,
        name: agents.name,
      })
      .from(agents)
      .where(inArray(agents.id, speakerIds))
      .then((ags) =>
        ags.map((a) => ({
          id: a.id,
          name: a.name,
          image: generateAvatarUri({
            seed: a.name ?? "Unknown",
            variant: "initials",
          }),
        }))
      );

    const speakers = [...userSpeakers, ...agentSpeakers];

    // Attach speaker info to transcript items
    const transcriptWithSpeakers = transcript.map((item) => {
      const speaker = speakers.find((s) => s.id === item.speaker_id);

      return {
        ...item,
        user: speaker ?? {
          name: "Unknown",
          image: generateAvatarUri({ seed: "Unknown", variant: "initials" }),
        },
      };
    });

    return transcriptWithSpeakers;
  }),







  // ✅ Generate Token
  generateToken: protectedProcedure.mutation(async ({ ctx }) => {
    await streamVideo.upsertUsers([
      {
        id: ctx.auth.user.id,
        name: ctx.auth.user.name,
        role: "admin",
        image:
          ctx.auth.user.image ??
          generateAvatarUri({ seed: ctx.auth.user.name, variant: "initials" }),
      },
    ]);

    const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    const issuedAt = Math.floor(Date.now() / 1000); // now

    const token = streamVideo.generateUserToken({
      user_id: ctx.auth.user.id,
      exp: expirationTime,
      validity_in_seconds: issuedAt,
    });

    return token;
  }),

  // ✅ Remove Meeting
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [removedMeeting] = await db
        .delete(meetings)
        .where(
          and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id))
        )
        .returning();

      if (!removedMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      return removedMeeting;
    }),

  // ✅ Create Meeting
  create: protectedProcedure
    .input(meetingsInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const [createdMeeting] = await db
        .insert(meetings)
        .values({
          ...input,
          userId: ctx.auth.user.id,
        })
        .returning();

      const call = streamVideo.video.call("default", createdMeeting.id);

      await call.create({
        data: {
          created_by_id: ctx.auth.user.id,
          custom: {
            meetingId: createdMeeting.id,
            meetingName: createdMeeting.name,
          },

          settings_override: {
            transcription: {
              language: "en",
              mode: "auto-on",
              closed_caption_mode: "auto-on",
            },
            recording: {
              mode: "auto-on",
              quality: "1080p",
            },
          },
        },
      });

      const [existingAgent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, createdMeeting.agentId));

      if (!existingAgent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }

      await streamVideo.upsertUsers([
        {
          id: existingAgent.id,
          name: existingAgent.name,
          role: "user",
          image: generateAvatarUri({
            seed: existingAgent.name,
            variant: "botttsNeutral",
          }),
        },
      ]);

      return createdMeeting;
    }),

  // ✅ Update Meeting
  update: protectedProcedure
    .input(meetingsUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const [updatedMeeting] = await db
        .update(meetings)
        .set(input)
        .where(
          and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id))
        )
        .returning();

      if (!updatedMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      return updatedMeeting;
    }),

  // ✅ Get One Meeting
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingMeeting] = await db
        .select({
          ...getTableColumns(meetings),
          agent: agents,
          duration:
            sql<number>`EXTRACT(EPOCH FROM (${meetings.endedAt} - ${meetings.startedAt}))`.as(
              "duration"
            ),
        })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id))
        );

      if (!existingMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      return existingMeeting;
    }),

  // ✅ Get Many Meetings
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
        agentId: z.string().nullish(),
        status: z
          .enum([
            MeetingStatus.Upcoming,
            MeetingStatus.Active,
            MeetingStatus.Completed,
            MeetingStatus.Processing,
            MeetingStatus.Cancelled,
          ])
          .nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, page, pageSize, status, agentId } = input;

      const data = await db
        .select({
          ...getTableColumns(meetings),
          agent: agents,
          duration:
            sql<number>`EXTRACT(EPOCH FROM (${meetings.endedAt} - ${meetings.startedAt}))`.as(
              "duration"
            ),
        })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),
            search ? ilike(meetings.name, `%${search}%`) : undefined,
            status ? eq(meetings.status, status) : undefined,
            agentId ? eq(meetings.agentId, agentId) : undefined
          )
        )
        .orderBy(desc(meetings.createdAt), desc(meetings.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({ count: count() })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),
            search ? ilike(meetings.name, `%${search}%`) : undefined,
            status ? eq(meetings.status, status) : undefined,
            agentId ? eq(meetings.agentId, agentId) : undefined
          )
        );

      const totalPages = Math.ceil(total.count / pageSize);

      return {
        items: data,
        total: total.count,
        totalPages,
      };
    }),
});
