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
                        invoice_type: true,
                        pi_no: true,
                        container_no: true,
                        is_authorized: true,
                        discount: true,
                        remark: true,
                        rdl_invoice_details: {
                            select: {
                                id: true,
                                factory_id: true,
                                factory_invoice: {
                                    select: {
                                        id: true,
                                        factory_invoice_consignee: {
                                            select: {
                                                consignee_id: true,
                                            }
                                        },
                                        factory_invoice_notify_party: {
                                            select: {
                                                notify_party_id: true,
                                            }
                                        },
                                        freight_term: {
                                            select: {
                                                id: true,
                                                term_name: true,
                                            }
                                        },
                                        destinations: {
                                            select: {
                                                id: true,
                                                name: true,
                                            }
                                        }
                                    },
                                },
                                rdl_invoice_shipment_details: {
                                    select: {
                                        id: true,
                                        shipment_details_id: true,
                                        invoice_quantity: true,
                                    }
                                }
                            }
                        }
                    }
                });

                const consignees = [
                    ...new Map(
                        rdlInvoice?.rdl_invoice_details.flatMap(
                            (detail) => detail.factory_invoice?.factory_invoice_consignee ?? []
                        ).map((item) => [item.consignee_id, item])
                    ).values(),
                ];

                const notifyParties = [
                    ...new Map(
                        rdlInvoice?.rdl_invoice_details.flatMap(
                            (detail) => detail.factory_invoice?.factory_invoice_notify_party ?? []
                        ).map((item) => [item.notify_party_id, item])
                    ).values(),
                ];

                const freightTerms = [
                    ...new Set(
                        rdlInvoice?.rdl_invoice_details
                            .map((detail) => detail.factory_invoice?.freight_term?.term_name)
                            .filter(Boolean)
                    ),
                ].join(", ");

                const destinations = [
                    ...new Set(
                        rdlInvoice?.rdl_invoice_details
                            .map((detail) => detail.factory_invoice?.destinations?.name)
                            .filter(Boolean)
                    ),
                ].join(", ");

                const result = {
                    ...rdlInvoice,
                    consignees,
                    notify_parties: notifyParties,
                    freightTerms,
                    port_of_loading: destinations,
                    rdl_invoice_details:
                    rdlInvoice?.rdl_invoice_details.map((detail) => ({
                        ...detail,
                        factory_invoice: detail.factory_invoice ? {
                            id: detail.factory_invoice.id,
                        } : null,
                    })) ?? [],
                };

                return result;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    getScLcForRDLInvoice: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            term_id: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.RDL_INVOICE]?.can_view;

                if (!can_view) {
                    throw new TRPCError({ 
                        code: 'FORBIDDEN', 
                        message: "You don't have permission to view LC and Sales Contract details." 
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
                            SC.ID,
                            SC.SALES_CONTRACT_NO AS SC_LC_NO
                        FROM sales_contracts AS SC
                            INNER JOIN factory_invoice AS FI ON FI.sales_contract_id = SC.id
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM rdl_invoice_details AS RID
                            WHERE RID.FACTORY_INVOICE_ID = FI.ID
                        )
                        AND SC.buyer_id = ${input.buyer_id}
                    `;
                }
                else {
                    scLcList = await ctx.db.$queryRaw<{ id: string, sc_lc_no: string }[]>`
                        SELECT DISTINCT
                            LC.id,
                            LC.lc_no AS SC_LC_NO
                        FROM lc_master AS LC
                            INNER JOIN factory_invoice AS FI ON FI.lc_id = LC.id
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM rdl_invoice_details AS RID
                            WHERE RID.FACTORY_INVOICE_ID = FI.ID
                        )
                        AND LC.buyer_id = ${input.buyer_id}
                    `;
                }

                return scLcList;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    addRdlInvoice: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            term_id: z.number(),
            lc_sc_id: z.string(),
            invoice_date: z.date(),
            invoice_type: z.boolean().optional(),
            pi_no: z.string().optional(),
            remarks: z.string().optional(),
            container_no: z.string().optional(),
            discount: z.number().optional(),
            details: z.array(z.object({
                factory_id: z.number(),
                factory_invoice_id: z.string(),
                shipments: z.array(z.object({
                    shipment_details_id: z.string(),
                    invoice_quantity: z.number(),
                })),
            }))
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_create = ctx.permissions[m.RDL_INVOICE]?.can_add;

                if (!can_create) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to create RDL Invoices." 
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

                const buyerPrefix = await ctx.db.buyers.findUnique({
                    where: { id: input.buyer_id },
                    select: { prefix: true },
                });

                const currentYear = new Date().getFullYear();

                const meta = await ctx.db.rdl_invoice_metadata.upsert({
                    where: { 
                        buyer_id_year: {
                            buyer_id: input.buyer_id,
                            year: currentYear,
                        },
                    },
                    update: {
                        last_ref: {
                            increment: 1,
                        },
                    },
                    create: {
                        buyer_id: input.buyer_id,
                        year: currentYear,
                        last_ref: 1,
                    },
                });

                const invoiceRef = `RDL/${buyerPrefix?.prefix || 'BUYER'}/${currentYear}/${String(meta.last_ref).padStart(4, '0')}`;

                return await ctx.db.$transaction(async (tx) => {
                    const rdlInvoice = await tx.rdl_invoice.create({
                        data: {
                            buyer_id: input.buyer_id,
                            term_id: input.term_id,
                            lc_id: isTT ? null : input.lc_sc_id,
                            sales_contract_id: isTT ? input.lc_sc_id : null,
                            invoice_no: invoiceRef,
                            invoice_date: input.invoice_date,
                            invoice_type: input.invoice_type,
                            pi_no: input.pi_no,
                            container_no: input.container_no,
                            discount: input.discount,
                            remark: input.remarks,
                        },
                    });

                    await tx.rdl_invoice_history.create({
                        data: {
                            rdl_invoice_id: rdlInvoice.id,
                            buyer_id: rdlInvoice.buyer_id,
                            term_id: rdlInvoice.term_id,
                            invoice_no: rdlInvoice.invoice_no,
                            invoice_date: rdlInvoice.invoice_date,
                            sales_contract_id: rdlInvoice.sales_contract_id,
                            lc_id: rdlInvoice.lc_id,
                            invoice_type: rdlInvoice.invoice_type,
                            pi_no: rdlInvoice.pi_no,
                            container_no: rdlInvoice.container_no,
                            discount: rdlInvoice.discount,
                            remark: rdlInvoice.remarks,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                        },
                    });

                    await Promise.all(
                        input.details.map(async (detail) => {
                            const rdlInvoiceDetail = await tx.rdl_invoice_details.create({
                                data: {
                                    rdl_invoice_id: rdlInvoice.id,
                                    factory_id: detail.factory_id,
                                    factory_invoice_id: detail.factory_invoice_id,
                                },
                            });

                            await Promise.all(
                                detail.shipments.map(async (shipment) => {
                                    const shipmentDetail = await tx.rdl_invoice_shipment_details.create({
                                        data: {
                                            rdl_invoice_details_id: rdlInvoiceDetail.id,
                                            shipment_details_id: shipment.shipment_details_id,
                                            invoice_quantity: shipment.invoice_quantity,
                                        },
                                    });

                                    tx.rdl_invoice_shipment_details_history.create({
                                        data: {
                                            rdl_invoice_details_id: shipmentDetail.rdl_invoice_details_id,
                                            shipment_details_id: shipmentDetail.shipment_details_id,
                                            invoice_quantity: shipmentDetail.invoice_quantity,
                                            action_type: actions.ADDED,
                                            action_by: ctx.user.id,
                                        },
                                    })
                                })
                            );

                            tx.rdl_invoice_details_history.create({
                                data: {
                                    rdl_invoice_details: rdlInvoiceDetail.id,
                                    rdl_invoice_id: rdlInvoiceDetail.rdl_invoice_id,
                                    factory_id: rdlInvoiceDetail.factory_id,
                                    factory_invoice_id: rdlInvoiceDetail.factory_invoice_id,
                                    action_type: actions.ADDED,
                                    action_by: ctx.user.id,
                                },
                            });
                        })
                    );

                    return rdlInvoice;
                });
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),


});