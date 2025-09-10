import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { agentsRouter } from '@/modules/agents/server/procedure';
import { meetingsRouter } from '@/modules/meetings/server/procedure';
import { userRouter } from '@/modules/user/server/procedure';
export const appRouter = createTRPCRouter({
  agents : agentsRouter ,
  meetings : meetingsRouter,
  user: userRouter
});
// export type definition of API
export type AppRouter = typeof appRouter;