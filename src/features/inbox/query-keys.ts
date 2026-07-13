export const inboxUnreadCountQueryKey = ["inbox", "unread-count"] as const;

export const inboxListQueryKey = (filterKey: string) => ["inbox", "list", filterKey] as const;
