import type { Rep, Action, ARRTier } from "./types";

export const SALES_REPS: Rep[] = [
  { name: "Alex Aaron", team: "Sales", role: "AE" },
  { name: "Marley Cavalcanti", team: "Sales", role: "AE" },
  { name: "Luke Dial", team: "Sales", role: "AE" },
  { name: "Zoe Kruize", team: "Sales", role: "AE" },
  { name: "Eric Magne", team: "Sales", role: "AE" },
  { name: "Jeff Randorf", team: "Sales", role: "AE" },
  { name: "Jacob Rhee", team: "Sales", role: "AE" },
  { name: "Austin Villela", team: "Sales", role: "AE" },
];

export const AAE_REPS: Rep[] = [
  { name: "Graham Collector", team: "AAE", role: "AAE" },
  { name: "Kyle Haslett", team: "AAE", role: "AAE" },
  { name: "Jacqueline Lo", team: "AAE", role: "AAE" },
  { name: "Julia Veith", team: "AAE", role: "AAE" },
];

export const CS_REPS: Rep[] = [
  { name: "Daniel Alexander", team: "CS", role: "CSM" },
  { name: "Will Auther", team: "CS", role: "CSM" },
  { name: "Evan Opolski", team: "CS", role: "CSM" },
  { name: "Hazan Raza", team: "CS", role: "CSM" },
  { name: "Cayla Wolfberg", team: "CS", role: "CSM" },
];

export const SALES_ACTIONS: Action[] = [
  { id: "canvas_business", label: "New business Canvas on Business plan", points: 10 },
  { id: "canvas_enterprise", label: "New business Canvas on Enterprise plan", points: 25 },
  { id: "credit_addon", label: "Credit add-on at close", points: 5 },
  { id: "first_canvas", label: "First Canvas-led deal (one-time per rep)", points: 10 },
  { id: "multi_year", label: "Multi-year deal on new pricing", points: 10 },
];

export const CS_ACTIONS: Action[] = [
  { id: "migration", label: "Customer migrated to new credit-based plan", points: 10 },
  { id: "tier_upgrade", label: "Customer upgraded tier (e.g., Starter → Business)", points: 15 },
  { id: "enterprise_upgrade", label: "Customer upgraded to Enterprise", points: 25 },
  { id: "credit_addon", label: "Credit add-on sold (per 1K credits)", points: 5 },
  { id: "brand_kit", label: "Customer completed Brand Kit setup", points: 5, bonus: true },
  { id: "expansion_5k", label: "Expansion deal over $5K incremental ARR", points: 5, bonus: true },
  { id: "expansion_15k", label: "Expansion deal over $15K incremental ARR", points: 15, bonus: true },
  { id: "multi_year_renewal", label: "Multi-year renewal with upgrade to new pricing", points: 10, bonus: true },
];

export const AAE_ACTIONS: Action[] = [
  { id: "meeting_booked", label: "Canvas-focused meeting booked (LinkedIn, email)", points: 5 },
  { id: "cold_call_meeting", label: "Canvas cold call meeting booked", points: 8 },
  { id: "meeting_held", label: "Canvas-focused meeting held", points: 5 },
  { id: "held_to_sql", label: "Held to SQL", points: 5 },
];

export const ARR_TIERS: ARRTier[] = [
  { threshold: 800000, label: "$800K", prize: "🔒 Prize TBA. Trust us, you want this one." },
  { threshold: 900000, label: "$900K", prize: "🔒🔒 It gets better. Way better." },
  { threshold: 1000000, label: "$1M", prize: "🔒🔒🔒 Hit seven figures and find out." },
];

export const AIR = {
  bg: "#1a1a1a",
  surface: "#242424",
  surfaceHover: "#2e2e2e",
  border: "rgba(255,255,255,0.08)",
  borderActive: "rgba(255,255,255,0.16)",
  text: "#f0f0f0",
  textMuted: "#999",
  textDim: "#666",
  cyan: "#4dd4e6",
  cyanDim: "rgba(77,212,230,0.12)",
  cyanBorder: "rgba(77,212,230,0.25)",
  blue: "#2d7ff9",
  teal: "#3aada8",
  tealDim: "rgba(58,173,168,0.12)",
  tealBorder: "rgba(58,173,168,0.25)",
  gold: "#d4a843",
  goldDim: "rgba(212,168,67,0.12)",
  goldBorder: "rgba(212,168,67,0.25)",
  tan: "#c4a882",
  olive: "#a3b87c",
  pink: "#e8a0bf",
  red: "#e84855",
  orange: "#f26430",
  green: "#3aada8",
  greenDim: "rgba(58,173,168,0.12)",
  greenBorder: "rgba(58,173,168,0.25)",
} as const;

export const AIR_LOGO_URI =
  "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCADcAOADASIAAhEBAxEB/8QAHQABAQACAwEBAQAAAAAAAAAAAAIHCAUGCQQDAf/EAEEQAAEDAwICBggEAgoCAwAAAAEAAgMEBREGBxIhCBMxM3KxFCJBUVJTkZIJMmFxI4EVFhhCVmKTocHTJIKUs8P/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A+/og9HGwSaVodea9tkdzqrgwT0FvqmcUMMJ/K97Dye5w5gHIAI5Z7Ns6OgoaOnbT0lHT08LBhsccYa0fsAlrpoKO2UtJTRtjghhZHGxo5NaAAAP5L6UEdTF8pn2hOpi+Uz7QrRBHUxfKZ9oTqYvlM+0K0QR1MXymfaE6mL5TPtCtEEdTF8pn2hOpi+Uz7QrRBHUxfKZ9oTqYvlM+0K0QR1MXymfaE6mL5TPtCtEEdTF8pn2hOpi+Uz7QrRBHUxfKZ9oTqYvlM+0K0QR1MXymfaE6mL5TPtCtEEdTF8pn2hOpi+Uz7QrRBHUxfKZ9oTqYvlM+0K0QR1MXymfaE6mL5TPtCtEHzVlBQ1lM+mq6OnqIJBh8ckYc1w9xB7VqZ0vejjp+PStfr3QdujtlVb2OqLhQU44YZoRze9jexjmjLsDkQDyz27eL5rpTQ1lsqqSoYHwzQvjkafa0gghB+0HcR+EeStRB3EfhHkrQEREBERAREQEREBERAREQEREBERAREQEREBERAREQFE/cSeE+StRP3EnhPkgQdxH4R5K1EHcR+EeStAREQEREBERAREQEREBERAREQEREBERAREQEREBERAUT9xJ4T5K1E/cSeE+SBB3EfhHkrUQdxH4R5K0BERAREQEREBERAREQEREBERAREQEREBERAREQEREBRP3EnhPkrUT9xJ4T5IEHcR+EeStRB3EfhHkrQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREB";
