import type { CreateServerOptions } from './types';

export async function createServer(opts: CreateServerOptions) {
    const [{ default: Fastify }, { default: cors }, { default: sse }, { default: storePlugin }, { registerStateRoutes }] =
        await Promise.all([
            import('fastify'),
            import('@fastify/cors'),
            import('@fastify/sse'),
            import('./plugins/store'),
            import('./routes/state')
        ]);

    const server = Fastify({
        logger: false
    });

    server.decorate('repoRoot', opts.repoRoot);

    await server.register(cors, {
        origin: true
    });
    await server.register(sse);
    await server.register(storePlugin);
    await registerStateRoutes(server);

    server.get('/health', async () => ({ ok: true }));

    return server;
}
