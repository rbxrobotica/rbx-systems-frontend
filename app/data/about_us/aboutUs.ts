import { Files, Rocket, Users } from "lucide-react";

// Card metadata (icons and gradients stay here, text comes from i18n)
export const cardMeta = [
    {
        id: 0,
        Icon: Users,
        gradient: "from-cyan-950 to-slate-900",
    },
    {
        id: 1,
        Icon: Rocket,
        gradient: "from-zinc-900 to-zinc-950",
    },
    {
        id: 2,
        Icon: Files,
        gradient: "from-pink-950 to-slate-900",
    },
]

// Legacy export for backward compatibility (deprecated)
export const cardItems = cardMeta.map((meta, i) => ({
    ...meta,
    title: `Card ${i}`,
    description: `Card description ${i}`,
}))
