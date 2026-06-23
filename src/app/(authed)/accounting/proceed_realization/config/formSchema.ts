import z from 'zod';
import { safeNumber } from '~/utils/numbers';

export const RDLInvoiceDetails = z.object({
    db_id: z.string().optional(),
    rdl_invoice_id: z.string().min(1, "Exfactory Shipment is required"),
    rdl_invoice_no: z.string().min(1, "Exfactory Shipment is required"),
    invoice_value: z.number().optional(),
    previous_proceed_value: z.number().optional(),
    proceed_value: z.number().optional(),
}).superRefine((data, ctx) => {
    if (data.invoice_value !== undefined && data.previous_proceed_value !== undefined) {
        const remainingValue = safeNumber(data.invoice_value) - safeNumber(data.previous_proceed_value);

        if (safeNumber(data.proceed_value) > remainingValue) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["proceed_value"],
                message: `Proceed value cannot exceed remaining value (${remainingValue}).`,
            });
        }
    }
});

export type RDLInvoiceDetailsFormValues = z.infer<typeof RDLInvoiceDetails>;

// Define the form fields schema using Zod
export const ProceedRealizationFormSchema = z.object({
    db_id: z.string().optional(),
    term_id: z.number().min(1, "Term is required"),
    buyer_id: z.number().min(1, "Buyer is required"),
    proceed_date: z.string().min(1, "Proceed Date is required"),
    document_submission_id: z.string().min(1, "FDBC No is required"),
    document_submission_no: z.string().optional(),
    lc_sc_no: z.string().optional(),
    bank_charge: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().optional()
    ) as z.ZodType<number | undefined>,
    document_charge: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().optional()
    ) as z.ZodType<number | undefined>,
    discount_charge: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().optional()
    ) as z.ZodType<number | undefined>,
    realized_amount: z.number().min(0, "Realized Amount must be a positive number"),
    invoice_value: z.string().optional(),
    details: z.array(RDLInvoiceDetails).optional(),
});

export type ProceedRealizationFormValues = z.infer<typeof ProceedRealizationFormSchema>;
