import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export async function POST(request: Request) {
    try {
        const store = getStore();
        if (!store.isInitialized) {
            return NextResponse.json({ error: 'Patchbay not initialized' }, { status: 404 });
        }

        const { title, goal, affectedFiles } = await request.json();
        if (!title) {
            return NextResponse.json({ error: 'Missing title' }, { status: 400 });
        }

        const task = store.createTask(title, goal || '', affectedFiles);
        return NextResponse.json(task, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const store = getStore();
        if (!store.isInitialized) {
            return NextResponse.json({ error: 'Patchbay not initialized' }, { status: 404 });
        }

        const { id, status } = await request.json();
        if (!id || !status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
        }

        const validStatuses = ['open', 'in_progress', 'blocked', 'review', 'done'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
        }

        const task = store.getTask(id);
        if (!task) {
            return NextResponse.json({ error: `Task ${id} not found` }, { status: 404 });
        }

        task.status = status;
        store.saveTask(task);
        return NextResponse.json(task);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
