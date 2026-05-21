import clsx from "clsx";
import React from "react";

type LabelProps = {
  label: string;
  htmlFor: string;
  isErrored?: boolean;
  optional?: boolean; 
}

const Label = ({ label, htmlFor, isErrored = false, optional }: LabelProps) => {
  const variantClasses = {
    error: 'text-red',
    default: 'text-inherit'
  }[isErrored ? 'error' : 'default']

  return (
    <label htmlFor={htmlFor} className={clsx("py-0.5", variantClasses)}>
      {label} {!optional ? "*" : ''}
    </label>
  );
};

export default React.memo(Label) as typeof Label;
