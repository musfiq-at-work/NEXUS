/**
 * @description
 * This file defines the form schema for the RDL invoice form in the commercial module of the application. 
 * It uses Zod, a TypeScript-first schema declaration and validation library, to define the structure and validation rules for the form data.
 * The `RDLInvoiceDetails` schema represents the details of each invoice, including an optional `db_id` and a required `exfactory_shipment_id`.
 * The `RDLInvoiceFormSchema` schema represents the main form data, 
 * including fields such as `factory_id`, `buyer_id`, `term_id`, `lc_sc_id`, `invoice_no`, `invoice_date`, and optional fields like `remarks`, `discount`, `invoice_quantity`, `invoice_value`, and `total_value`. 
 * It also includes an optional array of `details` which follows the structure defined in the `RDLInvoiceDetails` schema.
 * The use of Zod allows for robust validation of form data, ensuring that required fields are present and that the data types are correct before submission.
 */
import z from 'zod';

export const FactoryInvoiceDetails = z.object({
    db_id: z.string().optional(),
    order_no: z.string().optional(),
    style: z.string().optional(),
    po: z.string().optional(),
    order_quantity: z.number().optional(),
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
});

export type RDLInvoiceDetailsFormValues = z.infer<typeof RDLInvoiceDetails>;

// Define the form fields schema using Zod
export const RDLInvoiceSchema = z.object({
    db_id: z.string().optional(),
    buyer_id: z.number().min(1, "Buyer is required"),
    term_id: z.number().min(1, "Term is required"),
    lc_sc_id: z.string().min(1, "LC/SC is required"),
    invoice_no: z.string().min(1, "Invoice No is required"),
    invoice_date: z.string().min(1, "Invoice Date is required"),
    invoice_type: z.boolean().optional(),
    pi_no: z.string().optional(),
    remarks: z.string().optional(),
    freight_term_id: z.number().optional(),
    consignee_ids: z.array(z.number()).optional(),
    notifyParties: z.array(z.number()).optional(),
    port_of_loading: z.number().optional(),
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
