'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";


const FactoryPaymentPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    return (
        <>
            <Wrapper
                heading="Cross Payments"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Cross Payments..."
                        infoText="Cross Payment Reference, Buyer Name, Term and Factory Invoice."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Cross Payment"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/accounting/factory_payment/cross_payment/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <p>Cross Payments</p>
                {/* <div className="w-full">
                    <Table
                        data={searchQuery.data?.proceedRealizations && !!debouncedSearch 
                            ? searchQuery.data.proceedRealizations : proceedRealizationList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.proceedRealizations && searchQuery.data.proceedRealizations.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        view={!can_update}
                    />
                </div> */}
            </Wrapper>
            {/* <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.proceedRealizations && !!debouncedSearch 
                        ? searchQuery.data.proceedRealizations : proceedRealizationList
                ).find((proceedRealization) => proceedRealization.id === deleteID)?.fdbc_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            /> */}
        </>
    )
}

export default FactoryPaymentPage;