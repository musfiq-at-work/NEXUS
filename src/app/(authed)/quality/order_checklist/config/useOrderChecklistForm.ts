import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { orderChecklistFormSchema } from "./formSchema";
import type { OrderChecklistFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDate, formatDateForInput } from "~/utils/localDateString";
// import type { GetTNAPlanByIdTypes } from "~/types/commercialAPITypes";

// type TNAActionsDetails = NonNullable<GetTNAPlanByIdTypes>['details'][number];

export const useOrderChecklistForm = (initialData?: any) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.id,
            buyer_id: initialData.buyer_id ?? undefined,
            order_id: initialData.order_id ?? undefined,
            style_id: initialData.style_id ?? undefined,
            po_id: initialData.po_id ?? undefined,
            factory_name: initialData.factory_name ?? undefined,
            details: initialData.details?.map((detail: any) => ({
                db_id: detail.id,
                serial_no: detail.serial_no ?? undefined,
                document_details: detail.document_details ?? undefined,
                technical_check: detail.technical_check ?? undefined,
                technical_remarks: detail.technical_remarks ?? undefined,
                technical_check_date: detail?.technical_check_date ? formatDateForInput(detail?.technical_check_date) : undefined,
                qa_check: detail.qa_check ?? undefined,
                qa_remarks: detail.qa_remarks ?? undefined,
                qa_check_date: detail?.qa_check_date ? formatDateForInput(detail?.qa_check_date) : undefined,
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<OrderChecklistFormValues>({
        resolver: zodResolver(orderChecklistFormSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            buyer_id: undefined,
            style_id: undefined,
            po_id: undefined,
            factory_name: undefined,
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset, setValue } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset(transformedInitialData);
        }
    }, [transformedInitialData, reset]);


    const buyerId = useWatch({ control, name: 'buyer_id' });
    const orderId = useWatch({ control, name: 'order_id' });
    const styleId = useWatch({ control, name: 'style_id' });

    const formFields = useFormFields({ buyerId, orderId, styleId });

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}