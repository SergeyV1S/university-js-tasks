import type { ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
};

export const FormField = ({ id, label, error, children }: FormFieldProps) => (
  <div className='grid gap-0.75'>
    <label htmlFor={id} className='text-invest-label text-invest-muted'>
      {label}
    </label>
    {children}
    {error && (
      <p id={`${id}-error`} className='text-invest-caption text-invest-negative'>
        {error}
      </p>
    )}
  </div>
);
