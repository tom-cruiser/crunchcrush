import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { newAddOn, newChoice, newOption, type ItemFormValues } from './itemSchema'

interface Props {
  control: Control<ItemFormValues>
  register: UseFormRegister<ItemFormValues>
  errors: FieldErrors<ItemFormValues>
}

/** Option groups (size, protein, sauce…) each with their own choices. */
export function OptionGroupsField({ control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'options' })
  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => (
        <Card key={field.id} className="flex flex-col gap-3 p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input label="Group name" placeholder="e.g. Protein" {...register(`options.${index}.name`)} error={errors.options?.[index]?.name?.message} />
            </div>
            <Button variant="ghost" aria-label="Remove option group" onClick={() => remove(index)} className="h-12">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-[auto_1fr_1fr] items-end gap-3">
            <label className="flex h-12 items-center gap-2 text-sm font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-black" {...register(`options.${index}.required`)} /> Required
            </label>
            <Input label="Min picks" type="number" inputMode="numeric" {...register(`options.${index}.minSelect`, { valueAsNumber: true })} error={errors.options?.[index]?.minSelect?.message} />
            <Input label="Max picks" type="number" inputMode="numeric" {...register(`options.${index}.maxSelect`, { valueAsNumber: true })} error={errors.options?.[index]?.maxSelect?.message} />
          </div>
          <ChoicesField control={control} register={register} errors={errors} optionIndex={index} />
        </Card>
      ))}
      <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => append(newOption())}>
        Add option group
      </Button>
    </div>
  )
}

function ChoicesField({ control, register, errors, optionIndex }: Props & { optionIndex: number }) {
  const { fields, append, remove } = useFieldArray({ control, name: `options.${optionIndex}.choices` })
  const groupError = errors.options?.[optionIndex]?.choices
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold">Choices</legend>
      {fields.map((field, index) => {
        const e = groupError?.[index]
        return (
          <div key={field.id} className="grid grid-cols-[1fr_7rem_auto_auto] items-start gap-2">
            <Input aria-label="Choice name" placeholder="Choice" {...register(`options.${optionIndex}.choices.${index}.name`)} error={e?.name?.message} />
            <Input aria-label="Extra price (RWF)" placeholder="+RWF" type="number" inputMode="numeric" {...register(`options.${optionIndex}.choices.${index}.priceDelta`, { valueAsNumber: true })} error={e?.priceDelta?.message} />
            <label className="flex h-12 items-center gap-1 text-xs font-semibold" title="Uncheck when this choice runs out">
              <input type="checkbox" className="h-4 w-4 accent-black" {...register(`options.${optionIndex}.choices.${index}.isAvailable`)} /> In stock
            </label>
            <button type="button" aria-label="Remove choice" disabled={fields.length === 1} onClick={() => remove(index)} className="flex h-12 items-center rounded-full px-2 hover:bg-muted disabled:opacity-30">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      })}
      {groupError?.root?.message || groupError?.message ? <p className="text-sm font-semibold text-danger">{groupError?.root?.message ?? groupError?.message}</p> : null}
      <button type="button" onClick={() => append(newChoice())} className="self-start text-sm font-semibold underline underline-offset-4">
        + Add choice
      </button>
    </fieldset>
  )
}

/** Paid extras (extra cheese, avocado…). */
export function AddOnsField({ control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'addOns' })
  return (
    <div className="flex flex-col gap-2">
      {fields.map((field, index) => {
        const e = errors.addOns?.[index]
        return (
          <div key={field.id} className="grid grid-cols-[1fr_7rem_5rem_auto_auto] items-start gap-2">
            <Input aria-label="Add-on name" placeholder="e.g. Extra cheese" {...register(`addOns.${index}.name`)} error={e?.name?.message} />
            <Input aria-label="Price (RWF)" placeholder="RWF" type="number" inputMode="numeric" {...register(`addOns.${index}.price`, { valueAsNumber: true })} error={e?.price?.message} />
            <Input aria-label="Max quantity" title="Max quantity" type="number" inputMode="numeric" {...register(`addOns.${index}.maxQuantity`, { valueAsNumber: true })} error={e?.maxQuantity?.message} />
            <label className="flex h-12 items-center gap-1 text-xs font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-black" {...register(`addOns.${index}.isAvailable`)} /> In stock
            </label>
            <button type="button" aria-label="Remove add-on" onClick={() => remove(index)} className="flex h-12 items-center rounded-full px-2 hover:bg-muted">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      })}
      {fields.length > 0 && <p className="text-xs text-ink-soft">Columns: name, price, max quantity per item.</p>}
      <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => append(newAddOn())}>
        Add add-on
      </Button>
    </div>
  )
}
