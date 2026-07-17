import z from 'zod';

// Define the form fields schema using Zod
export const OrderSummaryReportFormSchema = z.object({
    from_date: z.string().min(1, "From Date is required"),
    to_date: z.string().min(1, "To Date is required"),
    buyer_ids: z.array(z.number()).optional(),
});

export type OrderSummaryReportFormValues = z.infer<typeof OrderSummaryReportFormSchema>;
