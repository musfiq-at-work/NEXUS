import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { historyQueue } from "~/server/queues/history.queue";

type HistoryWrite = { model: string; data: unknown };

export async function transactionWithQueuedHistory<T>(
    db: PrismaClient,
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel },
): Promise<T> {
    const historyWrites: HistoryWrite[] = [];
    const result = await db.$transaction(async (transaction) => {
        const tx = new Proxy(transaction, {
            get(target, property) {
                const delegate = Reflect.get(target, property, target);
                if (typeof property !== "string" || !property.endsWith("_history") || !delegate) {
                    return delegate;
                }

                return new Proxy(delegate, {
                    get(historyDelegate, method) {
                        if (method === "create" || method === "createMany") {
                            return async (args: { data: unknown | unknown[] }) => {
                                const entries = Array.isArray(args.data) ? args.data : [args.data];
                                historyWrites.push(...entries.map((data) => ({ model: property, data })));
                                return { count: entries.length };
                            };
                        }

                        const value = Reflect.get(historyDelegate, method, historyDelegate);
                        return typeof value === "function" ? value.bind(historyDelegate) : value;
                    },
                });
            },
        }) as Prisma.TransactionClient;

        return callback(tx);
    }, options);

    if (historyWrites.length === 0) return result;

    const countsByModel = historyWrites.reduce<Record<string, number>>((counts, write) => {
        counts[write.model] = (counts[write.model] ?? 0) + 1;
        return counts;
    }, {});
    console.info("[history-queue] Transaction committed; enqueueing history writes", {
        count: historyWrites.length,
        countsByModel,
    });

    for (const write of historyWrites) {
        try {
            const job = await historyQueue.add(write.model, write.data, {
                attempts: 5,
                backoff: { type: "exponential", delay: 1000 },
            });
            console.info("[history-queue] Enqueued history write", {
                jobId: job.id,
                jobName: job.name,
            });
        } catch (error) {
            console.error("[history-queue] Failed to enqueue history write", {
                model: write.model,
                error,
            });
            throw error;
        }
    }

    return result;
}
