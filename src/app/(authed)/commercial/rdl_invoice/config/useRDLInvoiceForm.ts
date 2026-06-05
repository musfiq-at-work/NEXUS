import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { RDLInvoiceSchema } from "./formSchema";
import type { RDLInvoiceFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { safeNumber } from "~/utils/numbers";
import type { GetRdlInvoiceByIdTypes } from "~/types/commercialAPITypes";

type RDLInvoiceDetails = NonNullable<GetRdlInvoiceByIdTypes>['rdl_invoice_details'][number];

type RDLInvoiceShipments = NonNullable<RDLInvoiceDetails>['rdl_invoice_shipment_details'][number];

export const useRDLInvoiceForm = (initialData?: GetRdlInvoiceByIdTypes) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.id,
            factory_id: initialData.rdl_invoice_details?.[0]?.factory_id ?? undefined,
            buyer_id: initialData.buyer_id ?? undefined,
            term_id: initialData.term_id ?? undefined,
            lc_sc_id: initialData.sales_contracts?.id?.toString() 
                ? initialData.sales_contracts?.id?.toString() 
                : initialData.lc_master?.id?.toString() ?? '',
            invoice_no: initialData.invoice_no ?? '',
            invoice_date: initialData.invoice_date ? formatDateForInput(new Date(initialData.invoice_date)) : '',
            remarks: initialData.remark ?? '',
            pi_no: initialData.pi_no ?? '',
            container_no: initialData.container_no ?? '',
            discount: initialData.discount ?? undefined,
            notifyParties: initialData.notify_parties?.map((notifyParty) => notifyParty.notify_party_id ?? undefined) ?? [],
            consignee_ids: initialData.consignees?.map((consignee) => consignee.consignee_id ?? undefined) ?? [],
            freight_terms: initialData.freightTerms ?? undefined,
            port_of_loading: initialData.port_of_loading ?? undefined,
            details: initialData.rdl_invoice_details?.map((detail: RDLInvoiceDetails) => ({
                db_id: detail.id,
                factory_id: detail.factory_id ?? undefined,
                FactoryInvoiceDetails: detail.rdl_invoice_shipment_details?.map((shipment: RDLInvoiceShipments) => ({
                    db_id: shipment.id,
                    shipment_details_id: shipment.shipment_details_id,
                    invoice_quantity: shipment.invoice_quantity,
                })) ?? [],
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<RDLInvoiceFormValues>({
        resolver: zodResolver(RDLInvoiceSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            buyer_id: undefined,
            term_id: undefined,
            lc_sc_id: undefined,
            invoice_no: undefined,
            pi_no: undefined,
            invoice_date: formatDateForInput(new Date()),
            remarks: "",
            discount: undefined,
            freight_terms: undefined,
            port_of_loading: undefined,
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset, setValue } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset(transformedInitialData);
        }
    }, [transformedInitialData, reset]);

    const invoiceNoValue = watch("invoice_no");
    
    useEffect(() => {
        if (invoiceNoValue && invoiceNoValue !== invoiceNoValue.toUpperCase()) {
            setValue("invoice_no", invoiceNoValue.toUpperCase(), {
                shouldValidate: true,
                shouldDirty: true,
            });
        }
    }, [invoiceNoValue, setValue]);

    const isEdit = !!initialData;

    const term_id = useWatch({ control, name: 'term_id' });
    const buyer_id = useWatch({ control, name: 'buyer_id' });

    const lcList = api.rdlInvoice.getScLcForRDLInvoice.useQuery(
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
    
    const formFields = useFormFields({lcList: lcScList, isEdit, buyer_id});

    const invoiceValue = useWatch({ control, name: 'details' })?.reduce((total, detail) => {
        const value = safeNumber(detail.factory_value);
        return total + (isNaN(value) ? 0 : value);
    }, 0);

    useEffect(() => {
        if (invoiceValue !== undefined) {
            methods.setValue('invoice_value', invoiceValue.toFixed(2));
        }
    }, [invoiceValue, methods]);

    const totalValue = useWatch({ control, name: 'discount' }) !== undefined
        ? (invoiceValue || 0) - (safeNumber(methods.getValues('discount')) || 0)
        : invoiceValue;

    useEffect(() => {
        if (totalValue !== undefined) {
            methods.setValue('total_value', totalValue.toFixed(2));
        }
    }, [totalValue, methods]);

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