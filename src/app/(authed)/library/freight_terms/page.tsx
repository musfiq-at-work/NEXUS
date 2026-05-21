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


const FreightTermsPage = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Delete Flow States
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [deleteClicked, setDeleteClicked] = useState(false);
    const [deleteID, setDeleteID] = useState<number>(0);
        
    const utils = api.useUtils();
    
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
    const {data: freightTerms, isLoading} = api.freightTerms.getFreightTerms.useQuery({
        limit,
        offset: page * limit,
    });

    const freightTermsList = freightTerms?.freightTerms ?? [];
    const total = freightTerms?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.freightTerms.searchFreightTerms.useQuery(   
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/freight_terms/edit/';

    const deleteMutation = api.freightTerms.deleteFreightTerm.useMutation({
        onSuccess: async () => {
            toast.success("Freight Term deleted successfully!");
            setDeleteClicked(false);
            setDeleteID(0);
            await Promise.all([
                utils.freightTerms.getFreightTerms.invalidate(),
                utils.freightTerms.searchFreightTerms.invalidate()
            ]);
        },
    });

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    // Handlers
    const handleDeleteClicked = useCallback((id: string) => {
        setDeleteClicked(true);
        setDeleteID(parseInt(id));
    }, []);

    const handleDeleteConfirmed = useCallback(async () => {
        setIsLoadingDelete(true);

        if (!deleteID) return;

        try {
            await deleteMutation.mutateAsync({ id: deleteID });
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting Freight Term: ${message}`);
        }
        finally {
            setIsLoadingDelete(false);
        }
    }, [deleteID, deleteMutation]);


    return (
        <>
            <Wrapper
                heading="Freight Terms"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Freight Terms..."
                        infoText="Freight Term."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Freight Term"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/freight_terms/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.freightTerms && !!debouncedSearch 
                            ? searchQuery.data.freightTerms : freightTermsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.freightTerms && searchQuery.data.freightTerms.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={can_update ? editURL : undefined}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.freightTerms && !!debouncedSearch 
                        ? searchQuery.data.freightTerms : freightTermsList
                ).find(freightTerm => freightTerm.id === deleteID)?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default FreightTermsPage;