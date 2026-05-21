import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { toInputName } from "~/utils/toInputName";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  optional?: boolean;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
};

const Toggle = React.forwardRef<HTMLInputElement, TextFieldProps>((props, ref) => {
  const { label, checked, name, disabled, ...rest } = props;

  return (
    <div className="flex flex-row gap-4 w-full h-full items-center pt-5">
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" 
          ref={ref} 
          readOnly={disabled}
          name={name ?? toInputName(label)}
          className="sr-only"
          {...rest} 
        />  
        <div className={clsx(
          'relative w-11 h-6 rounded-full transition-colors', 
          checked ? "bg-blue-600" : "bg-gray-300"
        )}>
          <motion.div
            className="absolute top-[2px] left-[2px] h-5 w-5 bg-white rounded-full"
            animate={{ x: checked ? 20 : 0 }}
            transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
          />
        </div>
      </label>
    </div>
  );
});

Toggle.displayName = "Toggle";

export default Toggle;