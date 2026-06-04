'use client';
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { useDebouncedValue, useModulePath, useTablePagination } from "~/hooks";
import { useNavigationStore, usePermissionStore } from "~/store";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { parseTRPCError } from "~/utils/parseTRPCError";

const RdlInvoicePage = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Delete Flow States
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [deleteClicked, setDeleteClicked] = useState(false);
    const [deleteID, setDeleteID] = useState<string>('');
    
    const utils = api.useUtils();
    
    // Debounced search term
    const debouncedSearch = useDebouncedValue(searchTerm);
    
    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_add, can_update, can_delete } = permissions ?? {};

    // Frontend pagination state and handlers
    const { page, limit, nextPage, prevPage, setPage } = useTablePagination();

    const {data: rdlInvoices, isLoading} = api.rdlInvoice.getRdlInvoice.useQuery({
        limit,
        offset: page * limit,
    });

    const rdlInvoiceList = rdlInvoices?.rdlInvoices ?? [];
    const total = rdlInvoices?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.rdlInvoice.searchRdlInvoices.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    const editURL = '/commercial/rdl_invoice/edit/';
    const printURL = '/pdf/rdl_invoice/';

    const deleteMutation = api.rdlInvoice.deleteRdlInvoice.useMutation({
        onSuccess: async () => {
            toast.success("RDL Invoice deleted successfully");
            setDeleteClicked(false);
            setDeleteID('');
            await Promise.all([
                utils.rdlInvoice.getRdlInvoice.invalidate(),
                utils.rdlInvoice.searchRdlInvoices.invalidate()
            ]);
        },
    });
    
    // Handlers
    const handleDeleteClicked = useCallback((id: string) => {
        setDeleteClicked(true);
        setDeleteID(id);
    }, []);

    const handleDeleteConfirmed = useCallback(async () => {
        setIsLoadingDelete(true);

        if(!deleteID) return;

        try {
            await deleteMutation.mutateAsync({ id: deleteID });
        }
        catch (error) {
            const parsedError = parseTRPCError(error);
            toast.error(`Error deleting RDL Invoice: ${parsedError}`);
        }
        finally {
            setIsLoadingDelete(false);
        }
    }, [deleteID, deleteMutation]);

    return (
        <>
            <Wrapper
                heading="RDL Invoices"
                subSectionLeft={
                    <SearchField
                        placeholder="Search RDL Invoices..."
                        infoText="RDL Invoice No, Buyer Name, Order Reference, Style No, Po no."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New RDL Invoice"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/commercial/rdl_invoice/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.rdlInvoices && !!debouncedSearch 
                            ? searchQuery.data.rdlInvoices : rdlInvoiceList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.rdlInvoices && searchQuery.data.rdlInvoices.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        allowPrint={true}
                        printURL={printURL}
                        view={!can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.rdlInvoices && !!debouncedSearch 
                        ? searchQuery.data.rdlInvoices : rdlInvoiceList
                ).find((rdlInvoice) => rdlInvoice.id === deleteID)?.invoice_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default RdlInvoicePage;