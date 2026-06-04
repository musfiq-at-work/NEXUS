import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { currencyFormatter, quantityFormatter } from "~/utils/localNumberStrings";

interface RdlInvoiceListItem {
    id: string;
    buyer_name: string;
    invoice_no: string;
    invoice_date: Date;
    value: number;
    symbol: string;
    is_authorized: boolean;
    total_count: bigint;
}

export const rdlInvoiceRouter = createTRPCRouter({
    getRdlInvoice: protectedProcedure
        .input(z.object({
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.RDL_INVOICE]?.can_view;

                if (!can_view) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to view RDL Invoices." 
                    });
                }

                const result = await ctx.db.$queryRaw<RdlInvoiceListItem[]>`
                     WITH RDL_INVOICES AS (
                        SELECT
                            RI.ID,
                            B.BUYER_NAME AS BUYER_NAME,
                            RI.INVOICE_NO,
                            RI.INVOICE_DATE,
                            COALESCE(RI.IS_AUTHORIZED, FALSE) AS IS_AUTHORIZED,
                            SUM(SD.FOB_RATE * RISD.INVOICE_QUANTITY) AS VALUE,
                            C.SYMBOL,
                            RI.ADDED_AT
                        FROM rdl_invoice AS RI
                            INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                            INNER JOIN FACTORY_INVOICE AS FI ON FI.id = RID.factory_invoice_id
                            INNER JOIN factory_invoice_details AS FID ON FI.id = FID.factory_invoice_id
                            INNER JOIN EXFACTORY_SHIPMENTS AS ES ON ES.ID = FID.exfactory_shipment_id
                            INNER JOIN SHIPMENT_DETAILS AS SD ON SD.ID = ES.shipment_details_id
                            INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.shipment_details_id = SD.id
                            INNER JOIN ORDER_STYLES AS OS ON OS.id = SD.order_style_id
                            INNER JOIN BUYER_ORDERS AS BO ON BO.ID = OS.order_id
                            INNER JOIN CURRENCIES AS C ON C.id = BO.secondary_currency_id
                            INNER JOIN BUYERS AS B ON B.id = BO.buyer_id
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
                                WHERE T.BUYER_ID = BO.BUYER_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        GROUP BY RI.ID, B.ID, C.ID
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM RDL_INVOICES
                    ORDER BY INVOICE_DATE DESC, ADDED_AT DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const rdlInvoices = result.map(({ total_count: _,  value, symbol, ...invoice}) => (
                    { ...invoice, value: currencyFormatter(value, symbol) })
                );

                return { rdlInvoices, total };
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    searchRdlInvoices: protectedProcedure
        .input(z.object({
            query: z.string(),
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.RDL_INVOICE]?.can_view;

                if (!can_view) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to view RDL Invoices." 
                    });
                }

                const result = await ctx.db.$queryRaw<RdlInvoiceListItem[]>`
                    WITH RDL_INVOICES AS (
                        SELECT
                            RI.ID,
                            B.BUYER_NAME AS BUYER_NAME,
                            RI.INVOICE_NO,
                            RI.INVOICE_DATE,
                            COALESCE(RI.IS_AUTHORIZED, FALSE) AS IS_AUTHORIZED,
                            SUM(SD.FOB_RATE * RISD.INVOICE_QUANTITY) AS VALUE,
                            C.SYMBOL,
                            RI.ADDED_AT
                        FROM rdl_invoice AS RI
                            INNER JOIN rdl_invoice_details AS RID ON RID.rdl_invoice_id = RI.id
                            INNER JOIN FACTORY_INVOICE AS FI ON FI.id = RID.factory_invoice_id
                            INNER JOIN factory_invoice_details AS FID ON FI.id = FID.factory_invoice_id
                            INNER JOIN EXFACTORY_SHIPMENTS AS ES ON ES.ID = FID.exfactory_shipment_id
                            INNER JOIN SHIPMENT_DETAILS AS SD ON SD.ID = ES.shipment_details_id
                            INNER JOIN rdl_invoice_shipment_details AS RISD ON RISD.shipment_details_id = SD.id
                            INNER JOIN ORDER_STYLES AS OS ON OS.id = SD.order_style_id
                            INNER JOIN BUYER_ORDERS AS BO ON BO.ID = OS.order_id
                            INNER JOIN CURRENCIES AS C ON C.id = BO.secondary_currency_id
                            INNER JOIN BUYERS AS B ON B.id = BO.buyer_id
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
                                WHERE T.BUYER_ID = BO.BUYER_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        AND (
                            B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                            OR RI.INVOICE_NO ILIKE '%' || ${input.query} || '%'
                            OR BO.REF_NO ILIKE '%' || ${input.query} || '%'
                            OR OS.STYLE ILIKE '%' || ${input.query} || '%'
                            OR SD.buyer_po ILIKE '%' || ${input.query} || '%'
                        )
                        GROUP BY RI.ID, B.ID, C.ID
                    )
                    SELECT *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM FACTORY_INVOICES
                    ORDER BY ADDED_AT DESC
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const rdlInvoices = result.map(({ total_count: _,  value, symbol, ...invoice}) => (
                    { ...invoice, value: currencyFormatter(value, symbol) })
                );

                return { rdlInvoices, total };
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    deleteRdlInvoice: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_delete = ctx.permissions[m.RDL_INVOICE]?.can_delete;

                if (!can_delete) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to delete RDL Invoices." 
                    });
                }

                await ctx.db.$transaction(async (tx) => {
                    const rdlInvoiceDetails = await tx.rdl_invoice_details.findMany({
                        where: { rdl_invoice_id: input.id },
                    });

                    const rdlInvoiceShipmentDetails = await tx.rdl_invoice_shipment_details.findMany({
                        where: {
                            rdl_invoice_details_id: {
                                in: rdlInvoiceDetails.map(detail => detail.id),
                            },
                        },
                    });

                    await tx.rdl_invoice_shipment_details_history.createMany({
                        data: rdlInvoiceShipmentDetails.map(detail => ({
                            rdl_invoice_details_id: detail.rdl_invoice_details_id,
                            shipment_details_id: detail.shipment_details_id,
                            invoice_quantity: detail.invoice_quantity,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        })),
                    });

                    await tx.rdl_invoice_details_history.createMany({
                        data: rdlInvoiceDetails.map(detail => ({
                            rdl_invoice_details: detail.id,
                            rdl_invoice_id: detail.rdl_invoice_id,
                            factory_invoice_id: detail.factory_invoice_id,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        })),
                    });

                    await tx.rdl_invoice_shipment_details.deleteMany({
                        where: {
                            rdl_invoice_details_id: {
                                in: rdlInvoiceDetails.map(detail => detail.id),
                            },
                        },
                    });

                    await tx.rdl_invoice_details.deleteMany({
                        where: { rdl_invoice_id: input.id },
                    });

                    const deleted = await tx.rdl_invoice.delete({
                        where: { id: input.id },
                    });

                    await tx.rdl_invoice_history.create({
                        data: {
                            rdl_invoice_id: deleted.id,
                            buyer_id: deleted.buyer_id,
                            term_id: deleted.term_id,
                            invoice_no: deleted.invoice_no,
                            invoice_date: deleted.invoice_date,
                            sales_contract_id: deleted.sales_contract_id,
                            lc_id: deleted.lc_id,
                            invoice_type: deleted.invoice_type,
                            pi_no: deleted.pi_no,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                        },
                    });
                })
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    getRdlInvoiceById: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.RDL_INVOICE]?.can_view;

                if (!can_view) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to view RDL Invoices." 
                    });
                }

                const rdlInvoice = await ctx.db.rdl_invoice.findUnique({
                    where: { id: input.id },
                    select: {
                        id: true,
                        buyer_id: true,
                        term_id: true,
                        sales_contracts: {
                            select: {
                                id: true,
                                sales_contract_no: true,
                            }
                        },
                        lc_master: {
                            select: {
                                id: true,
                                lc_no: true,
                            }
                        },
                        invoice_no: true,
                        invoice_date: true,
                    }
                });

                if (!rdlInvoice) {
                    throw new TRPCError({ 
                        code: "NOT_FOUND", 
                        message: "RDL Invoice not found." 
                    });
                }

                return rdlInvoice;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),
});