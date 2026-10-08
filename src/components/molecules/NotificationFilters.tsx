import type { NotificationFilter } from "~/types/notification";
import CountFilterButton from "../atoms/CountFilterButton";

type NotificationFiltersProps = {
	selected: NotificationFilter;
	counts: Record<NotificationFilter, number>;
	onChange: (filter: NotificationFilter) => void;
};

const filters = [
	{ value: "unread", label: "Pending" },
	{ value: "all", label: "All" },
	{ value: "system", label: "System" },
] as const;

const NotificationFilters = ({ selected, counts, onChange }: NotificationFiltersProps) => {
	return (
		<div
			role="group"
			aria-label="Filter notifications"
			className="flex gap-1 rounded-xl bg-gray-100 p-1"
		>
			{filters.map(({ value, label }) => (
				<CountFilterButton
					key={value}
					label={label}
					count={counts[value]}
					active={selected === value}
					onClick={() => onChange(value)}
				/>
			))}
		</div>
	);
}

export default NotificationFilters;