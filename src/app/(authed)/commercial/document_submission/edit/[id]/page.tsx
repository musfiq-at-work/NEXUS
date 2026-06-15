'use client';

import { Button, Form, Wrapper, MessageBox } from "~/components";
import React, { useCallback, useEffect, useState } from "react";
import { useDocumentSubmissionForm } from "../../config/useDocumentSubmissionForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useDecodedUser, useModulePath } from "~/hooks";
import RDLInvoiceDetails from "../../components/rdlInvoiceComponents/RDLInvoiceDetails";
import { safeNumber } from "~/utils/numbers";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";

type EditDocumentSubmissionPageProp = {
    params: Promise<{ id: string }>
}

const EditDocumentSubmissionPage = ({ params }: EditDocumentSubmissionPageProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: documentSubmissionData, isLoading } = api.documentSubmission.getDocumentSubmissionById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useDocumentSubmissionForm(
        documentSubmissionData ?? undefined
    );

    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update, can_view } = permissions ?? {};

    // const updateDocumentSubmission = api.documentSubmission.updateDocumentSubmission.useMutation({
    //     onSuccess: async () => {
    //         setError(null);
    //         toast.success("Document Submission updated successfully!");
    //         await Promise.all([
    //             utils.documentSubmission.getDocumentSubmissionById.invalidate({ id }),
    //             utils.documentSubmission.getDocumentSubmission.invalidate(),
    //             utils.documentSubmission.searchDocumentSubmissions.invalidate()
    //         ]);
    //     }
    // });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (documentSubmissionData) => {
        try {
            setIsLoadingSubmit(true);
            const payload = {
                id,
                buyer_id: safeNumber(documentSubmissionData.buyer_id),
                term_id: safeNumber(documentSubmissionData.term_id),
                lc_sc_id: documentSubmissionData.lc_sc_id,
                submission_date: new Date(documentSubmissionData.submission_date ?? new Date()),
                fdbc_no: documentSubmissionData.fdbc_no,
                fdbc_date: new Date(documentSubmissionData.fdbc_date ?? new Date()),
                fdbc_value: safeNumber(documentSubmissionData.fdbc_value),
                awb_no: documentSubmissionData.awb_no,
                awb_date: new Date(documentSubmissionData.awb_date ?? new Date()),
                courier_id: documentSubmissionData.courier_id 
                    ? safeNumber(documentSubmissionData.courier_id) 
                    : undefined,
                rdlInvoices: (documentSubmissionData.rdlInvoices ?? []).map((rdlInvoice) => ({
                    db_id: rdlInvoice.db_id,
                    rdl_invoice_id: rdlInvoice.rdl_invoice_id ?? "",
                    factoryInvoices: rdlInvoice.factoryInvoices?.map((factoryInvoice) => ({
                        db_id: factoryInvoice.db_id,
                        factory_invoice_id: factoryInvoice.factory_invoice_id ?? "",
                        factory_fdbc_no: factoryInvoice.factory_fdbc_no ?? "",
                    })) ?? [],
                })),
            };

            // const res = await updateDocumentSubmission.mutateAsync(payload);
            console.log("Payload for submission:", payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to update Document Submission: ${message}`);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), []);

    
    return (
        <Wrapper heading='Add Document Submission' >
            <Form 
                fields={formFields} 
                buttonLabel="Add New Document Submission" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <RDLInvoiceDetails 
                methods={methods}
                validationError={validationError ?? {}}
                disabled={isLoading}
            />

            {/* Shipment Portal anchor */}
            <div id='document_submissions_rdl_invoice_portal'/> 

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add Document Submission"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    )
};

export default EditDocumentSubmissionPage;