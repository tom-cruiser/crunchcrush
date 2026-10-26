import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Modal } from '@/components/ui'
import { cn } from '@/lib/cn'
import { ALLERGENS, DIETARY_TAGS, EMPTY_FILTERS, type MenuFilters } from '../filters'

interface FilterSheetProps {
  open: boolean
  onClose: () => void
  filters: MenuFilters
  onChange: (filters: MenuFilters) => void
  resultCount: number
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors', selected ? 'border-ink bg-brand text-brand-fg' : 'border-line bg-surface text-ink hover:border-ink')}
    >
      {selected && <Check className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  )
}

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

export function FilterSheet({ open, onClose, filters, onChange, resultCount }: FilterSheetProps) {
  const { t } = useTranslation()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('menu.filters')}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onChange({ ...EMPTY_FILTERS, query: filters.query })}>
            {t('menu.clearFilters')}
          </Button>
          <Button fullWidth onClick={onClose}>
            {t('menu.showResults', { count: resultCount })}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <fieldset>
          <legend className="mb-3 font-bold">{t('menu.dietary')}</legend>
          <div className="flex flex-wrap gap-2">
            {DIETARY_TAGS.map((tag) => (
              <Chip key={tag} selected={filters.dietary.includes(tag)} onClick={() => onChange({ ...filters, dietary: toggle(filters.dietary, tag) })}>
                {t(`tags.${tag}`)}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-3 font-bold">{t('menu.excludeAllergens')}</legend>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((a) => (
              <Chip key={a} selected={filters.excludeAllergens.includes(a)} onClick={() => onChange({ ...filters, excludeAllergens: toggle(filters.excludeAllergens, a) })}>
                {t(`allergens.${a}`)}
              </Chip>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center justify-between gap-3 font-bold">
          {t('menu.hideSoldOut')}
          <input type="checkbox" checked={filters.hideSoldOut} onChange={(e) => onChange({ ...filters, hideSoldOut: e.target.checked })} className="h-5 w-5 accent-ink" />
        </label>
      </div>
    </Modal>
  )
}
