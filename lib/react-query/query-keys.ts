export const userKeys = {
  me: ["user", "me"] as const,
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: {}) => [...userKeys.lists(), filters] as const,
};
