import z from 'zod';

export const DebitNoteDetails = z.object({
    db_id: z.string().optional(),
    po_no: z.string().optional(),
    factory_shipment_id: z.string(),
    factory_invoice_no: z.string().optional(),
    value: z.string().optional(),
});

export type DebitNoteDetailsFormValues = z.infer<typeof DebitNoteDetails>;

// Define the form fields schema using Zod
export const DebitNoteFormSchema = z.object({
    db_id: z.string().optional(),
    term_id: z.string(),
    dn_date: z.string(),
    factory_id: z.string(),
    dn_ref: z.string().optional(),
    buyer_id: z.string(),
    lc_sc_id: z.string(),
    less: z.number().optional(),
    processing_charges: z.number().optional(),
    conversion_rate: z.number().optional(),
    additional_charges: z.number().optional(),
    remarks: z.string().optional(),
    details: z.array(DebitNoteDetails).optional(),
});

export type DebitNoteFormValues = z.infer<typeof DebitNoteFormSchema>;
