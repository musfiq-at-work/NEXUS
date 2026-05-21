'use client';
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { useDebouncedValue, useModulePath, useTablePagination } from "~/hooks";
import { useNavigationStore, usePermissionStore } from "~/store";
import { api } from "~/trpc/react";
import { tableHeaders } from "./config/columns";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const CurrenciesPage = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Delete Flow States
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [deleteClicked, setDeleteClicked] = useState(false);
    const [deleteID, setDeleteID] = useState<number>(0);

    // Debounced search term
    const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_add, can_update, can_delete } = permissions ?? {};


    // Frontend pagination state and handlers
    const { page, limit, nextPage, prevPage, setPage } = useTablePagination();

    const utils = api.useUtils();

    const { data: currenciesData, isLoading } = api.currencies.getCurrencies.useQuery({
        limit,
        offset: page * limit,
    });

    const currencies = currenciesData?.currencies ?? [];
    const total = currenciesData?.totalCount ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.currencies.searchCurrencies.useQuery(
        { query: debouncedSearchTerm, limit, offset: page * limit },
        { enabled: debouncedSearchTerm.length > 0 }
    );

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    const editURL = '/library/currencies/edit/';

    const deleteMutation = api.currencies.deleteCurrency.useMutation({
        onSuccess: async () => {
            await Promise.all([
                utils.currencies.getCurrencies.invalidate(),
                utils.currencies.searchCurrencies.invalidate()
            ]);
            toast.success("Currency deleted successfully!");
            setDeleteClicked(false);
            setDeleteID(0);
        },
    });

    const handleDelete = (id: string) => {
        setDeleteClicked(true);
        setDeleteID(parseInt(id));
    };

    const confirmDelete = async () => {
        setIsLoadingDelete(true);

        if (!deleteID) return;

        try {
            await deleteMutation.mutateAsync({id: deleteID});
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting currency: ${message}`);
        } finally {
            setIsLoadingDelete(false);
        }
    };

    return (
        <>
            <Wrapper
                heading="Currencies"    
                subSectionLeft={
                    <SearchField placeholder="Search Currencies" handleSearchChange={handleSearchChange} 
                        infoText="Currency Name, Code, and Symbol."
                    />
                }
                subSectionRight={
                    can_add && <div className="w-56">
                        <Button
                            variant="secondary"
                            leftIcon={plusIcon}
                            label="Add New Currency"
                            disabled={!can_add}
                            onClick={() => router.push('/library/currencies/new')}
                        />
                    </div>
                }
            >
                <div className="w-full">
                    <Table 
                        data={debouncedSearchTerm.length > 0 
                            ? searchQuery.data?.currencies ?? [] : currencies
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.currencies && searchQuery.data.currencies.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        page={page}
                        limit={limit}
                        editURL={can_update ? editURL : undefined}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        deleteFunction={handleDelete}
                    />
                </div>
            </Wrapper>
            <Popup 
                open={deleteClicked}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    debouncedSearchTerm.length > 0 
                        ? searchQuery.data?.currencies ?? [] : currencies
                ).find(c => c.id === deleteID)?.name}"?`}
                onClose={() => setDeleteClicked(false)}
                loading={isLoadingDelete}
                actionLabel="DELETE"
                negativeAction={true}
                action={confirmDelete}
            />
        </>
    )
}

export default CurrenciesPage;