import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { SalesReportFormSchema } from "./formSchema";
import type { SalesReportFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { safeNumber } from "~/utils/numbers";

export const useCommissionInvoiceForm = () => {
    const methods = useForm<SalesReportFormValues>({
        resolver: zodResolver(SalesReportFormSchema),
        defaultValues: {
            base: undefined,
            from_date: formatDateForInput(new Date()),
            to_date: formatDateForInput(new Date()),
            buyer_ids: undefined,
            factory_ids: undefined,
            department_ids: undefined,
            product_type_ids: undefined,
            quantity: undefined,
            rdl_value: undefined,
            factory_value: undefined,
            commission_value: undefined,
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset, setValue } = methods;

    const buyer_ids = useWatch({ control, name: "buyer_ids" });

    const formFields = useFormFields({buyer_ids});

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}