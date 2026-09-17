"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { caretDownIcon, caretUpIcon } from "~/assets";

const ScrollToTopBottom = () => {
	const [showTop, setShowTop] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			const scrollTop = window.scrollY;
			const scrollHeight = document.documentElement.scrollHeight;
			const clientHeight = document.documentElement.clientHeight;

			setShowTop(scrollTop > (scrollHeight - clientHeight) / 2);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll();

		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const scroll = () => {
		window.scrollTo({
			top: showTop ? 0 : document.documentElement.scrollHeight,
			behavior: "smooth",
		});
	};

	return (
		<button
			type="button"
			onClick={scroll}
			className="fixed bottom-2 right-1 z-50 flex size-9 items-center justify-center rounded-md bg-gray shadow-md transition hover:bg-accent opacity-80"
			aria-label={showTop ? "Scroll to top" : "Scroll to bottom"}
		>
			<span className="relative size-5">
				<AnimatePresence mode="wait" initial={false}>
					<motion.img
						key={showTop ? "top" : "bottom"}
						src={showTop ? caretUpIcon.src : caretDownIcon.src}
						className="absolute inset-0 w-6"
						initial={{ opacity: 0, y: showTop ? 8 : -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: showTop ? -8 : 8 }}
						transition={{ duration: 0.18, ease: "easeOut" }}
					/>
				</AnimatePresence>
			</span>
		</button>
	);
}

export default ScrollToTopBottom;