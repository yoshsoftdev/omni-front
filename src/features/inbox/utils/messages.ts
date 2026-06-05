import type { Message } from "@/types/message";

export function dedupeMessages(messages: Message[]): Message[] {
  const seen = new Set<string>();
  const result: Message[] = [];

  for (const message of messages) {
    if (seen.has(message.id)) continue;
    seen.add(message.id);
    result.push(message);
  }

  return result;
}

export function mergeMessages(existing: Message[], incoming: Message | Message[]): Message[] {
  const list = Array.isArray(incoming) ? incoming : [incoming];
  return dedupeMessages([...existing, ...list]);
}
