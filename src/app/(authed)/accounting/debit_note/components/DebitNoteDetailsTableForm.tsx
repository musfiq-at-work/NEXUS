'use client';

import React from "react";
import { GenericFormTableRow, Heading, TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId, type FieldErrors } from "react-hook-form";
import type { useDebitNoteForm } from "../config/useDebitNoteForm";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import type { DebitNoteFormValues } from "../config/formSchema";
import { formFields as shipmentTableFormFields } from "../shipmentConfig/tableFormFields";
import { plusIcon } from "~/assets";
import Image from "next/image";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";

type ShipmentRow = FieldArrayWithId<DebitNoteFormValues>;

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<ShipmentRow>[];
    rows: ShipmentRow[];
    disabled?: boolean;
    name: string;
    methods: ReturnType<typeof useDebitNoteForm>['methods'];
    validationError: FieldErrors<DebitNoteFormValues>;
    invoiceIndex: number;
    selectedRdlInvoiceNo: string;
    addRow: () => void;
    removeRow: (index: number) => void;
}

const TableForm = (props: Props) => {
    const {columns, rows, disabled = false, name, methods, validationError, invoiceIndex, selectedRdlInvoiceNo, addRow, removeRow} = props;

    const lc_sc_id = methods.getValues('lc_sc_id');
    const term_id = methods.getValues('term_id');

    const { data: shipmentDetails } = api.debitNotes.getShipmentDetailsForDebitNote.useQuery(
        (!!lc_sc_id || !!term_id) ? { lc_sc_id, term_id: Number(term_id) } : skipToken,
    )

    return (
        <>
            <div className="flex flex-row items-center gap-4">
                <Heading as ='h3' className="mx-8">
                    {invoiceIndex + 1}. Factory Invoice Details of
                    <span className="font-bold rounded-lg bg-primary text-white ml-2 px-3 py-1">
                        {selectedRdlInvoiceNo}
                    </span>
                </Heading>
            </div>

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={columns} rows={rows} />
                        <TableBody>
                            {rows.map((row, index) => (
                                <GenericFormTableRow
                                    key={row.id}
                                    fields={shipmentTableFormFields(shipmentDetails)}
                                    register={methods.register}
                                    removeRow={removeRow}
                                    disabled={disabled}
                                    validationError={validationError?.details ?? {}}
                                    name={name}
                                    control={methods.control}
                                    index={index}
                                />
                            ))}
                        </TableBody>
                    </TableWrapper>
                </div>
                {!disabled && 
                    <button type="button"
                        onClick={() => addRow()}
                        className="group w-fit bg-gray-light ml-1 rounded-full px-4 py-2 mt-4 text-gray-dark hover:cursor-pointer hover:bg-gray hover:text-white"
                    >
                        <Image width={20} height={20} src={plusIcon.src} alt="Add more" className="inline-block mr-2 h-4 invert group-hover:invert-0" /> 
                        Add more
                    </button>
                }
            </form>
        </>
    );
}

export default React.memo(TableForm) as typeof TableForm;