export const LED_COUNT = 12
export const presetSchemes = [
    {
        name: "Gökkuşağı",
        colors: Array(LED_COUNT)
            .fill("")
            .map((_, i) => `hsl(${(i / LED_COUNT) * 360}, 100%, 50%)`),
    },
    {
        name: "Kırmızı Tonları",
        colors: Array(LED_COUNT)
            .fill("")
            .map((_, i) => `hsl(${(i / LED_COUNT) * 30}, 100%, 50%)`),
    },
    {
        name: "Mavi Tonları",
        colors: Array(LED_COUNT)
            .fill("")
            .map((_, i) => `hsl(${200 + (i / LED_COUNT) * 40}, 100%, 50%)`),
    },
    {
        name: "Yeşil Tonları",
        colors: Array(LED_COUNT)
            .fill("")
            .map((_, i) => `hsl(${100 + (i / LED_COUNT) * 40}, 100%, 50%)`),
    },
    {
        name: "Mor Tonları",
        colors: Array(LED_COUNT)
            .fill("")
            .map((_, i) => `hsl(${260 + (i / LED_COUNT) * 40}, 100%, 50%)`),
    },
    {
        name: "Sıcak Renkler",
        colors: Array(LED_COUNT)
            .fill("")
            .map((_, i) => `hsl(${(i / LED_COUNT) * 60}, 100%, 50%)`),
    },
    {
        name: "Soğuk Renkler",
        colors: Array(LED_COUNT)
            .fill("")
            .map((_, i) => `hsl(${180 + (i / LED_COUNT) * 60}, 100%, 50%)`),
    },
    {
        name: "Siyah-Beyaz",
        colors: Array(LED_COUNT)
            .fill("")
            .map((_, i) => (i % 2 === 0 ? "#FFFFFF" : "#000000")),
    },
]