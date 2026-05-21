import clsx from "clsx";
import React from "react";

type CheckBoxProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange"
> & {
    value?: boolean;
    onChange?: (value: boolean) => void;
    className?: string;
    disabled?: boolean;
};

const CheckBox = ({ value, onChange, className, disabled, ...rest }: CheckBoxProps) => {
    return (
        <div className="flex items-center mb-4">
            <input
                type="checkbox"
                className={clsx("w-full h-5 cursor-pointer", className)}
                checked={!!value}
                onChange={(e) => onChange?.(e.target.checked)}
                disabled={disabled}
                {...rest}
            />
        </div>
    );
};

export default React.memo(CheckBox);