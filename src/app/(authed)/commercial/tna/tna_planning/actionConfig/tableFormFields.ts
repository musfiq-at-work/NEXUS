import type { BaseField } from "~/types/form";
import type { TNAPlanningDetailsFormValues } from "../config/formSchema";

export type Field<T extends keyof TNAPlanningDetailsFormValues> = BaseField<T>;

export const formFields = (
    action: string, user_department: number | undefined, isAdmin: boolean
): Field<keyof TNAPlanningDetailsFormValues>[] => {
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
            name: "tna_action",   
            label: "TNA Action",
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
            name: "actual_date",
            label: "Actual Date",
            type: "date",
            disabled: !(allowActualDateEdit || isAdmin),
            optional: true,
        },
    ];
}