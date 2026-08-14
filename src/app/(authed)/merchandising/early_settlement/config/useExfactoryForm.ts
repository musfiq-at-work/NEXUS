import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { earlySettlementFormSchema } from "./formSchema";
import type { EarlySettlementFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import type { GetEarlySettlementPercentageByIdTypes } from "~/types/libraryAPITypes";

export const useEarlySettlementPercentageForm = (settlement?: any) => {
    // Form setup
    const methods = useForm<EarlySettlementFormValues>({
        resolver: zodResolver(earlySettlementFormSchema),
        defaultValues: {
            db_id: settlement?.id ?? undefined,
            order_id: settlement?.order_id ?? undefined,
            buyer_name: settlement?.buyer_name,
            remarks: settlement?.remarks ?? 0,
            pos: settlement?.pos
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, reset } = methods;

    // Effect to reset form when percentage changes
    useEffect(() => {
        if (settlement) {
            methods.reset({
                db_id: settlement.id,
                order_id: settlement.order_id,
                buyer_name: settlement.buyer_name,
                remarks: settlement.remarks,
                pos: settlement?.pos
            });
        }
    }, [settlement, methods]);

    return { methods, handleSubmit, formFields: useFormFields(), validationError, control, reset };
}