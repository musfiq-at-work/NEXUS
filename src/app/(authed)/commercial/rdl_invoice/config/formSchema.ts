import z from 'zod';

export const FactoryInvoiceDetails = z.object({
    db_id: z.string().optional(),
    order_no: z.string().optional(),
    style: z.string().optional(),
    po: z.string().optional(),
    shipment_details_id: z.string().optional(),
    order_quantity: z.number().optional(),
    destination_port: z.string().optional(),
    invoice_quantity: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().optional()
    ) as z.ZodType<number | undefined>,
    invoice_fob: z.string().optional(),
    invoice_value: z.string().optional(),
});

export type FactoryInvoiceDetailsFormValues = z.infer<typeof FactoryInvoiceDetails>;

export const RDLInvoiceDetails = z.object({
    db_id: z.string().optional(),
    factory_id: z.number().min(1, "Factory is required"),
    factory_invoice_id: z.string().optional(),
    quantity: z.number().optional(),
    factory_value: z.number().optional(),
    details: z.array(FactoryInvoiceDetails).optional(),
});

export type RDLInvoiceDetailsFormValues = z.infer<typeof RDLInvoiceDetails>;

// Define the form fields schema using Zod
export const RDLInvoiceSchema = z.object({
    db_id: z.string().optional(),
    buyer_id: z.number().min(1, "Buyer is required"),
    term_id: z.number().min(1, "Term is required"),
    lc_sc_id: z.string().min(1, "LC/SC is required"),
    invoice_no: z.string().optional(),
    invoice_date: z.string().min(1, "Invoice Date is required"),
    invoice_type: z.boolean().optional(),
    pi_no: z.string().optional(),
    container_no: z.string().optional(),
    remarks: z.string().optional(),
    freight_terms: z.string().optional(),
    consignee_ids: z.array(z.number()).optional(),
    notifyParties: z.array(z.number()).optional(),
    port_of_loading: z.string().optional(),
    discount: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().optional()
    ) as z.ZodType<number | undefined>,
    invoice_quantity: z.string().optional(),
    invoice_value: z.string().optional(),
    total_value: z.string().optional(),
    details: z.array(RDLInvoiceDetails).optional(),
});

export type RDLInvoiceFormValues = z.infer<typeof RDLInvoiceSchema>;
