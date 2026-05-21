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

const FabricSuppliersPage = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Delete Flow States
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [deleteClicked, setDeleteClicked] = useState(false);
    const [deleteID, setDeleteID] = useState<number>(0);
    
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
    const {data: fabricSuppliers, isLoading} = api.fabricSuppliers.getFabricSuppliers.useQuery({
        limit,
        offset: page * limit,
    });

    const fabricSuppliersList = fabricSuppliers?.fabricSuppliers ?? [];
    const total = fabricSuppliers?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.fabricSuppliers.searchFabricSuppliers.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    const editURL = '/library/fabric_supplier/edit/';

    const deleteMutation = api.fabricSuppliers.deleteFabricSupplier.useMutation({
        onSuccess: async () => {
            toast.success("Fabric supplier deleted successfully!");
            setDeleteClicked(false);
            setDeleteID(0);
            await Promise.all([
                utils.fabricSuppliers.getFabricSuppliers.invalidate(),
                utils.fabricSuppliers.searchFabricSuppliers.invalidate()
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

        if(!deleteID) return;

        try {
            await deleteMutation.mutateAsync({id: deleteID});
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting fabric supplier: ${message}`);
        }
        finally {
            setIsLoadingDelete(false);
        }
    }, [deleteID, deleteMutation]);

    return (
        <>
            <Wrapper
                heading="Fabric Suppliers"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Fabric Suppliers..."
                        infoText="Supplier Name, Email Address, Phone No, Address, Contact Person, Country."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Fabric Supplier"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/fabric_supplier/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.fabricSuppliers && !!debouncedSearch 
                            ? searchQuery.data.fabricSuppliers : fabricSuppliersList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.fabricSuppliers && searchQuery.data.fabricSuppliers.length > 0 
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
                    searchQuery.data?.fabricSuppliers && !!debouncedSearch 
                        ? searchQuery.data.fabricSuppliers : fabricSuppliersList
                ).find(supplier => supplier.id === deleteID)?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default FabricSuppliersPage;