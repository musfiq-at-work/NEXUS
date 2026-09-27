import type { BaseField } from "~/types/form";
import type { CrossPayReportFormValues } from "./formSchema";

export const useFormFields = (): BaseField<keyof CrossPayReportFormValues>[] => [
    {
        name: "cross_pay_from",
        label: "Cross Payment From Date",
        type: "date",
        optional: true,
    },
    {
        name: "cross_pay_to",
        label: "Cross Payment To Date",
        type: "date",
        optional: true,
    },
    {
        name: "factory_pay_from",
        label: "Factory Payment From Date",
        type: "date",
        optional: true,
    },
    {
        name: "factory_pay_to",
        label: "Factory Payment To Date",
        type: "date",
        optional: true,
    },
];