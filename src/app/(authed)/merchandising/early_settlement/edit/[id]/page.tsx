'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePermissions } from "~/hooks";
import { useEarlySettlementForm } from "../../config/useEarlySettlementForm";
import ShipmentDetails from "../../components/shipmentDetails";
import { safeNumber } from "~/utils/numbers";
import type { ParamsProp } from "~/types/params";

const EditEarlySettlementPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: proceedRealizationData, isLoading } = api.proceedRealization.getProceedRealizationById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useEarlySettlementForm(
        proceedRealizationData ?? undefined
    );

    // TRPC utils
    const utils = api.useUtils();

    const { can_update } = useModulePermissions();

    const updateProceedRealization = api.proceedRealization.updateProceedRealization.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Early Settlement updated successfully!");
            await Promise.all([
                utils.proceedRealization.getProceedRealizationById.invalidate({ id }),
                utils.proceedRealization.getProceedRealization.invalidate(),
                utils.proceedRealization.searchProceedRealization.invalidate()
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (proceedRealizationData) => {
        try {
            setIsLoadingSubmit(true);

            const payload = {
                id: id,
                realization_date: new Date(proceedRealizationData.proceed_date ?? new Date()),
                bank_charge: proceedRealizationData.bank_charge ? safeNumber(proceedRealizationData.bank_charge) : undefined,
                document_charge: proceedRealizationData.document_charge ? safeNumber(proceedRealizationData.document_charge) : undefined,
                discount_charge: proceedRealizationData.discount_charge ? safeNumber(proceedRealizationData.discount_charge) : undefined,
                rdl_invoice_details: (proceedRealizationData.details ?? []).map((detail) => ({
                    db_id: detail.db_id,
                    rdl_invoice_id: detail.rdl_invoice_id,
                    proceed_value: safeNumber(detail.proceed_value ?? 0),
                })),
            };

            await updateProceedRealization.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to update Early Settlement: ${message}`);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, updateProceedRealization]);


    return (
        <Wrapper heading='Update Early Settlement'>
            <Form 
                fields={formFields} 
                buttonLabel="Update Early Settlement" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
                disabled={!can_update}
            />

            <ShipmentDetails 
                methods={methods}
                validationError={validationError}
                disabled={isLoading}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Early Settlement"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit}
                />
            </div>
        </Wrapper>
    )
};

export default EditEarlySettlementPage;