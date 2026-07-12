/** Truncate a base58 pubkey for taskbar / chrome (e.g. AbCd…XyZ9). */
export function truncateAddress(address: string, head = 4, tail = 4): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}
