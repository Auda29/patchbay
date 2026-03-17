import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { Orchestrator } from './orchestrator';
import { Store } from './store';
import type { Runner, RunnerInput, RunnerOutput } from './runner';

const makeCompletedRunner = (): Runner => ({
    name: 'mock',
    execute: async (_input: RunnerInput): Promise<RunnerOutput> => ({
        status: 'completed',
        summary: 'All done',
        logs: ['step 1', 'step 2'],
    }),
});

const makeBlockedRunner = (): Runner => ({
    name: 'blocker',
    execute: async (_input: RunnerInput): Promise<RunnerOutput> => ({
        status: 'blocked',
        summary: 'Need more info',
        logs: [],
        blockers: ['Missing API key'],
    }),
});

const makeFailedRunner = (): Runner => ({
    name: 'failer',
    execute: async (_input: RunnerInput): Promise<RunnerOutput> => ({
        status: 'failed',
        summary: 'Something went wrong',
        logs: ['error: unexpected EOF'],
    }),
});

describe('Orchestrator', () => {
    let tmpDir: string;
    let store: Store;
    let orchestrator: Orchestrator;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'patchbay-orch-test-'));
        store = new Store(tmpDir);
        store.init({ name: 'Test Project', goal: 'Test' });
        orchestrator = new Orchestrator(tmpDir);
        orchestrator.registerRunner('mock', makeCompletedRunner());
        orchestrator.registerRunner('blocker', makeBlockedRunner());
        orchestrator.registerRunner('failer', makeFailedRunner());
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('dispatches a task and returns a run', async () => {
        const task = store.createTask('Do something', 'Achieve the goal');
        const run = await orchestrator.dispatchTask(task.id, 'mock');
        expect(run.taskId).toBe(task.id);
        expect(run.runner).toBe('mock');
        expect(run.status).toBe('completed');
    });

    it('transitions task to review after completed run', async () => {
        const task = store.createTask('Do something', 'Goal');
        await orchestrator.dispatchTask(task.id, 'mock');
        expect(store.getTask(task.id)?.status).toBe('review');
    });

    it('transitions task to blocked when runner returns blocked', async () => {
        const task = store.createTask('Blocked task', 'Goal');
        await orchestrator.dispatchTask(task.id, 'blocker');
        expect(store.getTask(task.id)?.status).toBe('blocked');
    });

    it('run status is completed when runner returns blocked (run finished, task is blocked)', async () => {
        const task = store.createTask('Blocked task', 'Goal');
        const run = await orchestrator.dispatchTask(task.id, 'blocker');
        expect(run.status).toBe('completed');
        expect(run.blockers).toContain('Missing API key');
    });

    it('transitions task back to open when runner fails', async () => {
        const task = store.createTask('Failing task', 'Goal');
        await orchestrator.dispatchTask(task.id, 'failer');
        expect(store.getTask(task.id)?.status).toBe('open');
    });

    it('persists run logs and summary', async () => {
        const task = store.createTask('Task', 'Goal');
        const run = await orchestrator.dispatchTask(task.id, 'mock');
        expect(run.logs).toContain('step 1');
        expect(run.summary).toBe('All done');
    });

    it('throws if task does not exist', async () => {
        await expect(orchestrator.dispatchTask('TASK-NOPE', 'mock')).rejects.toThrow('not found');
    });

    it('throws if runner is not registered', async () => {
        const task = store.createTask('Task', 'Goal');
        await expect(orchestrator.dispatchTask(task.id, 'unknown-runner')).rejects.toThrow('not registered');
    });

    it('throws if task status is not open or blocked', async () => {
        const task = store.createTask('Task', 'Goal');
        const doneTask = { ...task, status: 'done' as const };
        store.saveTask(doneTask);
        await expect(orchestrator.dispatchTask(task.id, 'mock')).rejects.toThrow('status');
    });
});
