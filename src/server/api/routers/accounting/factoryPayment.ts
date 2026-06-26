import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";

interface FactoryPaymentResult {
    term_name: string;
    fdbc_no: string;
    realization_date: Date;
    rdl_invoice_value: number;
    realized_amount: number;
    factory_paid_amount: number;
    paid_count: number;
    pending_count: number;
    total_count: bigint;
}

export const factoryPaymentRouter = createTRPCRouter({
    getFactoryPayments: protectedProcedure
        .input(z.object({
            offset: z.number().optional(),
            limit: z.number().optional(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.REGULAR_PAYMENT]?.can_view;

                if (!can_view) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to view factory payments.",
                    });
                }

                const results = await ctx.db.$queryRaw<FactoryPaymentResult[]>`
                    WITH RDL_INVOICE_IN_DOCUMENT_SUBMISSIONS AS (
                        SELECT 
                            DSD.DOCUMENT_SUBMISSIONS_ID AS DSDID,
                            SUM(RISD.INVOICE_QUANTITY * SD.fob_rate)::NUMERIC(18, 2) AS TOTAL_INVOICE_VALUE
                        FROM document_submissions_details AS DSD 
                            INNER JOIN rdl_invoice AS RI ON RI.id = DSD.rdl_invoice_id
                            INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                            INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                            INNER JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                        GROUP BY DSD.DOCUMENT_SUBMISSIONS_ID
                    ),
                    FACTORY_INVOICE_COUNT AS (
                        SELECT
                            DSD.DOCUMENT_SUBMISSIONS_ID,
                            COUNT(DSFI.FACTORY_INVOICE_ID) AS TOTAL_INVOICE_COUNT
                        FROM document_submissions_details AS DSD 
                            INNER JOIN document_submission_factory_invoices AS DSFI ON DSFI.document_submissions_details_id = DSD.id
                        GROUP BY DSD.DOCUMENT_SUBMISSIONS_ID
                    ),
                    PENDING_FACTORY_PAYMENT AS (
                        SELECT 
                            T.NAME AS TERM_NAME,
                            DS.FDBC_NO,
                            PR.REALIZATION_DATE,
                            RIDS.TOTAL_INVOICE_VALUE AS RDL_INVOICE_VALUE,
                            PR.REALIZED_AMOUNT,
                            COALESCE(SUM(FP.PAID_AMOUNT), 0) AS FACTORY_PAID_AMOUNT,
                            COALESCE(COUNT(FP.ID), 0) AS PAID_COUNT,
                            COALESCE(FIC.TOTAL_INVOICE_COUNT, 0) - COALESCE(COUNT(FP.ID), 0) AS PENDING_COUNT
                        FROM proceed_realization AS PR 
                            INNER JOIN document_submissions AS DS ON DS.id = PR.document_submission_id
                            INNER JOIN RDL_INVOICE_IN_DOCUMENT_SUBMISSIONS AS RIDS ON RIDS.DSDID = DS.id
                            INNER JOIN terms AS T ON T.id = PR.term_id
                            INNER JOIN FACTORY_INVOICE_COUNT AS FIC ON FIC.DOCUMENT_SUBMISSIONS_ID = DS.id
                            LEFT JOIN factory_payments AS FP ON FP.proceed_realization_id = PR.id
                        WHERE (
                            EXISTS (
                                SELECT 1
                                FROM USERS AS U
                                WHERE U.ID = ${ctx.user.id}
                                    AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                    AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                            )
                            OR EXISTS (
                                SELECT 1
                                FROM TEAM_MEMBERS AS TM 
                                    INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
                                WHERE T.BUYER_ID = DS.buyer_id
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        GROUP BY PR.ID, DS.ID, RIDS.TOTAL_INVOICE_VALUE, T.ID, FIC.TOTAL_INVOICE_COUNT
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM PENDING_FACTORY_PAYMENT AS PFP
                    ORDER BY PFP.REALIZATION_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = results.length > 0 ? Number(results[0]?.total_count) : 0;
                const factoryPayments = results.map(({ total_count: _, ...payments}) => payments);

                return { factoryPayments, total };
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    searchFactoryPayments: protectedProcedure
        .input(z.object({
            query: z.string(),
            offset: z.number().optional(),
            limit: z.number().optional(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.REGULAR_PAYMENT]?.can_view;

                if (!can_view) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to view factory payments.",
                    });
                }

                const results = await ctx.db.$queryRaw<FactoryPaymentResult[]>`
                    WITH RDL_INVOICE_IN_DOCUMENT_SUBMISSIONS AS (
                        SELECT 
                            DSD.DOCUMENT_SUBMISSIONS_ID AS DSDID,
                            SUM(RISD.INVOICE_QUANTITY * SD.fob_rate)::NUMERIC(18, 2) AS TOTAL_INVOICE_VALUE
                        FROM document_submissions_details AS DSD 
                            INNER JOIN rdl_invoice AS RI ON RI.id = DSD.rdl_invoice_id
                            INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                            INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                            INNER JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                        GROUP BY DSD.DOCUMENT_SUBMISSIONS_ID
                    ),
                    FACTORY_INVOICE_COUNT AS (
                        SELECT
                            DSD.DOCUMENT_SUBMISSIONS_ID,
                            COUNT(DSFI.FACTORY_INVOICE_ID) AS TOTAL_INVOICE_COUNT
                        FROM document_submissions_details AS DSD 
                            INNER JOIN document_submission_factory_invoices AS DSFI ON DSFI.document_submissions_details_id = DSD.id
                            INNER JOIN factory_invoice AS FI ON FI.id = DSFI.factory_invoice_id
                        GROUP BY DSD.DOCUMENT_SUBMISSIONS_ID
                    ),
                    PENDING_FACTORY_PAYMENT AS (
                        SELECT DISTINCT
                            T.NAME AS TERM_NAME,
                            DS.FDBC_NO,
                            PR.REALIZATION_DATE,
                            RIDS.TOTAL_INVOICE_VALUE AS RDL_INVOICE_VALUE,
                            PR.REALIZED_AMOUNT,
                            COALESCE(SUM(FP.PAID_AMOUNT), 0) AS FACTORY_PAID_AMOUNT,
                            COALESCE(COUNT(FP.ID), 0) AS PAID_COUNT,
                            COALESCE(FIC.TOTAL_INVOICE_COUNT, 0) - COALESCE(COUNT(FP.ID), 0) AS PENDING_COUNT
                        FROM proceed_realization AS PR 
                            INNER JOIN document_submissions AS DS ON DS.id = PR.document_submission_id
                            INNER JOIN RDL_INVOICE_IN_DOCUMENT_SUBMISSIONS AS RIDS ON RIDS.DSDID = DS.id
                            INNER JOIN terms AS T ON T.id = PR.term_id
                            INNER JOIN FACTORY_INVOICE_COUNT AS FIC ON FIC.DOCUMENT_SUBMISSIONS_ID = DS.id
                            INNER JOIN BUYERS AS B ON B.id = DS.buyer_id
                            LEFT JOIN factory_payments AS FP ON FP.proceed_realization_id = PR.id
                        WHERE (
                            EXISTS (
                                SELECT 1
                                FROM USERS AS U
                                WHERE U.ID = ${ctx.user.id}
                                    AND U.DEPARTMENT_ID = ${ADMIN_DEPARTMENT_ID}
                                    AND U.LEVEL_ID = ${ADMIN_LEVEL_ID}
                            )
                            OR EXISTS (
                                SELECT 1
                                FROM TEAM_MEMBERS AS TM 
                                    INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
                                WHERE T.BUYER_ID = B.ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        AND (
                            DS.FDBC_NO ILIKE '%' || ${input.query} || '%'
                            OR T.NAME ILIKE '%' || ${input.query} || '%'
                            OR B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                            OR EXISTS (
                                SELECT 1
                                FROM document_submissions_details DSD2
                                INNER JOIN document_submission_factory_invoices DSFI ON DSFI.document_submissions_details_id = DSD2.id
                                INNER JOIN factory_invoice FI ON FI.id = DSFI.factory_invoice_id
                                WHERE DSD2.document_submissions_id = DS.id
                                    AND FI.invoice_no ILIKE '%' || ${input.query} || '%'
                            )
                        )
                        GROUP BY PR.ID, DS.ID, RIDS.TOTAL_INVOICE_VALUE, T.ID, FIC.TOTAL_INVOICE_COUNT
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM PENDING_FACTORY_PAYMENT AS PFP
                    ORDER BY PFP.REALIZATION_DATE DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = results.length > 0 ? Number(results[0]?.total_count) : 0;
                const factoryPayments = results.map(({total_count: _, ...payments}) => payments);

                return { factoryPayments, total };
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    getFactoryPaymentById: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.REGULAR_PAYMENT]?.can_view;

                if (!can_view) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to view factory payments.",
                    });
                }

                const result = await ctx.db.$queryRaw<FactoryPaymentResult[]>`
                    WITH RDL_INVOICE_IN_DOCUMENT_SUBMISSIONS AS (
                        SELECT 
                            DSD.DOCUMENT_SUBMISSIONS_ID AS DSDID,
                            SUM(RISD.INVOICE_QUANTITY * SD.fob_rate)::NUMERIC(18, 2) AS TOTAL_INVOICE_VALUE
                        FROM document_submissions_details AS DSD 
                            INNER JOIN rdl_invoice AS RI ON RI.id = DSD.rdl_invoice_id
                            INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                            INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.rdl_invoice_details_id = RID.id
                            INNER JOIN shipment_details AS SD ON SD.id = RISD.shipment_details_id
                        GROUP BY DSD.DOCUMENT_SUBMISSIONS_ID
                    )
                    SELECT DISTINCT
                        T.NAME AS TERM_NAME,
                        DS.FDBC_NO,
                        PR.REALIZATION_DATE,
                        RIDS.TOTAL_INVOICE_VALUE AS RDL_INVOICE_VALUE,
                        PR.REALIZED_AMOUNT,
                        COALESCE(SUM(FP.PAID_AMOUNT), 0) AS FACTORY_PAID_AMOUNT,
                        FPH.REMARKS
                    FROM proceed_realization AS PR 
                        INNER JOIN document_submissions AS DS ON DS.id = PR.document_submission_id
                        INNER JOIN RDL_INVOICE_IN_DOCUMENT_SUBMISSIONS AS RIDS ON RIDS.DSDID = DS.id
                        INNER JOIN terms AS T ON T.id = PR.term_id
                        INNER JOIN BUYERS AS B ON B.id = DS.buyer_id
                        LEFT JOIN factory_payments AS FP ON FP.proceed_realization_id = PR.id
                        LEFT JOIN factory_payment_header AS FPH ON FPH.proceed_realization_id = PR.id
                    WHERE (
                        EXISTS (
                            SELECT 1
                            FROM USERS AS U
                            WHERE U.ID = '79dcca24-d57b-43ea-870e-904a6b00b09a'
                                AND U.DEPARTMENT_ID = 5
                                AND U.LEVEL_ID = 5
                        )
                        OR EXISTS (
                            SELECT 1
                            FROM TEAM_MEMBERS AS TM 
                                INNER JOIN TEAMS AS T ON T.ID = TM.TEAM_ID
                            WHERE T.BUYER_ID = B.ID
                                AND TM.USER_ID = '79dcca24-d57b-43ea-870e-904a6b00b09a'
                        )
                    )
                    AND PR.ID = '24111e04-3f7d-40a3-802f-14ef98a3e72a'
                    GROUP BY PR.ID, DS.ID, RIDS.TOTAL_INVOICE_VALUE, T.ID, FPH.ID;
                `;

                if (result.length === 0) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Factory payment not found.",
                    });
                }

                const factoryPayment = result[0];

                return factoryPayment;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),
})
