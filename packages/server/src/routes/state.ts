import { FastifyInstance } from 'fastify';
import { getState } from '../handlers/state';

export async function registerStateRoutes(fastify: FastifyInstance) {
    fastify.get('/state', async (_request, reply) => {
        if (!fastify.store.isInitialized) {
            reply.code(404);
            return { error: 'Patchbay not initialized' };
        }

        return getState(fastify.store);
    });
}
