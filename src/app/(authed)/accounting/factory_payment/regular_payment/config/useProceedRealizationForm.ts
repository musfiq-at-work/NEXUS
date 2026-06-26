import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { FactoryPaymentFormSchema } from "./formSchema";
import type { FactoryPaymentFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { safeNumber } from "~/utils/numbers";
import type { GetFactoryPaymentByIdTypes } from "~/types/accountingAPITypes";

type FactoryInvoiceTypes = NonNullable<GetFactoryPaymentByIdTypes>['factoryPaymentsDetails'][number];

export const useProceedRealizationForm = (initialData?: GetFactoryPaymentByIdTypes) => {
    const transformedInitialData = useMemo(() => {
        return initialData?.factoryPayment ? {
            term_name: initialData.factoryPayment.term_name,
            fdbc_no: initialData.factoryPayment.fdbc_no ?? undefined,
            realization_date: initialData.factoryPayment.realization_date ?? undefined,
            rdl_invoice_value: initialData.factoryPayment.rdl_invoice_value ?? undefined,
            realized_amount: initialData.factoryPayment.realized_amount ?? undefined,
            factory_paid_amount: initialData.factoryPayment.factory_paid_amount ?? undefined,
            remarks: initialData.factoryPayment.remarks ?? undefined,
            details: initialData.factoryPaymentsDetails?.map((detail: FactoryInvoiceTypes) => ({
                db_id: detail.db_id,
                factory_iname: detail.factory_name ?? undefined,
                factory_invoice_no: detail.factory_invoice_no ?? undefined,
                factory_fdbc_no: detail.fdbc_no ?? undefined,
                invoice_date: detail.factory_invoice_date ?? undefined,
                invoice_quantity: detail.proceed_value ?? undefined,
                invoice_value: detail.proceed_value ?? undefined,
                paid_amount: detail.paid_amount ?? undefined,
                factory_payment_no: detail.factory_payment_no ?? undefined,
                payment_date: detail.payment_date ?? undefined,
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<ProceedRealizationFormValues>({
        resolver: zodResolver(FactoryPaymentFormSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            term_id: undefined,
            buyer_id: undefined,
            proceed_date: formatDateForInput(new Date()),
            document_submission_id: undefined,
            document_submission_no: undefined,
            bank_charge: undefined,
            discount_charge: undefined,
            document_charge: undefined,
            realized_amount: undefined,
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset, setValue } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset(transformedInitialData);
        }
    }, [transformedInitialData, reset]);

    const isEdit = !!initialData;

    const term_id = useWatch({ control, name: 'term_id' });
    const buyer_id = useWatch({ control, name: 'buyer_id' });

    const documentSubmissionList = api.proceedRealization.getDocumentSubmissionForProceedRealization.useQuery(
       (!!term_id && !!buyer_id) ? {
            term_id: safeNumber(term_id),
            buyer_id: safeNumber(buyer_id),
        } : skipToken
    ).data || [];

    let documentSubmissions;

    if(isEdit) {
        documentSubmissions = [{ 
            id: initialData.document_submission_id, 
            fdbc_no: initialData.document_submission_no ?? '' 
        }]
    }
    else {
        documentSubmissions = documentSubmissionList;
    }
    
    const formFields = useFormFields();

    const totalProceedValue = useWatch({
        control,
        name: 'details',
    })?.reduce((acc, detail) => acc + (detail.proceed_value || 0), 0) ?? 0;

    useEffect(() => {
        setValue('invoice_value', totalProceedValue.toFixed(2));
    }, [totalProceedValue, setValue]);

    return {
        methods,
        handleSubmit,
        formFields,
        validationError,
        trigger,
        watch,
        control,
    };
}
