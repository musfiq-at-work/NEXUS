'use client'

import { Wrapper } from "~/components"

const BuyerCommissions = () => {
    return (
        <Wrapper
            heading="Commission Percentages"
            // subSectionLeft={
            //     <SearchField
            //         placeholder="Search Couriers..."
            //         infoText="Courier Name, Email Address, Phone No, Address, Contact Person, Website."
            //         handleSearchChange={handleSearchChange}
            //     />
            // }
            // subSectionRight={
            //     can_add ? (
            //         <div className="w-70">
            //             <Button
            //                 variant="secondary"
            //                 label="Add New Courier"
            //                 leftIcon={plusIcon}
            //                 onClick={() => router.push('/library/couriers/new')}
            //             />
            //         </div>
            //     ) : null
            // }
        >
            <div className="w-full">
                {/* <Table
                    data={searchQuery.data?.couriers && !!debouncedSearch 
                        ? searchQuery.data.couriers : couriersList
                    }
                    isLoading={isLoading || searchQuery.isLoading}
                    columns={tableHeaders}
                    nextPage={nextPage}
                    prevPage={prevPage}
                    total={searchQuery.data?.couriers && searchQuery.data.couriers.length > 0 
                        ? searchQuery.data.total ?? 0 : total
                    }
                    deleteFunction={handleDeleteClicked}
                    page={page}
                    limit={limit}
                    editURL={can_update ? editURL : undefined}
                    allowDelete={can_delete}
                    allowEdit={can_update}
                /> */}
            </div>
        </Wrapper>
    )
}

export default BuyerCommissions;