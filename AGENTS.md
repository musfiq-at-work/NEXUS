# Code writing style

These are the user's coding preferences for this project. Apply them to new code and edits, even where older files use a different style.

## Explicit preferences

- Use four spaces for each indentation level. Do not use tabs or two-space indentation.
- Accept React component props as a typed `props` parameter. Destructure them inside the component body, usually as its first statement. Do not destructure component props in the parameter list.
- Keep the right-hand expression on the same line as `=`. For example, write `const visibleNotifications = notifications.filter((notification) => {`, not an assignment ending with `=` followed by the expression on the next line. Longer argument lists and callback bodies can continue on subsequent lines.

```tsx
export default function NotificationPanelHeader(props: NotificationPanelHeaderProps) {
    const { unreadCount, isLoading, hasError, onClose } = props;

    return (
        <div>
            {/* component content */}
        </div>
    );
}

const visibleNotifications = notifications.filter((notification) => {
    if (filter === "unread") return notification.marked_at === null;
    return true;
});
```

## Supporting conventions observed in the user's code

- Prefer compact, readable destructuring, calls, and conditions. Avoid splitting simple expressions just to meet a narrow line-length limit.
- Separate logical sections with a blank line: prop extraction, state/hooks, derived values, handlers, and returned JSX.
- Keep simple guard clauses concise, such as `if (isMarkingRead) return;`.
- Use typed component props and descriptive component, variable, and handler names. Preserve existing database field names.
- Keep JSX indentation consistent. Put several attributes on separate lines when that improves readability; keep small elements compact.
- Preserve the existing declaration/export pattern, import organization, and quote style of the file being edited. The repository contains both arrow components and function declarations, and both quote styles.
- Make focused edits. Do not reformat unrelated files or change behavior while applying style preferences.

## Formatting tools

Prettier is configured for four spaces and a wider print width to reduce unnecessary wrapping. It does not enforce prop placement or guarantee that every assignment stays on one line. Review its output against the explicit preferences above and retain the user's layout when automatic formatting conflicts with them. Do not run a repository-wide formatting pass unless requested.
