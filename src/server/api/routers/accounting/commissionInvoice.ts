import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";

interface CommissionInvoiceListItem {
    id: string,
    term: string,
    buyer_name: string,
    invoice_date: Date,
    ref_no: string,
    lc_sc_no: string | null,
    fdbc_rdl_invoice_no: string | null,
    total_count: bigint,
    added_at: Date,
}

export const commissionInvoiceRouter = createTRPCRouter({
    getCommissionInvoiceList: protectedProcedure
        .input(z.object({
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.COMMISSION_INVOICE]?.can_add;

                if (!can_view) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to view commission invoices." 
                    });
                }

                const result = await ctx.db.$queryRaw<CommissionInvoiceListItem[]>`
                    WITH COMMISSION_INVOICE_LIST AS (
                        SELECT
                            T.NAME AS TERM,
                            CI.ID,
                            B.BUYER_NAME,
                            CI.INVOICE_DATE,
                            CI.REF_NO,
                            COALESCE(LC.LC_NO, SC.SALES_CONTRACT_NO) AS LC_SC_NO,
                            COALESCE(DS.FDBC_NO, RI.INVOICE_NO) AS FDBC_RDL_INVOICE_NO,
                            CI.ADDED_AT
                        FROM COMMISSION_INVOICE AS CI
                            INNER JOIN TERMS AS T ON T.id = CI.term_id
                            INNER JOIN BUYERS AS B ON B.id = CI.buyer_id
                            LEFT JOIN LC_MASTER AS LC ON LC.id = CI.lc_id
                            LEFT JOIN SALES_CONTRACTS AS SC ON SC.id = CI.sales_contract_id
                            LEFT JOIN document_submissions AS DS ON DS.id = CI.document_submission_id
                            LEFT JOIN rdl_invoice AS RI ON RI.id = CI.rdl_invoice_id
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
                    SELECT 
                        *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM COMMISSION_INVOICE_LIST
                    ORDER BY ADDED_AT DESC, INVOICE_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const commissionInvoices = result.map(({ total_count: _, ...invoice}) => invoice);

                return { commissionInvoices, total };
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    searchCommissionInvoice: protectedProcedure
        .input(z.object({
            query: z.string(),
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.COMMISSION_INVOICE]?.can_add;

                if (!can_view) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to view commission invoices." 
                    });
                }

                const result = await ctx.db.$queryRaw<CommissionInvoiceListItem[]>`
                    WITH COMMISSION_INVOICE_LIST AS (
                        SELECT
                            T.NAME AS TERM,
                            CI.ID,
                            B.BUYER_NAME,
                            CI.INVOICE_DATE,
                            CI.REF_NO,
                            COALESCE(LC.LC_NO, SC.SALES_CONTRACT_NO) AS LC_SC_NO,
                            COALESCE(DS.FDBC_NO, RI.INVOICE_NO) AS FDBC_RDL_INVOICE_NO,
                            CI.ADDED_AT
                        FROM COMMISSION_INVOICE AS CI
                            INNER JOIN TERMS AS T ON T.id = CI.term_id
                            INNER JOIN BUYERS AS B ON B.id = CI.buyer_id
                            LEFT JOIN LC_MASTER AS LC ON LC.id = CI.lc_id
                            LEFT JOIN SALES_CONTRACTS AS SC ON SC.id = CI.sales_contract_id
                            LEFT JOIN document_submissions AS DS ON DS.id = CI.document_submission_id
                            LEFT JOIN rdl_invoice AS RI ON RI.id = CI.rdl_invoice_id
                            LEFT JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                            LEFT JOIN factory_invoice AS FI ON FI.ID = RID.factory_invoice_id
                            LEFT JOIN document_submissions_details AS DSD ON DSD.document_submissions_id = DS.id
                            LEFT JOIN document_submission_factory_invoices AS DSFI ON DSFI.document_submissions_details_id = DSD.id
                            LEFT JOIN rdl_invoice AS DSRI ON DSRI.id = DSD.rdl_invoice_id
                            LEFT JOIN factory_invoice AS DSDFI ON DSDFI.ID = DSFI.factory_invoice_id
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
                            OR CI.REF_NO ILIKE '%' || ${input.query} || '%'
                            OR LC.LC_NO ILIKE '%' || ${input.query} || '%'
                            OR SC.SALES_CONTRACT_NO ILIKE '%' || ${input.query} || '%'
                            OR DS.FDBC_NO ILIKE '%' || ${input.query} || '%'
                            OR RI.INVOICE_NO ILIKE '%' || ${input.query} || '%'
                            OR FI.INVOICE_NO ILIKE '%' || ${input.query} || '%'
                            OR DSRI.INVOICE_NO ILIKE '%' || ${input.query} || '%'
                            OR DSDFI.INVOICE_NO ILIKE '%' || ${input.query} || '%'
                        )
                    )
                    SELECT 
                        *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM COMMISSION_INVOICE_LIST
                    ORDER BY ADDED_AT DESC, INVOICE_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const commissionInvoices = result.map(({ total_count: _, ...invoice}) => invoice);

                return { commissionInvoices, total };
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    deleteCommissionInvoice: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_delete = ctx.permissions[m.COMMISSION_INVOICE]?.can_delete;

                if (!can_delete) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to delete commission invoices." 
                    });
                }

                return await ctx.db.$transaction(async (tx) => {
                    const deletedInvoice = await tx.commission_invoice.delete({
                        where: { id: input.id },
                    });

                    await tx.commission_invoice_history.create({
                        data: {
                            commission_invoice_id: deletedInvoice.id,
                            buyer_id: deletedInvoice.buyer_id,
                            company_bank_id: deletedInvoice.company_bank_id,
                            document_submission_id: deletedInvoice.document_submission_id,
                            rdl_invoice_id: deletedInvoice.rdl_invoice_id,
                            lc_id: deletedInvoice.lc_id,
                            sales_contract_id: deletedInvoice.sales_contract_id,
                            ref_no: deletedInvoice.ref_no,
                            term_id: deletedInvoice.term_id,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                            action_at: new Date(),
                        },
                    });

                    return deletedInvoice;
                });
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    getCommissionInvoiceById: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.COMMISSION_INVOICE]?.can_add;

                if (!can_view) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to view commission invoices." 
                    });
                }

                const invoiceObj = await ctx.db.commission_invoice.findUnique({
                    where: { id: input.id },
                    select: {
                        id: true,
                        buyer_id: true,
                        company_bank_id: true,
                        document_submission_id: true,
                        rdl_invoice_id: true,
                        lc_id: true,
                        sales_contract_id: true,
                        ref_no: true,
                        term_id: true,
                        invoice_date: true,
                    },
                });

                const invoice = invoiceObj ? {
                    id: invoiceObj.id,
                    buyer_id: invoiceObj.buyer_id,
                    company_bank_id: invoiceObj.company_bank_id,
                    fdbc_rdl_invoice_no: invoiceObj.document_submission_id ?? invoiceObj.rdl_invoice_id,
                    lc_sc_id: invoiceObj.lc_id ?? invoiceObj.sales_contract_id,
                    ref_no: invoiceObj.ref_no,
                    term_id: invoiceObj.term_id,
                    invoice_date: invoiceObj.invoice_date,
                } : null;

                return invoice;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),
});
