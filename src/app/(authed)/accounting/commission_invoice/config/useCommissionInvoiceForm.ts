import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { CommissionInvoiceSchema } from "./formSchema";
import type { CommissionInvoiceFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { safeNumber } from "~/utils/numbers";
import type { GetCommissionInvoiceByIdTypes } from "~/types/accountingAPITypes";

// type RDLInvoiceDetails = NonNullable<GetDocumentSubmissionByIdTypes>['rdlInvoices'][number];

// type FactoryInvoiceShipments = NonNullable<RDLInvoiceDetails>['factoryInvoices'][number];

export const useDocumentSubmissionForm = (initialData?: GetCommissionInvoiceByIdTypes) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.id,
            term_id: initialData.term_id ?? undefined,
            buyer_id: initialData.buyer_id ?? undefined,
            invoice_date: initialData.invoice_date 
                ? formatDateForInput(new Date(initialData.invoice_date)) : '',
            ref_no: initialData.ref_no ?? '',
            lc_sc_id: initialData.lc_sc_id?.toString() ?? undefined,
            fdbc_rdl_invoice_no: initialData.fdbc_rdl_invoice_no ?? '',
            company_bank_id: initialData.company_bank_id != null ? String(initialData.company_bank_id) : undefined,
        } : undefined;
    }, [initialData]);

    const methods = useForm<CommissionInvoiceFormValues>({
        resolver: zodResolver(CommissionInvoiceSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            term_id: undefined,
            buyer_id: undefined,
            invoice_date: formatDateForInput(new Date()),
            lc_sc_id: undefined,
            ref_no: undefined,
            fdbc_rdl_invoice_no: undefined,
            company_bank_id: undefined,
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset, setValue } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset(transformedInitialData);
        }
    }, [transformedInitialData, reset]);

    const isEdit = !!initialData;

    // const term_id = useWatch({ control, name: 'term_id' });
    // const buyer_id = useWatch({ control, name: 'buyer_id' });

    // const lcList = api.documentSubmission.getScLcForDocumentSubmission.useQuery(
    //    (!!term_id && !!buyer_id && !isEdit) ? {
    //         term_id: safeNumber(term_id),
    //         buyer_id: safeNumber(buyer_id),
    //     } : skipToken
    // ).data || [];

    let lcScList: { id: string; sc_lc_no: string }[];

    // if(isEdit) {
    //     const id = initialData.lc_sc_id;

    //     lcScList = id ? [{ id: String(id), sc_lc_no: String(initialData.sc_lc_no) }] : [];
    // }
    // else {
    //     lcScList = lcList;
    // }
    
    const formFields = useFormFields({lcScList, isEdit});
    // const formFields = useFormFields({lcList: lcScList, isEdit});

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}