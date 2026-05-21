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


const FobTypesPage = () => {
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
    const {data: fobTypes, isLoading} = api.fobTypes.getFobTypes.useQuery({
        limit,
        offset: page * limit,
    });

    const fobTypeList = fobTypes?.fobTypes ?? [];
    const total = fobTypes?.count ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.fobTypes.searchFobTypes.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    const editURL = '/library/fob_types/edit/';

    const deleteMutation = api.fobTypes.deleteFobType.useMutation({
        onSuccess: async () => {
            toast.success("FOB Type deleted successfully!");
            setDeleteClicked(false);
            setDeleteID(0);
            await Promise.all([
                utils.fobTypes.getAll.invalidate(),
                utils.fobTypes.searchFobTypes.invalidate()
            ]);
        },
    });

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
            toast.error(`Error deleting FOB Type: ${message}`);
        }
        finally {
            setIsLoadingDelete(false);
        }
    }, [deleteID, deleteMutation]);

    return (
        <>
            <Wrapper
                heading="FOB Types"
                subSectionLeft={
                    <SearchField
                        placeholder="Search FOB Types..."
                        infoText="FOB Type."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New FOB Type"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/fob_types/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.fobTypes && !!debouncedSearch 
                            ? searchQuery.data.fobTypes : fobTypeList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.fobTypes && searchQuery.data.fobTypes.length > 0 
                            ? searchQuery.data.count ?? 0 : total
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
                    searchQuery.data?.fobTypes && !!debouncedSearch 
                        ? searchQuery.data.fobTypes : fobTypeList
                ).find(fobType => fobType.id === deleteID)?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default FobTypesPage;