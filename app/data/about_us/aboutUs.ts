import { Files, Rocket, Users } from "lucide-react";

// Card metadata (icons and gradients stay here, text comes from i18n)
export const cardMeta = [
    {
        id: 0,
        Icon: Users,
        gradient: "from-blue-500 to-blue-700",
    },
    {
        id: 1,
        Icon: Rocket,
        gradient: "from-green-500 to-green-700",
    },
    {
        id: 2,
        Icon: Files,
        gradient: "from-[#FF2C9C] to-purple-700",
    },
]

// Legacy export for backward compatibility (deprecated)
export const cardItems = cardMeta.map((meta, i) => ({
    ...meta,
    title: `Card ${i}`,
    description: `Card description ${i}`,
}))
