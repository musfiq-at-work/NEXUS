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

interface PDFHeaderData {
    term_name: string,
    ref_no: string,
    invoice_date: Date,
    buyer_name: string,
    bank_name: string,
    lc_no: string | null,
    sales_contract_no: string | null,
    lc_exfactory_date: Date | null,
    sc_exfactory_date: Date | null,
    fdbc_no: string | null,
}

interface RDLInvoiceData {
    term_name: string,
    rfl_invoice_no: string,
    rfl_invoice_date: Date,
    rfl_invoice_quantity: number,
    rfl_invoice_value: number,
    rft_invoice_no: string,
    rft_invoice_date: Date,
    rft_invoice_quantity: number,
    rft_invoice_value: number
}

interface FactoryInvoiceData {
    term_name: string,
    rfl_invoice_no: string,
    rfl_invoice_date: Date,
    rfl_invoice_quantity: number,
    rfl_invoice_value: number,
    rft_invoice_no: string,
    rft_invoice_date: Date,
    rft_invoice_quantity: number,
    rft_invoice_value: number
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
                }, {timeout: 30000});
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
                }, {timeout: 30000});
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    updateCommissionInvoice: protectedProcedure
        .input(z.object({
            id: z.string(),
            invoice_date: z.date(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_update = ctx.permissions[m.COMMISSION_INVOICE]?.can_update;

                if (!can_update) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: "You are not allowed to update Commission Invoices."
                    });
                }

                return await ctx.db.$transaction(async (tx) => {
                    const updatedInvoice = await ctx.db.commission_invoice.update({
                        where: { id: input.id },
                        data: {
                            invoice_date: input.invoice_date,
                        },
                    });

                    await tx.commission_invoice_history.create({
                        data: {
                            commission_invoice_id: updatedInvoice.id,
                            buyer_id: updatedInvoice.buyer_id,
                            company_bank_id: updatedInvoice.company_bank_id,
                            document_submission_id: updatedInvoice.document_submission_id,
                            rdl_invoice_id: updatedInvoice.rdl_invoice_id,
                            lc_id: updatedInvoice.lc_id,
                            sales_contract_id: updatedInvoice.sales_contract_id,
                            ref_no: updatedInvoice.ref_no,
                            term_id: updatedInvoice.term_id,
                            action_type: actions.UPDATE,
                            action_by: ctx.user.id,
                            action_at: new Date(),
                        },
                    });

                    return updatedInvoice;
                })
            } catch (error) {
                handlePrismaError(error);
            }
        }),

    getPDFDate: protectedProcedure
        .input(z.object({
            id: z.string(),
            fdbc_rdl_invoice_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.COMMISSION_INVOICE]?.can_view;

                if (!can_view) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: "You are not allowed to view Commission Invoices."
                    });
                }

                const isATeamMember = await ctx.db.team_members.findFirst({
                    where: {
                        user_id: ctx.user.id,
                        teams: {
                            buyers: {
                                commission_invoice: {
                                    some: {
                                        id: input.id,
                                    }
                                }
                            }
                        }
                    },
                    select: {
                        id: true,
                    }
                });

                if(!isATeamMember && (ctx.user.level_id !== 5 || ctx.user.department_id !== 5)) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to view this Commission Invoice." 
                    });
                }

                const headerData = await ctx.db.$queryRaw<PDFHeaderData[]>`
                    WITH LC AS (
                        SELECT 
                            LC.ID,
                            LC.LC_NO AS LC_NO,
                            MAX(E.EXFACTORY_DATE) AS EXFACTORY_DATE
                        FROM LC_MASTER AS LC
                            INNER JOIN lc_orders AS LO ON LO.lc_master_id = LC.id
                            INNER JOIN lc_shipments AS LCS ON LCS.lc_order_id = LO.id
                            INNER JOIN shipment_details AS SD ON SD.id = LCS.shipment_details_id
                            INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = SD.id
                            INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                            INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                        GROUP BY LC.ID
                    ),
                    SC AS (
                        SELECT
                            SC.ID,
                            SC.SALES_CONTRACT_NO AS SALES_CONTRACT_NO,
                            MAX(E.EXFACTORY_DATE) AS EXFACTORY_DATE
                        FROM SALES_CONTRACTS AS SC
                            INNER JOIN sales_contract_details AS SCD ON SCD.sales_contract_id = SC.id
                            INNER JOIN buyer_orders AS BO ON BO.id = SCD.order_id
                            INNER JOIN order_styles AS OS ON OS.order_id = SCD.order_id
                            INNER JOIN shipment_details AS SD ON SD.order_style_id = OS.id
                            INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = SD.id
                            INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                            INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
                            GROUP BY SC.ID
                    )
                    SELECT
                        T.name AS TERM_NAME,
                        CI.REF_NO,
                        CI.INVOICE_DATE,
                        BU.BUYER_NAME,
                        B.NAME AS BANK_NAME,
                        LC.LC_NO,
                        SC.SALES_CONTRACT_NO,
                        LC.EXFACTORY_DATE AS lc_exfactory_date,
                        SC.EXFACTORY_DATE AS sc_exfactory_date,
                        DS.FDBC_NO
                    FROM commission_invoice AS CI
                        INNER JOIN company_banks AS CB ON CB.id = CI.company_bank_id
                        INNER JOIN banks AS B ON B.id = CB.bank_id
                        INNER JOIN TERMS AS T ON T.id = CI.term_id
                        INNER JOIN BUYERS AS BU ON BU.id = CI.buyer_id
                        LEFT JOIN LC ON LC.ID = CI.LC_ID AND T.NAME = 'LC'
                        LEFT JOIN SC ON SC.ID = CI.sales_contract_id AND T.NAME = 'TT'
                        LEFT JOIN document_submissions AS DS ON DS.id = CI.document_submission_id AND T.NAME = 'LC'
                    WHERE CI.id = ${input.id};
                `;

                const isTT = headerData[0]?.term_name.toLowerCase() === 'tt';

                const header = {
                    term_name: headerData[0]?.term_name ?? '',
                    ref_no: headerData[0]?.ref_no ?? '',
                    invoice_date: headerData[0]?.invoice_date ?? new Date(),
                    buyer_name: headerData[0]?.buyer_name ?? '',
                    bank_name: headerData[0]?.bank_name ?? '',
                    lc_sc_no: isTT ? headerData[0]?.sales_contract_no : headerData[0]?.lc_no ?? null,
                    exfactory_date: isTT ? headerData[0]?.sc_exfactory_date : headerData[0]?.lc_exfactory_date ?? null,
                    fdbc_no: headerData[0]?.fdbc_no ?? null,
                }

                const rdl_invoices_data = await ctx.db.$queryRaw<RDLInvoiceData[]>`
                    WITH RI_FOR_LC AS (
                        SELECT 
                            RI.INVOICE_NO,
                            RI.INVOICE_DATE,
                            RID.INVOICE_QUANTITY,
                            RID.INVOICE_VALUE,
                            DS.ID AS DS_ID
                        FROM document_submissions AS DS
                            INNER JOIN document_submissions_details AS DSD ON DSD.document_submissions_id = DS.id
                            INNER JOIN rdl_invoice AS RI ON RI.id = DSD.rdl_invoice_id
                            INNER JOIN (
                                SELECT
                                    RID.RDL_INVOICE_ID AS RIID,
                                    SUM(RISD.INVOICE_QUANTITY) AS INVOICE_QUANTITY,
                                    SUM(RISD.INVOICE_QUANTITY * SD.FOB_RATE) AS INVOICE_VALUE
                                FROM rdl_invoice_details AS RID
                                    INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                                    INNER JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                                GROUP BY RID.RDL_INVOICE_ID
                            ) RID ON RID.RIID = RI.id 
                            WHERE DS.ID = ${input.fdbc_rdl_invoice_id}
                    ),
                    RI_FOR_TT AS (
                        SELECT
                            RI.INVOICE_NO,
                            RI.INVOICE_DATE,
                            RID.INVOICE_QUANTITY,
                            RID.INVOICE_VALUE,
                            RI.ID AS RI_ID
                        FROM rdl_invoice AS RI
                        INNER JOIN (
                            SELECT
                                RID.RDL_INVOICE_ID AS RIID,
                                SUM(RISD.INVOICE_QUANTITY) AS INVOICE_QUANTITY,
                                SUM(RISD.INVOICE_QUANTITY * SD.FOB_RATE) AS INVOICE_VALUE
                            FROM rdl_invoice_details AS RID
                                INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                                INNER JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                            GROUP BY RID.RDL_INVOICE_ID
                        ) RID ON RID.RIID = RI.id 
                        WHERE RI.ID = ${input.fdbc_rdl_invoice_id} 
                    )
                    SELECT DISTINCT
                        T.NAME AS TERM_NAME,
                        RFL.INVOICE_NO AS rfl_invoice_no,
                        RFL.INVOICE_DATE AS rfl_invoice_date,
                        RFL.INVOICE_QUANTITY AS rfl_invoice_quantity,
                        RFL.INVOICE_VALUE AS rfl_invoice_value,
                        RFT.INVOICE_NO AS rft_invoice_no,
                        RFT.INVOICE_DATE AS rft_invoice_date,
                        RFT.INVOICE_QUANTITY AS rft_invoice_quantity,
                        RFT.INVOICE_VALUE AS rft_invoice_value
                    FROM commission_invoice AS CI
                        INNER JOIN TERMS AS T ON T.id = CI.term_id
                        LEFT JOIN RI_FOR_LC AS RFL ON RFL.DS_ID = CI.document_submission_id AND T.NAME = 'LC'
                        LEFT JOIN RI_FOR_TT AS RFT ON RFT.RI_ID = CI.rdl_invoice_id AND T.NAME = 'TT'
                    WHERE CI.ID = ${input.id};
                `;

                const rdl_invoices = rdl_invoices_data.map((data) => ({
                    invoice_no: isTT ? data.rft_invoice_no : data.rfl_invoice_no,
                    invoice_date: isTT ? data.rft_invoice_date : data.rfl_invoice_date,
                    invoice_quantity: isTT ? data.rft_invoice_quantity : data.rfl_invoice_quantity,
                    invoice_value: isTT ? data.rft_invoice_value : data.rfl_invoice_value,
                }));


                const factory_invoices_data = await ctx.db.$queryRaw<FactoryInvoiceData[]>`
                    WITH FI_FOR_LC AS (
                        SELECT 
                            FI.INVOICE_NO,
                            FI.INVOICE_DATE,
                            SUM(FAC_INV.INVOICE_QUANTITY) AS INVOICE_QUANTITY,
                            SUM(FAC_INV.INVOICE_VALUE) - COALESCE(FI.DISCOUNT, 0) AS INVOICE_VALUE,
                            DS.ID AS DS_ID
                        FROM document_submissions AS DS
                            INNER JOIN document_submissions_details AS DSD ON DSD.document_submissions_id = DS.id
                            INNER JOIN rdl_invoice AS RI ON RI.id = DSD.rdl_invoice_id
                            INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                            INNER JOIN factory_invoice AS FI ON FI.id = RID.factory_invoice_id
                            INNER JOIN (
                                SELECT
                                    FID.factory_invoice_id AS FI_ID,
                                    RISD.rdl_invoice_details_id AS RISD,
                                    SUM(RISD.INVOICE_QUANTITY) AS INVOICE_QUANTITY,
                                    CASE 
                                        WHEN COALESCE(FSD.transfer_rate, 0) <> 0
                                            THEN FSD.transfer_rate * SUM(RISD.INVOICE_QUANTITY)
                                        ELSE FSD.factory_rate * SUM(RISD.INVOICE_QUANTITY)
                                    END AS INVOICE_VALUE
                                FROM factory_invoice_details AS FID
                                    INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                                    INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.shipment_details_id = ES.shipment_details_id 
                                    INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = ES.shipment_details_id
                                GROUP BY FID.factory_invoice_id, FSD.transfer_rate, FSD.factory_rate, RISD.rdl_invoice_details_id
                            ) FAC_INV ON FAC_INV.FI_ID = FI.id AND FAC_INV.RISD = RID.ID
                        GROUP BY FI.ID, DS.ID
                    ),
                    FI_FOR_TT AS (
                        SELECT
                            FI.INVOICE_NO,
                            FI.INVOICE_DATE,
                            SUM(FAC_INV.INVOICE_QUANTITY) AS INVOICE_QUANTITY,
                            SUM(FAC_INV.INVOICE_VALUE) - COALESCE(FI.DISCOUNT, 0) AS INVOICE_VALUE,
                            RI.ID AS RI_ID
                        FROM rdl_invoice AS RI
                            INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                            INNER JOIN factory_invoice AS FI ON FI.id = RID.factory_invoice_id
                            INNER JOIN (
                                SELECT
                                    FID.factory_invoice_id AS FI_ID,
                                    RISD.rdl_invoice_details_id AS RISD,
                                    SUM(RISD.INVOICE_QUANTITY) AS INVOICE_QUANTITY,
                                    CASE 
                                        WHEN COALESCE(FSD.transfer_rate, 0) <> 0
                                            THEN FSD.transfer_rate * SUM(RISD.INVOICE_QUANTITY)
                                        ELSE FSD.factory_rate * SUM(RISD.INVOICE_QUANTITY)
                                    END AS INVOICE_VALUE
                                FROM factory_invoice_details AS FID
                                    INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                                    INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.shipment_details_id = ES.shipment_details_id
                                    INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = ES.shipment_details_id
                                GROUP BY FID.factory_invoice_id, FSD.transfer_rate, FSD.factory_rate, RISD.rdl_invoice_details_id
                            ) FAC_INV ON FAC_INV.FI_ID = FI.id AND FAC_INV.RISD = RID.ID
                        GROUP BY FI.ID, RI.ID
                    )
                    SELECT DISTINCT
                        T.NAME AS TERM_NAME,
                        RFL.INVOICE_NO AS rfl_invoice_no,
                        RFL.INVOICE_DATE AS rfl_invoice_date,
                        RFL.INVOICE_QUANTITY AS rfl_invoice_quantity,
                        RFL.INVOICE_VALUE AS rfl_invoice_value,
                        RFT.INVOICE_NO AS rft_invoice_no,
                        RFT.INVOICE_DATE AS rft_invoice_date,
                        RFT.INVOICE_QUANTITY AS rft_invoice_quantity,
                        RFT.INVOICE_VALUE AS rft_invoice_value
                    FROM commission_invoice AS CI
                        INNER JOIN TERMS AS T ON T.id = CI.term_id
                        LEFT JOIN FI_FOR_LC AS RFL ON RFL.DS_ID = CI.document_submission_id AND T.NAME = 'LC'
                        LEFT JOIN FI_FOR_TT AS RFT ON RFT.RI_ID = CI.rdl_invoice_id AND T.NAME = 'TT'
                    WHERE CI.ID = ${input.id};
                `;

                const factoryInvoices = factory_invoices_data.map((data) => ({
                    invoice_no: isTT ? data.rft_invoice_no : data.rfl_invoice_no,
                    invoice_date: isTT ? data.rft_invoice_date : data.rfl_invoice_date,
                    invoice_quantity: isTT ? data.rft_invoice_quantity : data.rfl_invoice_quantity,
                    invoice_value: isTT ? data.rft_invoice_value : data.rfl_invoice_value,
                }))

                return {header, rdl_invoices, factoryInvoices};
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),
});



