#!/usr/bin/env node
import { Command } from 'commander';
import { Store, Project } from '@patchbay/core';

const program = new Command();

program
    .name('patchbay')
    .description('A lightweight control plane for AI-assisted software development.')
    .version('0.1.0');

program
    .command('init')
    .description('Initialize a new Patchbay project in the current directory')
    .action(() => {
        try {
            const store = new Store();
            if (store.isInitialized) {
                console.error('Error: Patchbay is already initialized in this repository.');
                process.exit(1);
            }

            const defaultProject: Project = {
                name: 'My Patchbay Project',
                goal: 'To build awesome software.',
                rules: ['Write clean code.', 'Document decisions.'],
                techStack: ['Node.js', 'TypeScript']
            };

            store.init(defaultProject);
            console.log('Successfully initialized Patchbay in .project-agents/');
        } catch (err: any) {
            console.error('Failed to initialize Patchbay:', err.message);
            process.exit(1);
        }
    });

program.parse(process.argv);
