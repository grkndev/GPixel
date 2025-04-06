"use client"

import { useState, useEffect } from "react"
import { HexColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { RefreshCw, Play, Save, Trash, Check } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LED_COUNT, presetSchemes } from "@/lib/presetSchemes"
import { motion, AnimatePresence } from "framer-motion"
import { tabContentVariants } from "@/lib/utils"

const initialColors = Array(LED_COUNT).fill("#000000")

// Profil tipi
type Profile = {
  id: string
  name: string
  colors: string[]
  createdAt: Date
}

// Convert hex color (e.g. "#FF0000") to RGB values (e.g. "255,0,0")
const hexToRgb = (hex: string) => {
  // Remove # if present
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `${r},${g},${b}`;
};

// Send LED colors to the API
const sendColorsToApi = async (colors: string[]) => {
  try {
    const rgbValues = colors.map(hexToRgb).join(';');
    await fetch("http://192.168.1.200/setleds", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: rgbValues
    });
  } catch (error) {
    console.error("Error sending colors to API:", error);
  }
};

export default function NeoPixelRing() {
  // Client-side rendering check
  const [isClient, setIsClient] = useState(false)

  // Ekran boyutu kontrolü
  const isMobile = useMediaQuery("(max-width: 640px)")
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)")
  const isDesktop = useMediaQuery("(min-width: 1025px)")

  // Halka boyutu
  const [ringSize, setRingSize] = useState({ width: 380, height: 380 })
  const [ledSize, setLedSize] = useState(32)

  // LED renklerini tutan state
  const [colors, setColors] = useState<string[]>(initialColors)

  // Tüm LEDler için ortak renk
  const [globalColor, setGlobalColor] = useState("#000000")

  // Seçili LED indeksi
  const [selectedLed, setSelectedLed] = useState<number | null>(null)

  // Animasyon hızı
  const [animationSpeed, setAnimationSpeed] = useState<number>(50)

  // Animasyon durumu
  const [isAnimating, setIsAnimating] = useState<boolean>(false)

  // Profiller
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [newProfileName, setNewProfileName] = useState("")

  // Aktif sekme
  const [activeTab, setActiveTab] = useState("color")

  // Mark as client-side rendered
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Send colors to API whenever they change
  useEffect(() => {
    if (!isClient) return
    
    // Send the current colors to the API
    sendColorsToApi(colors)
  }, [colors, isClient])

  // Ekran boyutuna göre halka boyutunu ayarla
  useEffect(() => {
    if (!isClient) return

    if (isMobile) {
      setRingSize({ width: 240, height: 240 })
      setLedSize(24)
    } else if (isTablet) {
      setRingSize({ width: 280, height: 280 })
      setLedSize(28)
    } else {
      // Masaüstü için daha büyük halka
      setRingSize({ width: 380, height: 380 })
      setLedSize(32)
    }
  }, [isMobile, isTablet, isDesktop, isClient])

  // Tarayıcı depolamasından profilleri yükle
  useEffect(() => {
    if (!isClient) return

    try {
      const savedProfiles = localStorage.getItem("neopixelProfiles")
      if (savedProfiles) {
        const parsedProfiles = JSON.parse(savedProfiles)
        // Tarihleri düzelt
        const fixedProfiles = parsedProfiles.map((profile: Partial<Profile>) => ({
          ...profile,
          createdAt: new Date(profile.createdAt as unknown as string),
        }))
        setProfiles(fixedProfiles as Profile[])
      }
    } catch (e) {
      console.error("Profiller yüklenemedi:", e)
    }
  }, [isClient])

  // LED rengini değiştirme fonksiyonu
  const changeLedColor = (index: number, color: string) => {
    const newColors = [...colors]
    newColors[index] = color
    setColors(newColors)
  }

  // Tüm LEDleri sıfırlama
  const resetAllLeds = () => {
    setColors(initialColors)
  }

  // Gökkuşağı efekti için renk hesaplama
  const calculateRainbowColor = (index: number, offset = 0) => {
    const hue = ((index / LED_COUNT) * 360 + offset) % 360
    return `hsl(${hue}, 100%, 50%)`
  }

  // Gökkuşağı efekti başlatma
  const startRainbowEffect = () => {
    if (isAnimating) {
      setIsAnimating(false)
      return
    }

    setIsAnimating(true)
    let offset = 0

    const interval = setInterval(
      () => {
        if (!isAnimating) {
          clearInterval(interval)
          return
        }

        const newColors = Array(LED_COUNT)
          .fill("")
          .map((_, i) => calculateRainbowColor(i, offset))

        setColors(newColors)
        offset = (offset + 10) % 360
      },
      1000 - animationSpeed * 9,
    )

    return () => clearInterval(interval)
  }

  // LED pozisyonlarını hesaplama
  const calculateLedPosition = (index: number) => {
    const radius = ringSize.width * 0.4 // Halka boyutuna göre yarıçap
    const angle = (index / LED_COUNT) * 2 * Math.PI
    const x = radius * Math.sin(angle)
    const y = -radius * Math.cos(angle)
    return { x, y }
  }

  // Profil kaydetme
  const saveProfile = () => {
    if (!newProfileName.trim() || !isClient) return

    const newProfile: Profile = {
      id: Date.now().toString(),
      name: newProfileName,
      colors: [...colors],
      createdAt: new Date(),
    }

    const updatedProfiles = [...profiles, newProfile]
    setProfiles(updatedProfiles)
    setNewProfileName("")

    // Tarayıcı depolamasına kaydet
    try {
      localStorage.setItem("neopixelProfiles", JSON.stringify(updatedProfiles))
    } catch (e) {
      console.error("Profil kaydedilemedi:", e)
    }
  }

  // Profil silme
  const deleteProfile = (id: string) => {
    if (!isClient) return

    const updatedProfiles = profiles.filter((profile) => profile.id !== id)
    setProfiles(updatedProfiles)

    // Tarayıcı depolamasını güncelle
    try {
      localStorage.setItem("neopixelProfiles", JSON.stringify(updatedProfiles))
    } catch (e) {
      console.error("Profil silinemedi:", e)
    }
  }

  // Profil yükleme
  const loadProfile = (profile: Profile) => {
    setColors([...profile.colors])
  }

  // Hazır şema yükleme
  const loadPreset = (preset: (typeof presetSchemes)[0]) => {
    setColors([...preset.colors])
  }

  // Tüm LEDleri değiştirme
  const changeAllLedsColor = (color: string) => {
    setColors(Array(LED_COUNT).fill(color))
    setGlobalColor(color)
  }

  // If not client-side yet, show a minimal version to avoid hydration mismatch
  if (!isClient) {
    return (
      <div className="flex justify-center items-center w-full h-full">
        <div className="w-full max-w-md">
          <Card className="h-full px-4">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">NeoPixel Kontrol</h3>
              <div className="h-[400px] flex items-center justify-center">
                <p className="text-gray-500">Yükleniyor...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-between lg:flex-row items-center lg:items-start w-full h-full gap-6 lg:gap-8">
      {/* LED Halka Kısmı */}
      <div className="lg:sticky lg:top-4 lg:self-center lg:flex-shrink-0 flex justify-center items-center w-full h-full max-w-[400px] lg:max-w-[500px]">
        <div
          className="relative mb-6 md:mb-8 lg:mb-0"
          style={{
            width: `${ringSize.width}px`,
            height: `${ringSize.height}px`,
          }}
        >
          {/* Halka arka planı */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-[12px] border-muted bg-transparent shadow-inner"
            style={{
              width: `${ringSize.width * 0.83}px`,
              height: `${ringSize.height * 0.83}px`,
            }}
          ></div>

          {/* LEDler */}
          {colors.map((color, index) => {
            const { x, y } = calculateLedPosition(index)
            return (
              <Popover key={`led-${index}`}>
                <PopoverTrigger asChild>
                  <button
                    className="absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      backgroundColor: color,
                      boxShadow: `0 0 10px ${color === "#000000" ? "transparent" : color}`,
                      width: `${ledSize}px`,
                      height: `${ledSize}px`,
                    }}
                    onClick={() => {
                      setSelectedLed(index)
                      setActiveTab("color") // Renk seçimi sekmesine geç
                    }}
                  >
                    <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium">
                      {index}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="center">
                  <p className="text-sm font-medium">LED {index}</p>
                  <p className="text-sm font-mono">{color}</p>
                </PopoverContent>
              </Popover>
            )
          })}
        </div>
      </div>

      {/* Kontrol Panelleri */}
      <div className="w-full h-full max-w-md lg:max-w-6xl lg:flex-1 px-2 sm:px-0">
        <Card className="h-full px-4">
          <Tabs defaultValue="color" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="color">Renk Seçimi  </TabsTrigger>
              <TabsTrigger value="controls" className="relative z-10">Kontroller</TabsTrigger>
              <TabsTrigger value="presets" className="relative z-10"  >Hazır Ayarlar</TabsTrigger>
              <TabsTrigger value="profiles">Profiller</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {/* Renk Seçimi Sekmesi */}
              <TabsContent value="color" className="space-y-4">
                <motion.div
                  key="color-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Renk Seçimi</h3>
                    {selectedLed !== null ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">LED {selectedLed}</span>
                          <div
                            className="w-8 h-8 rounded-full border border-gray-300"
                            style={{ backgroundColor: colors[selectedLed] }}
                          ></div>
                        </div>
                        <HexColorPicker
                          color={selectedLed !== null ? colors[selectedLed] : "#000000"}
                          onChange={(newColor) => {
                            if (selectedLed !== null) {
                              changeLedColor(selectedLed, newColor)
                            }
                          }}
                          className="w-full "
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-mono">{selectedLed !== null ? colors[selectedLed] : ""}</span>
                          <Button variant="outline" size="sm" onClick={() => setSelectedLed(null)}>
                            Seçimi Kaldır
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[220px] text-center text-gray-500">
                        <p>Renk değiştirmek için bir LED seçin</p>
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              </TabsContent>

              {/* Kontroller Sekmesi */}
              <TabsContent value="controls" className="space-y-4">
                <motion.div
                  key="controls-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">LED Kontrolleri</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-2">

                      {colors.map((color, index) => (
                        <div
                          key={index}
                          className={`flex flex-col items-center py-2 rounded-md cursor-pointer transition-all ${selectedLed === index ? "bg-muted " : ""}`}
                          onClick={() => {
                            setSelectedLed(index)
                            setActiveTab("color") // Renk seçimi sekmesine geç
                          }}
                        >
                          <div
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mb-1"
                            style={{
                              backgroundColor: color,
                              boxShadow: color !== "#000000" ? `0 0 5px ${color}` : "none",
                            }}
                          ></div>
                          <span className="text-[10px] sm:text-xs">LED {index}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-6 mt-6">
                      <h4 className="font-medium mb-4">Tüm LEDleri Değiştir</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Toplu Renk</span>
                          <div
                            className="w-8 h-8 rounded-full border border-gray-300"
                            style={{ backgroundColor: globalColor }}
                          ></div>
                        </div>
                        <HexColorPicker
                          color={globalColor}
                          onChange={(newColor) => {
                            setGlobalColor(newColor)
                          }}
                          className="w-full"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-mono">{globalColor}</span>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => changeAllLedsColor(globalColor)}
                          >
                            Uygula
                          </Button>
                        </div>
                      </div>
                    </div>



                  </CardContent>
                </motion.div>
              </TabsContent>

              {/* Hazır Ayarlar Sekmesi */}
              <TabsContent value="presets" className="space-y-4">
                <motion.div
                  key="presets-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Hazır Renk Şemaları</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                      {presetSchemes.map((preset, index) => (
                        <div
                          key={`preset-scheme-${index}`}
                          className="border rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => loadPreset(preset)}
                        >
                          <h4 className="font-medium mb-2">{preset.name}</h4>
                          <div className="flex gap-1 mb-2">
                            {preset.colors.map((color, i) => (
                              <div key={`preset-color-${index}-${i}`} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                            ))}
                          </div>

                        </div>
                      ))}
                    </div>
                  </CardContent>
                </motion.div>
              </TabsContent>

              {/* Profiller Sekmesi */}
              <TabsContent value="profiles" className="space-y-4">
                <motion.div
                  key="profiles-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Profiller</h3>

                    {/* Yeni Profil Oluşturma */}
                    <div className="border rounded-lg p-4 mb-4">
                      <h4 className="font-medium mb-2">Yeni Profil Oluştur</h4>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor="profile-name" className="sr-only">
                            Profil Adı
                          </Label>
                          <Input
                            id="profile-name"
                            placeholder="Profil adı"
                            value={newProfileName}
                            onChange={(e) => setNewProfileName(e.target.value)}
                          />
                        </div>
                        <Button onClick={saveProfile} disabled={!newProfileName.trim()}>
                          <Save className="w-4 h-4 mr-1" />
                          Kaydet
                        </Button>
                      </div>
                    </div>

                    {/* Kaydedilmiş Profiller */}
                    {profiles.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {profiles.map((profile) => (
                          <div key={profile.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">{profile.name}</h4>
                              <Button variant="ghost" size="icon" onClick={() => deleteProfile(profile.id)}>
                                <Trash className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                            <div className="flex gap-1 mb-2 flex-wrap">
                              {profile.colors.map((color, i) => (
                                <div key={`profile-color-${profile.id}-${i}`} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                              ))}
                            </div>
                            <div className="text-xs text-gray-500 mb-2">{profile.createdAt.toLocaleDateString()}</div>
                            <Button variant="outline" size="sm" className="w-full" onClick={() => loadProfile(profile)}>
                              <Check className="w-4 h-4 mr-1" />
                              Yükle
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>Henüz kaydedilmiş profil yok.</p>
                        <p className="text-sm mt-1">Mevcut LED ayarlarınızı kaydetmek için yukarıdaki formu kullanın.</p>
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

