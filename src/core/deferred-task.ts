abstract class DeferredTaskBase<T extends () => void | Promise<void>> {
    protected tasks: Map<string, T> = new Map();

    public addTask(key: string, task: T): void {
        this.tasks.set(key, task);
        console.log(`Deferred task added: ${key}`);
    }

    public removeTask(key: string): void {
        this.tasks.delete(key);
    }

    public isWaitingExecution(key: string): boolean {
        return this.tasks.has(key);
    }

    public hasWaitingExecutions(): boolean {
        return this.tasks.size > 0;
    }

    public clearAll(): void {
        this.tasks.clear();
    }
}

export class DeferredSyncTask extends DeferredTaskBase<() => void> {
    public executeTask(key: string): void {
        const task = this.tasks.get(key);
        if (task) {
            this.tasks.delete(key);
            task();
        }
    }

    public executeAll(): (Error | null)[] {
        const errors: (Error | null)[] = [];
        // It must be converted to array first, because tasks are deleted during iteration
        for (const [key, task] of Array.from(this.tasks.entries())) {
            this.tasks.delete(key);
            try {
                task();
                errors.push(null);
            } catch (err) {
                errors.push(err as Error);
            }
        }
        return errors;
    }
}

export class DeferredAsyncTask extends DeferredTaskBase<() => Promise<void>> {
    public async executeTaskAsync(key: string): Promise<void> {
        const task = this.tasks.get(key);
        if (task) {
            this.tasks.delete(key);
            await task();
        }
    }

    public async executeAllAsync(): Promise<(Error | null)[]> {
        return await Promise.all(
            Array.from(this.tasks.entries()).map(async ([key, task]) => {
                try {
                    this.tasks.delete(key);
                    await task();
                    return null;
                } catch (err) {
                    return err as Error;
                }
            }),
        );
    }
}
