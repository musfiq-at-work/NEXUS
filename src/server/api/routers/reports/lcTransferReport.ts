import { TRPCError } from "@trpc/server";
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { handlePrismaError, logError } from "~/server/_utils/handleTRPCErrors";
import { m } from "~/utils/moduleMap";
import { safeNumber } from "~/utils/numbers";


export const lcTransferReportRouter = createTRPCRouter({
    getLCByBuyerId: protectedProcedure
        .input(z.object({
            buyer_id: z.number()
        }))
        .query(async ({ctx, input}) => {
            try {
                const lcs = await ctx.db.lc_master.findMany({
                    where: {
                        buyer_id: input.buyer_id
                    },
                    select: {
                        id: true,
                        lc_no: true
                    }
                })

                return lcs;
            }
            catch (error){
                await logError(error, ctx, input);
                handlePrismaError(error);
            }
        })

})
/**

SELECT
    F.name,
    LCD.lc_transfer_value,
    LCD.lc_transfer_quantity,
    LCD.lc_transfer_date
FROM lc_transfer AS LCT
    INNER JOIN lc_transfer_details AS LCD ON LCD.lc_transfer_id = LCT.id
    INNER JOIN factories AS F ON F.id = LCD.factory_id 
WHERE LCT.lc_master_id = '1543bdf9-4b58-4330-a70a-32def904a74a';


SELECT 
    B.buyer_name,
    LC.lc_no,
    SUM(SID.quantity * SD.fob_rate) AS LC_VALUE,
    SUM(SID.quantity) AS LC_QUANTITY
FROM lc_master AS LC
    INNER JOIN lc_shipments AS LCS ON LCS.lc_master_id = LC.id
    INNER JOIN shipment_details AS SD ON SD.id = LCS.shipment_details_id
    INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
    INNER JOIN buyers AS B ON B.id = LC.buyer_id
WHERE LC.id = '1543bdf9-4b58-4330-a70a-32def904a74a'
GROUP BY B.ID, LC.ID;

 */