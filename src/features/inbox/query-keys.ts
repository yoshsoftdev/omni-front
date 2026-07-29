export const inboxUnreadCountQueryKey = ["inbox", "unread-count"] as const;

export const inboxChannelsQueryKey = ["inbox", "channels"] as const;

export const inboxAgentsQueryKey = ["inbox", "agents"] as const;

export const inboxListQueryKey = (filterKey: string) => ["inbox", "list", filterKey] as const;
