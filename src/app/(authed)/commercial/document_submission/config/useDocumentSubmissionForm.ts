import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { DocumentSubmissionSchema } from "./formSchema";
import type { DocumentSubmissionFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { safeNumber } from "~/utils/numbers";
import type { GetRdlInvoiceByIdTypes } from "~/types/commercialAPITypes";

// type RDLInvoiceDetails = NonNullable<GetRdlInvoiceByIdTypes>['rdl_invoice_details'][number];

// type RDLInvoiceShipments = NonNullable<RDLInvoiceDetails>['rdl_invoice_shipment_details'][number];

export const useDocumentSubmissionForm = (initialData?: any) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.id,
            buyer_id: initialData.buyer_id ?? undefined,
            term_id: initialData.term_id ?? undefined,
            lc_sc_id: initialData.sales_contracts?.id?.toString() 
                ? initialData.sales_contracts?.id?.toString() 
                : initialData.lc_master?.id?.toString() ?? '',
            fdbc_no: initialData.fdbc_no ?? '',
            fdbc_date: initialData.fdbc_date ? formatDateForInput(new Date(initialData.fdbc_date)) : '',
            fdbc_value: initialData.fdbc_value ?? undefined,
            submission_date: initialData.submission_date ? formatDateForInput(new Date(initialData.submission_date)) : '',
            awb_no: initialData.awb_no ?? '',
            awb_date: initialData.awb_date ? formatDateForInput(new Date(initialData.awb_date)) : '',
            courier_id: initialData.courier_id ?? undefined,
            rdlInvoices: initialData.rdl_invoice_details?.map((detail: any) => ({
                db_id: detail.id,
                rdl_invoice_id: detail.rdl_invoice_id?.toString() ?? undefined,
                rdl_invoice_no: detail?.rdl_invoice_no?.invoice_no ?? undefined,
                quantity: detail.quantity ? detail.quantity.toString() : undefined,
                rdl_value: detail.rdl_value ? detail.rdl_value.toString() : undefined,
                factoryInvoices: detail.rdl_invoice_shipment_details?.map((shipment: any) => ({
                    db_id: shipment.id,
                    factory_name: shipment.factory_name ?? undefined,
                    factory_invoice_no: shipment.factory_invoice_no ?? undefined,
                    factory_fdbc_no: shipment.factory_fdbc_no ?? undefined,
                    factory_invoice_date: shipment.factory_invoice_date ? formatDateForInput(new Date(shipment.factory_invoice_date)) : undefined,
                    quantity: shipment.quantity ? shipment.quantity.toString() : undefined,
                    factory_invoice_value: shipment.factory_invoice_value ? shipment.factory_invoice_value.toString() : undefined,
                })) ?? [],
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<DocumentSubmissionFormValues>({
        resolver: zodResolver(DocumentSubmissionSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            buyer_id: undefined,
            term_id: undefined,
            lc_sc_id: undefined,
            fdbc_no: undefined,
            fdbc_date: undefined,
            fdbc_value: undefined,
            submission_date: formatDateForInput(new Date()),
            awb_no: undefined,
            awb_date: undefined,
            courier_id: undefined,
            rdlInvoices: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset, setValue } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset(transformedInitialData);
        }
    }, [transformedInitialData, reset]);

    const fdbcNoValue = watch("fdbc_no");
    
    useEffect(() => {
        if (fdbcNoValue && fdbcNoValue !== fdbcNoValue.toUpperCase()) {
            setValue("fdbc_no", fdbcNoValue.toUpperCase(), {
                shouldValidate: true,
                shouldDirty: true,
            });
        }
    }, [fdbcNoValue, setValue]);

    const isEdit = !!initialData;

    const term_id = useWatch({ control, name: 'term_id' });
    const buyer_id = useWatch({ control, name: 'buyer_id' });

    const lcList = api.documentSubmission.getScLcForDocumentSubmission.useQuery(
       (!!term_id && !!buyer_id && !isEdit) ? {
            term_id: safeNumber(term_id),
            buyer_id: safeNumber(buyer_id),
        } : skipToken
    ).data || [];

    let lcScList: { id: string; sc_lc_no: string }[];

    if(isEdit) {
        const id = initialData.sales_contracts?.id ?? initialData.lc_master?.id;
        const sc_lc_no = initialData.sales_contracts?.sales_contract_no ?? initialData.lc_master?.lc_no;

        lcScList = id && sc_lc_no ? [{ id: String(id), sc_lc_no: String(sc_lc_no) }] : [];
    }
    else {
        lcScList = lcList;
    }
    
    const formFields = useFormFields({lcList: lcScList, isEdit});

    return { methods, handleSubmit, formFields, validationError, trigger, watch, control };
}