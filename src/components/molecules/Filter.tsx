import { clearIcon } from "~/assets"
import SelectField, { type Option } from "../atoms/SelectField";
import type { SetStateAction } from "react";

interface Props {
    filter: number;
    filterChange: (value: string | number | boolean | null) => void;
    setFilter: (value: SetStateAction<number>) => void;
    label: string;
    options: Option[];
}

const Filter = (props: Props) => {
    const { filter, filterChange, setFilter, label, options } = props;

    return (
        <div className={`flex w-full items-center justify-end gap-3 rounded-xl border-2 
            bg-white/70 pl-3 backdrop-blur-sm transition-colors sm:w-auto 
            ${ filter !== -1 ? 'border-secondary' : 'border-slate-200/80' }`
        }>
            <label className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-primary-dark">
                {label}
            </label>
            <SelectField
                options={options}
                value={filter}
                onChange={filterChange}
                className='!mb-0 w-52 border-x border-slate-200 bg-white transition-shadow'
            />
            <button
                type="button"
                aria-label="Clear approval status filter"
                title="Clear filter"
                onClick={() => setFilter(-1)}
                disabled={filter === -1}
                className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full 
                    transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
                <img src={clearIcon.src} alt="" className="h-4 w-4" />
            </button>
        </div>
    )
}

export default Filter;