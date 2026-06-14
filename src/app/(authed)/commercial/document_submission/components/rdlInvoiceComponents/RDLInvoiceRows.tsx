import { GenericFormTableRow, Portal } from "~/components";
import type { useDocumentSubmissionForm } from "../../config/useDocumentSubmissionForm";
import { formFields as factoryInvoiceTableFormFields } from "../../rdlInvoiceConfig/tableFormFields";
import { useWatch } from "react-hook-form";
import React, { useEffect } from "react";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { safeNumber } from "~/utils/numbers";
// import ShipmentDetails from "../shipmentComponents/ShipmentDetails";

type Props = {
    register: ReturnType<typeof useDocumentSubmissionForm>['methods']['register'];
    removeRow: (index: number) => void;
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useDocumentSubmissionForm>['methods'];
    validationError: {[key: string]: any};
}

const RdlInvoiceRow = (props: Props) => {
    const { removeRow, disabled = false, name, index,  methods, validationError } =  props;

    const buyerId = useWatch({ control: methods.control, name: `buyer_id`});

    const termId = useWatch({ control: methods.control, name: `term_id`});

    const documentSubmissionDBid = useWatch({ control: methods.control, name: `db_id`});

    const lc_sc_id = useWatch({ control: methods.control, name: `lc_sc_id`});

    const rdlInvoices = api.documentSubmission.getRdlInvoiceForDocumentSubmission.useQuery(
        (!!buyerId && !!termId && !!lc_sc_id) ? { 
            buyer_id: safeNumber(buyerId), 
            term_id: safeNumber(termId),
            lc_sc_id: lc_sc_id,
            document_submission_id: documentSubmissionDBid,
        } : skipToken
    ).data;

    // filter out already selected factory invoices
    const details = useWatch({
        control: methods.control,
        name: "rdlInvoices",
    });

    const selectedRDLInvoiceIds = details
        ?.filter((_, i) => i !== index)
        .map((detail) => detail.rdl_invoice_id);

    const filteredRDLInvoices = rdlInvoices?.filter(
        (invoice) => !selectedRDLInvoiceIds?.includes(invoice.id)
    );

    const selectedRDLInvoice = useWatch({
        control: methods.control,
        name: `rdlInvoices.${index}.rdl_invoice_id`,
    });

    useEffect(() => {
        if (!selectedRDLInvoice || !rdlInvoices) return;

        const invoice = rdlInvoices.find(
            (fi) => fi.id === selectedRDLInvoice
        );

        if (!invoice) return;

        methods.setValue(
            `rdlInvoices.${index}.quantity`,
            invoice.total_quantity.toFixed(2),
            { shouldDirty: true }
        );

        methods.setValue(
            `rdlInvoices.${index}.rdl_value`,
            invoice.total_value.toFixed(2),
            { shouldDirty: true }
        );

        methods.setValue(
            `rdlInvoices.${index}.previously_received_rdl_value`,
            invoice.previous_quantity.toFixed(2),
            { shouldDirty: true }
        );
    }, [selectedRDLInvoice, rdlInvoices, index, methods]);

    return (
        <>
            <GenericFormTableRow
                fields={factoryInvoiceTableFormFields({ rdlInvoice: filteredRDLInvoices })}
                register={methods.register}
                removeRow={removeRow}
                disabled={disabled}
                validationError={validationError?.rdlInvoices}
                name={name}
                control={methods.control}
                index={index}
            />

            {/* {!!selectedFactoryInvoiceNo && 
                <Portal containerId="rdl_invoice_shipment_details_portal">
                    <ShipmentDetails invoiceIndex={index} 
                        methods={methods} 
                        validationError={validationError}
                        disabled={disabled}
                        selectedFactoryInvoiceNo={selectedFactoryInvoiceNo}
                    />
                </Portal>
            } */}
        </>
    );
}

export default React.memo(RdlInvoiceRow) as typeof RdlInvoiceRow;