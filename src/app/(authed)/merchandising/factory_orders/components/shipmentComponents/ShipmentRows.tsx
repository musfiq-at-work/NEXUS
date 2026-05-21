import { GenericFormTableRow } from "~/components";
import type { useFactoryOrderForm } from "../../config/useFactoryOrderForm";
import { formFields as shipmentTableFormFields } from "../../shipmentConfig/tableFormFields";
import { useWatch, type FieldErrors } from "react-hook-form";
import type { FactoryOrderFormValues } from "../../config/formSchema";
import React from "react";

type Props = {
    register: ReturnType<typeof useFactoryOrderForm>['methods']['register'];
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useFactoryOrderForm>['methods'];
    validationError: FieldErrors<FactoryOrderFormValues['factoryOrder']>;
    styleIndex: number;
    canViewTransferRate: boolean;
}

const ShipmentRows = (props: Props) => {
    const { disabled = false, name, index,  methods, validationError, styleIndex, canViewTransferRate } =  props;

    const exfactoryExists = useWatch({ control: methods.control, name: `factoryOrder.styles.${styleIndex}.shipments.${index}.ex_factory_exists` });

    return (
        <GenericFormTableRow
            fields={shipmentTableFormFields(canViewTransferRate)}
            register={methods.register}
            disabled={disabled || exfactoryExists}
            validationError={validationError?.styles?.[styleIndex]?.shipments ?? {}}
            name={name}
            control={methods.control}
            index={index}
        />
    );
}

export default React.memo(ShipmentRows) as typeof ShipmentRows;