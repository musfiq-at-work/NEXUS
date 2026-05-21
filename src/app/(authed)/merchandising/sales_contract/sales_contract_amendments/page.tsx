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


const SalesContractAmendment = () => {
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

    // Fetch paginated data
    const {data: salesContractAmendments, isLoading} = api.salesContractAmendments.getSalesContractAmendments.useQuery({
        limit,
        offset: page * limit,
    });

    const salesContractAmendmentsList = salesContractAmendments?.salesContractAmendments ?? [];
    const total = salesContractAmendments?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.salesContractAmendments.searchSalesContractAmendments.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    const editURL = '/merchandising/sales_contract/sales_contract_amendments/edit/';

    const printURL = `/pdf/sales_contract_amendment/`;

    const deleteMutation = api.salesContractAmendments.deleteSalesContractAmendment.useMutation({
        onSuccess: async () => {
            toast.success("Sales Contract Amendment deleted successfully!");
            setDeleteClicked(false);
            setDeleteID('');
            await Promise.all([
                utils.salesContractAmendments.getSalesContractAmendments.invalidate(),
                utils.salesContractAmendments.searchSalesContractAmendments.invalidate(),
            ]);
        },
        onError: () => {
            setIsLoadingDelete(false);
        }
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
            toast.error(`Error deleting Sales Contract Amendment: ${parsedError}`);
        }
        finally {
            setIsLoadingDelete(false);
        }
    }, [deleteID, deleteMutation]);

    return (
        <>
            <Wrapper
                heading="Sales Contract Amendments"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Sales Contract Amendments..."
                        infoText="Search Sales Contract No, Factory Name, Order Reference, Style or PO."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Amendment"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/merchandising/sales_contract/sales_contract_amendments/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.salesContracts && !!debouncedSearch 
                            ? searchQuery.data.salesContracts : salesContractAmendmentsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.salesContracts && searchQuery.data.salesContracts.length > 0 
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
                    searchQuery.data?.salesContracts && !!debouncedSearch 
                        ? searchQuery.data.salesContracts : salesContractAmendmentsList
                ).find(contract => contract.id.toString() === deleteID)?.sales_contract_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default SalesContractAmendment;