import z from 'zod';

const shipmentSchema = z.object({
    db_id: z.string().optional(),
    shipment_id: z.string().optional(),
    early_settlement_charge: z.number().optional(),
});

export type ShipmentFormValues = z.infer<typeof shipmentSchema>;

export const earlySettlementFormSchema = z.object({
	db_id: z.string().optional(),
	order_id: z.string().min(1, "Order ID is required"),
	buyer_name: z.string().optional(),
	remarks: z.string().optional(),
	pos: z.array(shipmentSchema).optional(),
});

export type EarlySettlementFormValues = z.infer<typeof earlySettlementFormSchema>;