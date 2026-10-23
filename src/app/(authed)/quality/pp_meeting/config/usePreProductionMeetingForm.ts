import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { preProductionMeetingFormSchema, type PreProductionFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";

export const usePreProductionMeetingForm = () => {
    const methods = useForm<PreProductionFormValues>({
        resolver: zodResolver(preProductionMeetingFormSchema),
        defaultValues: {
            order_id: '',
            style_id: '',
            first_shipment_date: '',
            item: '',
            fabric_description: '',
            required_gsm: '',
            order_quantity: '',
        },
    });

    const { handleSubmit, formState: { errors: validationError }, control, resetField, setValue } = methods;
    const factoryId = useWatch({ control, name: 'factory_id' });
    const orderId = useWatch({ control, name: 'order_id' });
    const styleId = useWatch({ control, name: 'style_id' });
    
    const { formFields, selectedStyle, queryError, isLoadingOptions, emptyMessage } = useFormFields({ factoryId, orderId, styleId });

    useEffect(() => {
        resetField('order_id');
        resetField('style_id');
    }, [factoryId, resetField]);

    useEffect(() => {
        resetField('style_id');
    }, [orderId, resetField]);

    useEffect(() => {
        const firstShipmentDate = selectedStyle?.shipment_details[0]?.factory_shipment_details?.exfactory_date;
        const fabric = selectedStyle?.fabrics;

        setValue('first_shipment_date', firstShipmentDate ? formatDateForInput(firstShipmentDate) : '');
        setValue('item', selectedStyle?.products.name ?? '');
        setValue('fabric_description', fabric?.description ?? fabric?.name ?? '');
        setValue('required_gsm', fabric?.value != null ? `${fabric.value} ${fabric.unit ?? ''}`.trim() : '');
        setValue('order_quantity', selectedStyle ? String(selectedStyle.order_quantity) : '');
    }, [selectedStyle, setValue]);

    return { methods, handleSubmit, formFields, validationError, control, queryError, isLoadingOptions, emptyMessage, selectedStyle };
};
