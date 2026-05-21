import type { BaseField } from "~/types/form";
import type { TnaActionFormValues } from "../config/formSchema";

export type Field<T extends keyof TnaActionFormValues> = BaseField<T>;

export const formFields = (action: string, user_department: number | undefined, isAdmin: boolean): Field<keyof TnaActionFormValues>[] => {
    const rules: Record<string, number> = {
        "PP MEETING DATE": 4,
        "HANDOVER DATE": 2,
        "ETD DATE": 2,
    };

    const MERCHANDISING_DEPARTMENT = 1;

    const allowActualDateEdit = rules[action]
        ? user_department === rules[action]
        : user_department === MERCHANDISING_DEPARTMENT;

    return [
        {
            name: "buyer_po",   
            label: "Buyer PO",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "destination_name",
            label: "Destination",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "action_name",
            label: "Action",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "plan_date",
            label: "Plan Date",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "revise_date",
            label: "Revise Date",
            type: "date",
            optional: true,
            minDate: 2 // allow selecting dates up to 3 days (today included) in the past
        },
        {
            name: "actual_date",
            label: "Actual Date",
            type: "date",
            disabled: !(allowActualDateEdit || isAdmin),
            optional: true,
        },
    ];
}