import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { currencyFormatter } from "~/utils/localNumberStrings";

interface LCListItem {
    id: string;
    factory_name: string;
    debit_note_ref: string;
    term_name: string;
    lc_sc_no: string;
    buyer_name: string;
    debit_note_date: Date;
    total_count: number;
}

interface ShipmentDetails { 
    id: string; 
    buyer_po: string; 
    invoice_no: string; 
    dn_value: number 
}

export const debitNotesRouter = createTRPCRouter({
    getAllDebitNotes: protectedProcedure
        .input(z.object({
            offset: z.number().optional(),
            limit: z.number().optional(),
        }))
        .query(async ({ ctx }) => {
            try {
                const can_view = ctx.permissions[m.DEBIT_NOTE]?.can_view;

                if(!can_view) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: "You do not have permission to view debit notes."
                    });
                }

                const result = await ctx.db.$queryRaw<LCListItem[]>`
                    WITH DEBIT_NOTES AS (	
                        SELECT
                            DN.id,
                            F.NAME AS FACTORY_NAME,
                            DN.DEBIT_NOTE_REF,
                            T.NAME AS TERM_NAME,
                            CASE
                                WHEN T.NAME = 'TT'
                                    THEN SC.SALES_CONTRACT_NO
                                ELSE LC.LC_NO
                            END AS LC_SC_NO,
                            B.BUYER_NAME,
                            DN.DEBIT_NOTE_DATE
                        FROM DEBIT_NOTE AS DN
                            INNER JOIN debit_note_details AS DND ON DND.debit_note_header_id = DN.id
                            INNER JOIN factories AS F ON F.id = DN.factory_id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.id = DND.factory_shipment_id
                            LEFT JOIN lc_shipments AS LS ON LS.shipment_details_id = FSD.shipment_detail_id
                            LEFT JOIN lc_orders AS LO ON LO.id = LS.lc_order_id
                            LEFT JOIN lc_master AS LC ON LC.id = LO.lc_master_id
                            LEFT JOIN shipment_details AS SD ON SD.id = FSD.shipment_detail_id
                            LEFT JOIN order_styles AS OS ON OS.id = SD.order_style_id
                            LEFT JOIN sales_contract_details AS SCS ON SCS.order_id = OS.order_id
                            LEFT JOIN sales_contracts AS SC ON SC.id = SCS.sales_contract_id
                            INNER JOIN BUYERS AS B ON B.id = DN.buyer_id
                            INNER JOIN TERMS AS T ON T.ID = DN.term_id
                        WHERE EXISTS ( -- Admin
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
                    SELECT *, 
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM DEBIT_NOTES
                    LIMIT 15
                    OFFSET 0;
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const debitNotes = result.map(({ total_count: _, ...invoice}) => invoice);

                return {debitNotes, total};
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    searchDebitNotes: protectedProcedure
        .input(z.object({
            query: z.string(),
            offset: z.number().optional(),
            limit: z.number().optional(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.DEBIT_NOTE]?.can_view;

                if(!can_view) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: "You do not have permission to view debit notes."
                    });
                }

                const result = await ctx.db.$queryRaw<LCListItem[]>`
                    WITH DEBIT_NOTES AS (	
                        SELECT
                            DN.id,
                            F.NAME AS FACTORY_NAME,
                            DN.DEBIT_NOTE_REF,
                            T.NAME AS TERM_NAME,
                            CASE
                                WHEN T.NAME = 'TT'
                                    THEN SC.SALES_CONTRACT_NO
                                ELSE LC.LC_NO
                            END AS LC_SC_NO,
                            B.BUYER_NAME,
                            DN.DEBIT_NOTE_DATE
                        FROM DEBIT_NOTE AS DN
                            INNER JOIN debit_note_details AS DND ON DND.debit_note_header_id = DN.id
                            INNER JOIN factories AS F ON F.id = DN.factory_id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.id = DND.factory_shipment_id
                            LEFT JOIN lc_shipments AS LS ON LS.shipment_details_id = FSD.shipment_detail_id
                            LEFT JOIN lc_orders AS LO ON LO.id = LS.lc_order_id
                            LEFT JOIN lc_master AS LC ON LC.id = LO.lc_master_id
                            INNER JOIN shipment_details AS SD ON SD.id = FSD.shipment_detail_id
                            INNER JOIN order_styles AS OS ON OS.id = SD.order_style_id
                            INNER JOIN buyer_orders AS BO ON BO.id = OS.order_id
                            LEFT JOIN sales_contract_details AS SCS ON SCS.order_id = OS.order_id
                            LEFT JOIN sales_contracts AS SC ON SC.id = SCS.sales_contract_id
                            INNER JOIN BUYERS AS B ON B.id = DN.buyer_id
                            INNER JOIN TERMS AS T ON T.ID = DN.term_id
                        WHERE EXISTS ( -- Admin
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
                        AND (
                            F.NAME ILIKE '%' || ${input.query} || '%'
                            OR DN.DEBIT_NOTE_REF ILIKE '%' || ${input.query} || '%'
                            OR T.NAME ILIKE '%' || ${input.query} || '%'
                            OR SC.SALES_CONTRACT_NO ILIKE '%' || ${input.query} || '%'
                            OR LC.LC_NO ILIKE '%' || ${input.query} || '%'
                            OR B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                            OR SD.BUYER_PO ILIKE '%' || ${input.query} || '%'
                            OR OS.STYLE ILIKE '%' || ${input.query} || '%'
                            OR BO.REF_NO ILIKE '%' || ${input.query} || '%'
                        )
                    )
                    SELECT *, 
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM DEBIT_NOTES
                    LIMIT 15
                    OFFSET 0;
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const debitNotes = result.map(({ total_count: _, ...invoice}) => invoice);

                return {debitNotes, total};
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    deleteDebitNote: protectedProcedure
        .input(z.object({
            debit_note_id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_delete = ctx.permissions[m.DEBIT_NOTE]?.can_delete;

                if(!can_delete) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: "You do not have permission to delete debit notes."
                    });
                }

                const deletedDebitNote = await ctx.db.$transaction(async (db) => {
                    // Delete associated debit note details first
                    const deletedDetails = await db.debit_note_details.findMany({
                        where: { debit_note_header_id: input.debit_note_id },
                    });

                    await db.debit_note_details.deleteMany({
                        where: { debit_note_header_id: input.debit_note_id },
                    });

                    await db.debit_note_details_history.createMany({
                        data: deletedDetails.map(detail => ({
                            ...detail,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                            action_at: new Date(),
                        })),
                    });

                    const deletedHeader = await db.debit_note.delete({
                        where: { id: input.debit_note_id },
                    });

                    await db.debit_note_history.create({
                        data: {
                            ...deletedHeader,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                            action_at: new Date(),
                        },
                    });

                    return deletedHeader;
                });
                
                return deletedDebitNote;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    getLCScForDebitNotes: protectedProcedure
        .input(z.object({
            term_id: z.number(),
            buyer_id: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
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

                let lcScList: { lc_sc_id: string; sc_lc_no: string }[];

                if (isTT) {
                    lcScList = await ctx.db.$queryRaw<{ lc_sc_id: string; sc_lc_no: string }[]>`
                        SELECT DISTINCT
                            SC.ID AS lc_sc_id,
                            SC.sales_contract_no AS sc_lc_no
                        FROM sales_contracts AS SC 
                            INNER JOIN sales_contract_details AS SCD ON SCD.sales_contract_id = SC.id
                            INNER JOIN order_styles AS SO ON SO.order_id = SCD.order_id
                            INNER JOIN shipment_details AS SD ON SD.order_style_id = SO.id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                            INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = SD.id
                            INNER JOIN factory_invoice_details AS FID ON FID.exfactory_shipment_id = ES.id
                            INNER JOIN factory_payments AS FP ON FP.factory_invoice_id = FID.factory_invoice_id
                        WHERE FSD.FACTORY_RATE <> COALESCE(FSD.TRANSFER_RATE, 0)
                            AND NOT EXISTS (
                                SELECT 1
                                FROM debit_note_details AS DND
                                WHERE DND.factory_shipment_id = FSD.ID
                            )
                            AND SC.buyer_id = ${input.buyer_id}
                            AND EXISTS ( -- Admin
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
                                WHERE T.BUYER_ID = SC.BUYER_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            );
                        `;
                }
                else {
                    lcScList = await ctx.db.$queryRaw<{ lc_sc_id: string; sc_lc_no: string }[]>`
                        SELECT DISTINCT
                            LC.ID AS lc_sc_id,
                            LC.LC_NO AS sc_lc_no
                        FROM LC_MASTER AS LC
                            INNER JOIN lc_orders AS LO ON LO.lc_master_id = LC.id
                            INNER JOIN lc_shipments AS LS ON LS.lc_order_id = LO.id
                            INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = LS.shipment_details_id
                            INNER JOIN factory_invoice_details AS FID ON FID.exfactory_shipment_id = ES.id
                            INNER JOIN factory_payments AS FP ON FP.factory_invoice_id = FID.factory_invoice_id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = ES.shipment_details_id
                        WHERE FSD.FACTORY_RATE <> COALESCE(FSD.TRANSFER_RATE, 0)
                            AND NOT EXISTS (
                                SELECT 1
                                FROM debit_note_details AS DND
                                WHERE DND.factory_shipment_id = FSD.ID
                            )
                            AND LC.buyer_id = ${input.buyer_id}
                            AND EXISTS ( -- Admin
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
                                WHERE T.BUYER_ID = LC.BUYER_ID
                                    AND TM.USER_ID = ${ctx.user.id}
                            );
                    `;
                }

                return lcScList;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),


    addDebitNote: protectedProcedure
        .input(z.object({
            term_id: z.number(),
            dn_date: z.date(),
            factory_id: z.number(),
            buyer_id: z.number(),
            lc_sc_id: z.string(),
            less: z.number().optional(),
            processing_charges: z.number().optional(),
            conversion_rate: z.number().optional(),
            additional_charges: z.number().optional(),
            remarks: z.string().optional(),
            details: z.array(z.object({
                factory_shipment_id: z.string(),
            })).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_add = ctx.permissions[m.DEBIT_NOTE]?.can_add;

                if(!can_add) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: "You do not have permission to add debit notes."
                    });
                }

                const currentYear = new Date().getFullYear();

                const meta = await ctx.db.debit_note_metadata.upsert({
                    where: { buyer_id_year: { buyer_id: input.buyer_id, year: currentYear } },
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

                const factory_prefix = await ctx.db.factories.findUnique({
                    where: { id: input.factory_id },
                    select: { prefix: true },
                });

                if(!factory_prefix) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: "Factory prefix not found."
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

                const isTT = terms.name.toLowerCase() === 'tt'

                const debitNotes= await ctx.db.$transaction(async (tx) => {
                    const dn_ref = `DBN/${buyer_prefix?.prefix}/${factory_prefix?.prefix}/${String((meta?.last_ref ?? 0)).padStart(4, '0')}}`;

                    const debitNoteHeader = await tx.debit_note.create({
                        data: {
                            term_id: input.term_id,
                            debit_note_date: input.dn_date,
                            factory_id: input.factory_id,
                            debit_note_ref: dn_ref,
                            buyer_id: input.buyer_id,
                            lc_id: isTT ? null : input.lc_sc_id,
                            sales_contract_id: isTT ? input.lc_sc_id : null,
                            less: input.less,
                            processing_charge: input.processing_charges,
                            conversion_rate: input.conversion_rate,
                            additional_adjustment: input.additional_charges,
                            remarks: input.remarks,
                        },
                    });

                    await tx.debit_note_history.create({
                        data: {
                            ...debitNoteHeader,
                            action_type: actions.ADDED,
                            action_by: ctx.user.id,
                            action_at: new Date(),
                        },
                    });

                    if (input.details && input.details.length > 0) {
                        const debitNoteDetails = input.details.map(detail => ({
                            debit_note_header_id: debitNoteHeader.id,
                            factory_shipment_id: detail.factory_shipment_id,
                        }));
                        await tx.debit_note_details.createMany({
                            data: debitNoteDetails,
                        });
                    }

                    return debitNoteHeader;
                }, {timeout: 30000});

                const newDebitNoteDetails = await ctx.db.debit_note_details.findMany({
                    where: { debit_note_header_id: debitNotes.id },
                });

                await ctx.db.debit_note_details_history.createMany({
                    data: newDebitNoteDetails?.map(detail => ({
                        ...detail,
                        action_type: actions.ADDED,
                        action_by: ctx.user.id,
                        action_at: new Date(),
                    })) ?? [],
                });

                return debitNotes;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    getShipmentDetailsForDebitNote: protectedProcedure
        .input(z.object({
            lc_sc_id: z.string(),
            term_id: z.number(),
            factory_id: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
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

                let shipmentDetails: ShipmentDetails[];

                if (isTT) {
                    shipmentDetails = await ctx.db.$queryRaw<ShipmentDetails[]>`
                        SELECT
                            FSD.id,
                            SD.buyer_po,
                            FI.invoice_no,
                            SUM(ES.delivery_quantity) * (FSD.transfer_rate - FSD.factory_rate) AS dn_value
                        FROM sales_contracts AS SC
                            INNER JOIN sales_contract_details AS SCD ON SCD.sales_contract_id = SC.id
                            INNER JOIN order_styles AS SO ON SO.order_id = SCD.order_id
                            INNER JOIN shipment_details AS SD ON SD.order_style_id = SO.id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                            INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = SD.id
                            INNER JOIN factory_invoice_details AS FID ON FID.exfactory_shipment_id = ES.id
                            INNER JOIN factory_invoice AS FI ON FI.id = FID.factory_invoice_id
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM debit_note_details AS DND
                            WHERE DND.factory_shipment_id = FSD.id
                        )
                        AND FSD.factory_rate <> FSD.transfer_rate
                        AND SC.id = ${input.lc_sc_id}
                        AND FI.factory_id = ${input.factory_id}
                        GROUP BY SD.ID, FI.ID, FSD.ID
                        ORDER BY SD.added_at DESC;
                    `;
                }
                else {
                    shipmentDetails = await ctx.db.$queryRaw<ShipmentDetails[]>`
                        SELECT
                            FSD.id,
                            SD.buyer_po,
                            FI.invoice_no,
                            SUM(ES.delivery_quantity) * (FSD.transfer_rate - FSD.factory_rate) AS dn_value
                        FROM lc_master AS LC
                            INNER JOIN lc_orders AS LO ON LO.lc_master_id = LC.id
                            INNER JOIN lc_shipments AS LS ON LS.lc_order_id = LO.id
                            INNER JOIN shipment_details AS SD ON SD.id = LS.shipment_details_id
                            INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
                            INNER JOIN exfactory_shipments AS ES ON ES.shipment_details_id = SD.id
                            INNER JOIN factory_invoice_details AS FID ON FID.exfactory_shipment_id = ES.id
                            INNER JOIN factory_invoice AS FI ON FI.id = FID.factory_invoice_id
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM debit_note_details AS DND
                            WHERE DND.factory_shipment_id = FSD.id
                        )
                        AND FSD.factory_rate <> FSD.transfer_rate
                        AND LC.id = ${input.lc_sc_id}
                        AND FI.factory_id = ${input.factory_id}
                        GROUP BY SD.ID, FI.ID, FSD.ID
                        ORDER BY SD.added_at DESC;
                    `;
                }

                return shipmentDetails;
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    deleteShipment: protectedProcedure
        .input(z.object({
            db_id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const can_delete = ctx.permissions[m.DEBIT_NOTE]?.can_delete;

                if(!can_delete) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: "You do not have permission to delete debit note shipments."
                    });
                }

                const deletedShipment = await ctx.db.$transaction(async (db) => {
                    const deletedDetail = await db.debit_note_details.findUnique({
                        where: { id: input.db_id },
                    });

                    if (!deletedDetail) {
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: "Debit note shipment not found."
                        });
                    }

                    await db.debit_note_details.delete({
                        where: { id: input.db_id },
                    });

                    await db.debit_note_details_history.create({
                        data: {
                            ...deletedDetail,
                            action_type: actions.DELETE,
                            action_by: ctx.user.id,
                            action_at: new Date(),
                        },
                    });

                    return deletedDetail;
                })
          
                return deletedShipment;
            }
            catch (error) {
                handlePrismaError(error);
            }
        })
                
})