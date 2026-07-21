export interface SlashTokenMatch {
  start: number;
  end: number;
  query: string;
}

export function findActiveSlashToken(value: string, cursor: number): SlashTokenMatch | null {
  const safeCursor = Math.max(0, Math.min(cursor, value.length));
  const beforeCursor = value.slice(0, safeCursor);
  const slashIndex = beforeCursor.lastIndexOf("/");
  if (slashIndex < 0) {
    return null;
  }
  if (slashIndex > 0) {
    const previous = beforeCursor[slashIndex - 1];
    if (previous !== " " && previous !== "\n" && previous !== "\t") {
      return null;
    }
  }

  const query = beforeCursor.slice(slashIndex + 1);
  if (/\s/.test(query)) {
    return null;
  }

  return {
    start: slashIndex,
    end: safeCursor,
    query,
  };
}

export function replaceSlashToken(
  value: string,
  token: SlashTokenMatch,
  replacement: string,
): { nextValue: string; nextCursor: number } {
  const nextValue = `${value.slice(0, token.start)}${replacement}${value.slice(token.end)}`;
  const nextCursor = token.start + replacement.length;
  return { nextValue, nextCursor };
}

export function filterQuickReplies<T extends { category: string; text: string }>(
  items: T[],
  query: string,
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return items;
  }
  return items.filter(
    (item) =>
      item.text.toLowerCase().includes(normalized) ||
      item.category.toLowerCase().includes(normalized),
  );
}
