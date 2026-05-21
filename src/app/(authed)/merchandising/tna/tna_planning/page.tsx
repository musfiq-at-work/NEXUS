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


const TNAPlanning = () => {
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
    const {data: tnaPlans, isLoading} = api.tnaPlan.getTnaPlans.useQuery({
        limit,
        offset: page * limit,
    });

    const tnaPlansList = tnaPlans?.plans ?? [];
    const total = tnaPlans?.count ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.tnaPlan.searchTnaPlans.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    const editURL = '/merchandising/tna/tna_planning/edit/';

    const deleteMutation = api.tnaPlan.deleteTnaPlan.useMutation({
        onSuccess: async () => {
            toast.success("TNA Plan deleted successfully!");
            setDeleteClicked(false);
            setDeleteID('');
            await Promise.all([
                utils.tnaPlan.getTnaPlans.invalidate(),
                utils.tnaPlan.searchTnaPlans.invalidate(),
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
            toast.error(`Error deleting TNA Plan: ${parsedError}`);
        }
        finally {
            setIsLoadingDelete(false);
        }
    }, [deleteID, deleteMutation]);


    return (
        <>
            <Wrapper
                heading="TNA Plans"
                subSectionLeft={
                    <SearchField
                        placeholder="Search TNA Plans..."
                        infoText="Template Name, Buyer Name, Order References, Factory Name, Style and PO."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New TNA Plan"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/merchandising/tna/tna_planning/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.plans && !!debouncedSearch 
                            ? searchQuery.data.plans : tnaPlansList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.plans && searchQuery.data.plans.length > 0 
                            ? searchQuery.data.count ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        view={!can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.plans && !!debouncedSearch 
                        ? searchQuery.data.plans : tnaPlansList
                ).find(plan => plan.id === deleteID)?.template_name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default TNAPlanning;