import type { EarlySettlementFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof EarlySettlementFormValues> = BaseField<T>;

export const useFormFields = (): Field<keyof EarlySettlementFormValues>[] => {
    return [
        {
            name: 'order_id',
            label: 'Order References',
            type: 'text',
            disabled: true,
            optional: true,
        },
        {
            name: "buyer_name",
            label: "Buyer",
            placeholder: "Select buyer",
            type: 'text',
            disabled: true,
            optional: true,
        },
        {
            name: "remarks",
            label: "Remarks",
            placeholder: "Enter remarks",
            optional: true,
        },
    ]
}