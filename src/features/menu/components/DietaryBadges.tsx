import { Flame, Leaf, Sprout, WheatOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import type { DietaryTag } from '@/types'

const ICONS: Partial<Record<DietaryTag, typeof Leaf>> = {
  vegetarian: Leaf,
  vegan: Sprout,
  spicy: Flame,
  'gluten-free': WheatOff,
}

export function DietaryBadges({ tags, max }: { tags: DietaryTag[]; max?: number }) {
  const { t } = useTranslation()
  const shown = max ? tags.slice(0, max) : tags
  if (!shown.length) return null
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Dietary information">
      {shown.map((tag) => {
        const Icon = ICONS[tag]
        return (
          <li key={tag}>
            <Badge tone="outline" className="px-2 text-[11px]">
              {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
              {t(`tags.${tag}`)}
            </Badge>
          </li>
        )
      })}
    </ul>
  )
}
