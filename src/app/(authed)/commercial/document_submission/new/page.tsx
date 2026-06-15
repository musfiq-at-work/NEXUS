'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useDocumentSubmissionForm } from "../config/useDocumentSubmissionForm";
import { useRouter } from "next/navigation";
import { safeNumber } from "~/utils/numbers";
import RDLInvoiceDetails from "../components/rdlInvoiceComponents/RDLInvoiceDetails";

const NewDocumentSubmissionPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useDocumentSubmissionForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils    
    const utils = api.useUtils();

    const addDocumentSubmission = api.documentSubmission.addDocumentSubmission.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Document Submission added successfully!");
            await Promise.all([
                utils.documentSubmission.getDocumentSubmission.invalidate(),
                utils.documentSubmission.searchDocumentSubmissions.invalidate()
            ]);
        }
    });

    useEffect(() => {
        console.log("Validation Errors:", validationError);
    }, [validationError]);

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (documentSubmissionData) => {
        try {
            setIsLoading(true);
            const payload = {
                buyer_id: safeNumber(documentSubmissionData.buyer_id),
                term_id: safeNumber(documentSubmissionData.term_id),
                lc_sc_id: documentSubmissionData.lc_sc_id,
                submission_date: new Date(documentSubmissionData.submission_date ?? new Date()),
                fdbc_no: documentSubmissionData.fdbc_no,
                fdbc_date: new Date(documentSubmissionData.fdbc_date ?? new Date()),
                fdbc_value: safeNumber(documentSubmissionData.fdbc_value),
                awb_no: documentSubmissionData.awb_no,
                awb_date: new Date(documentSubmissionData.awb_date ?? new Date()),
                courier_id: documentSubmissionData.courier_id ? safeNumber(documentSubmissionData.courier_id) : undefined,
                rdlInvoices: (documentSubmissionData.rdlInvoices ?? []).map((rdlInvoice) => ({
                    rdl_invoice_id: rdlInvoice.rdl_invoice_id ?? "",
                    factoryInvoices: rdlInvoice.factoryInvoices?.map((factoryInvoice) => ({
                        factory_invoice_id: factoryInvoice.factory_invoice_id ?? "",
                        factory_fdbc_no: factoryInvoice.factory_fdbc_no ?? "",
                    })) ?? [],
                })),
            };

            const res = await addDocumentSubmission.mutateAsync(payload);
            router.push('/commercial/document_submission');
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Document Submission: ${message}`);
        }
        finally {
            setIsLoading(false);
        }
    });

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
}

export default NewDocumentSubmissionPage;