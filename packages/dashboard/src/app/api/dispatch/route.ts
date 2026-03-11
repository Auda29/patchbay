import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { Orchestrator, loadConfig } from '@patchbay/core';
import { BashRunner } from '@patchbay/runner-bash';
import { HttpRunner } from '@patchbay/runner-http';
import { CursorRunner } from '@patchbay/runner-cursor';
import { ClaudeCodeRunner } from '@patchbay/runner-claude-code';
import { CursorCliRunner } from '@patchbay/runner-cursor-cli';
import { CodexRunner } from '@patchbay/runner-codex';
import { GeminiRunner } from '@patchbay/runner-gemini';

function createOrchestrator(): Orchestrator {
    const cfg = loadConfig();
    const r = cfg.runners;
    const orchestrator = new Orchestrator();
    orchestrator.registerRunner('bash', new BashRunner());
    orchestrator.registerRunner('http', new HttpRunner());
    orchestrator.registerRunner('cursor', new CursorRunner());
    orchestrator.registerRunner('cursor-cli', new CursorCliRunner(r['cursor-cli']));
    orchestrator.registerRunner('claude-code', new ClaudeCodeRunner(r['claude-code']));
    orchestrator.registerRunner('codex', new CodexRunner(r['codex']));
    orchestrator.registerRunner('gemini', new GeminiRunner(r['gemini']));
    return orchestrator;
}

export async function POST(request: Request) {
    try {
        const store = getStore();
        if (!store.isInitialized) {
            return NextResponse.json({ error: 'Patchbay not initialized' }, { status: 404 });
        }

        const { taskId, runnerId } = await request.json();
        if (!taskId || !runnerId) {
            return NextResponse.json({ error: 'Missing taskId or runnerId' }, { status: 400 });
        }

        const orchestrator = createOrchestrator();
        const run = await orchestrator.dispatchTask(taskId, runnerId);
        return NextResponse.json(run);
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Internal error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
