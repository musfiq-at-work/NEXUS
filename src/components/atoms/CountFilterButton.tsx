import clsx from "clsx";

type CountFilterButtonProps = {
	label: string;
	count: number;
	active: boolean;
	onClick: () => void;
};

const CountFilterButton = (props: CountFilterButtonProps) => {
	const {label, count, active, onClick} = props;

	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={clsx(
				"focus-visible:outline-primary flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors focus-visible:outline-2",
				active ? "bg-white font-medium text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900",
			)}
		>
			{label}
			<span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
				{count}
			</span>
		</button>
	);
}

export default CountFilterButton;