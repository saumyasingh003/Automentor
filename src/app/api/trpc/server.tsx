import 'server-only'; // <-- ensure this file cannot be imported from the client
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { cache } from 'react';

import { makeQueryClient } from './query-client';
import { appRouter } from '@/tRPC/routers/_app';
import { createTRPCContext } from '@/tRPC/init';

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

// ...
export const caller = appRouter.createCaller(createTRPCContext);
