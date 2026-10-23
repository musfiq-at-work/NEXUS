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
});

export type ProductionPlanValues = z.infer<typeof productionPlanFormSchema>;

export const approvalStatusFormSchema = z.object({
    db_id: z.string().optional(),
    status_name: z.string().optional(),
    approval_status: z.number().min(-1).max(1),
});

export type ApprovalFormValues = z.infer<typeof approvalStatusFormSchema>;

export const preProductionMeetingFormSchema = z.object({
    db_id: z.string().optional(),
    factory_id: z.number({ required_error: "Factory is required", invalid_type_error: "Factory is required" }).int().positive("Factory is required"),
    order_id: z.string().uuid("Order is required"),
    style_id: z.string().uuid("Style is required"),
    first_shipment_date: z.string().optional(),
    item: z.string().optional(),
    fabric_description: z.string().optional(),
    required_gsm: z.string().optional(),
    order_quantity: z.string().optional(),
    daily_production_plan: z.number({ required_error: "Daily production plan is required", invalid_type_error: "Daily production plan is required" })
        .int("Daily production plan must be a whole number")
        .positive("Daily production plan must be greater than zero")
        .max(2147483647, "Daily production plan is too large"),
    productionPlans: z.array(productionPlanFormSchema).optional(),
    approvalStatus: z.array(approvalStatusFormSchema).optional(),
});

export type PreProductionFormValues = z.infer<typeof preProductionMeetingFormSchema>;
