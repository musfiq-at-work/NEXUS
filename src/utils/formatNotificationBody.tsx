export const formatNotificationBody = (body: string) => {
    const parts = body.split(/__b__([\s\S]*?)__b__/g);

    return parts.map((part, index) => {
        if (index % 2 === 0) return part;

        return (
            <strong key={index} className="font-bold">
                {part}
            </strong>
        );
    });
};
