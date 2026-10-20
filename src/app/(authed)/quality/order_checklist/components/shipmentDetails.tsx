/* eslint-disable react-hooks/exhaustive-deps */
import { useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import type { OrderChecklistFormValues } from "../config/formSchema";
import type { useOrderChecklistForm } from "../config/useOrderChecklistForm";
import React, { useEffect } from "react";
import { api } from "~/trpc/react";
import { tableFormColumns } from "../listConfig/tableFormColumns";
import { skipToken } from "@tanstack/react-query";
import TableForm from "./shipmentTableForm";

type props = {
    methods: ReturnType<typeof useOrderChecklistForm>['methods'];
    validationError: FieldErrors<OrderChecklistFormValues>;
    disabled?: boolean;
}

const ListDetails = (props: props) => {
    const { methods, validationError, disabled = false } = props;

    const { 
        fields: shipmentFields, replace: replaceShipments
    } = useFieldArray<OrderChecklistFormValues>({
        control: methods.control,
        name: `details`,
    });

    const earlySettlementId = useWatch({ control: methods.control, name: `db_id` });

    // const { data: shipments } = api.earlySettlement.getPoDetails.useQuery(
    //     !!earlySettlementId ? { id: earlySettlementId } : skipToken
    // )

    // useEffect(() => {
    //     replaceShipments(
    //         (shipments?.shipments ?? []).map((item) => {
    //             return {
    //                 db_id: item.id,
    //                 serial_no: item.serial_no,
    //                 document_details: item.document_details,
    //                 technical_check: item.technical_check,
    //                 technical_remarks: item.technical_remarks,
    //                 technical_check_date: item.technical_check_date,
    //                 qa_check: item.qa_check,
    //                 qa_remarks: item.qa_remarks,
    //                 qa_check_date: item.qa_check_date,
    //             }
    //         })
    //     )
    // }, [shipments])

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

export default React.memo(ListDetails) as typeof ListDetails;