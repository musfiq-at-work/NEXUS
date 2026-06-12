import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";

interface DocumentSubmissions {
    id: string;
    term: string;
    buyer_name: string;
    fdbc_no: string;
    fdbc_value: number;
    submission_date: Date;
    added_at: Date;
    awb_no: string;
    total_count: bigint;
}

export const documentSubmissionRouter = createTRPCRouter({
    getDocumentSubmission: protectedProcedure
        .input(z.object({
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.DOCUMENT_SUBMISSION]?.can_view;

                if (!can_view) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN",
                        message: "You do not have permission to view document submissions." 
                    });
                }

                const result = await ctx.db.$queryRaw<DocumentSubmissions[]>`
                    WITH DOCUMENTS AS (
                        SELECT 
                            DS.ID,
                            T.NAME AS TERM,
                            B.BUYER_NAME,
                            DS.FDBC_NO,
                            DS.FDBC_VALUE,
                            DS.SUBMISSION_DATE,
                            DS.AWB_NO,
                            DS.ADDED_AT
                        FROM DOCUMENT_SUBMISSIONS AS DS
                            INNER JOIN TERMS AS T ON DS.term_id = T.id
                            INNER JOIN BUYERS AS B ON B.id = DS.buyer_id
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
                    FROM DOCUMENTS
                    ORDER BY ADDED_AT DESC, SUBMISSION_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const documentSubmissions = result.map(({ total_count: _, ...invoice}) => invoice);

                return { documentSubmissions, total };
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    searchDocumentSubmissions: protectedProcedure
        .input(z.object({
            query: z.string(),
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.DOCUMENT_SUBMISSION]?.can_view;

                if (!can_view) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN",
                        message: "You do not have permission to view document submissions." 
                    });
                }

                const result = await ctx.db.$queryRaw<DocumentSubmissions[]>`
                    WITH DOCUMENTS AS (
                        SELECT
                            DS.ID,
                            T.NAME AS TERM,
                            B.BUYER_NAME,
                            DS.FDBC_NO,
                            DS.FDBC_VALUE,
                            DS.SUBMISSION_DATE,
                            DS.ADDED_AT
                        FROM DOCUMENT_SUBMISSIONS AS DS
                            INNER JOIN TERMS AS T ON DS.term_id = T.id
                            INNER JOIN BUYERS AS B ON B.id = DS.buyer_id
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
                            T.NAME ILIKE '%' || ${input.query} || '%'
                            OR B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                            OR DS.FDBC_NO ILIKE '%' || ${input.query} || '%'
                        )
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM DOCUMENTS
                    ORDER BY ADDED_AT DESC, SUBMISSION_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const documentSubmissions = result.map(({ total_count: _, ...invoice}) => invoice);
                return { documentSubmissions, total };
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    deleteDocumentSubmission: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_delete = ctx.permissions[m.DOCUMENT_SUBMISSION]?.can_delete;

                if (!can_delete) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN",
                        message: "You do not have permission to delete document submissions." 
                    });
                }

                return await ctx.db.$transaction(async (tx) => {
                    const documentSubmissionDetails = await tx.document_submissions_details.findMany({
                        where: {
                            document_submissions: {
                                id: input.id
                            }
                        }
                    });

                    const documentSubmissionFactoryInvoices = await tx.document_submission_factory_invoices.findMany({
                        where: {
                            document_submissions_details_id: {
                                in: documentSubmissionDetails.map(detail => detail.id)
                            }
                        }
                    });

                    await tx.document_submission_factory_invoices.deleteMany({
                        where: {
                            document_submissions_details_id: {
                                in: documentSubmissionDetails.map(detail => detail.id)
                            }
                        }
                    });

                    await tx.document_submissions_details.deleteMany({
                        where: {
                            document_submissions: {
                                id: input.id
                            }
                        }
                    });

                    const deletedDocumentSubmission = await tx.document_submissions.delete({
                        where: {
                            id: input.id
                        }
                    });

                    await tx.document_submissions_history.create({
                        data: {
                            document_submission_id: deletedDocumentSubmission.id,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                            awb_date: deletedDocumentSubmission.submission_date,
                            fdbc_no: deletedDocumentSubmission.fdbc_no,
                            fdbc_value: deletedDocumentSubmission.fdbc_value,
                            term_id: deletedDocumentSubmission.term_id,
                            buyer_id: deletedDocumentSubmission.buyer_id,
                            awb_no: deletedDocumentSubmission.awb_no,
                            remarks: deletedDocumentSubmission.remarks,
                            courier_id: deletedDocumentSubmission.courier_id,
                            fdbc_date: deletedDocumentSubmission.fdbc_date,
                            lc_id: deletedDocumentSubmission.lc_id,
                            sales_contract_id: deletedDocumentSubmission.sales_contract_id,
                            submission_date: deletedDocumentSubmission.submission_date,
                        }
                    });

                    await tx.document_submission_factory_invoices_history.createMany({
                        data: documentSubmissionFactoryInvoices.map(invoice => ({
                            document_submission_factory_invoices_id: invoice.id,
                            document_submission_details_id: invoice.document_submissions_details_id,
                            factory_invoice_id: invoice.factory_invoice_id,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        }))
                    });

                    await tx.document_submissions_details_history.createMany({
                        data: documentSubmissionDetails.map(detail => ({
                            document_submissions_details_id: detail.id,
                            document_submissions_id: detail.document_submissions_id,
                            rdl_invoice_id: detail.rdl_invoice_id,
                            quantity: detail.quantity,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        }))
                    });

                    return deletedDocumentSubmission;
                });
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),
})