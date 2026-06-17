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
                    SELECT *,
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
                        SELECT DISTINCT
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
                    SELECT *,
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
                        lc_master: {
                            select: {
                                id: true,
                                lc_no: true,
                            }
                        },
                        sales_contracts: {
                            select: {
                                id: true,
                                sales_contract_no: true,
                            }
                        },
                        document_submissions: {
                            select: {
                                id: true,
                                fdbc_no: true,
                            }
                        },
                        rdl_invoice: {
                            select: {
                                id: true,
                                invoice_no: true,
                            }
                        },
                        ref_no: true,
                        term_id: true,
                        invoice_date: true,
                    },
                });

                const invoice = invoiceObj ? {
                    id: invoiceObj.id,
                    buyer_id: invoiceObj.buyer_id,
                    company_bank_id: invoiceObj.company_bank_id,
                    fdbc_rdl_invoice_no: invoiceObj.document_submissions?.fdbc_no ?? invoiceObj.rdl_invoice?.invoice_no,
                    fdbc_rdl_invoice_id: invoiceObj.document_submissions?.id ?? invoiceObj.rdl_invoice?.id,
                    lc_sc_id: invoiceObj.lc_master?.id ?? invoiceObj.sales_contracts?.id,
                    sc_lc_no: invoiceObj.lc_master?.lc_no ?? invoiceObj.sales_contracts?.sales_contract_no,
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

    getScLcForCommissionInvoice: protectedProcedure
        .input(z.object({
            term_id: z.number(),
            buyer_id: z.number(),
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

                const terms = await ctx.db.terms.findUnique({
                    where: { id: input.term_id },
                    select: { name: true },
                });

                if (!terms) {
                    throw new TRPCError({ 
                        code: 'NOT_FOUND', 
                        message: "Terms not found." 
                    });
                }

                let scLcList: { id: string, sc_lc_no: string}[] = [];

                if (terms.name.toLowerCase() === 'tt') {
                    scLcList = await ctx.db.$queryRaw<{ id: string, sc_lc_no: string }[]>`
                        SELECT DISTINCT
                            SC.ID AS id,
                            SC.sales_contract_no AS sc_lc_no
                        FROM rdl_invoice AS RI 
                            INNER JOIN sales_contracts AS SC ON RI.sales_contract_id = SC.id
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM commission_invoice AS CI
                            WHERE CI.RDL_INVOICE_ID = RI.ID
                        )
                        AND RI.term_id = ${input.term_id}
                        AND SC.buyer_id = ${input.buyer_id};
                    `;
                }
                else {
                    scLcList = await ctx.db.$queryRaw<{ id: string, sc_lc_no: string }[]>`
                        SELECT DISTINCT
                            LC.ID AS id,
                            LC.lc_no AS sc_lc_no
                        FROM document_submissions AS DS 
                            INNER JOIN lc_master AS LC ON DS.lc_id = LC.id
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM commission_invoice AS CI
                            WHERE CI.document_submission_id = DS.ID
                        )
                        AND DS.term_id = ${input.term_id}
                        AND LC.buyer_id = ${input.buyer_id};
                    `;
                }

                return scLcList;

            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    selectFDBCorRDLForCommissionInvoice: protectedProcedure
        .input(z.object({
            term_id: z.number(),
            lc_sc_id: z.string(),
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

                const terms = await ctx.db.terms.findUnique({
                    where: { id: input.term_id },
                    select: { name: true },
                });

                if (!terms) {
                    throw new TRPCError({ 
                        code: 'NOT_FOUND', 
                        message: "Terms not found." 
                    });
                }

                let fdbcRdlInvoiceList: { id: string, fdbc_rdl_invoice_no: string}[] = [];

                if (terms.name.toLowerCase() === 'tt') {
                    fdbcRdlInvoiceList = await ctx.db.$queryRaw<{ id: string, fdbc_rdl_invoice_no: string }[]>`
                        SELECT DISTINCT
                            RI.ID,
                            RI.INVOICE_NO AS fdbc_rdl_invoice_no
                        FROM rdl_invoice AS RI 
                            INNER JOIN sales_contracts AS SC ON RI.sales_contract_id = SC.id
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM commission_invoice AS CI
                            WHERE CI.RDL_INVOICE_ID = RI.ID
                        )
                        AND RI.term_id = ${input.term_id}
                        AND SC.ID = ${input.lc_sc_id};
                    `;
                }
                else {
                    fdbcRdlInvoiceList = await ctx.db.$queryRaw<{ id: string, fdbc_rdl_invoice_no: string }[]>`
                        SELECT DISTINCT
                            DS.ID,
                            DS.fdbc_no AS fdbc_rdl_invoice_no
                        FROM document_submissions AS DS 
                            INNER JOIN lc_master AS LC ON DS.lc_id = LC.id
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM commission_invoice AS CI
                            WHERE CI.document_submission_id = DS.ID
                        )
                        AND DS.term_id = ${input.term_id}
                        AND LC.ID = ${input.lc_sc_id};
                    `;
                }

                return fdbcRdlInvoiceList;

            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    getCompanyBankForCommissionInvoice: protectedProcedure
        .input(z.object({
            term_id: z.number(),
            lc_sc_id: z.string(),
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

                const terms = await ctx.db.terms.findUnique({
                    where: { id: input.term_id },
                    select: { name: true },
                });

                if (!terms) {
                    throw new TRPCError({ 
                        code: 'NOT_FOUND', 
                        message: "Terms not found." 
                    });
                }

                let companyBankList: { id: string, bank_name: string}[] = [];

                if (terms.name.toLowerCase() === 'tt') {
                    companyBankList = await ctx.db.$queryRaw<{ id: string, bank_name: string }[]>`
                        SELECT
                            CB.ID,
                            CONCAT(B.NAME, ' (', CB.account_no, ')') AS bank_name 
                        FROM company_banks AS CB
                            INNER JOIN BANKS AS B ON B.ID = CB.bank_id
                            INNER JOIN sales_contracts AS SC ON SC.company_id = CB.company_id
                        WHERE SC.ID = ${input.lc_sc_id};
                    `;
                }
                else {
                    companyBankList = await ctx.db.$queryRaw<{ id: string, bank_name: string }[]>`
                        SELECT
                            CB.ID,
                            CONCAT(B.NAME, ' (', CB.account_no, ')') AS bank_name
                        FROM company_banks AS CB
                            INNER JOIN BANKS AS B ON B.ID = CB.bank_id
                            INNER JOIN LC_MASTER AS LC ON LC.company_id = CB.company_id
                        WHERE LC.ID = ${input.lc_sc_id};
                    `;
                }

                return companyBankList;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    addCommissionInvoice: protectedProcedure
        .input(z.object({
            term_id: z.number(),
            buyer_id: z.number(),
            lc_sc_id: z.string(),
            fdbc_rdl_invoice_id: z.string(),
            company_bank_id: z.number(),
            invoice_date: z.date(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_add = ctx.permissions[m.COMMISSION_INVOICE]?.can_add;

                if (!can_add) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to add commission invoices." 
                    });
                }

                const currentYear = new Date().getFullYear();

                const meta = await ctx.db.commission_invoice_metadata.upsert({
                    where: {
                        buyer_id_year: {
                        buyer_id: input.buyer_id,
                        year: currentYear
                    }
                    },
                    update: {
                        last_ref: {
                            increment: 1,
                        },
                    },
                    create: {
                        year: currentYear,
                        buyer_id: input.buyer_id,
                        last_ref: 0,
                    },
                });

                const buyerName = await ctx.db.buyers.findUnique({
                    where: { id: input.buyer_id },
                    select: { short_name: true },
                });

                const ref_no = `CI/${buyerName?.short_name ?? 'UNKNOWN'}/${currentYear}/${String(meta.last_ref).padStart(4, '0')}`;

                const terms = await ctx.db.terms.findUnique({
                    where: { id: input.term_id },
                    select: { name: true },
                });

                if (!terms) {
                    throw new TRPCError({ 
                        code: 'NOT_FOUND', 
                        message: "Terms not found." 
                    });
                }

                const isTT = terms.name.toLowerCase() === 'tt'

                return await ctx.db.$transaction(async (tx) => {
                    const newInvoice = await tx.commission_invoice.create({
                        data: {
                            term_id: input.term_id,
                            buyer_id: input.buyer_id,
                            lc_id: isTT ? null : input.lc_sc_id,
                            sales_contract_id: isTT ? input.lc_sc_id : null,
                            rdl_invoice_id: isTT ? input.fdbc_rdl_invoice_id : null,
                            document_submission_id: isTT ? null : input.fdbc_rdl_invoice_id,
                            company_bank_id: input.company_bank_id,
                            invoice_date: input.invoice_date,
                            ref_no,
                        },
                    });

                    await tx.commission_invoice_history.create({
                        data: {
                            commission_invoice_id: newInvoice.id,
                            buyer_id: newInvoice.buyer_id,
                            company_bank_id: newInvoice.company_bank_id,
                            document_submission_id: newInvoice.document_submission_id,
                            rdl_invoice_id: newInvoice.rdl_invoice_id,
                            lc_id: newInvoice.lc_id,
                            sales_contract_id: newInvoice.sales_contract_id,
                            ref_no: newInvoice.ref_no,
                            term_id: newInvoice.term_id,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                            action_at: new Date(),
                        },
                    });

                    return newInvoice.id;
                });
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),
});
