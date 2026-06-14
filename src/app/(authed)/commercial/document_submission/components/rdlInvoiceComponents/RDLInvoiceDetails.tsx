import TableForm from "./RDLInvoiceTableForm";
import { useFieldArray, type FieldErrors } from "react-hook-form";
import type { DocumentSubmissionFormValues } from "../../config/formSchema";
import type { useDocumentSubmissionForm } from "../../config/useDocumentSubmissionForm";
import { tableFormColumns as rdlInvoiceTableFormColumns } from "../../rdlInvoiceConfig/tableFormColumns";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import React, { useCallback } from "react";

type Props = {
    methods: ReturnType<typeof useDocumentSubmissionForm>['methods'];
    validationError: FieldErrors<DocumentSubmissionFormValues>;
    disabled?: boolean;
}

const RdlInvoiceDetails = ({ methods, validationError, disabled = false }: Props) => {
    const { 
        fields: rdlInvoiceFields, append: addRdlInvoice, remove: removeRdlInvoice,
    } = useFieldArray<DocumentSubmissionFormValues>({
        control: methods.control,
        name: "rdlInvoices",
    });

    const utils = api.useUtils();

    const AddRdlInvoiceRow = useCallback(() => {
        addRdlInvoice({
            db_id: undefined,
            rdl_invoice_id: undefined,
            rdl_invoice_no: undefined,
            quantity: undefined,
            rdl_value: undefined,
            received_rdl_value: undefined,
            previously_received_rdl_value: undefined,
            factoryInvoices: [],
        });
    }, [addRdlInvoice]);

    // const deleteRdlInvoiceMutation = api.rdlInvoice.deleteRdlInvoice.useMutation({
    //     onSuccess: async () => {
    //         toast.success("RDL Invoice deleted successfully!");
    //         await Promise.all([
    //             utils.rdlInvoice.getRdlInvoice.invalidate(),
    //             utils.rdlInvoice.getRdlInvoiceById.invalidate()
    //         ])
    //     },
    // });

    const RemoveRdlInvoiceRow = useCallback(async (index: number) => {
        try {
            // if(!!rdlInvoiceFields[index]?.db_id) {
            //     await deleteRdlInvoiceMutation.mutateAsync({ 
            //         db_id: rdlInvoiceFields[index].db_id 
            //     });
            // }

            removeRdlInvoice(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting RDL Invoice: ${message}`);
        }
    // }, [deleteRdlInvoiceMutation, removeRdlInvoice, rdlInvoiceFields]);
    }, [removeRdlInvoice, rdlInvoiceFields]);

    return (
        <TableForm 
            name="rdlInvoices"
            rows={rdlInvoiceFields}
            columns={rdlInvoiceTableFormColumns}
            register={methods.register}
            addRow={AddRdlInvoiceRow}
            removeRow={RemoveRdlInvoiceRow}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
        />
    )
}

export default React.memo(RdlInvoiceDetails) as typeof RdlInvoiceDetails;