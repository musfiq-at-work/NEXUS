/* eslint-disable react-hooks/exhaustive-deps */
import { useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import type { DocumentSubmissionFormValues } from "../../config/formSchema";
import TableForm from "./FactoryInvoiceTableForm";
import type { useDocumentSubmissionForm } from "../../config/useDocumentSubmissionForm";
import React, { useEffect } from "react";
import { Heading } from "~/components";
import { api } from "~/trpc/react";
import { tableFormColumns } from "../../factoryInvoiceConfig/tableFormColumns";
import { skipToken } from "@tanstack/react-query";
import { formatDate } from "~/utils/localDateString";

type props = {
    invoiceIndex: number;
    methods: ReturnType<typeof useDocumentSubmissionForm>['methods'];
    validationError: FieldErrors<DocumentSubmissionFormValues>;
    disabled?: boolean;
    selectedRdlInvoiceNo: string;
}

const FactoryInvoiceDetails = (props: props) => {
    const { invoiceIndex, methods, validationError, disabled = false, selectedRdlInvoiceNo } = props;

    const { 
        fields: shipmentFields, replace: replaceShipments
    } = useFieldArray<DocumentSubmissionFormValues>({
        control: methods.control,
        name: `rdlInvoices.${invoiceIndex}.factoryInvoices`,
    });

    const rdlInvoiceId = useWatch({
        control: methods.control,
        name: `rdlInvoices.${invoiceIndex}.rdl_invoice_id`
    });

    const { data: rdlInvoiceDetails } = api.documentSubmission.getRdlInvoiceDetails.useQuery(
        !!rdlInvoiceId ? { rdl_invoice_id: rdlInvoiceId } : skipToken
    );

    useEffect(() => {
        if (!rdlInvoiceDetails) return;
        
        const existingFactoryInvoice = methods.getValues(`rdlInvoices.${invoiceIndex}.factoryInvoices`) ?? [];

        replaceShipments(
            rdlInvoiceDetails.map((factoryInvoice) => {
                const existing = existingFactoryInvoice.find(
                    (x) => x.rdl_invoice_details_id === factoryInvoice.risdid
                );

                return {
                    rdl_invoice_details_id: factoryInvoice.risdid ?? existing?.db_id ?? undefined,
                    factory_invoice_id: factoryInvoice.factory_invoice_id ?? undefined,
                    factory_name: factoryInvoice.factory_name ?? undefined,
                    factory_invoice_no: factoryInvoice.factory_invoice_no ?? undefined,
                    factory_invoice_date: factoryInvoice.invoice_date 
                        ? formatDate(factoryInvoice.invoice_date) 
                        : undefined,
                    quantity: factoryInvoice.quantity.toString() ?? undefined,
                    factory_invoice_value: factoryInvoice.factory_invoice_value.toFixed(2) ?? undefined,
                    
                    // preserve existing values loaded from initialData
                    db_id: existing?.db_id,
                    factory_fdbc_no: existing?.factory_fdbc_no,
                    
                };
            })
        );
    }, [rdlInvoiceDetails, invoiceIndex]);

    

    const ShipmentHeading = () => (
        <div className="flex flex-row items-center gap-4">
            <Heading as ='h3' className="mx-8">
                {invoiceIndex + 1}. Factory Invoice Details of
                <span className="font-bold rounded-lg bg-primary text-white ml-2 px-3 py-1">
                    {selectedRdlInvoiceNo}
                </span>
            </Heading>
        </div>
    );

    return (
        <TableForm 
            title={<ShipmentHeading />}
            name={`rdlInvoices.${invoiceIndex}.factoryInvoices`}
            rows={shipmentFields}
            columns={tableFormColumns}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
            invoiceIndex={invoiceIndex}
        />
    )
}

export default React.memo(FactoryInvoiceDetails) as typeof FactoryInvoiceDetails;