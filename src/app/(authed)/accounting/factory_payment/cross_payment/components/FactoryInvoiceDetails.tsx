/* eslint-disable react-hooks/exhaustive-deps */
import { useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import type { CrossPaymentFormValues } from "../config/formSchema";
import TableForm from "./FactoryInvoiceDetailsTableForm";
import type { useCrossPaymentForm } from "../config/useCrossPaymentForm";
import { tableFormColumns as shipmentTableFormColumns } from "../factoryInvoiceConfig/tableFormColumns";
import React, { useCallback, useEffect } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { skipToken } from "@tanstack/react-query";
import { formatDateForInput } from "~/utils/localDateString";

type props = {
    methods: ReturnType<typeof useCrossPaymentForm>['methods'];
    validationError: FieldErrors<CrossPaymentFormValues>;
    disabled?: boolean;
}

const FactoryInvoiceDetails = (props: props) => {
    const { methods, validationError, disabled = false } = props;

    const { 
        fields: shipmentFields, append: addShipment, remove: removeShipment,
    } = useFieldArray<CrossPaymentFormValues>({
        control: methods.control,
        name: `details`,
    });

    const addShipmentRow = useCallback(() => {
        addShipment({
            db_id: undefined,
            factory_invoice_no: undefined,
            factory_invoice_id: '',
            factory_payment_no: '',
            factory_invoice_date: '',
            factory_name: '',
            invoice_quantity: 0,
            invoice_value: 0,
            factory_payment_date: formatDateForInput(new Date()),
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

    const buyerId = useWatch({ control: methods.control, name: `buyer_id` });

    return (
        <TableForm 
            name={`details`}
            rows={shipmentFields}
            columns={shipmentTableFormColumns}
            register={methods.register}
            addRow={addShipmentRow}
            removeRow={removeShipmentRow}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
        />
    )
}

export default React.memo(FactoryInvoiceDetails) as typeof FactoryInvoiceDetails;