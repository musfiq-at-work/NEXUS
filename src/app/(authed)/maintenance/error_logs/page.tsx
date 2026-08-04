'use client';
import { Wrapper, TableFooter } from "~/components";
import { api } from "~/trpc/react";
import { useSearchablePagination } from "~/hooks";
import ErrorLogs from "./_components/errorLog";

const ShipmentTolerancePage = () => {
    const { page, limit, nextPage, prevPage } = useSearchablePagination();
    
    // Fetch paginated data
    const {data: logs} = api.errorLogs.getErrors.useQuery({
        limit: 10,
        offset: page * limit,
    });

    const errorList = logs?.errors ?? [];
    const total = logs?.total ?? 0;

    return (
        <Wrapper
            heading="Error Logs"
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
    );
};
    
export default ShipmentTolerancePage;