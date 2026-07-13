'use client';

import { Button, Form, MessageBox, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useCrossPaymentForm } from "../../config/useCrossPaymentForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePermissions } from "~/hooks";
import FactoryInvoiceDetails from "../../components/FactoryInvoiceDetails";
import { safeNumber } from "~/utils/numbers";
import type { ParamsProp } from "~/types/params";

const EditCrossPaymentPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: crossPaymentData, isLoading } = api.crossPayments.getCrossPaymentById.useQuery({ cross_payment_id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useCrossPaymentForm(
        crossPaymentData ?? undefined
    );

    const utils = api.useUtils();

    const { can_update } = useModulePermissions();

    const updateCrossPayment = api.crossPayments.updateCrossPayment.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Cross Payment updated successfully!");
            await Promise.all([
                utils.crossPayments.getCrossPaymentById.invalidate({ cross_payment_id: id }),
                utils.crossPayments.getCrossPaymentList.invalidate(),
                utils.crossPayments.searchCrossPayments.invalidate()
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (crossPaymentData) => {
        try {
            setIsLoadingSubmit(true);
            const payload = {
                cross_payment_id: id,
                cross_payment_date: new Date(crossPaymentData.cross_payment_date),
                remarks: crossPaymentData.remarks,
                details: (crossPaymentData.details ?? []).map((detail) => ({
                    db_id: detail.db_id,
                    value: safeNumber(detail.value),
                    factory_invoice_id: detail.factory_invoice_id,
                    factory_payment_no: detail.factory_payment_no,
                    factory_payment_date: detail.factory_payment_date ? new Date(detail.factory_payment_date) : new Date(),
                })),
            };

            await updateCrossPayment.mutateAsync(payload);
        }
        catch (error) {
            const parsedError = parseTRPCError(error);
            setError(parsedError);
            toast.error(parsedError);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, updateCrossPayment]);

    return (
        <Wrapper heading='Update Cross Payment' >
            <Form 
                fields={formFields} 
                buttonLabel="Add New Cross Payment" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <FactoryInvoiceDetails 
                methods={methods}
                validationError={validationError ?? {}}
                disabled={isLoading || !can_update}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Cross Payment"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || !can_update || isLoadingSubmit}
                />
            </div>
        </Wrapper>
    )
};

export default EditCrossPaymentPage;