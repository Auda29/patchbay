import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

// Requires `npm run build --workspace=packages/cli` to be run first.
const CLI_BIN = path.resolve(__dirname, '../dist/index.js');

function cliAvailable(): boolean {
    return fs.existsSync(CLI_BIN);
}

describe('patchbay init --yes', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'patchbay-cli-test-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('creates all five .project-agents subdirectories', () => {
        if (!cliAvailable()) {
            console.warn('Skipping: CLI binary not built. Run: npm run build --workspace=packages/cli');
            return;
        }

        execSync(
            `node "${CLI_BIN}" init --yes --name "Test Project" --goal "Test goal" --tech-stack "TypeScript"`,
            { cwd: tmpDir, stdio: 'pipe' }
        );

        const base = path.join(tmpDir, '.project-agents');
        expect(fs.existsSync(base)).toBe(true);
        for (const dir of ['tasks', 'runs', 'decisions', 'agents', 'context']) {
            expect(fs.existsSync(path.join(base, dir)), `Expected subdir: ${dir}`).toBe(true);
        }
    });

    it('writes project.yml with the provided name and goal', () => {
        if (!cliAvailable()) return;

        execSync(
            `node "${CLI_BIN}" init --yes --name "My Repo" --goal "Build a CLI tool"`,
            { cwd: tmpDir, stdio: 'pipe' }
        );

        const projectYml = fs.readFileSync(
            path.join(tmpDir, '.project-agents', 'project.yml'),
            'utf-8'
        );
        expect(projectYml).toContain('My Repo');
        expect(projectYml).toContain('Build a CLI tool');
    });

    it('exits with error when already initialized', () => {
        if (!cliAvailable()) return;

        execSync(
            `node "${CLI_BIN}" init --yes`,
            { cwd: tmpDir, stdio: 'pipe' }
        );

        expect(() =>
            execSync(`node "${CLI_BIN}" init --yes`, { cwd: tmpDir, stdio: 'pipe' })
        ).toThrow();
    });
});
