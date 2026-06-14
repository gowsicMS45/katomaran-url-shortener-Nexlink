export const trafficData = Array.from({ length: 30 }).map((_, i) => {
  const base = 800 + Math.sin(i / 3) * 220 + i * 18;
  return {
    d: `Day ${i + 1}`,
    clicks: Math.round(base + (i % 4) * 40),
    uniq: Math.round(base * 0.62 + (i % 5) * 25),
  };
});

export const devicesData = [
  { name: "Desktop", value: 5240 },
  { name: "Mobile", value: 7820 },
  { name: "Tablet", value: 1130 },
  { name: "Smart TV", value: 240 },
];

export const sourcesData = [
  { name: "Direct", value: 4200 },
  { name: "Twitter", value: 2600 },
  { name: "LinkedIn", value: 1900 },
  { name: "Email", value: 1500 },
  { name: "Search", value: 1100 },
];

export const browsersData = [
  { name: "Chrome", value: 8120 },
  { name: "Safari", value: 3950 },
  { name: "Edge", value: 1240 },
  { name: "Firefox", value: 820 },
  { name: "Other", value: 360 },
];

export const countriesData = [
  { name: "United States", code: "US", visits: 5840 },
  { name: "Germany", code: "DE", visits: 2310 },
  { name: "United Kingdom", code: "GB", visits: 1980 },
  { name: "India", code: "IN", visits: 1720 },
  { name: "Brazil", code: "BR", visits: 1290 },
  { name: "Japan", code: "JP", visits: 980 },
];

export const links = [
  { id: "nx_1", slug: "launch24", url: "https://acme.com/launch-2024", clicks: 12840, ctr: 6.4, status: "active",  tag: "Marketing", created: "2d ago" },
  { id: "nx_2", slug: "pricing", url: "https://acme.com/pricing", clicks: 9320, ctr: 4.1, status: "active", tag: "Sales", created: "5d ago" },
  { id: "nx_3", slug: "beta-invite", url: "https://acme.com/beta", clicks: 7204, ctr: 8.9, status: "active", tag: "Product", created: "1w ago" },
  { id: "nx_4", slug: "yt-promo", url: "https://youtu.be/abc123", clicks: 5430, ctr: 3.4, status: "active", tag: "Campaign", created: "1w ago" },
  { id: "nx_5", slug: "old-deck", url: "https://acme.com/deck-q1", clicks: 2210, ctr: 1.2, status: "archived", tag: "Internal", created: "1mo ago" },
  { id: "nx_6", slug: "newsletter", url: "https://acme.com/news", clicks: 4180, ctr: 5.7, status: "active", tag: "Email", created: "2w ago" },
];

export const activity = [
  { who: "Lena Park", what: "created link", target: "launch24", when: "2m ago" },
  { who: "Alex Kim", what: "updated campaign", target: "Spring '26", when: "12m ago" },
  { who: "Jordan Lee", what: "rotated API key", target: "prod-key-9f", when: "1h ago" },
  { who: "Sam Patel", what: "exported analytics", target: "Q1 report", when: "3h ago" },
  { who: "Rin Tanaka", what: "invited member", target: "marco@acme.com", when: "yesterday" },
];
