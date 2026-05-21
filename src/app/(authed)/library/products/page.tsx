'use client';
import { useRouter } from "next/navigation";
import { use, useCallback, useState } from "react";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { useDebouncedValue, useModulePath, useTablePagination } from "~/hooks";
import { useNavigationStore, usePermissionStore } from "~/store";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { parseTRPCError } from "~/utils/parseTRPCError";

const ProductsPage = () => {
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
    const {data: products, isLoading} = api.products.getProducts.useQuery({
        limit,
        offset: page * limit,
    });

    const productsList = products?.products ?? [];
    const total = products?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.products.searchProducts.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]); 

    const editURL = '/library/products/edit/';

    const deleteMutation = api.products.deleteProduct.useMutation({
        onSuccess: async () => {
            toast.success("Product deleted successfully!");
            setDeleteClicked(false);
            setDeleteID(0);
            await Promise.all([
                utils.products.getProducts.invalidate(),
                utils.products.searchProducts.invalidate()
            ]);
        },
    });

    // Handlers
    const handleDeleteClicked = useCallback((id: string) => {
        setDeleteClicked(true);
        setDeleteID(parseInt(id));
    }, []);

    const handleDeleteConfirmed = useCallback(async () => {
        setDeleteClicked(true);

        if(!deleteID) return;

        try {
            await deleteMutation.mutateAsync({ id: deleteID });
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting product: ${message}`);
        }
        finally {
            setIsLoadingDelete(false);
        }
    }, [deleteID, deleteMutation]);

    return (
        <>
            <Wrapper
                heading ="Products"
                subSectionLeft={
                    <SearchField
                        placeholder="Search products..."
                        infoText="Name, Type, Stats"
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? ( 
                        <div className="w-70">
                            <Button
                                variant="primary"
                                label='Add Product'
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/products/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.products && !!debouncedSearch 
                            ? searchQuery.data.products : productsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.products && searchQuery.data.products.length > 0 
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
                    searchQuery.data?.products && !!debouncedSearch 
                        ? searchQuery.data.products : productsList
                ).find(product => product.id === deleteID)?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default ProductsPage;
        