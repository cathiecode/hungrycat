import {
  DetailedHTMLProps,
  forwardRef,
  HTMLAttributes,
  InputHTMLAttributes,
} from "react";

const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  console.log(props);
  return (
    <input
      ref={ref}
      type="text"
      placeholder="Access token..."
      className={`m-auto p-3 border border-slate-200 focus:border-slate-300 shadow-slate-300 shadow focus:shadow-md rounded-lg transition-colors ${className}`}
      {...props}
    />
  );
});

export default TextInput;
