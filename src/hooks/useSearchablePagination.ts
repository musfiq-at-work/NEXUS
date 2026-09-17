import { useCallback, useEffect, useState } from 'react';
import { usePathname } from "next/navigation";
import { useDebouncedValue, useTablePagination } from "~/hooks";

export const useSearchablePagination = () => {
    const pathname = usePathname();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const storedSearchTerm = window.localStorage.getItem(`search-query:${pathname}`);
        setSearchTerm(storedSearchTerm ?? '');
    }, [pathname]);

    const debouncedSearch = useDebouncedValue(searchTerm);

    const { page, limit, nextPage, prevPage, setPage } = useTablePagination();

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0);
        const nextSearchTerm = event.target.value.trim();
        setSearchTerm(nextSearchTerm);

        if (nextSearchTerm) {
            window.localStorage.setItem(`search-query:${pathname}`, nextSearchTerm);
        } else {
            window.localStorage.removeItem(`search-query:${pathname}`);
        }
    }, [pathname, setPage]);

    return {
        searchTerm,
        debouncedSearch,
        page,
        limit,
        nextPage,
        prevPage,
        setPage,
        handleSearchChange,
    };
};