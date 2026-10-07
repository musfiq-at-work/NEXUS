"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import useDialogFocus from "~/hooks/useDialogFocus";
import Portal from "./portal";

type SidePanelProps = {
	open: boolean;
	id: string;
	labelledBy: string;
	closeLabel: string;
	onClose: () => void;
	children: ReactNode;
};

function SidePanelContent(props: Omit<SidePanelProps, "open">) {
	const { id, labelledBy, closeLabel, onClose, children } = props;

	const panelRef = useDialogFocus(onClose);
	const reducedMotion = useReducedMotion();

	return (
		<div className="fixed inset-0 z-[60]">
		<button
			type="button"
			tabIndex={-1}
			aria-label={closeLabel}
			onClick={onClose}
			className="absolute inset-0 cursor-default bg-slate-950/25"
		/>
		<motion.aside
			ref={panelRef}
			id={id}
			role="dialog"
			aria-modal="true"
			aria-labelledby={labelledBy}
			tabIndex={-1}
			initial={reducedMotion ? false : { x: "100%" }}
			animate={{ x: 0 }}
			transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
			className="absolute inset-y-0 right-0 flex h-dvh w-full max-w-[420px] flex-col bg-gray-50 shadow-2xl outline-none sm:rounded-l-2xl"
		>
			{children}
		</motion.aside>
		</div>
	);
}

export default function SidePanel({ open, ...props }: SidePanelProps) {
	if (!open) return null;
	
	return (
		<Portal>
			<SidePanelContent {...props} />
		</Portal>
	);
}
