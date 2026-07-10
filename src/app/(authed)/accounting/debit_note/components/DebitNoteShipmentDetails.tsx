/* eslint-disable react-hooks/exhaustive-deps */
import { useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import type { DebitNoteFormValues } from "../config/formSchema";
import TableForm from "./DebitNoteDetailsTableForm";
import type { useDebitNoteForm } from "../config/useDebitNoteForm";
import React, { useCallback, useEffect } from "react";
import { api } from "~/trpc/react";
import { tableFormColumns } from "../shipmentConfig/tableFormColumns";
import { skipToken } from "@tanstack/react-query";
import { formatDate } from "~/utils/localDateString";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { toast } from "sonner";

type props = {
    invoiceIndex: number;
    methods: ReturnType<typeof useDebitNoteForm>['methods'];
    validationError: FieldErrors<DebitNoteFormValues>;
    disabled?: boolean;
    selectedRdlInvoiceNo: string;
}

const DebitNoteDetails = (props: props) => {
    const { invoiceIndex, methods, validationError, disabled = false, selectedRdlInvoiceNo } = props;

    const { 
        fields: shipmentFields, append: addShipment, remove: removeShipment,
    } = useFieldArray<DebitNoteFormValues>({
        control: methods.control,
        name: `details`,
    });

    const addShipmentRow = useCallback(() => {
        addShipment({
            db_id: undefined,
            po_no: undefined,
            factory_invoice_no: undefined,
            factory_shipment_id: '',
            value: undefined,
        });
    }, [addShipment]);

    const utils = api.useUtils();

    const deleteShipmentMutation = api.buyerOrders.deleteShipment.useMutation({
        onSuccess: async () => {
            await utils.buyerOrders.getBuyerOrders.invalidate();
            toast.success("Shipment deleted successfully!");
        },
    });

    const removeShipmentRow = useCallback(async (index: number) => {
        try {
            if(!!shipmentFields[index]?.db_id) {
                await deleteShipmentMutation.mutateAsync({ shipment_id: shipmentFields[index].db_id });
            }

            removeShipment(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting Shipment: ${message}`);
        }
    }, [deleteShipmentMutation, removeShipment, shipmentFields]);

    return (
        <TableForm 
            selectedRdlInvoiceNo={selectedRdlInvoiceNo}
            name={`details`}
            rows={shipmentFields}
            addRow={addShipmentRow}
            removeRow={removeShipmentRow}
            columns={tableFormColumns}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
            invoiceIndex={invoiceIndex}
        />
    )
}

export default React.memo(DebitNoteDetails) as typeof DebitNoteDetails;