import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { tnaPlanningSchema } from "./formSchema";
import type { TNAPlanningFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { safeNumber } from "~/utils/numbers";
import type { GetRdlInvoiceByIdTypes } from "~/types/commercialAPITypes";

// type RDLInvoiceDetails = NonNullable<GetRdlInvoiceByIdTypes>['rdl_invoice_details'][number];

// type RDLInvoiceShipments = NonNullable<RDLInvoiceDetails>['rdl_invoice_shipment_details'][number];

export const useRDLInvoiceForm = (initialData?: any) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.id,
            factory_invoice: initialData.factory_invoice ?? undefined,
            tna_template: initialData.tna_template ?? undefined,
            details: initialData.rdl_invoice_details?.map((detail: any) => ({
                db_id: detail.id,
                tna_action: detail.factory_id?.toString() ?? undefined,
                plan_date: detail?.factory_invoice?.id ?? undefined,
                actual_date: detail?.actual_date ? formatDateForInput(detail?.actual_date) : undefined,
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<TNAPlanningFormValues>({
        resolver: zodResolver(tnaPlanningSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            factory_invoice: undefined,
            tna_template: undefined,
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset, setValue } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset(transformedInitialData);
        }
    }, [transformedInitialData, reset]);

    const formFields = useFormFields();

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}