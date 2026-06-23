import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";

// Type guard for Prisma errors
function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return typeof error === "object" && error !== null && "code" in error;
}

// Handle errors and convert them into TRPCError with helpful messages
export function handlePrismaError(error: unknown): never {
    if (error instanceof TRPCError) {
        throw error;
    }
    
    if (isPrismaError(error)) {
        switch (error.code) {
            case "P2000":
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "One of the values is too long for the database column.",
                    cause: error,
                });
            case "P2002":
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Duplicate value found, this value already exists.",
                    cause: error,
                });
            case "P2003":
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "This is referenced in other records and can't be deleted.",
                    cause: error,
                });
            case "P2025":
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "The record you are trying to update or delete was not found.",
                    cause: error,
                });
            default:
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Database operation failed: ${error.message}`,
                    cause: error,
                });
        }
    }

    // For non-Prisma errors
    throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
        cause: error,
    });
}
