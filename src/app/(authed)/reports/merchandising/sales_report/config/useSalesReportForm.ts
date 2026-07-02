import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SalesReportFormSchema } from "./formSchema";
import type { SalesReportFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";

export const useSalesReportForm = () => {
    const methods = useForm<SalesReportFormValues>({
        resolver: zodResolver(SalesReportFormSchema),
        defaultValues: {
            base: 'EXFACTORY',
            from_date: formatDateForInput(new Date()),
            to_date: formatDateForInput(new Date()),
            buyer_ids: undefined,
            factory_ids: undefined,
            brand_ids: undefined,
            department_ids: undefined,
            product_type_ids: undefined,
            quantity: true,
            rdl_value: true,
            factory_value: true,
            commission_value: true,
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control } = methods;

    const buyer_ids = useWatch({ control, name: "buyer_ids" });

    const brand_ids = useWatch({ control, name: "brand_ids" });

    const formFields = useFormFields({buyer_ids: buyer_ids?.map(id => Number(id)), brand_ids: brand_ids?.map(id => Number(id))});

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}