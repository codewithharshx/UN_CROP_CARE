import { useEffect, useState } from "react";

export type CartItem = { slug: string; name: string; quantity: string; pack: string };
const KEY = "uncc-enquiry";
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export const cart = {
  add(item: Pick<CartItem, "slug" | "name">) {
    const items = read();
    if (!items.some((i) => i.slug === item.slug)) write([...items, { ...item, quantity: "1", pack: "" }]);
  },
  update(slug: string, patch: Partial<CartItem>) {
    write(read().map((i) => (i.slug === slug ? { ...i, ...patch } : i)));
  },
  remove(slug: string) { write(read().filter((i) => i.slug !== slug)); },
  clear() { write([]); },
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    listeners.add(sync);
    return () => { listeners.delete(sync); };
  }, []);
  return items;
}
