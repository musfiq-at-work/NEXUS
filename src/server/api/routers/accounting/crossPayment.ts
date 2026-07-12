import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";

interface CrossPaymentDetails {
    db_id: string;
    factory_name: string;
    factory_invoice_id: string;
    factory_invoice_no: string;
    factory_invoice_date: string;
    invoice_quantity: number;
    invoice_value: number;
}

export const crossPaymentsRouter = createTRPCRouter({
    addCrossPayment: protectedProcedure
        .input(z.object({
            term_id: z.number(),
            buyer_id: z.number(),
            cross_payment_date: z.string(),
            remarks: z.string().optional(),
            details: z.array(z.object({
                factory_invoice_id: z.string(),
                value: z.number(),
            })).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_add = ctx.permissions[m.CROSS_PAYMENT]?.can_add;

                if (!can_add) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to add cross payment.",
                    });
                }

                const currentYear = new Date().getFullYear();
                
                const meta = await ctx.db.cross_payments_metadata.upsert({
                    where: { 
                        year_buyer_id: {
                            year: currentYear,
                            buyer_id: input.buyer_id,
                        }
                    },
                    update: {
                        last_ref: {
                            increment: 1,
                        },
                    },
                    create: {
                        year: currentYear,
                        last_ref: 1,
                    },
                });
                
                const buyer_prefix = await ctx.db.buyers.findUnique({
                    where: { id: input.buyer_id },
                    select: { prefix: true },
                });

                if(!buyer_prefix) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: "Buyer prefix not found."
                    });
                }

                const crossPayment = await ctx.db.cross_payments.create({
                    data: {
                        term_id: input.term_id,
                        buyer_id: input.buyer_id,
                        cross_payment_ref: `CROSS_PAY/${buyer_prefix.prefix}/${currentYear}/${String(meta.last_ref).padStart(4, '0')}`, // Generate a unique reference
                        cross_payment_date: input.cross_payment_date,
                        remarks: input.remarks,
                    },
                });

                await ctx.db.cross_payments_history.create({
                    data: {
                        cross_payments_id: crossPayment.id,
                        buyer_id: input.buyer_id,
                        cross_payment_date: input.cross_payment_date,
                        cross_payment_ref: crossPayment.cross_payment_ref,
                        action: actions.ADDED,
                        performed_by: ctx.user.id,
                        performed_at: new Date(),
                    },
                });

                if (input.details && input.details.length > 0) {
                    const crossPaymentDetailsData = input.details.map((detail) => ({
                        cross_payment_id: crossPayment.id,
                        factory_invoice_id: detail.factory_invoice_id,
                        value: detail.value,
                    }));

                    await ctx.db.cross_payment_details.createMany({
                        data: crossPaymentDetailsData,
                    });
                }

                const addedDetails = await ctx.db.cross_payment_details.findMany({
                    where: { cross_payment_id: crossPayment.id },
                });

                await ctx.db.cross_payment_details_history.createMany({
                    data: addedDetails.map((detail) => ({
                        cross_payment_details_id: detail.id,
                        cross_payment_id: crossPayment.id,
                        factory_invoice_id: detail.factory_invoice_id,
                        value: detail.value,
                        action: actions.ADDED,
                        action_by: ctx.user.id,
                        action_at: new Date(),
                    })),
                });

                return crossPayment;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    getFactoryInvoicesByBuyer: protectedProcedure
        .input(z.object({
            buyer_id: z.number(),
            term_id: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {

                const can_view = ctx.permissions[m.CROSS_PAYMENT]?.can_view;

                if (!can_view) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to view factory invoices.",
                    });
                }

                const factoryInvoices = await ctx.db.$queryRaw<{ id: string; invoice_no: string }[]>`
                    SELECT DISTINCT
                        FI.ID,
                        FI.INVOICE_NO
                    FROM FACTORY_INVOICE AS FI
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM document_submission_factory_invoices AS DSFI
                        WHERE DSFI.factory_invoice_id = FI.ID
                    )
                    AND EXISTS (
                        SELECT 1
                        FROM rdl_invoice_details AS RID
                        WHERE RID.FACTORY_INVOICE_ID = FI.ID
                    )
                    AND FI.buyer_id = ${input.buyer_id}
                    AND FI.term_id = ${input.term_id};
                `;
            
                return factoryInvoices;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),


    getFactoryInvoiceDetails: protectedProcedure
        .input(z.object({
            factory_invoice_id: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.CROSS_PAYMENT]?.can_view;    

                if (!can_view) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to view factory invoice details.",
                    });
                }

                console.log("Fetching details for factory_invoice_id:", input.factory_invoice_id);

                const factoryInvoiceDetails = await ctx.db.$queryRaw<CrossPaymentDetails[]>`
                    WITH FOB_RATE AS (
                        SELECT
                            RISD.rdl_invoice_details_id AS RIDI,
                            RISD.invoice_quantity AS QUANTITY,
                            CASE 
                                WHEN FSD.TRANSFER_RATE <> 0
                                    THEN RISD.invoice_quantity * FSD.TRANSFER_RATE
                                ELSE RISD.invoice_quantity * FSD.FACTORY_RATE
                            END AS VALUE
                        FROM rdl_invoice_shipment_details AS RISD
                        INNER JOIN factory_invoice_details AS FID ON FID.id = RISD.factory_invoice_details_id
                        INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = RISD.shipment_details_id
                    )
                    SELECT 
                        FI.ID AS DB_ID,
                        F.NAME AS FACTORY_NAME,
                        FI.ID AS FACTORY_INVOICE_ID,
                        FI.INVOICE_NO AS FACTORY_INVOICE_NO,
                        FI.INVOICE_DATE AS FACTORY_INVOICE_DATE,
                        SUM(FR.QUANTITY)::NUMERIC(18, 2) AS INVOICE_QUANTITY,
                        SUM(FR.VALUE)::NUMERIC(18, 2) AS INVOICE_VALUE
                    FROM factory_invoice AS FI
                        INNER JOIN factories AS F ON F.id = FI.factory_id
                        INNER JOIN rdl_invoice_details AS RID ON RID.factory_invoice_id = FI.id
                        INNER JOIN FOB_RATE AS FR ON FR.RIDI = RID.id
                    WHERE FI.ID = ${input.factory_invoice_id}
                    GROUP BY FI.ID, F.ID;
                `;

                return factoryInvoiceDetails;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),
})