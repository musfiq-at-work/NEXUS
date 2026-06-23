import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";
import { formatDate } from "~/utils/localDateString";
import { safeNumber } from "~/utils/numbers";

interface ProceedRealizationResult {
    id: string;
    buyer_name: string;
    fdbc_no: string;
    term_name: string;
    realization_date: Date;
    realized_amount: number;
    added_at: Date;
    total_count: number;
}

export const proceedRealizationRouter = createTRPCRouter({
    getProceedRealization: protectedProcedure
        .input(z.object({
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.PROCEED_REALIZATION]?.can_view;

                if (!can_view) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to view proceed realization.",
                    });
                }

                const result = await ctx.db.$queryRaw<ProceedRealizationResult[]>`
                    WITH PROCEED AS (
                        SELECT
                            PR.id,
                            B.buyer_name,
                            DS.fdbc_no,
                            T.NAME AS TERM_NAME,
                            PR.REALIZATION_DATE,
                            PR.REALIZED_AMOUNT,
                            PR.ADDED_AT
                        FROM proceed_realization AS PR
                            INNER JOIN document_submissions AS DS ON DS.id = PR.document_submission_id
                            INNER JOIN buyers AS B ON B.id = PR.buyer_id
                            INNER JOIN terms AS T ON T.id = PR.term_id
                        WHERE (
                            EXISTS ( -- Admin
                                SELECT 1
                                FROM USERS AS U
                                WHERE U.ID = ${ctx.user.id}
                                    AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                    AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                            )
                            OR EXISTS ( -- Team Member
                                SELECT 1
                                FROM TEAM_MEMBERS AS TM 
                                    INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
                                WHERE T.BUYER_ID = B.ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM PROCEED
                    ORDER BY ADDED_AT DESC, REALIZATION_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const proceedRealizations = result.map(({ total_count: _, ...invoice}) => invoice);

                return { proceedRealizations, total };
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    searchProceedRealization: protectedProcedure
        .input(z.object({
            query: z.string(),
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.PROCEED_REALIZATION]?.can_view;

                if (!can_view) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to view proceed realization.",
                    });
                }

                const result = await ctx.db.$queryRaw<ProceedRealizationResult[]>`
                    WITH PROCEED AS (
                        SELECT DISTINCT
                            PR.id,
                            B.buyer_name,
                            DS.fdbc_no,
                            T.NAME AS TERM_NAME,
                            PR.REALIZATION_DATE,
                            PR.REALIZED_AMOUNT,
                            PR.ADDED_AT
                        FROM proceed_realization AS PR
                            INNER JOIN document_submissions AS DS ON DS.id = PR.document_submission_id
                            INNER JOIN buyers AS B ON B.id = PR.buyer_id
                            INNER JOIN terms AS T ON T.id = PR.term_id
                            LEFT JOIN PROCEED_REALIZATION_DETAILS AS PRD ON PRD.realization_id = PR.id
                            LEFT JOIN rdl_invoice AS RI ON RI.id = PRD.rdl_invoice_id
                        WHERE (
                            EXISTS ( -- Admin
                                SELECT 1
                                FROM USERS AS U
                                WHERE U.ID = ${ctx.user.id}
                                    AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                    AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                            )
                            OR EXISTS ( -- Team Member
                                SELECT 1
                                FROM TEAM_MEMBERS AS TM 
                                    INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
                                WHERE T.BUYER_ID = B.ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        AND (
                            B.buyer_name ILIKE '%' || ${input.query} || '%'
                            OR DS.fdbc_no ILIKE '%' || ${input.query} || '%'
                            OR T.NAME ILIKE '%' || ${input.query} || '%'
                            OR RI.INVOICE_NO ILIKE '%' || ${input.query} || '%'
                        )
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM PROCEED
                    ORDER BY ADDED_AT DESC, REALIZATION_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const proceedRealizations = result.map(({ total_count: _, ...invoice}) => invoice);

                return { proceedRealizations, total };
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    deleteProceedRealization: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_delete = ctx.permissions[m.PROCEED_REALIZATION]?.can_delete;

                if (!can_delete) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to delete proceed realization.",
                    });
                }

                await ctx.db.$transaction(async (tx) => {
                    const deletedDetails = await tx.proceed_realization_details.findMany({
                        where: {
                            realization_id: input.id,
                        },
                    });

                    await tx.proceed_realization_details_history.createMany({
                        data: deletedDetails.map((detail) => ({
                            realization_detail_id: detail.id,
                            realization_id: detail.realization_id,
                            rdl_invoice_id: detail.rdl_invoice_id,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        })),
                    });

                    await tx.proceed_realization_details.deleteMany({
                        where: {
                            realization_id: input.id,
                        },
                    });
                    
                    const deletedRealization = await tx.proceed_realization.delete({
                        where: {
                            id: input.id,
                        },
                    });

                    await tx.proceed_realization_history.create({
                        data: {
                            realization_id: deletedRealization.id,
                            buyer_id: deletedRealization.buyer_id,
                            document_submission_id: deletedRealization.document_submission_id,
                            term_id: deletedRealization.term_id,
                            realization_date: deletedRealization.realization_date,
                            realized_amount: deletedRealization.realized_amount,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });
                }, {timeout: 30000}); 
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    getDocumentSubmissionForProceedRealization: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            term_id: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.PROCEED_REALIZATION]?.can_view;

                if (!can_view) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to view document submissions for proceed realization.",
                    });
                }

                const documentSubmissions = await ctx.db.$queryRaw<{ id: string, fdbc_no: string; }[]>`
                    SELECT DISTINCT
                        ID, FDBC_NO
                    FROM document_submissions AS DS 
                    WHERE DS.ID NOT IN (
                        SELECT DOCUMENT_SUBMISSION_ID FROM proceed_realization
                    )
                    AND TERM_ID = ${input.term_id}
                    AND BUYER_ID = ${input.buyer_id};
                `;

                return documentSubmissions;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),
});