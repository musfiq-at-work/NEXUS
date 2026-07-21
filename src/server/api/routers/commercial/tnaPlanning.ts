import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID, ETD_DATE_DB_ID } from "~/utils/config";

interface CommercialTNAPlanning {
    invoice_no: string;
    buyer_name: string;
    factory_name: string;
    template_name: string;
    exfactory_date: Date;
    added_at: Date;
    total_count: bigint;
}

export const commercialTnaPlanRouter = createTRPCRouter({
    getTnaPlanning: protectedProcedure
        .input(z.object({
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ctx, input}) => {
            try {
                const can_view = ctx.permissions[m.TNA_PLANNING_COMMERCIAL]?.can_view;

                if(!can_view) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to view RDL Invoices." 
                    });
                }

                const result = await ctx.db.$queryRaw<CommercialTNAPlanning[]>`
                    WITH COMMERCIAL_TNA AS (
                        SELECT
                            FI.INVOICE_NO,
                            B.BUYER_NAME,
                            F.NAME AS FACTORY_NAME,
                            CTT.TEMPLATE_NAME,
                            MIN(E.EXFACTORY_DATE) AS EXFACTORY_DATE,
                            FI.ADDED_AT
                        FROM commercial_tna_planning AS CTP
                            INNER JOIN factory_invoice AS FI ON FI.id = CTP.factory_invoice_id
                            INNER JOIN commercial_tna_templates AS CTT ON CTT.id = CTP.commercial_tna_template_id
                            INNER JOIN BUYERS AS B ON B.id = FI.buyer_id
                            INNER JOIN factories AS F ON F.id = FI.factory_id
                            INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FI.id
                            INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                            INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                            INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
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
                                WHERE T.BUYER_ID = B.id
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        GROUP BY FI.ID, B.ID, F.ID, CTT.ID
                        ORDER BY ADDED_AT
                    )
                    SELECT 
                        *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM COMMERCIAL_TNA
                    ORDER BY ADDED_AT
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const tnaPlans = result.map(({ total_count: _, ...invoice }) => invoice);

                return { tnaPlans, total };
            }
            catch (error) {
                handlePrismaError(error);
            }
        }),

    searchTNAPlans: protectedProcedure
        .input(z.object({
            query: z.string(),
            limit: z.number(),
            offset: z.number(),
        }))
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.TNA_PLANNING_COMMERCIAL]?.can_view;

                if(!can_view) {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "You do not have permission to view RDL Invoices." 
                    });
                }

                const result = await ctx.db.$queryRaw<CommercialTNAPlanning[]>`
                    WITH COMMERCIAL_TNA AS (
                        SELECT
                            FI.INVOICE_NO,
                            B.BUYER_NAME,
                            F.NAME AS FACTORY_NAME,
                            CTT.TEMPLATE_NAME,
                            MIN(E.EXFACTORY_DATE) AS EXFACTORY_DATE,
                            FI.ADDED_AT
                        FROM commercial_tna_planning AS CTP
                            INNER JOIN factory_invoice AS FI ON FI.id = CTP.factory_invoice_id
                            INNER JOIN commercial_tna_templates AS CTT ON CTT.id = CTP.commercial_tna_template_id
                            INNER JOIN BUYERS AS B ON B.id = FI.buyer_id
                            INNER JOIN factories AS F ON F.id = FI.factory_id
                            INNER JOIN factory_invoice_details AS FID ON FID.factory_invoice_id = FI.id
                            INNER JOIN exfactory_shipments AS ES ON ES.id = FID.exfactory_shipment_id
                            INNER JOIN exfactory_orders AS EO ON EO.id = ES.exfactory_orders_id
                            INNER JOIN exfactory AS E ON E.id = EO.exfactory_id
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
                                WHERE T.BUYER_ID = B.id
                                    AND TM.USER_ID = ${ctx.user.id}
                            )
                        )
                        AND (
                            FI.INVOICE_NO ILIKE '%' || ${input.query} || '%'
                            OR B.BUYER_NAME ILIKE '%' || ${input.query} || '%'
                            OR F.NAME ILIKE '%' || ${input.query} || '%'
                            OR CTT.TEMPLATE_NAME ILIKE '%' || ${input.query} || '%'
                        )
                        GROUP BY FI.ID, B.ID, F.ID, CTT.ID
                        ORDER BY ADDED_AT
                    )
                    SELECT 
                        *,
                        COUNT(*) OVER() AS TOTAL_COUNT
                    FROM COMMERCIAL_TNA
                    ORDER BY ADDED_AT
                    LIMIT ${input.limit}
                    OFFSET ${input.offset};
                `;

                const total = result.length > 0 ? Number(result[0]?.total_count) : 0;
                const tnaPlans = result.map(({ total_count: _, ...invoice }) => invoice);

                return { tnaPlans, total };
            }
            catch (error) {
                handlePrismaError(error);
            }
        })
})
