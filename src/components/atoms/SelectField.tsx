import Select, { components, type SingleValue } from "react-select";
import clsx from "clsx";
import React from "react";

export type Option = {
    label: string;
    value: string | number | boolean;
};

type FormSelectProps = {
    options?: Option[];
    value: string | number | boolean | null;
    onChange: (value: string | number | boolean | null) => void;
    error?: boolean;
    disabled?: boolean;
    className?: string;
};

const SelectField = ({ options, value, onChange, error, disabled, className = 'emboss-inner'}: FormSelectProps) => {
    return (
        <Select
            unstyled
            isMulti={false}
            options={options}
            value={options?.find((c) => String(c.value) === String(value)) ?? null}
            onChange={(val: SingleValue<Option>) => onChange(val ? val.value : null)}
            isDisabled={disabled}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            isSearchable
            styles={{
                menuPortal: (base) => ({...base, zIndex: 9999}),
            }}
            components={{
                DropdownIndicator: disabled ? () => null : components.DropdownIndicator,
                IndicatorSeparator: () => null,
            }}
            classNames={{
                control: ({ isDisabled }) => clsx(
                    "mb-1 appearance-none py-2 px-3 rounded-lg outline-none w-full min-w-[130px]",
                    error && "border border-red-500",
                    isDisabled ? "cursor-not-allowed opacity-80" : "cursor-pointer",
                    className
                ),
                valueContainer: () => "px-0 flex flex-wrap overflow-visible",
                singleValue: () => "text-gray-900 whitespace-normal break-words leading-snug",
                input: () => "m-0 p-0 w-full min-w-0",
                placeholder: () => "text-gray-400 whitespace-normal",
                menu: () => "rounded-lg bg-white shadow-lg border border-gray-200 min-w-[130px]",
                option: ({ isFocused, isSelected }) => clsx(
                    "px-3 py-2 cursor-pointer text-wrap min-w-[125px] break-all",
                    isSelected && "bg-primary text-white",
                    isFocused && !isSelected && "bg-secondary-accent text-white"
                ),
            }}
        />
    )
}

export default React.memo(SelectField) as typeof SelectField;