import { AppRouter } from "@/tRPC/routers/_app";
import { inferRouterOutputs } from "@trpc/server";



export type AgentGetOne = inferRouterOutputs<AppRouter>["agents"]["getOne"];
