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

interface RDLInvoice {
    id: string,
    invoice_no: string,
    total_quantity: bigint,
    total_value: bigint,
    invoice_date: Date,
    previous_quantity: bigint,
}

interface FactoryInvoiceDetails {
    factory_name: string,
    factory_invoice_id: string,
    factory_invoice_no: string,
    invoice_date: Date,
    factory_invoice_value: bigint,
    quantity: bigint,
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

    addDocumentSubmission: protectedProcedure
        .input(z.object({
            term_id: z.number(),
            buyer_id: z.number(),
            submission_date: z.date(),
            fdbc_no: z.string().optional(),
            fdbc_value: z.number().optional(),
            fdbc_date: z.date().optional(),
            lc_sc_id: z.string().optional(),
            awb_no: z.string().optional(),
            awb_date: z.date().optional(),
            courier_id: z.number().optional(),
            rdlInvoices: z.array(z.object({
                rdl_invoice_id: z.string(),
                factoryInvoices: z.array(z.object({
                    factory_invoice_id: z.string(),
                    factory_fdbc_no: z.string().optional(),
                })).optional(),
            })).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_add = ctx.permissions[m.DOCUMENT_SUBMISSION]?.can_add;

                if (!can_add) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN",
                        message: "You do not have permission to add document submissions." 
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

                const isTT = terms.name.toLowerCase() === 'tt';

                return await ctx.db.$transaction(async (tx) => {
                    const newDocumentSubmission = await tx.document_submissions.create({
                        data: {
                            term_id: input.term_id,
                            buyer_id: input.buyer_id,
                            submission_date: input.submission_date,
                            fdbc_no: input.fdbc_no,
                            fdbc_value: input.fdbc_value,
                            fdbc_date: input.fdbc_date,
                            lc_id: isTT ? null : input.lc_sc_id,
                            sales_contract_id: isTT ? input.lc_sc_id : null,
                            awb_no: input.awb_no,
                            awb_date: input.awb_date,
                            courier_id: input.courier_id,
                        }
                    });

                    await tx.document_submissions_history.create({
                        data: {
                            document_submission_id: newDocumentSubmission.id,
                            term_id: newDocumentSubmission.term_id,
                            buyer_id: newDocumentSubmission.buyer_id,
                            submission_date: newDocumentSubmission.submission_date,
                            fdbc_no: newDocumentSubmission.fdbc_no,
                            fdbc_value: newDocumentSubmission.fdbc_value,
                            fdbc_date: newDocumentSubmission.fdbc_date,
                            lc_id: newDocumentSubmission.lc_id,
                            sales_contract_id: newDocumentSubmission.sales_contract_id,
                            awb_no: newDocumentSubmission.awb_no,
                            awb_date: newDocumentSubmission.submission_date,
                            courier_id: newDocumentSubmission.courier_id,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        }
                    });

                    if (input.rdlInvoices && input.rdlInvoices.length > 0) {
                        await Promise.all(input.rdlInvoices.map(async (rdlInvoice) => {
                            const newDocumentSubmissionDetail = await tx.document_submissions_details.create({
                                data: {
                                    document_submissions_id: newDocumentSubmission.id,
                                    rdl_invoice_id: rdlInvoice.rdl_invoice_id,
                                }
                            });

                            await tx.document_submissions_details_history.create({
                                data: {
                                    document_submissions_details_id: newDocumentSubmissionDetail.id,
                                    document_submissions_id: newDocumentSubmission.id,
                                    rdl_invoice_id: newDocumentSubmissionDetail.rdl_invoice_id,
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                }
                            });

                            if(rdlInvoice.factoryInvoices && rdlInvoice.factoryInvoices.length > 0) {
                                await Promise.all(rdlInvoice.factoryInvoices.map(async (factoryInvoice) => {
                                    const newFactoryInvoice = await tx.document_submission_factory_invoices.create({
                                        data: {
                                            document_submissions_details_id: newDocumentSubmissionDetail.id,
                                            factory_invoice_id: factoryInvoice.factory_invoice_id,
                                            factory_fdbc_no: factoryInvoice.factory_fdbc_no,
                                        }
                                    });

                                    await tx.document_submission_factory_invoices_history.create({
                                        data: {
                                            document_submission_factory_invoices_id: newFactoryInvoice.id,
                                            document_submission_details_id: newDocumentSubmissionDetail.id,
                                            factory_invoice_id: newFactoryInvoice.factory_invoice_id,
                                            action_type: actions.ADDED,
                                            action_by: ctx.user.id,
                                        }
                                    });
                                }));
                            }
                        }));
                    }
                })
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    getScLcForDocumentSubmission: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            term_id: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.DOCUMENT_SUBMISSION]?.can_view;

                if (!can_view) {
                    throw new TRPCError({ 
                        code: 'FORBIDDEN', 
                        message: "You don't have permission to view Document Submissions." 
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
                        WITH IN_RDL_INVOICE AS (
                            SELECT 
                                RID.RDL_INVOICE_ID AS RID,
                                SUM(RISD.INVOICE_QUANTITY) AS RDL_QUANTITY
                            FROM rdl_invoice_details AS RID
                            INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                            GROUP BY RID.RDL_INVOICE_ID
                        ),
                        IN_DOCUMENT_SUBMISSION AS (
                            SELECT
                                DSD.rdl_invoice_id AS RID,
                                SUM(DSD.QUANTITY) AS DOCUMENT_QUANTITY
                            FROM document_submissions_details AS DSD
                            GROUP BY DSD.rdl_invoice_id
                        )
                        SELECT DISTINCT
                            SC.ID,
                            SC.SALES_CONTRACT_NO AS SC_LC_NO
                        FROM sales_contracts AS SC
                            INNER JOIN rdl_invoice AS RI ON RI.sales_contract_id = SC.id
                            INNER JOIN IN_RDL_INVOICE AS IRI ON IRI.RID = RI.ID
                            LEFT JOIN IN_DOCUMENT_SUBMISSION AS IDS ON IDS.RID = RI.ID
                        WHERE SC.buyer_id = ${input.buyer_id}
                        GROUP BY SC.ID
                        HAVING SUM(IRI.RDL_QUANTITY) > SUM(IDS.DOCUMENT_QUANTITY);
                    `;
                }
                else {
                    scLcList = await ctx.db.$queryRaw<{ id: string, sc_lc_no: string }[]>`
                        WITH IN_RDL_INVOICE AS (
                            SELECT 
                                RID.RDL_INVOICE_ID AS RID,
                                SUM(RISD.INVOICE_QUANTITY) AS RDL_QUANTITY
                            FROM rdl_invoice_details AS RID
                            INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                            GROUP BY RID.RDL_INVOICE_ID
                        ),
                        IN_DOCUMENT_SUBMISSION AS (
                            SELECT
                                DSD.rdl_invoice_id AS RID,
                                SUM(DSD.QUANTITY) AS DOCUMENT_QUANTITY
                            FROM document_submissions_details AS DSD
                            GROUP BY DSD.rdl_invoice_id
                        )
                        SELECT DISTINCT
                            LC.id,
                            LC.lc_no AS SC_LC_NO
                        FROM lc_master AS LC
                            INNER JOIN rdl_invoice AS RI ON RI.lc_id = LC.id
                            INNER JOIN IN_RDL_INVOICE AS IRI ON IRI.RID = RI.ID
                            LEFT JOIN IN_DOCUMENT_SUBMISSION AS IDS ON IDS.RID = RI.ID
                        WHERE LC.buyer_id = ${input.buyer_id}
                        GROUP BY LC.ID
                        HAVING SUM(IRI.RDL_QUANTITY) > SUM(IDS.DOCUMENT_QUANTITY);
                    `;
                }

                return scLcList;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    getRdlInvoiceForDocumentSubmission: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            term_id: z.number(),
            lc_sc_id: z.string(),
            document_submission_id: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.DOCUMENT_SUBMISSION]?.can_view;

                if (!can_view) {
                    throw new TRPCError({ 
                        code: 'FORBIDDEN', 
                        message: "You don't have permission to view Document Submissions." 
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

                const isTT = terms.name.toLowerCase() === 'tt';

                const excludeCurrentInvoiceClause = input.document_submission_id 
                    ? Prisma.sql`WHERE DS.ID <> ${input.document_submission_id}` 
                    : Prisma.sql``;

                const whereClause = isTT
                    ? Prisma.sql`RI.sales_contract_id = ${input.lc_sc_id}`
                    : Prisma.sql`RI.lc_id = ${input.lc_sc_id}`;

                const rdlInvoicesList = await ctx.db.$queryRaw<RDLInvoice[]>`
                    WITH IN_DOCUMENT_SUBMISSION AS (
                        SELECT
                            DSD.rdl_invoice_id AS RSD_RID,
                            SUM(DSD.QUANTITY) AS PREVIOUS_QUANTITY
                        FROM document_submissions AS DS 
                        INNER JOIN DOCUMENT_SUBMISSIONS_DETAILS AS DSD ON DSD.document_submissions_id = DS.id
                        ${excludeCurrentInvoiceClause}
                        GROUP BY DSD.rdl_invoice_id
                    )
                    SELECT
                        RI.ID,
                        RI.INVOICE_NO,
                        RI.INVOICE_DATE,
                        SUM(RISD.INVOICE_QUANTITY) AS TOTAL_QUANTITY,
	                    SUM(RISD.INVOICE_QUANTITY * SD.fob_rate) AS TOTAL_VALUE,
                        IDS.PREVIOUS_QUANTITY AS PREVIOUS_QUANTITY
                    FROM rdl_invoice AS RI
                        INNER JOIN RDL_INVOICE_DETAILS AS RID ON RID.rdl_invoice_id = RI.id
                        INNER JOIN RDL_INVOICE_SHIPMENT_DETAILS AS RISD ON RISD.rdl_invoice_details_id = RID.id
                        INNER JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                        LEFT JOIN IN_DOCUMENT_SUBMISSION AS IDS ON IDS.RSD_RID = RI.id
                    WHERE ${whereClause} AND RI.buyer_id = ${input.buyer_id}
                    GROUP BY RI.ID, IDS.PREVIOUS_QUANTITY
                    HAVING SUM(RISD.INVOICE_QUANTITY) > COALESCE(IDS.PREVIOUS_QUANTITY, 0);
                `;

                const rdlInvoice = rdlInvoicesList.map((invoice) => ({
                    id: invoice.id,
                    invoice_no: invoice.invoice_no,
                    invoice_date: invoice.invoice_date,
                    total_quantity: Number(invoice.total_quantity),
                    total_value: Number(invoice.total_value),
                    previous_quantity: Number(invoice.previous_quantity || 0),
                }));

                return rdlInvoice;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    deleteRdlInvoice: protectedProcedure
        .input(z.object({
            db_id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_delete = ctx.permissions[m.DOCUMENT_SUBMISSION]?.can_delete;

                if (!can_delete) {
                    throw new TRPCError({ 
                        code: 'FORBIDDEN', 
                        message: "You do not have permission to delete RDL Invoices from document submissions." 
                    });
                }

                return await ctx.db.$transaction(async (tx) => {
                    const deletedRdlInvoice = await tx.document_submissions_details.delete({
                        where: {
                            id: input.db_id
                        }
                    });

                    await tx.document_submissions_details_history.create({
                        data: {
                            document_submissions_details_id: deletedRdlInvoice.id,
                            document_submissions_id: deletedRdlInvoice.document_submissions_id,
                            rdl_invoice_id: deletedRdlInvoice.rdl_invoice_id,
                            quantity: deletedRdlInvoice.quantity,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        }
                    });

                    const relatedFactoryInvoices = await tx.document_submission_factory_invoices.findMany({
                        where: {
                            document_submissions_details_id: input.db_id
                        }
                    });

                    await tx.document_submission_factory_invoices.deleteMany({
                        where: {
                            document_submissions_details_id: input.db_id
                        }
                    });

                    await tx.document_submission_factory_invoices_history.createMany({
                        data: relatedFactoryInvoices.map(invoice => ({
                            document_submission_factory_invoices_id: invoice.id,
                            document_submission_details_id: invoice.document_submissions_details_id,
                            factory_invoice_id: invoice.factory_invoice_id,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        }))
                    });

                    return deletedRdlInvoice;
                });
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    getRdlInvoiceDetails: protectedProcedure
        .input(z.object({
            rdl_invoice_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.DOCUMENT_SUBMISSION]?.can_view;

                if (!can_view) {
                    throw new TRPCError({ 
                        code: 'FORBIDDEN', 
                        message: "You don't have permission to view Document Submissions." 
                    });
                }

                const result = await ctx.db.$queryRaw<FactoryInvoiceDetails[]>`
                    SELECT 
                        F.NAME AS FACTORY_NAME,
                        FI.ID AS FACTORY_INVOICE_ID,
                        FI.INVOICE_NO AS FACTORY_INVOICE_NO,
                        FI.INVOICE_DATE AS INVOICE_DATE,
                        CASE
                            WHEN COALESCE(FSD.TRANSFER_RATE, 0) <> 0	
                                THEN FSD.TRANSFER_RATE * RISD.INVOICE_QUANTITY
                            ELSE FSD.FACTORY_RATE * RISD.INVOICE_QUANTITY
                        END AS FACTORY_INVOICE_VALUE,
                        RISD.INVOICE_QUANTITY AS QUANTITY
                    FROM rdl_invoice AS RI
                        INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                        INNER JOIN FACTORY_INVOICE AS FI ON FI.id = RID.factory_invoice_id
                        INNER JOIN factories AS F ON F.id = FI.factory_id
                        INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                        INNER JOIN SHIPMENT_DETAILS AS SD ON SD.id = RISD.shipment_details_id
                        INNER JOIN FACTORY_SHIPMENT_DETAILS AS FSD ON FSD.shipment_detail_id = SD.id
                    WHERE RI.ID = ${input.rdl_invoice_id};
                `;

                const factoryInvoices = result.map(item => ({
                    factory_name: item.factory_name,
                    factory_invoice_id: item.factory_invoice_id,
                    factory_invoice_no: item.factory_invoice_no,
                    invoice_date: item.invoice_date,
                    factory_invoice_value: Number(item.factory_invoice_value),
                    quantity: Number(item.quantity),
                }));

                return factoryInvoices;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),
})


/**
    WITH EXFACTORY_INFO AS (
        SELECT
            ES.ID AS EID,
            CASE
                WHEN COALESCE(FSD.TRANSFER_RATE, 0) <> 0	
                    THEN FSD.TRANSFER_RATE * ES.DELIVERY_QUANTITY
                ELSE FSD.FACTORY_RATE * ES.DELIVERY_QUANTITY
            END AS FACTORY_VALUE,
            ES.DELIVERY_QUANTITY
        FROM EXFACTORY_SHIPMENTS AS ES
            INNER JOIN SHIPMENT_DETAILS AS SD ON SD.id = ES.shipment_details_id
            INNER JOIN FACTORY_SHIPMENT_DETAILS AS FSD ON FSD.shipment_detail_id = SD.id
    ),
    FACTORY_INVOICES AS (
        SELECT
            FI.ID AS FACTORY_INVOICE_ID,
            F.NAME AS FACTORY_NAME,
            FI.INVOICE_NO AS FACTORY_INVOICE_NO,
            FI.INVOICE_DATE AS INVOICE_DATE,
            SUM(E.DELIVERY_QUANTITY) AS QUANTITY,
            SUM(E.FACTORY_VALUE) AS FACTORY_INVOICE_VALUE
        FROM factory_invoice AS FI
            INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FI.id
            INNER JOIN factories AS F ON F.id = FI.factory_id
            INNER JOIN EXFACTORY_INFO AS E ON E.EID = FID.exfactory_shipment_id
        GROUP BY FI.ID, F.ID
    )
    SELECT 
        FI.*
    FROM rdl_invoice AS RI
        INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
        INNER JOIN FACTORY_INVOICES AS FI ON FI.FACTORY_INVOICE_ID = RID.factory_invoice_id
    WHERE RI.ID = ${input.rdl_invoice_id};
 */