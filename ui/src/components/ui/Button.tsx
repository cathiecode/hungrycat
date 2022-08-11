import { ButtonHTMLAttributes } from "react";

type Mod = "primary" | "secondaly";

export default function Button({
  mod,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { mod: Mod }) {
  const color = {
    primary: "bg-blue-600 text-white !shadow-blue-300",
    secondaly: "bg-blue-400 text-white !shadow-blue-200",
  }[mod];

  return (
    <button
      className={`p-2 shadow rounded-md focus:shadow-md hover:shadow-md transition-shadow ${color} ${className}`}
      {...props}
    />
  );
}
