'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup, TableFooter } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
// import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";
import ErrorLogs from "./_components/errorLog";

const ShipmentTolerancePage = () => {
    const router = useRouter();
    const utils = api.useUtils();
    
    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();
    
    // Fetch paginated data
    const {data: logs, isLoading} = api.errorLogs.getErrors.useQuery({
        limit: 10,
        offset: page * limit,
    });

    const errorList = logs?.errors ?? [];
    const total = logs?.total ?? 0;

    // // Search query (enabled only when there's a search term)
    // const searchQuery = api.toleranceLevel.searchTolerance.useQuery(
    //     { query: debouncedSearch, limit, offset: page * limit },
    //     { enabled: debouncedSearch.length > 0 }
    // );

    const editURL = '/developer/error_logs/edit/';

    return (
        <>
            <Wrapper
                heading="Error Logs"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Shipment Tolerance..."
                        infoText="Shipment Tolerance."
                        handleSearchChange={() => {}} // handleSearchChange}
                    />
                }
                // subSectionRight={
                //     can_add ? (
                //         <div className="w-70">
                //             <Button
                //                 variant="secondary"
                //                 label="Add New Shipment Tolerance"
                //                 leftIcon={plusIcon}
                //                 onClick={() => router.push('/maintenance/shipment_tolerance/new')}
                //             />
                //         </div>
                //     ) : null
                // }
            >
                <div className="w-full">
                    <ErrorLogs errorList={errorList} />
                    <TableFooter 
                        page={page}
                        limit={10}
                        total={total}
                        prevPage={prevPage}
                        nextPage={nextPage}
                    />
                </div>
            </Wrapper>
        </>
    );
};
    
export default ShipmentTolerancePage;