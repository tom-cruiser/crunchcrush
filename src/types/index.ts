// Domain types shared by the UI and the API layer. Money is stored as integer RWF.

export type ID = string
export type ISODate = string
export type Money = number

export type LocaleCode = 'en' | 'fr' | 'rw'

export type DietaryTag = 'vegetarian' | 'vegan' | 'spicy' | 'halal' | 'gluten-free'
export type Allergen = 'gluten' | 'eggs' | 'dairy' | 'nuts' | 'soy' | 'sesame' | 'fish'

export interface MenuCategory {
  id: ID
  name: string
  description?: string
  sortOrder: number
  isActive: boolean
  /** Optional availability window, e.g. a breakfast-only category. 24h "HH:mm". */
  availableFrom?: string
  availableTo?: string
}

export interface OptionChoice {
  id: ID
  name: string
  priceDelta: Money
  isAvailable: boolean
}

/** A choice group such as "Tortilla" or "Size". */
export interface ItemOption {
  id: ID
  name: string
  required: boolean
  minSelect: number
  maxSelect: number
  choices: OptionChoice[]
}

export interface AddOn {
  id: ID
  name: string
  price: Money
  isAvailable: boolean
  maxQuantity: number
}

export interface MenuItem {
  id: ID
  categoryId: ID
  name: string
  description: string
  price: Money
  imageUrl: string
  prepTimeMinutes: number
  dietaryTags: DietaryTag[]
  allergens: Allergen[]
  isAvailable: boolean
  isPopular: boolean
  isRecommended: boolean
  calories?: number
  options: ItemOption[]
  addOns: AddOn[]
  /** Ingredients the customer may ask to leave out. */
  removableIngredients: string[]
  sortOrder: number
}

export interface SelectedOption {
  optionId: ID
  optionName: string
  choiceIds: ID[]
  choiceNames: string[]
  priceDelta: Money
}

export interface SelectedAddOn {
  addOnId: ID
  name: string
  unitPrice: Money
  quantity: number
}

export interface CartItem {
  /** Unique per configuration so the same item with different options is a separate line. */
  lineId: ID
  itemId: ID
  name: string
  imageUrl: string
  basePrice: Money
  quantity: number
  selectedOptions: SelectedOption[]
  selectedAddOns: SelectedAddOn[]
  removedIngredients: string[]
  note?: string
  /** Price of one unit with options and add-ons. */
  unitPrice: Money
}

export type FulfillmentType = 'delivery' | 'pickup' | 'dine-in'

export type OrderStatus =
  | 'received'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'rejected'
  | 'cancelled'

export type PaymentMethod = 'mtn_momo' | 'airtel_money' | 'card' | 'cash'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface Coordinates {
  lat: number
  lng: number
}

export interface Address {
  id: ID
  label: string
  street: string
  area: string
  city: string
  instructions?: string
  coordinates: Coordinates
  isDefault?: boolean
}

export interface OrderStatusEvent {
  status: OrderStatus
  at: ISODate
  note?: string
}

export interface PriceBreakdown {
  subtotal: Money
  deliveryFee: Money
  serviceCharge: Money
  tax: Money
  discount: Money
  total: Money
}

export interface OrderRating {
  food: number
  delivery?: number
  comment?: string
  createdAt: ISODate
}

export interface ProblemReport {
  id: ID
  type: 'missing_item' | 'wrong_item' | 'late' | 'quality' | 'other'
  message: string
  createdAt: ISODate
  resolved: boolean
}

export interface Order {
  id: ID
  orderNumber: string
  customerId?: ID
  customerName: string
  customerPhone: string
  items: CartItem[]
  fulfillment: FulfillmentType
  tableNumber?: number
  address?: Address
  scheduledFor?: ISODate
  status: OrderStatus
  statusHistory: OrderStatusEvent[]
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  pricing: PriceBreakdown
  promoCode?: string
  estimatedReadyAt?: ISODate
  prepTimeMinutes?: number
  riderId?: ID
  rejectionReason?: string
  cancellationReason?: string
  rating?: OrderRating
  problemReports: ProblemReport[]
  createdAt: ISODate
  updatedAt: ISODate
}

export type StaffRole = 'owner' | 'manager' | 'cashier' | 'kitchen' | 'rider'

export interface User {
  id: ID
  name: string
  phone: string
  email?: string
  addresses: Address[]
  favouriteItemIds: ID[]
  createdAt: ISODate
  /** Present when the user is also a staff member. */
  staffRole?: StaffRole
}

export interface Staff {
  id: ID
  name: string
  phone: string
  email: string
  role: StaffRole
  isActive: boolean
  createdAt: ISODate
}

export type RiderStatus = 'available' | 'on_delivery' | 'offline'

export interface Rider {
  id: ID
  staffId: ID
  name: string
  phone: string
  vehicle: 'motorbike' | 'bicycle' | 'car'
  plateNumber?: string
  status: RiderStatus
  currentLocation?: Coordinates
  activeOrderIds: ID[]
}

export type PromoType = 'percentage' | 'fixed' | 'free_delivery'

export interface PromoCode {
  id: ID
  code: string
  description: string
  type: PromoType
  /** Percent (0-100) for percentage, RWF for fixed, ignored for free_delivery. */
  value: Money
  minOrder: Money
  maxDiscount?: Money
  validFrom: ISODate
  validTo: ISODate
  usageLimit?: number
  usedCount: number
  isActive: boolean
}

export interface ComboDeal {
  id: ID
  name: string
  description: string
  itemIds: ID[]
  price: Money
  isActive: boolean
}

export interface DeliveryZone {
  id: ID
  name: string
  /** Simplified circular zone around the restaurant. */
  radiusKm: number
  fee: Money
  minOrder: Money
  estimatedMinutes: number
  isActive: boolean
}

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface OpeningHours {
  day: Weekday
  open: string
  close: string
  closed: boolean
}

export interface HolidayClosure {
  id: ID
  date: string
  reason: string
}

export interface RestaurantSettings {
  name: string
  tagline: string
  phone: string
  whatsapp?: string
  email: string
  address: Address
  currency: 'RWF'
  locale: string
  timezone: string
  logoUrl: string
  coverUrl: string
  isOpen: boolean
  busyMode: boolean
  /** Extra minutes added to every estimate while busy. */
  busyExtraMinutes: number
  openingHours: OpeningHours[]
  holidayClosures: HolidayClosure[]
  minimumOrder: Money
  taxRatePercent: number
  /** Whether menu prices already include tax (Rwanda VAT is typically inclusive). */
  taxInclusive: boolean
  serviceChargePercent: number
  defaultPrepTimeMinutes: number
  enabledPaymentMethods: PaymentMethod[]
  fulfillmentTypes: FulfillmentType[]
  tableCount: number
}

/** Standard envelope for list endpoints so pagination can be added without changing callers. */
export interface Paginated<T> {
  items: T[]
  total: number
}

export interface ApiErrorShape {
  code: string
  message: string
}
