import NeoPixelRing from "@/components/Ring"

export default function Home() {
  return (
    <main className="flex h-screen flex-col items-center justify-center p-4 ">
      <div className="w-full h-full  border rounded-lg shadow-lg p-6">
        <NeoPixelRing />
      </div>
    </main>
  )
}

