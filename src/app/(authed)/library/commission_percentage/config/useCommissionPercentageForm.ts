import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetCommissionPercentageByIdTypes } from "~/types/libraryAPITypes";

export const useCommissionPercentageForm = (commissionPercentages?: GetCommissionPercentageByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            db_id: commissionPercentages?.id ?? undefined,
            buyer_id: commissionPercentages?.buyer_id ? commissionPercentages.buyer_id : -1,
            other_percentage: commissionPercentages?.other_percentage ?? 0,
            overseas_percentage: commissionPercentages?.overseas_percentage ?? 0,
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, reset } = methods;

    // Effect to reset form when handoverData changes
    useEffect(() => {
        if (commissionPercentages) {
            methods.reset({
                db_id: commissionPercentages.id,
                buyer_id: commissionPercentages.buyer_id ? commissionPercentages.buyer_id : -1,
                other_percentage: commissionPercentages.other_percentage ?? 0,
                overseas_percentage: commissionPercentages.overseas_percentage ?? 0,
            });
        }
    }, [commissionPercentages, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    const isEdit = !!commissionPercentages;

    return { methods, handleSubmit, formFields: formFields(isEdit), validationError, control, reset };
}