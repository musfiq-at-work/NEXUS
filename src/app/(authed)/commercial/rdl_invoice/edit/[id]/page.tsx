'use client';

import { Button, Form, Wrapper, MessageBox } from "~/components";
import React, { useCallback, useState } from "react";
import { useRDLInvoiceForm } from "../../config/useRDLInvoiceForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import FactoryInvoiceDetails from "../../components/factoryInvoiceComponents/FactoryInvoiceDetails";
import { printingWhiteIcon } from "~/assets";
import { safeNumber } from "~/utils/numbers";

type EditRDLInvoicePageProp = {
    params: Promise<{ id: string }>
}

const EditRDLInvoicePage = ({ params }: EditRDLInvoicePageProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: rdlInvoiceData, isLoading } = api.rdlInvoice.getRdlInvoiceById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useRDLInvoiceForm(
        rdlInvoiceData ?? undefined
    );

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update, can_view } = permissions ?? {};

    const updateRDLInvoice = api.rdlInvoice.updateRdlInvoice.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("RDL Invoice updated successfully!");
            await Promise.all([
                utils.rdlInvoice.getRdlInvoiceById.invalidate({ id }),
                utils.rdlInvoice.getRdlInvoice.invalidate(),
            ]);
        }

    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (rdlInvoiceData) => {
        try {
            setIsLoadingSubmit(true);
            const payload = {
                id,
                invoice_date: new Date(rdlInvoiceData.invoice_date ?? new Date()),
                pi_no: rdlInvoiceData.pi_no,
                remarks: rdlInvoiceData.remarks,
                container_no: rdlInvoiceData.container_no,
                discount: rdlInvoiceData.discount,
                details: (rdlInvoiceData.details ?? []).map((detail) => ({
                    db_id: detail.db_id,
                    factory_id: safeNumber(detail.factory_id),
                    factory_invoice_id: detail.factory_invoice_id ?? "",
                    shipments: detail.details?.map((shipment) => ({
                        db_id: shipment.db_id,
                        shipment_details_id: shipment.shipment_details_id ?? "",
                        invoice_quantity: safeNumber(shipment.invoice_quantity),
                    })) ?? [],
                })),
            };

            await updateRDLInvoice.mutateAsync(payload);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating RDL Invoice: ${message}`);
            setError(message);
        } finally {
            setIsLoadingSubmit(false);
        }
    }), [updateRDLInvoice]);
    
 
    return (
        <Wrapper heading='Update RDL Invoice' 
            subSectionRight={
                can_view ? (
                    <div className="w-50 mb-3">
                        <Button
                            variant="secondary"
                            label="Print (PDF)"
                            leftIcon={printingWhiteIcon}
                            onClick={() => window.open(`/pdf/rdl_invoice/${id}`, "_blank")}
                        />
                    </div>
                ) : null
            }
        >
            <Form 
                fields={formFields} 
                buttonLabel="Add New RDL Invoice" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
                disabled={!can_update}
            />

            <FactoryInvoiceDetails 
                methods={methods}
                validationError={validationError ?? {}}
                disabled={isLoading}
            />

            {/* Shipment Portal anchor */}
            <div id='rdl_invoice_shipment_details_portal'/> 
            
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update RDL Invoice"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit}
                />
            </div>
        </Wrapper>
    )
};

export default EditRDLInvoicePage;