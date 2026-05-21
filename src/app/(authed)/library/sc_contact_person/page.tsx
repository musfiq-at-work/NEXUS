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

const ScContactPersonPage = () => {
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
    const {data: contactPersons, isLoading} = api.scContactPerson.getContactPersons.useQuery({
        limit,
        offset: page * limit,
    });

    const contactPersonsList = contactPersons?.contactPersons ?? [];
    const total = contactPersons?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.scContactPerson.searchContactPersons.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    const editURL = '/library/sc_contact_person/edit/';

    const deleteMutation = api.scContactPerson.deleteContactPerson.useMutation({
        onSuccess: async () => {
            toast.success("Contact person deleted successfully!");
            setDeleteClicked(false);
            setDeleteID(0);
            await Promise.all([
                utils.scContactPerson.getContactPersons.invalidate(),
                utils.scContactPerson.searchContactPersons.invalidate() 
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
            const parsedError = parseTRPCError(error);
            toast.error(parsedError);
            setDeleteClicked(false);
            setDeleteID(0);
        }
        finally {
            setIsLoadingDelete(false);
        }
    }, [deleteID, deleteMutation]);

    return (
        <>
            <Wrapper
                heading ="Contact Persons"
                subSectionLeft={
                    <SearchField
                        placeholder="Search contact persons..."
                        infoText="Name, Email, pabx, and contact number"
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? ( 
                        <div className="w-70">
                            <Button
                                variant="primary"
                                label='Add Contact Person'
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/sc_contact_person/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.contactPersons && !!debouncedSearch 
                            ? searchQuery.data.contactPersons : contactPersonsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.contactPersons && searchQuery.data.contactPersons.length > 0 
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
                    searchQuery.data?.contactPersons && !!debouncedSearch 
                        ? searchQuery.data.contactPersons : contactPersonsList
                ).find(contactPerson => contactPerson.id === deleteID)?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default ScContactPersonPage;