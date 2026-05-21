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

const CommissionDistribution = () => {
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
    const {data: commissionDistributions, isLoading} = api.commissionDistribution.getCommissionDistribution.useQuery({
        limit,
        offset: page * limit,
    });

    const commissionDistributionList = commissionDistributions?.distributions ?? [];
    const total = commissionDistributions?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.commissionDistribution.searchCommissionDistribution.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );
    
    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    const editURL = '/merchandising/commission_distribution/edit/';

    const printURL = `/pdf/commission_distribution/`;

    const deleteMutation = api.commissionDistribution.deleteCommissionDistribution.useMutation({
        onSuccess: async () => {
            toast.success("Commission Distribution deleted successfully!");
            setDeleteClicked(false);
            setDeleteID('');
            await Promise.all([
                utils.commissionDistribution.getCommissionDistribution.invalidate(),
                utils.commissionDistribution.searchCommissionDistribution.invalidate(),
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
            toast.error(`Error deleting Commission Distribution: ${parsedError}`);
        }
        finally {
            setIsLoadingDelete(false);
        }
    }, [deleteID, deleteMutation]);

    return (
        <>
            <Wrapper
                heading="Commission Distributions"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Commission Distributions..."
                        infoText="Buyer Name, Order Reference, Style, PO, and Plan Date."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-80">
                            <Button
                                variant="secondary"
                                label="Add New Commission Distribution"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/merchandising/commission_distribution/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.distributions && !!debouncedSearch 
                            ? searchQuery.data.distributions : commissionDistributionList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.distributions && searchQuery.data.distributions.length > 0 
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
                    searchQuery.data?.distributions && !!debouncedSearch 
                        ? searchQuery.data.distributions : commissionDistributionList
                ).find(distribution => distribution.id === deleteID)?.ref_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default CommissionDistribution;