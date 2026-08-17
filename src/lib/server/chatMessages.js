/**
 * Keep only the client turns that may reach the model. A client-supplied
 * 'system' role would sit at the same privilege level as the server-side
 * system prompt, so anything but user/assistant text turns is dropped, and
 * extra properties are stripped before the payload is forwarded upstream.
 *
 * @param {unknown} messages
 * @param {number} [limit]
 * @returns {{ role: 'user' | 'assistant', content: string }[]}
 */
export function sanitizeMessages(messages, limit = 12) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (message) =>
        (message?.role === 'user' || message?.role === 'assistant') &&
        typeof message?.content === 'string'
    )
    .map(({ role, content }) => ({ role, content }))
    .slice(-limit);
}
