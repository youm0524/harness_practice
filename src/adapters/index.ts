import { bankIncruitAdapter } from "./bankIncruitAdapter";
import { defaultAdapter } from "./defaultAdapter";
import type { SiteAdapter } from "./types";

const adapters: SiteAdapter[] = [bankIncruitAdapter, defaultAdapter];

export function getSiteAdapter(href: string): SiteAdapter {
  let url: URL;

  try {
    url = new URL(href);
  } catch {
    return defaultAdapter;
  }

  return adapters.find((adapter) => adapter.matches(url)) ?? defaultAdapter;
}

export { bankIncruitAdapter, defaultAdapter };
