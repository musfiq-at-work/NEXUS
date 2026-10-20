import type { OrderFormDetailsValues } from "../config/formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof OrderFormDetailsValues> = BaseField<T>;

export const formFields = (): Field<keyof OrderFormDetailsValues>[] => {
    return [
        {
            name: "serial_no",
            label: "SL",
            placeholder: "Enter Style",
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "document_details",
            label: "Document Details",
            placeholder: "Enter Document details",
            type: 'text',
            optional: true,
            disabled: true,
        },
        {
            name: "technical_check",
            label: "Technical",
            placeholder: "Enter Destination",
            type: 'checkbox',
            optional: true,
        },
        {
            name: "technical_remarks",
            label: "Remarks",
            placeholder: "Enter Remarks",
            type: 'text',
            optional: true,
        },
        {
            name: "technical_check_date",
            label: "Technical Date",
            placeholder: "Enter date",
            type: 'date',
            optional: true,
        },
        {
            name: "qa_check",
            label: "QA",
            placeholder: "QA",
            type: 'checkbox',
            optional: true,
        },
        {
            name: "qa_remarks",
            label: "Remarks",
            placeholder: "Enter Remarks",
            type: 'text',
            optional: true,
        },
        {
            name: "qa_check_date",
            label: "QA Date",
            placeholder: "Enter Date",
            type: 'date',
            optional: true,
        },
    ]
}
