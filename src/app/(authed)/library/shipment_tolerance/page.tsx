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

const ShipmentTolerancePage = () => {
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
    const {data: toleranceLevels, isLoading} = api.toleranceLevel.getTolerance.useQuery({
        limit,
        offset: page * limit,
    });

    const toleranceLevelList = toleranceLevels?.toleranceLevels ?? [];
    const total = toleranceLevels?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.toleranceLevel.searchTolerance.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    const editURL = '/library/shipment_tolerance/edit/';

    const deleteMutation = api.toleranceLevel.deleteTolerance.useMutation({
        onSuccess: async () => {
            toast.success("Tolerance level deleted successfully!");
            setIsLoadingDelete(false);
            setDeleteClicked(false);
            setDeleteID(0);
            await Promise.all([
                utils.toleranceLevel.getTolerance.invalidate(),
                utils.toleranceLevel.searchTolerance.invalidate(),
            ]);
        },
    });

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
            toast.error(`Error deleting tolerance level: ${message}`);
        }
        finally {
            setIsLoadingDelete(false);
        }
    }, [deleteID, deleteMutation]);
    
    
    return (
        <>
            <Wrapper
                heading="Shipment Tolerance"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Shipment Tolerance..."
                        infoText="Shipment Tolerance."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Shipment Tolerance"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/shipment_tolerance/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.toleranceLevels && !!debouncedSearch 
                            ? searchQuery.data.toleranceLevels : toleranceLevelList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.toleranceLevels && searchQuery.data.toleranceLevels.length > 0 
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
                    searchQuery.data?.toleranceLevels && !!debouncedSearch 
                        ? searchQuery.data.toleranceLevels : toleranceLevelList
                ).find(toleranceLevel => toleranceLevel.id === deleteID)?.buyer_name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};
    
export default ShipmentTolerancePage;