import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof FormValues> = BaseField<T>;

export const formFields = (isEdit: boolean): Field<keyof FormValues>[] => {
    const buyers = api.commissionPercentage.getBuyerForCommissionPercentage.useQuery().data ?? [];

    return [
        {
            name: 'buyer_id',
            label: 'Buyer',
            type: "select",
            options: buyers.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: 'other_percentage',
            label: 'Other Percentage',
            type: "number",
            disabled: false,
            optional: false,
        },
        {
            name: 'overseas_percentage',
            label: 'Overseas Percentage',
            type: "number",
            disabled: false,
            optional: false,
        },
    ];
}