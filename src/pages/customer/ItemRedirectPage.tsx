import { Navigate, useParams } from 'react-router-dom'

/** Shareable item links (/item/:id) open the item sheet on top of the menu. */
export default function ItemRedirectPage() {
  const { itemId } = useParams()
  return <Navigate to={itemId ? `/?item=${encodeURIComponent(itemId)}` : '/'} replace />
}
