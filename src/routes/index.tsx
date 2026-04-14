import {
	type AnnotationSide,
	type DiffLineAnnotation,
	type FileContents,
	MultiFileDiff,
	Virtualizer,
	WorkerPoolContextProvider,
} from "@pierre/diffs/react";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Switch } from "~/components/Switch";
import { Tabs } from "~/components/Tabs";
import ThemeToggle from "~/components/ThemeToggle";
import { useHtmlTheme } from "~/hooks/useHTMLTheme";
import { workerFactory } from "../utils/worker-factory";
import type { SelectedLineRange } from "@pierre/diffs";

export const Route = createFileRoute("/")({ component: App });

type Side = "left" | "right";
type DiffSettings = {
	diffStyle: "unified" | "split";
	wrapLine: boolean;
	disableLineNumbers: boolean;
};
type AnnotationMetadata = { key: string, comment: string }

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
	const [settings, setSettings] = useState<DiffSettings>({
		diffStyle: "split",
		wrapLine: false,
		disableLineNumbers: false,
	});
	const [annotations, setAnnotations] = useState<DiffLineAnnotation<AnnotationMetadata>[]>([])
	const [selectedRange, setSelectedRange] = useState<SelectedLineRange | null>(
		null)
	const [editComment, setEditComment] = useState<{ lineNumber: number, side: AnnotationSide } | null>(null)


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
						if (file) handleFile(file, side);
					}}
				/>
			</>
		),
		[files.left, files.right],
	);

	const addComment = useCallback(
		(side: AnnotationSide, lineNumber: number) => {
			setAnnotations((prev) => {
				const existing = prev.find(
					(a) => a.side === side && a.lineNumber === lineNumber
				);

				if (existing) {
					return prev
				};

				return [
					...prev,
					{
						side,
						lineNumber,
						metadata: {
							key: `${side}-${lineNumber}`,
							comment: "",
						},

					},
				]
			});
			setEditComment({ lineNumber, side })
		},
		[]
	);

	const handleLineSelectionEnd = useCallback(
		(range: SelectedLineRange | null) => {
			setSelectedRange(range);
			if (range == null) return;
			const derivedSide = range.endSide ?? range.side;
			const side: AnnotationSide =
				derivedSide === 'deletions' ? 'deletions' : 'additions';
			addComment(side, Math.max(range.end, range.start));
		},
		[addComment]
	);

	const handleSubmitComment = useCallback(
		(side: AnnotationSide, lineNumber: number, comment: string) => {
			setAnnotations((prev) =>
				prev.map((ann) =>
					ann.side === side && ann.lineNumber === lineNumber
						? {
							...ann,
							metadata: {
								...ann.metadata,
								comment,
							},
						}
						: ann
				)
			);
			setEditComment(null)
		},
		[]
	);

	const handleCancelComment = useCallback(
		(side: AnnotationSide, lineNumber: number) => {
			setAnnotations((prev) =>
				prev.filter((ann) => {
					const isTarget = ann.side === side && ann.lineNumber === lineNumber;
					if (isTarget && !ann.metadata.comment) return false;
					return true;
				})
			);
			setEditComment(null);
		},
		[]
	);

	const handleDelete = useCallback(
		(side: AnnotationSide, lineNumber: number) => {
			setAnnotations((prev) =>
				prev.filter(
					(ann) => !(ann.side === side && ann.lineNumber === lineNumber)
				)
			);
		},
		[]
	);

	useEffect(() => {
		function handlePasteEvent(e: ClipboardEvent) {
			if (focusedPane) {
				handlePaste(e as any, focusedPane);
			}
		}
		if (files.left == null || files.right == null) {
			window.addEventListener("paste", handlePasteEvent);
		} else {
			window.removeEventListener("paste", handlePasteEvent);

		}

		return () => {
			window.removeEventListener("paste", handlePasteEvent);
		};
	}, [focusedPane]);

	return (
		<main className="relative page-wrap w-full h-full pt-3 pb-10">
			<section className="absolute -top-7.5 right-0 z-51 flex items-center gap-2">
				<Settings settings={settings} setSettings={setSettings} />
				<ThemeToggle />
			</section>
			{files.left && files.right ? (
				<>
					<WorkerPoolContextProvider
						poolOptions={{ workerFactory }}
						highlighterOptions={{
							theme: { dark: "pierre-dark", light: "pierre-light" },
						}}
					>
						<Virtualizer
							className="h-screen overflow-auto pb-25"
							contentClassName="space-y-4"
						>
							<MultiFileDiff
								lineAnnotations={annotations}
								oldFile={files.left}
								newFile={files.right}
								options={{
									themeType,
									diffStyle: settings.diffStyle,
									overflow: settings.wrapLine ? "wrap" : "scroll",
									disableLineNumbers: settings.disableLineNumbers,
									enableGutterUtility: true,
									enableLineSelection: true,
									onLineSelectionEnd: handleLineSelectionEnd,
								}}
								selectedLines={selectedRange}
								renderAnnotation={(annotation) => <Comment {...annotation} onSubmit={handleSubmitComment} onCancel={handleCancelComment} onEditRequest={(side, lineNumber) => {
									setEditComment({ lineNumber, side })
								}} isEditMode={editComment?.lineNumber === annotation.lineNumber && editComment?.side === annotation.side} onDelete={handleDelete} />}
								renderGutterUtility={() => <button className="cursor-pointer" title="Add a comment">
									<svg width={22} className="text-primary! bg-zinc-100 dark:bg-zinc-800" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<g id="SVGRepo_iconCarrier">
											<path d="M12 8V14M15 11H9M12.2896 17.9984C18.0965 17.9343 21 15.9189 21 11C21 6 18 4 12 4C6 4 3 6 3 11C3 14.0771 4.13623 16.018 6.40868 17.0557L5 21L12.2896 17.9984Z" stroke="currentColor" stroke-width="1.344" stroke-linecap="round" stroke-linejoin="round"></path>
										</g>
									</svg>
								</button>}
							/>
						</Virtualizer>
					</WorkerPoolContextProvider>
				</>
			) : (
				<div className="grid grid-cols-2 gap-4 h-full">
					{renderPane({ side: "left" })}
					{renderPane({ side: "right" })}
				</div>
			)}
		</main>
	);
}

function Settings({
	settings,
	setSettings,
}: {
	settings: DiffSettings;
	setSettings: React.Dispatch<React.SetStateAction<DiffSettings>>;
}) {
	return (
		<>
			<Switch
				checked={!settings.disableLineNumbers}
				onChange={() =>
					setSettings((s) => ({ ...s, disableLineNumbers: !s.disableLineNumbers }))
				}
				label="Line Numbers"
			/>
			<Switch
				checked={settings.wrapLine}
				onChange={() => setSettings((s) => ({ ...s, wrapLine: !s.wrapLine }))}
				label="Wrap Line"
			/>
			<Tabs
				value={settings.diffStyle}
				onChange={(val) => {
					setSettings((s) => ({ ...s, diffStyle: val as any }));
				}}
				items={[
					{ key: "split", label: "Split" },
					{ key: "unified", label: "Stacked" },
				]}
			/>
		</>
	);
}

function Comment({
	isEditMode,
	side,
	lineNumber,
	metadata,
	onSubmit,
	onCancel,
	onEditRequest,
	onDelete,
}: { isEditMode?: boolean } & DiffLineAnnotation<AnnotationMetadata> & {
	onSubmit: (
		side: AnnotationSide,
		lineNumber: number,
		comment: string
	) => void;
	onCancel: (side: AnnotationSide, lineNumber: number, isEditMode: boolean) => void;
	onEditRequest?: (side: AnnotationSide, lineNumber: number) => void;
	onDelete?: (side: AnnotationSide, lineNumber: number) => void;
}) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [value, setValue] = useState(metadata.comment ?? "");

	useEffect(() => {
		requestAnimationFrame(() => {
			textareaRef.current?.focus();
		});
	}, []);

	useEffect(() => {
		setValue(metadata.comment ?? "");
	}, [metadata.comment]);

	const handleSubmit = useCallback(() => {
		const trimmed = value.trim();
		if (!trimmed) return;

		onSubmit(side, lineNumber, trimmed);
	}, [side, lineNumber, value, onSubmit]);

	const handleCancel = useCallback(() => {
		onCancel(side, lineNumber, Boolean(isEditMode));
		setValue(metadata.comment)
	}, [side, lineNumber, onCancel, isEditMode, metadata.comment]);


	const resize = useCallback(() => {
		const el = textareaRef.current;
		if (!el) return;

		el.style.height = "auto";
		el.style.height = `${el.scrollHeight}px`;
	}, []);

	useEffect(() => {
		resize();
	}, [value, resize]);

	useEffect(() => {
		requestAnimationFrame(() => {
			textareaRef.current?.focus();
			resize();
		});
	}, [isEditMode, resize]);

	if (metadata.comment.length > 0 && !isEditMode) {
		return (
			<div className="relative px-3 pt-8 py-2 text-sm text-foreground bg-zinc-200 dark:bg-zinc-700 rounded-xl max-h-75 overflow-auto" role="button" tabIndex={0}>
				{metadata.comment}
				<div className="absolute w-full py-1 px-2 top-0 left-0 bg-zinc-300 dark:bg-zinc-800 flex items-center gap-2">
					<p className="text-xs">Comment on line {lineNumber} of {side}</p>
					<div className="flex items-center ml-auto">
						<button className="cursor-pointer px-2 flex items-center text-xs" onClick={() => onEditRequest?.(side, lineNumber)}>Edit <svg width={14} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" version="1.1" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <polygon points="1.75 11.25,1.75 14.25,4.75 14.25,14.25 4.75,11.25 1.75"></polygon> <line x1="8.75" y1="4.75" x2="11.25" y2="7.25"></line> </g></svg></button>
						<button className="cursor-pointer pl-2 flex items-center text-xs" onClick={() => onDelete?.(side, lineNumber)}>Delete <svg width={14} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20.5001 6H3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path> <path d="M18.8332 8.5L18.3732 15.3991C18.1962 18.054 18.1077 19.3815 17.2427 20.1907C16.3777 21 15.0473 21 12.3865 21H11.6132C8.95235 21 7.62195 21 6.75694 20.1907C5.89194 19.3815 5.80344 18.054 5.62644 15.3991L5.1665 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path> <path d="M9.1709 4C9.58273 2.83481 10.694 2 12.0002 2C13.3064 2 14.4177 2.83481 14.8295 4" stroke="#000000" stroke-width="1.5" stroke-linecap="round"></path> </g></svg></button>
					</div>
				</div>
			</div>
		);
	}


	return (
		<div className="px-3 py-2 z-2 bg-zinc-100 dark:bg-zinc-900">
			<div className="w-full">
				<div className="rounded-xl border bg-card shadow-sm">
					<div className="p-3">
						<textarea
							ref={textareaRef}
							value={value}
							onChange={(e) => setValue(e.target.value)}
							placeholder="Leave a comment…"
							className="bg-white dark:bg-black
								w-full min-h-20 resize-none max-h-[70vh]
								rounded-md border bg-background px-3 py-2 text-sm
								text-foreground placeholder:text-muted-foreground
								focus:outline-none focus:ring-1
							"
						/>

						<div className="mt-3 flex items-center justify-between">
							<span className="text-xs text-muted-foreground">
								Line {lineNumber}
							</span>

							<div className="flex items-center gap-2">
								<button
									onClick={handleCancel}
									className="
										cursor-pointer
										h-7 px-3 text-xs rounded-xl
										text-muted-foreground hover:text-foreground
										hover:bg-accent
										transition
										bg-zinc-200 dark:bg-zinc-800
									"
								>
									Cancel
								</button>

								<button
									onClick={handleSubmit}
									disabled={!value.trim()}
									className="
										cursor-pointer
										h-7 px-3 text-xs rounded-xl
										text-muted-foreground hover:text-foreground
										hover:bg-accent
										transition
										bg-zinc-200 dark:bg-zinc-800
									"
								>
									Save
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}