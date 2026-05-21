'use client';
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { useDebouncedValue, useModulePath, useTablePagination } from "~/hooks";
import { useNavigationStore, usePermissionStore } from "~/store";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { parseTRPCError } from "~/utils/parseTRPCError";

const MasterLC = () => {
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
    const {data: lcMasterData, isLoading} = api.lcMaster.getLc.useQuery({
        limit,
        offset: page * limit,
    });

    const lcMasterList = lcMasterData?.lc ?? [];
    const total = lcMasterData?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.lcMaster.searchLc.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    const editURL = '/merchandising/lc/lc_master/edit/';

    const deleteMutation = api.lcMaster.deleteLc.useMutation({
        onSuccess: async () => {
            toast.success('LC deleted successfully');
            setDeleteClicked(false);
            setDeleteID('');
            await Promise.all([
                utils.lcMaster.getLc.invalidate(),
                utils.lcMaster.searchLc.invalidate(),
            ]);
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
            toast.error(`Error deleting LC: ${parsedError}`);
        }
        finally {
            setIsLoadingDelete(false);
        }
    }, [deleteID, deleteMutation]);

    return (
        <>
            <Wrapper
                heading="Master LC"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Master LC..."
                        infoText="Search Master LC No, Order Reference, Style or PO."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Master LC"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/merchandising/lc/lc_master/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.lc && !!debouncedSearch 
                            ? searchQuery.data.lc : lcMasterList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.lc && searchQuery.data.lc.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        allowPrint={false}
                        view={!can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.lc && !!debouncedSearch 
                        ? searchQuery.data.lc : lcMasterList
                ).find(lc => lc.id.toString() === deleteID)?.lc_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default MasterLC;