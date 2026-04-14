import { useState } from "react";

type TabItem = {
	key: string;
	label: string;
};

type TabsProps = {
	items: TabItem[];
	value?: string;
	onChange?: (key: string) => void;
	className?: string;
};

export function Tabs({ items, value, onChange, className = "" }: TabsProps) {
	const [internal, setInternal] = useState(items[0]?.key);
	const active = value ?? internal;

	function handleChange(key: string) {
		if (onChange) onChange(key);
		else setInternal(key);
	}

	return (
		<div
			role="tablist"
			className={`
				inline-flex p-1 rounded-xl
				bg-zinc-100 dark:bg-zinc-800
				${className}
			`}
		>
			{items.map((item) => {
				const isActive = active === item.key;

				return (
					<button
						key={item.key}
						role="tab"
						aria-selected={isActive}
						onClick={() => handleChange(item.key)}
						className={`
							cursor-pointer
							relative px-3 py-0.5 text-xs rounded-lg
							transition-all duration-200
							${
								isActive
									? "bg-white dark:bg-zinc-900 shadow text-zinc-900 dark:text-white"
									: "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
							}
						`}
					>
						{item.label}
					</button>
				);
			})}
		</div>
	);
}
