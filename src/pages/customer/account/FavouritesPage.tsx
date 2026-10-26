import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ButtonLink, EmptyState, ErrorState, SkeletonList } from '@/components/ui'
import { MenuItemCard } from '@/features/menu/components/MenuItemCard'
import { orderability, useMenu } from '@/features/menu/useMenu'
import { useAuth } from '@/store/auth'

export default function FavouritesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const customer = useAuth((s) => s.customer)
  const menu = useMenu()
  if (!customer) return null

  const items = menu.data ? customer.favouriteItemIds.map((id) => menu.data!.itemsById.get(id)).filter((i) => i !== undefined) : []

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to="/account" aria-label={t('common.back')} className="-ml-2 rounded-full p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-extrabold">{t('account.favourites')}</h1>
      </div>
      {menu.error && !menu.data ? (
        <ErrorState error={menu.error} onRetry={menu.reload} />
      ) : !menu.data ? (
        <SkeletonList rows={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-6 w-6" />}
          title={t('account.noFavourites')}
          description={t('account.noFavouritesBody')}
          action={
            <ButtonLink to="/">{t('cart.browseMenu')}</ButtonLink>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <MenuItemCard item={item} unavailableReason={orderability(item, menu.data!.categoriesById.get(item.categoryId)).reason} onOpen={() => navigate(`/?item=${item.id}`)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
