import z from 'zod';

// Define the form fields schema using Zod
export const productionPlanFormSchema = z.object({
    db_id: z.string().optional(),
    color_name: z.string().optional(),
    po_no: z.string().optional(),
    order_quantity: z.number().optional(),
    cutting_date: z.string().optional(),
    sewing_date: z.string().optional(),
    finishing_date: z.string().optional(),
    plan_inspection_date: z.string().optional(),
})

export type ProductionPlanValues = z.infer<typeof productionPlanFormSchema>;

export const approvalStatusFormSchema = z.object({
    db_id: z.string().optional(),
    buyer_id: z.number().min(0, "Buyer is required"),
    order_id: z.string().min(1, "Order is required"),
    style_id: z.string().min(1, "Style is required"),
    po_id: z.string().min(1, "PO is required"),
    factory_name: z.string().optional(),
    details: z.array(productionPlanFormSchema).optional(),
})

export type ApprovalFormValues = z.infer<typeof approvalStatusFormSchema>;

export const preProductionMeetingFormSchema = z.object({
    db_id: z.string().optional(),
    buyer_id: z.number().min(0, "Buyer is required"),
    order_id: z.string().min(1, "Order is required"),
    style_id: z.string().min(1, "Style is required"),
    po_id: z.string().min(1, "PO is required"),
    factory_name: z.string().optional(),
    details: z.array(productionPlanFormSchema).optional(),
})

export type PreProductionFormValues = z.infer<typeof preProductionMeetingFormSchema>;
