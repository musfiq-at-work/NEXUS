import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrderSummaryReportFormSchema } from "./formSchema";
import type { OrderSummaryReportFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";

export const useOrderSummaryReport = () => {
    const methods = useForm<OrderSummaryReportFormValues>({
        resolver: zodResolver(OrderSummaryReportFormSchema),
        defaultValues: {
            from_date: formatDateForInput(new Date()),
            to_date: formatDateForInput(new Date()),
            buyer_ids: undefined,
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control } = methods;

    const formFields = useFormFields();

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}