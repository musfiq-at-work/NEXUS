import { GenericFormTableRow } from "~/components";
import type { useDocumentSubmissionForm } from "../../config/useDocumentSubmissionForm";
import { type FieldErrors } from "react-hook-form";
import React from "react";
import { formFields as shipmentTableFormFields } from "../../factoryInvoiceConfig/tableFormFields";
import type { DocumentSubmissionFormValues } from "../../config/formSchema";

type Props = {
    register: ReturnType<typeof useDocumentSubmissionForm>['methods']['register'];
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useDocumentSubmissionForm>['methods'];
    validationError: FieldErrors<DocumentSubmissionFormValues>;
    invoiceIndex: number ;
}

const FactoryInvoiceRows = (props: Props) => {
    const { disabled = false, name, index,  methods, validationError, invoiceIndex } =  props;

    return (
        <GenericFormTableRow
            fields={shipmentTableFormFields()}
            register={methods.register}
            disabled={disabled}
            validationError={validationError?.rdlInvoices?.[invoiceIndex]?.factoryInvoices ?? {}}
            name={name}
            control={methods.control}
            index={index}
        />
    );
}

export default React.memo(FactoryInvoiceRows) as typeof FactoryInvoiceRows;