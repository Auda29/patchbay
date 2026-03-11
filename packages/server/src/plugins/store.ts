import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { Store } from '@patchbay/core';
import { createConfiguredOrchestrator } from '../runtime';

async function storePlugin(fastify: FastifyInstance) {
    const store = new Store(fastify.repoRoot);
    fastify.decorate('store', store);
    fastify.decorate('orchestrator', createConfiguredOrchestrator(fastify.repoRoot));
}

export default fp(storePlugin, {
    name: 'patchbay-store'
});
