'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import { useFactoryInvoiceForm } from "../../config/useFactoryInvoiceForm";
import ShipmentDetails from "../../components/shipmentComponents/ShipmentDetails";
import Tags from "../../components/tagItems/Tags";
import { safeNumber } from "~/utils/numbers";
import { printingWhiteIcon } from "~/assets";


type EditFactoryInvoicePageProp = {
    params: Promise<{ id: string }>
}

const EditFactoryInvoicePage = ({ params }: EditFactoryInvoicePageProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: factoryInvoiceData, isLoading } = api.factoryInvoice.getFactoryInvoiceById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useFactoryInvoiceForm(
        factoryInvoiceData ?? undefined
    );

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_view, can_update } = permissions ?? {};

    const updateFactoryInvoice = api.factoryInvoice.updateFactoryInvoice.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Factory Invoice updated successfully!");
            await Promise.all([
                utils.factoryInvoice.getFactoryInvoiceById.invalidate({ id }),
                utils.factoryInvoice.getFactoryInvoiceList.invalidate(),
                utils.factoryInvoice.getShipmentDetailsForTagShipments.invalidate(),
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (factoryInvoiceData) => {
        try {
            setIsLoadingSubmit(true);

            const payload = {
                id: factoryInvoiceData.db_id ?? id,
                factory_id: safeNumber(factoryInvoiceData.factory_id),
                term_id: safeNumber(factoryInvoiceData.term_id),
                lc_sc_id: factoryInvoiceData.lc_sc_id,
                invoice_no: factoryInvoiceData.invoice_no.toLocaleUpperCase(),
                invoice_date: new Date(factoryInvoiceData.invoice_date ?? new Date()),
                remarks: factoryInvoiceData.remarks,
                details: (factoryInvoiceData.details ?? []).map((detail) => ({
                    db_id: detail.db_id,
                    exfactory_shipment_id: detail.exfactory_shipment_id,
                })),
            };

            await updateFactoryInvoice.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to update Factory Invoice: ${message}`);
        }
        finally {
            setIsLoadingSubmit(false);
        }

    }), [id, updateFactoryInvoice, handleSubmit]);


    return (
        <Wrapper heading='Update Factory Invoice'
            subSectionRight={
                can_view ? (
                    <div className="w-50 mb-3">
                        <Button
                            variant="secondary"
                            label="Print (PDF)"
                            leftIcon={printingWhiteIcon}
                            onClick={() => window.open(`/pdf/factory_invoice/${id}`, "_blank")}
                        />
                    </div>
                ) : null
            }
        >
            <Form 
                fields={formFields} 
                buttonLabel="Update Factory Invoice" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
                disabled={!can_update}
            />

            <ShipmentDetails 
                methods={methods}
                disabled={isLoading}
            />
            
            <Tags 
                methods={methods}
                isLoading={isLoading}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Factory Invoice"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit}
                />
            </div>
        </Wrapper>
    )
};

export default EditFactoryInvoicePage;