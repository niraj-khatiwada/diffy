
export default function Header() {
	return (
		<header className="sticky top-0 z-50 backdrop-blur-lg">
			<nav className="page-wrap flex flex-wrap items-center justify-between gap-1">
				<h2 className="m-0 shrink-0 text-base font-semibold tracking-tight">
					<a
						href="/"
						className="inline-flex items-center gap-2 rounded-full text-md no-underline"
					>
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<title>Diffy Logo</title>
							<g clip-path="url(#clip0_4118_2)">
								<path
									d="M2 4H11V5H3V20H11V21H2V4ZM12 23H13V2H12V23ZM14 12H18.08L16.54 10.46L17.46 9.54L20.42 12.5L17.46 15.46L16.54 14.54L18.08 13H14V21H23V4H14V12Z"
									fill="currentColor"
								/>
								<rect x="14" y="9" width="7" height="8" fill="currentColor" />
							</g>
							<defs>
								<clipPath id="clip0_4118_2">
									<rect width="24" height="24" fill="white" />
								</clipPath>
							</defs>
						</svg>
						Diffy
					</a>
				</h2>
			</nav>
		</header>
	);
}
