import { GenericFormTableRow } from "~/components";
import { type useExfactoryForm } from "../../config/useExfactoryForm";
import { formFields as shipmentTableFormFields } from "../../shipmentConfig/tableFormFields";
import { useWatch, type FieldErrors } from "react-hook-form";
import React from "react";
import type { ExFactoryFormValues } from "../../config/formSchema";
import { useAdminStore } from "~/store";

type Props = {
    register: ReturnType<typeof useExfactoryForm>['methods']['register'];
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useExfactoryForm>['methods'];
    validationError: FieldErrors<ExFactoryFormValues['exfactory']>;
    orderIndex: number ;
    removeRow: (index: number) => void;
}

const ShipmentRows = (props: Props) => {
    const { removeRow, disabled = false, name, index,  methods, validationError, orderIndex } =  props;

    const exfactory_id = useWatch({ control: methods.control, name: `exfactory.db_id` });

    const isAdmin = useAdminStore((state) => state.isAdmin);

    return (
        <>
            <GenericFormTableRow
                fields={shipmentTableFormFields({ isEdit: Boolean(exfactory_id), isAdmin: isAdmin })}
                register={methods.register}
                disabled={disabled}
                removeRow={removeRow}
                validationError={validationError?.orders?.[orderIndex]?.shipments ?? {}}
                name={name}
                control={methods.control}
                index={index}
            />
        </>
    );
}

export default React.memo(ShipmentRows) as typeof ShipmentRows;