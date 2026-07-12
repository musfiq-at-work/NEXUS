import z from 'zod';

export const CrossPaymentDetails = z.object({
    db_id: z.string().optional(),
    factory_invoice_id: z.string(),
    factory_invoice_no: z.string().optional(),
    factory_payment_no: z.string().optional(),
    factory_invoice_date: z.string().optional(),
    factory_name: z.string().optional(),
    invoice_quantity: z.number().optional(),
    invoice_value: z.number().optional(),
    value: z.string().optional(),
    factory_payment_date: z.string().optional(),
});

export type CrossPaymentDetailsFormValues = z.infer<typeof CrossPaymentDetails>;

// Define the form fields schema using Zod
export const CrossPaymentFormSchema = z.object({
    db_id: z.string().optional(),
    cross_payment_ref: z.string().optional(),
    term_id: z.number(),
    buyer_id: z.number(),
    cross_payment_date: z.string(),
    value: z.number().optional(),
    remarks: z.string().optional(),
    details: z.array(CrossPaymentDetails).optional(),
});

export type CrossPaymentFormValues = z.infer<typeof CrossPaymentFormSchema>;
