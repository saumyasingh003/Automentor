import { createTRPCContext } from '@/tRPC/init';
import { appRouter } from '@/tRPC/routers/_app';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';


const handler = async (req: Request) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext(),
  });
};

export { handler as GET, handler as POST };
