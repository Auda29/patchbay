export interface ConversationTurn {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface RunnerInput {
    taskId: string;
    repoPath: string;
    branch: string;
    affectedFiles?: string[];
    contextFiles?: string[];
    projectRules?: string;
    goal: string;
    outputFormat?: string;
    /** Conversation thread being continued. */
    conversationId?: string;
    /** Runner-native session ID to resume (e.g. claude --resume <id>). */
    resumeSessionId?: string;
    /** Previous turns for context injection (fallback when native resume is unavailable). */
    previousTurns?: ConversationTurn[];
}

export interface RunnerOutput {
    status: 'completed' | 'failed' | 'blocked' | 'awaiting_input';
    summary: string;
    changedFiles?: string[];
    diffRef?: string;
    logs: string[];
    blockers?: string[];
    suggestedNextSteps?: string[];
    /** Shell command that would install the missing CLI tool (e.g. "npm install -g @anthropic-ai/claude-code"). */
    installHint?: string;
    /** Runner-native session ID for resuming this conversation. */
    sessionId?: string;
    /** The specific question being asked (extracted from output). */
    question?: string;
}

export interface Runner {
    name: string;
    execute(input: RunnerInput): Promise<RunnerOutput>;
}
