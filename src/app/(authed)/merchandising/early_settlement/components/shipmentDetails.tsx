/* eslint-disable react-hooks/exhaustive-deps */
import { useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import type { EarlySettlementFormValues } from "../config/formSchema";
import type { useEarlySettlementForm } from "../config/useEarlySettlementForm";
import React, { useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import { tableFormColumns } from "../rdlInvoiceConfig/tableFormColumns";
import { skipToken } from "@tanstack/react-query";
import TableForm from "./shipmentTableForm";
import { currencyFormatter } from "~/utils/localNumberStrings";
import { safeNumber } from "~/utils/numbers";

type props = {
    methods: ReturnType<typeof useEarlySettlementForm>['methods'];
    validationError: FieldErrors<EarlySettlementFormValues>;
    disabled?: boolean;
}

const ShipmentDetails = (props: props) => {
    const { methods, validationError, disabled = false } = props;

    const { 
        fields: shipmentFields, replace: replaceShipments
    } = useFieldArray<EarlySettlementFormValues>({
        control: methods.control,
        name: `pos`,
    });

    const earlySettlementId = useWatch({ control: methods.control, name: `db_id` });

    const { data: shipments } = api.earlySettlement.getPoDetails.useQuery(
        !!earlySettlementId ? { id: earlySettlementId } : skipToken
    )

    useEffect(() => {
        replaceShipments(
            (shipments ?? []).map((item) => {
                return {
                    db_id: item.early_settlement_details_id,
                    style: item.style,
                    buyer_po: item.buyer_po,
                    destination: item.destination,
                    size: item.size,
                    order_quantity: item.order_quantity,
                    fob_rate: item.fob_rate,
                    rdl_value: item.rdl_value,
                    early_settlement_charge: item.early_settlement_charge,
                    effective_rdl_fob: item.effective_rdl_fob,
                    effective_rdl_value: item.effective_rdl_value,
                    factory_rate: item.factory_rate,
                    factory_value: item.factory_value,
                    commission: item.commission,
                    dhaka_commission: item.dhaka_commission,
                    dhaka_percentage: item.dhaka_percentage,
                    other_commission: item.other_commission,
                    others_percentage: item.others_percentage,
                    overseas_commission: item.overseas_commission,
                    overseas_percentage: item.overseas_percentage
                }
            })
        )
    }, [shipments, earlySettlementId])

    return (
        <TableForm 
            name='pos'
            rows={shipmentFields}
            columns={tableFormColumns}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
        />
    )
}

export default React.memo(ShipmentDetails) as typeof ShipmentDetails;