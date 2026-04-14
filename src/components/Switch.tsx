import { useState } from "react";

type SwitchProps = {
	checked?: boolean;
	onChange?: (checked: boolean) => void;
	label?: string;
	className?: string;
};

export function Switch({
	checked,
	onChange,
	label,
	className = "",
}: SwitchProps) {
	const [internal, setInternal] = useState(false);
	const isChecked = checked ?? internal;

	function toggle() {
		if (onChange) onChange(!isChecked);
		else setInternal(!isChecked);
	}

	return (
		<div className={`flex items-center gap-2rounded-lg ${className}`}>
			{label ? (
				<span
					className={`text-xs mr-2 ${
						isChecked ? "text-zinc-900 dark:text-white" : "text-zinc-400"
					}`}
				>
					{label}
				</span>
			) : null}

			<button
				role="switch"
				aria-checked={isChecked}
				onClick={toggle}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						toggle();
					}
				}}
				className={`
					cursor-pointer
					border border-zinc-300 dark:border-zinc-700 
					relative inline-flex h-5 w-9 items-center
					rounded-full transition-colors
					focus:outline-none focus:ring-2 focus:ring-primary
					${isChecked ? "bg-primary" : "bg-zinc-100 dark:bg-zinc-700"}
				`}
			>
				<span
					className={`
						inline-block h-3.5 w-4 transform rounded-full bg-zinc-400
						transition-transform
						${isChecked ? "translate-x-4" : "translate-x-0.75"}
					`}
				/>
			</button>
		</div>
	);
}
