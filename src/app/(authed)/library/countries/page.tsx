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

const CountriesPage = () => {
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
        
    const { data: countriesData, isLoading } = api.countries.getCountries.useQuery({
        limit,
        offset: page * limit,
    });

    const countries = countriesData?.countries ?? [];
    const total = countriesData?.totalCount ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.countries.searchCountries.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    const editURL = '/library/countries/edit/';

    const deleteMutation = api.countries.deleteCountry.useMutation({
        onSuccess: async () => {
            toast.success("Country deleted successfully!");
            setDeleteClicked(false);
            setDeleteID(0);
            await Promise.all([
                utils.countries.getCountries.invalidate(),
                utils.countries.searchCountries.invalidate()
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
            toast.error(`Failed to delete country: ${message}`);
        } 
        finally {
            setIsLoadingDelete(false);
        }
    }, [deleteID, deleteMutation]);
    
    return (
        <>
            <Wrapper
                heading='Countries'
                subSectionLeft={
                    <SearchField placeholder="Search Countries" handleSearchChange={handleSearchChange} 
                        infoText="Country Name and Country Code."
                    />
                }
                subSectionRight={
                    can_add && <div className="w-56">
                        <Button variant="secondary" 
                            label="Add New Country" 
                            leftIcon={plusIcon} 
                            onClick={() => router.push('/library/countries/new')} 
                            disabled={!can_add}
                        />
                    </div>
                }
            >
                <div className="w-full">
                    <Table 
                        data={searchQuery.data?.countries && !!debouncedSearch 
                            ? searchQuery.data.countries : countries
                        }
                        isLoading={isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.countries && searchQuery.data.countries.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
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
                    searchQuery.data?.countries && !!debouncedSearch 
                        ? searchQuery.data.countries : countries
                ).find(c => c.id === deleteID)?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
};

export default CountriesPage;