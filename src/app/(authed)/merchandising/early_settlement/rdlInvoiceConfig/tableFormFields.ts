import type { ShipmentFormValues } from "../config/formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof ShipmentFormValues> = BaseField<T>;

export const formFields = (): Field<keyof ShipmentFormValues>[] => {
    return [
        {
            name: "style",
            label: "Style",
            placeholder: "Enter Style",
            optional: true,
            disabled: true,
        },
        {
            name: "buyer_po",
            label: "Buyer PO",
            placeholder: "Enter PO",
            optional: true,
            disabled: true,
        },
        {
            name: "destination",
            label: "Destination",
            placeholder: "Enter Destination",
            optional: true,
            disabled: true,
        },
        {
            name: "size",
            label: "Size",
            placeholder: "Enter size",
            optional: true,
            disabled: true,
        },
        {
            name: "order_quantity",
            label: "Order Quantity",
            placeholder: "Enter Quantity",
            optional: true,
            disabled: true,
        },
        {
            name: "fob_rate",
            label: "FOB Rate",
            placeholder: "Enter FOB Rate",
            optional: true,
            disabled: true,
        },
        {
            name: "rdl_value",
            label: "RDL Value",
            placeholder: "Enter RDL value",
            optional: true,
            disabled: true,
        },
        {
            name: "early_settlement_charge",
            label: "Early Settlement Charge",
            placeholder: "Enter Settlement Charge",
            type: 'number',
        },
        {
            name: "effective_rdl_fob",
            label: "Effective RDL FOB",
            placeholder: "Enter Effective RDL FOB",
            optional: true,
            disabled: true,
        },
        {
            name: "effective_rdl_value",
            label: "Effective RDL Value",
            placeholder: "Enter Effective RDL Value",
            optional: true,
            disabled: true,
        },
        {
            name: "factory_rate",
            label: "Factory Rate",
            placeholder: "Enter Factory Rate",
            optional: true,
            disabled: true,
        },
        {
            name: "factory_value",
            label: "Factory Value",
            placeholder: "Enter Factory Value",
            optional: true,
            disabled: true,
        },
        {
            name: "commission",
            label: "Commission",
            placeholder: "Enter Commission",
            optional: true,
            disabled: true,
        },
        {
            name: "dhaka_percentage",
            label: "Dhaka Commission",
            placeholder: "Enter Dhaka Commission",
            optional: true,
            disabled: true,
        },
        {
            name: "dhaka_commission",
            label: "Dhaka Commission",
            placeholder: "Enter Dhaka Commission",
            optional: true,
            disabled: true,
        },
        {
            name: "others_percentage",
            label: "Other Commission",
            placeholder: "Enter Other Commission",
            optional: true,
            disabled: true,
        },
        {
            name: "other_commission",
            label: "Other Commission",
            placeholder: "Enter Other Commission",
            optional: true,
            disabled: true,
        },
        {
            name: "overseas_percentage",
            label: "Overseas Commission",
            placeholder: "Enter Overseas Commission",
            optional: true,
            disabled: true,
        },
        {
            name: "overseas_commission",
            label: "Overseas Commission",
            placeholder: "Enter Overseas Commission",
            optional: true,
            disabled: true,
        },
    ]
}
