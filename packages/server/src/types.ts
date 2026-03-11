import type { FastifyReply, FastifyRequest } from 'fastify';
import { Store, Orchestrator } from '@patchbay/core';

export interface CreateServerOptions {
    repoRoot: string;
    port?: number;
    host?: string;
}

export interface StateResponse {
    project: ReturnType<Store['getProject']>;
    tasks: ReturnType<Store['listTasks']>;
    runs: ReturnType<Store['listRuns']>;
    decisions: ReturnType<Store['listDecisions']>;
}

export type RouteHandler<TReply = unknown> = (
    request: FastifyRequest,
    reply: FastifyReply
) => Promise<TReply> | TReply;

declare module 'fastify' {
    interface FastifyInstance {
        repoRoot: string;
        store: Store;
        orchestrator: Orchestrator;
    }
}
