import { TRPCError } from "@trpc/server";
import z from "zod";
import { handlePrismaError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { actions, Prisma } from "@prisma/client";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { quantityFormatter } from "~/utils/localNumberStrings";

interface SalesReport {
    buyer_name: string;
    factory_name: string;
    team_name: string;
    brand: string;
    department: string;
    quantity: number;
    rdl_value: number;
    factory_value: number;
    commission_value: number;
}

export const salesReport = createTRPCRouter({
    getSalesReport: protectedProcedure
        .input(
            z.object({
                fromDate: z.string().optional(),
                toDate: z.string().optional(),
                buyerIds: z.array(z.number()).optional(),
                factoryIds: z.array(z.number()).optional(),
                brandIds: z.array(z.number()).optional(),
                departmentIds: z.array(z.number()).optional(),
                productTypeIds: z.array(z.number()).optional(),
                teamIds: z.array(z.number()).optional(),
                quantity: z.boolean().optional(),
                rdlValue: z.boolean().optional(),
                factoryValue: z.boolean().optional(),
                commissionValue: z.boolean().optional(),
                base: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            try {
                const can_view = ctx.permissions[m.SALES_REPORT]?.can_view;
                
                if (!can_view) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You do not have permission to view sales report.",
                    });
                }

                const fromDate = input.fromDate;
                const toDate = input.toDate;
                const base = input.base;

                const buyerIds = input.buyerIds ?? [];
                const factoryIds = input.factoryIds ?? [];
                const brandIds = input.brandIds ?? [];
                const departmentIds = input.departmentIds ?? [];
                const productTypeIds = input.productTypeIds ?? [];
                const teamIds = input.teamIds ?? [];

                const isFactoryNone = factoryIds.includes(-2);
                const isBrandNone = brandIds.includes(-2);
                const isDepartmentNone = departmentIds.includes(-2);
                const isProductTypeNone = productTypeIds.includes(-2);
                const isTeamNone = teamIds.includes(-2);

                const isFactoryAll = factoryIds.includes(-1);
                const isBrandAll = brandIds.includes(-1);
                const isDepartmentAll = departmentIds.includes(-1);
                const isProductTypeAll = productTypeIds.includes(-1);
                const isTeamAll = teamIds.includes(-1);

                const isFactoryDimension = !isFactoryNone && factoryIds.length > 0;
                const isBrandDimension = !isBrandNone && brandIds.length > 0;
                const isDepartmentDimension = !isDepartmentNone && departmentIds.length > 0;
                const isProductTypeDimension = !isProductTypeNone && productTypeIds.length > 0;
                const isTeamDimension = !isTeamNone && teamIds.length > 0;

                const isFactorySelected = isFactoryDimension && !isFactoryAll;
                const isBrandSelected = isBrandDimension && !isBrandAll;
                const isDepartmentSelected = isDepartmentDimension && !isDepartmentAll;
                const isProductTypeSelected = isProductTypeDimension && !isProductTypeAll;
                const isTeamSelected = isTeamDimension && !isTeamAll;

                // -----------------------------------------------------------------------------
                // SELECT
                // -----------------------------------------------------------------------------

                const selectFields: Prisma.Sql[] = [
                    Prisma.sql`B.buyer_name`,
                ];

                if (isFactoryDimension) {
                    selectFields.push(Prisma.sql`F.name AS factory_name`);
                }

                if (isTeamDimension) {
                    selectFields.push(Prisma.sql`T.team_name`);
                }

                if (isBrandDimension) {
                    selectFields.push(Prisma.sql`BB.brand`);
                }

                if (isDepartmentDimension) {
                    selectFields.push(Prisma.sql`BD.department`);
                }

                selectFields.push(
                    Prisma.sql`SUM(SID.quantity) AS quantity`,
                    Prisma.sql`SUM(SID.quantity * SD.FOB_RATE / BO.currency_rate) AS rdl_value`,
                    Prisma.sql`SUM(SID.quantity * COALESCE(FSD.FACTORY_RATE, 1) / FO.CURRENCY_RATE) AS FACTORY_VALUE,`,
                    Prisma.sql`SUM(SID.quantity * SD.fob_rate) - SUM(SID.quantity * COALESCE(FSD.factory_rate, 1)) AS commission_value`
                );

                // -----------------------------------------------------------------------------
                // JOINS
                // -----------------------------------------------------------------------------

                const joins: Prisma.Sql[] = [
                    Prisma.sql`INNER JOIN order_styles AS OS ON OS.order_id = BO.id`,
                    Prisma.sql`INNER JOIN buyers AS B ON B.id = BO.buyer_id`,
                    Prisma.sql`INNER JOIN shipment_details AS SD ON SD.order_style_id = OS.id`,
                    Prisma.sql`INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id`,
                    Prisma.sql`INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id`,
                ];

                if (isFactoryDimension) {
                    joins.push(
                        Prisma.sql`INNER JOIN factories AS F ON F.id = BO.factory_id`
                    );
                }

                if (isTeamDimension) {
                    joins.push(
                        Prisma.sql`INNER JOIN teams AS T ON T.id = BO.team_id`
                    );
                }

                if (isBrandDimension) {
                    joins.push(
                        Prisma.sql`INNER JOIN buyer_brands AS BB ON BB.id = BO.brand_id`
                    );
                }

                if (isDepartmentDimension) {
                    joins.push(
                        Prisma.sql`INNER JOIN buyer_departments AS BD ON BD.id = BO.department_id`
                    );
                }

                // -----------------------------------------------------------------------------
                // WHERE
                // -----------------------------------------------------------------------------

                const filters: Prisma.Sql[] = [];

                switch (base) {
                    case "EXFACTORY":
                        filters.push(
                            Prisma.sql`FSD.exfactory_date BETWEEN ${fromDate} AND ${toDate}`
                        );
                        break;

                    case "HANDOVER":
                        filters.push(
                            Prisma.sql`SD.handover_date BETWEEN ${fromDate} AND ${toDate}`
                        );
                        break;

                    case "ETD":
                        filters.push(
                            Prisma.sql`SD.etd_date BETWEEN ${fromDate} AND ${toDate}`
                        );
                        break;
                }

                if (buyerIds.length > 0) {
                    filters.push(
                        Prisma.sql`B.id IN (${Prisma.join(buyerIds)})`
                    );
                }

                if (isFactorySelected) {
                    filters.push(
                        Prisma.sql`BO.factory_id IN (${Prisma.join(factoryIds)})`
                    );
                }

                if (isBrandSelected) {
                    filters.push(
                        Prisma.sql`BO.brand_id IN (${Prisma.join(brandIds)})`
                    );
                }

                if (isDepartmentSelected) {
                    filters.push(
                        Prisma.sql`BO.department_id IN (${Prisma.join(departmentIds)})`
                    );
                }

                if (isProductTypeSelected) {
                    filters.push(
                        Prisma.sql`OS.product_type_id IN (${Prisma.join(productTypeIds)})`
                    );
                }

                if (isTeamSelected) {
                    filters.push(
                        Prisma.sql`BO.team_id IN (${Prisma.join(teamIds)})`
                    );
                }

                // -----------------------------------------------------------------------------
                // GROUP BY
                // -----------------------------------------------------------------------------

                const groupByFields: Prisma.Sql[] = [
                    Prisma.sql`B.id`,
                ];

                if (isFactoryDimension) {
                    groupByFields.push(Prisma.sql`F.id`);
                }

                if (isTeamDimension) {
                    groupByFields.push(Prisma.sql`T.id`);
                }

                if (isBrandDimension) {
                    groupByFields.push(Prisma.sql`BB.id`);
                }

                if (isDepartmentDimension) {
                    groupByFields.push(Prisma.sql`BD.id`);
                }

                // -----------------------------------------------------------------------------
                // QUERY
                // -----------------------------------------------------------------------------

                const result = await ctx.db.$queryRaw<SalesReport[]>`
                    SELECT
                        ${Prisma.join(selectFields, ", ")}
                    FROM buyer_orders AS BO
                        INNER JOIN factory_orders AS FO ON FO.order_id = BO.id
                        ${Prisma.join(joins, "\n")}
                    WHERE
                        ${Prisma.join(filters, " AND ")}
                    GROUP BY
                        ${Prisma.join(groupByFields, ", ")}
                `;

                const salesReportData = result.map((row) => ({
                    buyer_name: row.buyer_name,
                    factory_name: row.factory_name ?? "",
                    team_name: row.team_name ?? "",
                    brand: row.brand ?? "",
                    department: row.department ?? "",
                    quantity: quantityFormatter(Number(row.quantity) ?? 0),
                    rdl_value: quantityFormatter(Number(row.rdl_value) ?? 0),
                    factory_value: quantityFormatter(Number(row.factory_value) ?? 0),
                    commission_value: quantityFormatter(Number(row.commission_value) ?? 0),
                }));

                return salesReportData;
            }
            catch (error) {
                handlePrismaError(error);
            }
        })

})