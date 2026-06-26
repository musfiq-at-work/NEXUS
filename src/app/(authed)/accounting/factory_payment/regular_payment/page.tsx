'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";


const FactoryPaymentPage = () => {
    return (
        <Wrapper heading="Regular Factory Payment">
            Factory Payment Content
        </Wrapper>
    )
}

export default FactoryPaymentPage;