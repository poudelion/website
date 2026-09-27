/** Reuses the public Web3Forms form key already present in the portfolio. */
export async function notifyPitchJoin(
  kit: { name: string; number: string },
  accessKey: string,
  send: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await send("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        access_key: accessKey,
        subject: "New pitch visitor — adityapoudel.live",
        from_name: "The Home Ground",
        name: kit.name,
        jersey_number: kit.number,
        message: `Someone joined the pitch.\n\nName: ${kit.name}\nJersey number: ${kit.number}`,
      }),
    });
    const result = await response.json();
    return response.ok && result.success === true;
  } catch {
    return false;
  }
}
