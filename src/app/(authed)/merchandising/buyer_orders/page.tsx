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

const BuyerOrders = () => {
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
    const {data: buyerOrders, isLoading} = api.buyerOrders.getBuyerOrders.useQuery({
        limit,
        offset: page * limit,
    });

    const buyerOrdersList = buyerOrders?.buyerOrders ?? [];
    const total = buyerOrders?.total ?? 0;
    
    // Search query (enabled only when there's a search term)
    const searchQuery = api.buyerOrders.searchBuyerOrders.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    const editURL = '/merchandising/buyer_orders/edit/';

    const printURL = `/pdf/buyer_order/`;

    const deleteMutation = api.buyerOrders.deleteBuyerOrder.useMutation({
        onSuccess: async () => {
            toast.success("Buyer Order deleted successfully!");
            setDeleteClicked(false);
            setDeleteID('');
            await Promise.all([
                utils.buyerOrders.getBuyerOrders.invalidate(),
                utils.buyerOrders.searchBuyerOrders.invalidate(),
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
            toast.error(`Error deleting Buyer Order: ${parsedError}`);
        }
        finally {
            setIsLoadingDelete(false);
        }
    }, [deleteID, deleteMutation]);

    return (
        <>
            <Wrapper
                heading="Buyer Orders"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Buyer Orders..."
                        infoText="Buyer Name, Order Reference, Style, PO, Department, Season, and Team name."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Buyer Order"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/merchandising/buyer_orders/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.buyerOrders && !!debouncedSearch 
                            ? searchQuery.data.buyerOrders : buyerOrdersList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.buyerOrders && searchQuery.data.buyerOrders.length > 0 
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
                    searchQuery.data?.buyerOrders && !!debouncedSearch 
                        ? searchQuery.data.buyerOrders : buyerOrdersList
                ).find(order => order.id === deleteID)?.ref_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default BuyerOrders;