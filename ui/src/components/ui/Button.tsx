import { ButtonHTMLAttributes } from "react";

type Mod = "primary" | "secondly";

export default function Button({
  mod,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { mod: Mod }) {
  const color = {
    primary: "bg-blue-600 text-white !shadow-blue-300",
    secondly: "bg-blue-400 text-white !shadow-blue-200",
  }[mod];

  return (
    <button
      className={`p-2 shadow rounded-md focus:shadow-md hover:shadow-md transition-shadow ${color} ${className}`}
      {...props}
    />
  );
}
