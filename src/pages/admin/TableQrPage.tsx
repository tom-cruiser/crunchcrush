import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useSettings } from '@/features/store/useSettings'
import { Button, Spinner } from '@/components/ui'

/** Printable sheet of QR codes, one per dine-in table, linking to /table/:n. */
export default function TableQrPage() {
  const settings = useSettings()
  const [codes, setCodes] = useState<string[]>()
  const count = settings.data?.tableCount ?? 0

  useEffect(() => {
    if (!count) return
    Promise.all(Array.from({ length: count }, (_, i) => QRCode.toDataURL(`${window.location.origin}/table/${i + 1}`, { margin: 1, width: 360, errorCorrectionLevel: 'M' }))).then(setCodes)
  }, [count])

  if (!settings.data || (count > 0 && !codes)) return <Spinner className="m-10" label="Loading" />
  return (
    <div className="min-h-dvh bg-white p-6 text-black">
      <div className="no-print mb-6 flex items-center gap-3">
        <h1 className="flex-1 text-2xl font-extrabold">Table QR codes</h1>
        <Button onClick={() => window.print()}>Print</Button>
      </div>
      {count === 0 ? (
        <p>Set the number of dine-in tables in Settings first.</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 print:grid-cols-3">
          {codes!.map((src, i) => (
            <figure key={i} className="flex break-inside-avoid flex-col items-center rounded-2xl border-2 border-black p-4 text-center">
              <p className="text-lg font-extrabold">{settings.data!.name}</p>
              <img src={src} alt={`QR code for table ${i + 1}`} className="my-2 w-full max-w-44" />
              <figcaption>
                <span className="block text-3xl font-black">Table {i + 1}</span>
                <span className="text-sm">Scan to order and pay</span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  )
}
