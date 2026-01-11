import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  full?: boolean;
};

const Button: React.FC<Props> = ({ full, className = "", ...props }) => {
  return (
    <button
      {...props}
      className={[
        full ? "w-full" : "",
        "px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
    />
  );
};

export default Button;
