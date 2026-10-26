import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useCart } from '@/store/cart'
import { toast } from '@/store/toast'

/** QR codes on tables link to /table/:n, which switches the cart to dine-in for that table. */
export default function TableEntryPage() {
  const { tableNumber } = useParams()
  const setTable = useCart((s) => s.setTable)
  const n = Number(tableNumber)
  const valid = Number.isInteger(n) && n > 0 && n < 1000

  useEffect(() => {
    if (valid) {
      setTable(n)
      toast.success(`Welcome! You’re ordering for table ${n}`)
    } else {
      toast.error('That table link is not valid')
    }
  }, [n, valid, setTable])

  return <Navigate to="/" replace />
}
