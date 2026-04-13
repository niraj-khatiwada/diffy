import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function useHtmlTheme(): Theme {
	const [theme, setTheme] = useState<Theme>(() => {
		if (typeof window === "undefined") return "dark";

		const el = document.documentElement;

		if (el.classList.contains("dark")) return "dark";
		if (el.classList.contains("light")) return "light";

		return "light";
	});

	useEffect(() => {
		let observer: MutationObserver;
		if (typeof window !== "undefined") {
			const el = document.documentElement;

			observer = new MutationObserver(() => {
				const isDark = el.classList.contains("dark");
				setTheme(isDark ? "dark" : "light");
			});

			observer.observe(el, {
				attributes: true,
				attributeFilter: ["class"],
			});
		}

		return () => observer.disconnect();
	}, []);

	return theme;
}
