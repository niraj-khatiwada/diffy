import {
	type FileContents,
	MultiFileDiff,
	Virtualizer,
	WorkerPoolContextProvider,
} from "@pierre/diffs/react";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useHtmlTheme } from "~/hooks/useHTMLTheme";
import { workerFactory } from "../utils/worker-factory";

export const Route = createFileRoute("/")({ component: App });

type Side = "left" | "right";

function App() {
	const themeType = useHtmlTheme();

	const [files, setFiles] = useState<{
		left: FileContents | null;
		right: FileContents | null;
	}>({
		left: null,
		right: null,
	});
	const [focusedPane, setFocusedPane] = useState<Side | null>(null);

	async function handleFile(file: File, side: Side) {
		const text = await file.text();

		setFiles((prev) => ({
			...prev,
			[side]: {
				name: file.name,
				contents: text,
			} as FileContents,
		}));
	}

	function handleText(text: string, side: Side, name = "clipboard.txt") {
		setFiles((prev) => ({
			...prev,
			[side]: {
				name,
				contents: text,
			} as FileContents,
		}));
	}

	async function handlePaste(
		e: React.ClipboardEvent<HTMLDivElement>,
		side: Side,
	) {
		e.preventDefault();

		const items = e.clipboardData.items;

		for (const item of items) {
			if (item.kind === "file") {
				const file = item.getAsFile();
				if (file) {
					await handleFile(file, side);
					return;
				}
			}

			if (item.kind === "string" && item.type === "text/plain") {
				item.getAsString((text) => {
					handleText(text, side);
				});
				return;
			}
		}
	}

	const renderPane = useCallback(
		({ side }: { side: Side }) => (
			<>
				<label
					htmlFor={`file-${side}`}
					tabIndex={0}
					onMouseEnter={() => setFocusedPane(side)}
					onMouseLeave={() => setFocusedPane(null)}
					onDragOver={(e) => e.preventDefault()}
					onDrop={(e) => {
						e.preventDefault();
						const file = e.dataTransfer.files?.[0];
						if (file) handleFile(file, side);
					}}
					className={`
					w-full h-full 
					border rounded-xl flex flex-col items-center justify-center
					cursor-pointer transition-all
					${files[side] ? "border-primary" : "border-zinc-300 dark:border-zinc-800"}
					hover:bg-zinc-500/10 dark:hover:bg-zinc-600/10
				`}
				>
					{files[side] ? (
						<div className="text-center">
							<p className="text-sm font-medium text-primary">
								{files[side]!.name}
							</p>
							<p className="text-xs text-gray-500">
								Select / Drop / Paste to replace content
							</p>
						</div>
					) : (
						<div className="text-center space-y-1">
							<p className="text-sm text-gray-400">
								Select / Drop / Paste content
							</p>
						</div>
					)}
				</label>
				<input
					id={`file-${side}`}
					type="file"
					className="hidden"
					onChange={(e) => {
						const file = e.target.files?.[0];
						console.log("Selected file:", file);
						if (file) handleFile(file, side);
					}}
				/>
			</>
		),
		[files.left, files.right],
	);

	useEffect(() => {
		function handlePasteEvent(e: ClipboardEvent) {
			if (focusedPane) {
				handlePaste(e as any, focusedPane);
			}
		}
		window.addEventListener("paste", handlePasteEvent);

		return () => {
			window.removeEventListener("paste", handlePasteEvent);
		};
	}, [focusedPane]);

	return (
		<main className="page-wrap w-full h-full pt-3 pb-10">
			{files.left && files.right ? (
				<WorkerPoolContextProvider
					poolOptions={{ workerFactory }}
					highlighterOptions={{
						theme: { dark: "pierre-dark", light: "pierre-light" },
						langs: ["typescript", "javascript", "css", "html"],
					}}
				>
					<Virtualizer
						className="max-h-full overflow-auto"
						contentClassName="space-y-4"
					>
						<MultiFileDiff
							oldFile={files.left}
							newFile={files.right}
							options={{ diffStyle: "split", themeType }}
						/>
					</Virtualizer>
				</WorkerPoolContextProvider>
			) : (
				<div className="grid grid-cols-2 gap-4 h-full">
					{renderPane({ side: "left" })}
					{renderPane({ side: "right" })}
				</div>
			)}
		</main>
	);
}
