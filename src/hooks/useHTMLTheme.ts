import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function useHtmlTheme(): Theme {
	const [theme, setTheme] = useState<Theme>(() => {
		return typeof window !== "undefined"
			? document.documentElement.classList.contains("dark")
				? "dark"
				: "light"
			: "dark";
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
