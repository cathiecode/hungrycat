export async function login(token: string): Promise<string> {
  const result = await fetch(`/token/${token}/capability`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!result.ok || !(await result.json()).ok) {
    throw new Error(result.statusText);
  }
  return token;
}

export async function query(
  resource: string,
  token: string,
  options?: Parameters<typeof fetch>[1]
) {
  const result = await fetch(resource, {
    ...options,
    headers: { ...options?.headers, Authorization: `Bearer ${token}` },
  });
  return result.json();
}
