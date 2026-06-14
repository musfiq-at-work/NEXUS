import type { BaseField } from "~/types/form";
import type { FactoryInvoiceDetailsFormValues } from "../config/formSchema";

export type Field<T extends keyof FactoryInvoiceDetailsFormValues> = BaseField<T>;

interface RDLInvoiceProp {
    id: string, 
    invoice_no: string
};

export const formFields = ({rdlInvoice}: {rdlInvoice: RDLInvoiceProp[] | undefined}): Field<keyof FactoryInvoiceDetailsFormValues>[] => {
    return [
        {
            name: "factory_invoice_id",
            label: "Factory Invoice",
            placeholder: "Select Factory invoice",
            type: "select",
            options: rdlInvoice?.map((f) => ({ label: f.invoice_no, value: f.id.toString() })) ?? [],
        },
        {
            name: 'factory_name',
            label: 'Factory Name',
            placeholder: 'Enter factory name',
            disabled: true,
            optional: true,
        },
        {
            name: "factory_invoice_no",
            label: "Factory Invoice No",
            placeholder: "Enter factory invoice number",
            disabled: true,
            optional: true,
        },
        {
            name: "factory_fdbc_no",
            label: "Factory FDBC No",
            placeholder: "Enter factory FDBC number",
            disabled: true,
            optional: true,
        },
        {
            name: "factory_invoice_date",
            label: "Factory Invoice Date",
            placeholder: "Enter factory invoice date",
            disabled: true,
            optional: true,
        },
        {
            name: "quantity",
            label: "Quantity",
            placeholder: "Enter quantity",
            type: "number",
            disabled: true,
            optional: true,
        },
    ]
}
