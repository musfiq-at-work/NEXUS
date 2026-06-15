import z from 'zod';
import { safeNumber } from '~/utils/numbers';

export const FactoryInvoiceDetails = z.object({
    db_id: z.string().optional(),
    factory_invoice_id: z.string().min(1, "Factory Invoice is required"),
    factory_name: z.string().optional(),
    factory_invoice_no: z.string().optional(),
    factory_fdbc_no: z.string().optional(),
    factory_invoice_date: z.string().optional(),
    quantity: z.string().optional(),
    factory_invoice_value: z.string().optional(),
}); 

export type FactoryInvoiceDetailsFormValues = z.infer<typeof FactoryInvoiceDetails>;

export const RDLInvoiceDetails = z.object({
    db_id: z.string().optional(),
    rdl_invoice_id: z.string().min(1, "RDL Invoice is required"),
    rdl_invoice_no: z.string().optional(),
    invoice_date: z.string().optional(),
    quantity: z.string().optional(),
    rdl_value: z.string().optional(),
    received_rdl_value: z.string(),
    previously_received_rdl_value: z.string().optional(),
    factoryInvoices: z.array(FactoryInvoiceDetails).optional(),
})
.superRefine((data, ctx) => {
    if (data.rdl_value !== undefined && data.previously_received_rdl_value !== undefined) {
        const remainingValue = safeNumber(data.rdl_value) - safeNumber(data.previously_received_rdl_value);

        if (safeNumber(data.received_rdl_value) > remainingValue) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["received_rdl_value"],
                message: `Received value cannot exceed remaining value (${remainingValue}).`,
            });
        }
    }
});

export type DocumentSubmissionDetailsFormValues = z.infer<typeof RDLInvoiceDetails>;

// Define the form fields schema using Zod
export const DocumentSubmissionSchema = z.object({
    db_id: z.string().optional(),
    term_id: z.number().min(1, "Term is required"),
    buyer_id: z.number().min(1, "Buyer is required"),
    submission_date: z.string().min(1, "Submission Date is required"),
    fdbc_no: z.string().min(1, "FDBC/TT No is required"),
    fdbc_value: z.number().min(1, "FDBC/TT Value is required"),
    fdbc_date: z.string().min(1, "FDBC/TT Date is required"),
    lc_sc_id: z.string().min(1, "LC/SC is required"),
    awb_no: z.string().min(1, "AWB No is required"),
    lc_sc_date: z.string().optional(),
    bank_name: z.string().optional(),
    awb_date: z.string().min(1, "AWB Date is required"),
    courier_id: z.number().optional(),
    rdlInvoices: z.array(RDLInvoiceDetails).optional(),
});

export type DocumentSubmissionFormValues = z.infer<typeof DocumentSubmissionSchema>;
