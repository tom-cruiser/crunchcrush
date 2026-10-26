import type { AddOn, ItemOption, MenuCategory, MenuItem } from '@/types'

export const mockCategories: MenuCategory[] = [
  { id: 'cat-tacos', name: 'Tacos', description: 'Soft or crunchy shells, loaded to order.', sortOrder: 1, isActive: true },
  { id: 'cat-rolex', name: 'Roll-Eggs', description: 'Chapati rolled with a fluffy egg omelette.', sortOrder: 2, isActive: true },
  { id: 'cat-breakfast', name: 'Breakfast', description: 'Served 06:30 to 11:00.', sortOrder: 3, isActive: true, availableFrom: '06:30', availableTo: '11:00' },
  { id: 'cat-combos', name: 'Combos', description: 'Meal deals with a side and a drink.', sortOrder: 4, isActive: true },
  { id: 'cat-sides', name: 'Sides', sortOrder: 5, isActive: true },
  { id: 'cat-drinks', name: 'Drinks', sortOrder: 6, isActive: true },
  { id: 'cat-desserts', name: 'Desserts', sortOrder: 7, isActive: true },
]

const img = (id: string) => `/images/menu/${id}.svg`

const tortilla: ItemOption = {
  id: 'opt-tortilla',
  name: 'Tortilla',
  required: true,
  minSelect: 1,
  maxSelect: 1,
  choices: [
    { id: 'ch-soft-flour', name: 'Soft flour', priceDelta: 0, isAvailable: true },
    { id: 'ch-soft-corn', name: 'Soft corn', priceDelta: 0, isAvailable: true },
    { id: 'ch-crunchy', name: 'Crunchy shell', priceDelta: 300, isAvailable: true },
  ],
}

const tacoSize: ItemOption = {
  id: 'opt-taco-size',
  name: 'How many',
  required: true,
  minSelect: 1,
  maxSelect: 1,
  choices: [
    { id: 'ch-2pc', name: '2 tacos', priceDelta: 0, isAvailable: true },
    { id: 'ch-3pc', name: '3 tacos', priceDelta: 2000, isAvailable: true },
  ],
}

const heat: ItemOption = {
  id: 'opt-heat',
  name: 'Heat level',
  required: true,
  minSelect: 1,
  maxSelect: 1,
  choices: [
    { id: 'ch-mild', name: 'Mild', priceDelta: 0, isAvailable: true },
    { id: 'ch-medium', name: 'Medium', priceDelta: 0, isAvailable: true },
    { id: 'ch-hot', name: 'Hot (akabanga)', priceDelta: 0, isAvailable: true },
  ],
}

const eggs: ItemOption = {
  id: 'opt-eggs',
  name: 'Eggs',
  required: true,
  minSelect: 1,
  maxSelect: 1,
  choices: [
    { id: 'ch-2eggs', name: '2 eggs', priceDelta: 0, isAvailable: true },
    { id: 'ch-3eggs', name: '3 eggs', priceDelta: 400, isAvailable: true },
    { id: 'ch-4eggs', name: '4 eggs', priceDelta: 800, isAvailable: true },
  ],
}

const chapati: ItemOption = {
  id: 'opt-chapati',
  name: 'Chapati',
  required: true,
  minSelect: 1,
  maxSelect: 1,
  choices: [
    { id: 'ch-white', name: 'White', priceDelta: 0, isAvailable: true },
    { id: 'ch-wholewheat', name: 'Whole wheat', priceDelta: 200, isAvailable: true },
    { id: 'ch-double', name: 'Double chapati', priceDelta: 500, isAvailable: false },
  ],
}

const comboDrink: ItemOption = {
  id: 'opt-combo-drink',
  name: 'Drink',
  required: true,
  minSelect: 1,
  maxSelect: 1,
  choices: [
    { id: 'ch-d-fanta', name: 'Fanta Orange', priceDelta: 0, isAvailable: true },
    { id: 'ch-d-coke', name: 'Coca-Cola', priceDelta: 0, isAvailable: true },
    { id: 'ch-d-water', name: 'Water', priceDelta: 0, isAvailable: true },
    { id: 'ch-d-passion', name: 'Passion juice', priceDelta: 500, isAvailable: true },
  ],
}

const comboSide: ItemOption = {
  id: 'opt-combo-side',
  name: 'Side',
  required: true,
  minSelect: 1,
  maxSelect: 1,
  choices: [
    { id: 'ch-s-fries', name: 'Fries', priceDelta: 0, isAvailable: true },
    { id: 'ch-s-plantain', name: 'Fried plantain', priceDelta: 0, isAvailable: true },
    { id: 'ch-s-salad', name: 'Side salad', priceDelta: 0, isAvailable: true },
  ],
}

const dips: ItemOption = {
  id: 'opt-dips',
  name: 'Dips (pick up to 2)',
  required: false,
  minSelect: 0,
  maxSelect: 2,
  choices: [
    { id: 'ch-dip-salsa', name: 'Salsa roja', priceDelta: 0, isAvailable: true },
    { id: 'ch-dip-guac', name: 'Guacamole', priceDelta: 500, isAvailable: true },
    { id: 'ch-dip-pili', name: 'Pili pili mayo', priceDelta: 0, isAvailable: true },
  ],
}

const drinkSize: ItemOption = {
  id: 'opt-drink-size',
  name: 'Size',
  required: true,
  minSelect: 1,
  maxSelect: 1,
  choices: [
    { id: 'ch-regular', name: 'Regular', priceDelta: 0, isAvailable: true },
    { id: 'ch-large', name: 'Large', priceDelta: 700, isAvailable: true },
  ],
}

const addOn = (id: string, name: string, price: number, isAvailable = true, maxQuantity = 3): AddOn => ({
  id,
  name,
  price,
  isAvailable,
  maxQuantity,
})

const tacoAddOns: AddOn[] = [
  addOn('ao-cheese', 'Extra cheese', 500),
  addOn('ao-guac', 'Guacamole', 800),
  addOn('ao-jalapeno', 'Jalapeños', 300),
  addOn('ao-sourcream', 'Sour cream', 400),
  addOn('ao-extra-meat', 'Extra meat', 1500, true, 2),
]

const rolexAddOns: AddOn[] = [
  addOn('ao-avocado', 'Avocado', 500),
  addOn('ao-cheese', 'Extra cheese', 500),
  addOn('ao-sausage', 'Beef sausage', 800),
  addOn('ao-chicken', 'Grilled chicken', 1200, true, 2),
  addOn('ao-beef', 'Minced beef', 1200, false, 2),
]

type ItemSeed = Omit<MenuItem, 'imageUrl' | 'options' | 'addOns' | 'removableIngredients' | 'dietaryTags' | 'allergens' | 'isAvailable' | 'isPopular' | 'isRecommended'> &
  Partial<Pick<MenuItem, 'options' | 'addOns' | 'removableIngredients' | 'dietaryTags' | 'allergens' | 'isAvailable' | 'isPopular' | 'isRecommended'>>

const item = (seed: ItemSeed): MenuItem => ({
  imageUrl: img(seed.id),
  options: [],
  addOns: [],
  removableIngredients: [],
  dietaryTags: [],
  allergens: [],
  isAvailable: true,
  isPopular: false,
  isRecommended: false,
  ...seed,
})

export const mockItems: MenuItem[] = [
  // Tacos
  item({ id: 'taco-beef', categoryId: 'cat-tacos', name: 'Beef Birria Tacos', description: 'Slow-braised beef, melted cheese and a cup of consommé for dipping.', price: 6500, prepTimeMinutes: 15, sortOrder: 1, isPopular: true, options: [tortilla, tacoSize, heat], addOns: tacoAddOns, removableIngredients: ['Onion', 'Coriander', 'Cheese'], allergens: ['gluten', 'dairy'], calories: 720 }),
  item({ id: 'taco-chicken', categoryId: 'cat-tacos', name: 'Grilled Chicken Tacos', description: 'Lime-marinated chicken, pico de gallo, shredded cabbage and chipotle mayo.', price: 5500, prepTimeMinutes: 12, sortOrder: 2, isPopular: true, isRecommended: true, options: [tortilla, tacoSize, heat], addOns: tacoAddOns, removableIngredients: ['Cabbage', 'Pico de gallo', 'Chipotle mayo'], dietaryTags: ['halal'], allergens: ['gluten', 'eggs'], calories: 610 }),
  item({ id: 'taco-fish', categoryId: 'cat-tacos', name: 'Lake Kivu Fish Tacos', description: 'Crispy tilapia, mango slaw and lime crema.', price: 6000, prepTimeMinutes: 14, sortOrder: 3, isRecommended: true, options: [tortilla, tacoSize], addOns: tacoAddOns, removableIngredients: ['Mango slaw', 'Lime crema'], allergens: ['fish', 'gluten', 'dairy'], calories: 580 }),
  item({ id: 'taco-goat', categoryId: 'cat-tacos', name: 'Goat Brochette Tacos', description: 'Charcoal-grilled goat brochette, onions and pili pili.', price: 6000, prepTimeMinutes: 16, sortOrder: 4, options: [tortilla, tacoSize, heat], addOns: tacoAddOns, removableIngredients: ['Onion', 'Pili pili'], dietaryTags: ['spicy', 'halal'], allergens: ['gluten'], calories: 650 }),
  item({ id: 'taco-beans', categoryId: 'cat-tacos', name: 'Black Bean & Avocado Tacos', description: 'Refried black beans, avocado, pickled onion and salsa verde.', price: 4500, prepTimeMinutes: 10, sortOrder: 5, options: [tortilla, tacoSize, heat], addOns: tacoAddOns.filter((a) => a.id !== 'ao-extra-meat'), removableIngredients: ['Pickled onion', 'Salsa verde'], dietaryTags: ['vegan'], allergens: ['gluten'], calories: 480 }),
  item({ id: 'taco-paneer', categoryId: 'cat-tacos', name: 'Spicy Paneer Tacos', description: 'Tikka-spiced paneer, cucumber raita and mint.', price: 5000, prepTimeMinutes: 12, sortOrder: 6, options: [tortilla, tacoSize, heat], addOns: tacoAddOns.filter((a) => a.id !== 'ao-extra-meat'), removableIngredients: ['Raita', 'Mint'], dietaryTags: ['vegetarian', 'spicy'], allergens: ['gluten', 'dairy'], calories: 560 }),
  item({ id: 'taco-shrimp', categoryId: 'cat-tacos', name: 'Garlic Shrimp Tacos', description: 'Garlic butter shrimp, avocado and chilli lime slaw.', price: 8000, prepTimeMinutes: 14, sortOrder: 7, isAvailable: false, options: [tortilla, tacoSize], addOns: tacoAddOns, removableIngredients: ['Slaw'], allergens: ['fish', 'gluten', 'dairy'], calories: 540 }),
  item({ id: 'taco-mixed', categoryId: 'cat-tacos', name: 'Taco Trio Platter', description: 'One beef, one chicken and one bean taco. Can’t choose? Don’t.', price: 7500, prepTimeMinutes: 18, sortOrder: 8, isPopular: true, options: [tortilla, heat, dips], addOns: tacoAddOns, removableIngredients: ['Onion', 'Coriander'], allergens: ['gluten', 'dairy'], calories: 820 }),

  // Roll-Eggs (rolex)
  item({ id: 'rolex-classic', categoryId: 'cat-rolex', name: 'Classic Roll-Egg', description: 'Fresh chapati rolled around an egg omelette with tomato, onion and cabbage.', price: 2500, prepTimeMinutes: 8, sortOrder: 1, isPopular: true, options: [eggs, chapati], addOns: rolexAddOns, removableIngredients: ['Onion', 'Tomato', 'Cabbage'], dietaryTags: ['vegetarian'], allergens: ['gluten', 'eggs'], calories: 520 }),
  item({ id: 'rolex-chicken', categoryId: 'cat-rolex', name: 'Chicken Roll-Egg', description: 'Classic roll-egg loaded with grilled chicken strips and garlic sauce.', price: 4000, prepTimeMinutes: 10, sortOrder: 2, isPopular: true, isRecommended: true, options: [eggs, chapati, heat], addOns: rolexAddOns, removableIngredients: ['Onion', 'Tomato', 'Garlic sauce'], dietaryTags: ['halal'], allergens: ['gluten', 'eggs'], calories: 690 }),
  item({ id: 'rolex-beef', categoryId: 'cat-rolex', name: 'Minced Beef Roll-Egg', description: 'Spiced minced beef and peppers rolled with eggs.', price: 4000, prepTimeMinutes: 10, sortOrder: 3, isAvailable: false, options: [eggs, chapati, heat], addOns: rolexAddOns, removableIngredients: ['Peppers', 'Onion'], allergens: ['gluten', 'eggs'], calories: 710 }),
  item({ id: 'rolex-cheese', categoryId: 'cat-rolex', name: 'Cheesy Roll-Egg', description: 'Mozzarella pulled through a hot omelette, with tomato and green pepper.', price: 3500, prepTimeMinutes: 8, sortOrder: 4, options: [eggs, chapati], addOns: rolexAddOns, removableIngredients: ['Tomato', 'Green pepper'], dietaryTags: ['vegetarian'], allergens: ['gluten', 'eggs', 'dairy'], calories: 640 }),
  item({ id: 'rolex-veggie', categoryId: 'cat-rolex', name: 'Garden Roll-Egg', description: 'Spinach, carrot, avocado and mushrooms with eggs.', price: 3000, prepTimeMinutes: 8, sortOrder: 5, options: [eggs, chapati], addOns: rolexAddOns, removableIngredients: ['Mushrooms', 'Carrot', 'Spinach'], dietaryTags: ['vegetarian'], allergens: ['gluten', 'eggs'], calories: 540 }),
  item({ id: 'rolex-sausage', categoryId: 'cat-rolex', name: 'Sausage Roll-Egg', description: 'Two grilled beef sausages, egg, ketchup and mustard.', price: 3800, prepTimeMinutes: 9, sortOrder: 6, options: [eggs, chapati], addOns: rolexAddOns, removableIngredients: ['Ketchup', 'Mustard'], allergens: ['gluten', 'eggs'], calories: 760 }),
  item({ id: 'rolex-kikomando', categoryId: 'cat-rolex', name: 'Chapati & Beans Roll', description: 'Chapati rolled with spiced bean stew. Hearty and egg-free.', price: 2500, prepTimeMinutes: 6, sortOrder: 7, options: [chapati], addOns: rolexAddOns.filter((a) => a.id === 'ao-avocado'), removableIngredients: ['Onion'], dietaryTags: ['vegan'], allergens: ['gluten'], calories: 480 }),

  // Breakfast
  item({ id: 'bf-rolex-coffee', categoryId: 'cat-breakfast', name: 'Morning Roll-Egg + Coffee', description: 'Classic roll-egg and a Rwandan coffee.', price: 3500, prepTimeMinutes: 8, sortOrder: 1, options: [eggs, { ...drinkSize, id: 'opt-coffee', name: 'Coffee', choices: [{ id: 'ch-black', name: 'Black', priceDelta: 0, isAvailable: true }, { id: 'ch-latte', name: 'Latte', priceDelta: 500, isAvailable: true }] }], allergens: ['gluten', 'eggs'], dietaryTags: ['vegetarian'] }),
  item({ id: 'bf-breakfast-taco', categoryId: 'cat-breakfast', name: 'Breakfast Tacos', description: 'Scrambled eggs, chorizo, potato and salsa in two soft tacos.', price: 5000, prepTimeMinutes: 10, sortOrder: 2, options: [tortilla], removableIngredients: ['Chorizo', 'Salsa'], allergens: ['gluten', 'eggs'] }),

  // Combos
  item({ id: 'combo-taco', categoryId: 'cat-combos', name: 'Taco Combo', description: '2 chicken or beef tacos, a side and a drink.', price: 8500, prepTimeMinutes: 15, sortOrder: 1, isPopular: true, options: [{ id: 'opt-combo-taco', name: 'Tacos', required: true, minSelect: 1, maxSelect: 1, choices: [{ id: 'ch-ct-chicken', name: 'Chicken', priceDelta: 0, isAvailable: true }, { id: 'ch-ct-beef', name: 'Beef birria', priceDelta: 1000, isAvailable: true }] }, comboSide, comboDrink], allergens: ['gluten', 'dairy'] }),
  item({ id: 'combo-rolex', categoryId: 'cat-combos', name: 'Roll-Egg Combo', description: 'Any classic or chicken roll-egg, a side and a drink.', price: 6000, prepTimeMinutes: 12, sortOrder: 2, isRecommended: true, options: [{ id: 'opt-combo-rolex', name: 'Roll-Egg', required: true, minSelect: 1, maxSelect: 1, choices: [{ id: 'ch-cr-classic', name: 'Classic', priceDelta: 0, isAvailable: true }, { id: 'ch-cr-chicken', name: 'Chicken', priceDelta: 1500, isAvailable: true }] }, comboSide, comboDrink], allergens: ['gluten', 'eggs'] }),
  item({ id: 'combo-family', categoryId: 'cat-combos', name: 'Family Fiesta Box', description: '8 mixed tacos, 2 roll-eggs, 2 large fries and a 1.5 L soda. Feeds 4.', price: 32000, prepTimeMinutes: 25, sortOrder: 3, options: [heat, dips], allergens: ['gluten', 'eggs', 'dairy'] }),

  // Sides
  item({ id: 'side-fries', categoryId: 'cat-sides', name: 'Fries', description: 'Crispy Irish potato fries with salt and herbs.', price: 2000, prepTimeMinutes: 7, sortOrder: 1, isPopular: true, options: [{ id: 'opt-fries-size', name: 'Size', required: true, minSelect: 1, maxSelect: 1, choices: [{ id: 'ch-fr-reg', name: 'Regular', priceDelta: 0, isAvailable: true }, { id: 'ch-fr-large', name: 'Large', priceDelta: 1000, isAvailable: true }] }, dips], dietaryTags: ['vegan', 'gluten-free'] }),
  item({ id: 'side-plantain', categoryId: 'cat-sides', name: 'Fried Plantain', description: 'Sweet ripe plantain fried golden.', price: 2000, prepTimeMinutes: 6, sortOrder: 2, dietaryTags: ['vegan', 'gluten-free'] }),
  item({ id: 'side-nachos', categoryId: 'cat-sides', name: 'Loaded Nachos', description: 'Tortilla chips, cheese sauce, beans, jalapeños and salsa.', price: 4500, prepTimeMinutes: 8, sortOrder: 3, addOns: [addOn('ao-guac', 'Guacamole', 800), addOn('ao-beef-n', 'Minced beef', 1200)], removableIngredients: ['Jalapeños', 'Beans'], dietaryTags: ['vegetarian', 'spicy'], allergens: ['dairy'] }),
  item({ id: 'side-salad', categoryId: 'cat-sides', name: 'Avocado Corn Salad', description: 'Avocado, sweet corn, tomato, red onion and lime.', price: 2500, prepTimeMinutes: 5, sortOrder: 4, removableIngredients: ['Red onion'], dietaryTags: ['vegan', 'gluten-free'] }),
  item({ id: 'side-samosa', categoryId: 'cat-sides', name: 'Beef Samosas (3)', description: 'Crisp pastry stuffed with spiced beef.', price: 1800, prepTimeMinutes: 5, sortOrder: 5, isAvailable: false, allergens: ['gluten'] }),

  // Drinks
  item({ id: 'drink-passion', categoryId: 'cat-drinks', name: 'Fresh Passion Juice', description: 'Pressed daily from local passion fruit.', price: 1500, prepTimeMinutes: 2, sortOrder: 1, isRecommended: true, options: [drinkSize], dietaryTags: ['vegan', 'gluten-free'] }),
  item({ id: 'drink-tree-tomato', categoryId: 'cat-drinks', name: 'Tree Tomato Juice', description: 'Tangy and fresh.', price: 1500, prepTimeMinutes: 2, sortOrder: 2, options: [drinkSize], dietaryTags: ['vegan', 'gluten-free'] }),
  item({ id: 'drink-soda', categoryId: 'cat-drinks', name: 'Soda (330 ml)', description: 'Coca-Cola, Fanta Orange, Sprite or Krest.', price: 1000, prepTimeMinutes: 1, sortOrder: 3, options: [{ id: 'opt-soda', name: 'Flavour', required: true, minSelect: 1, maxSelect: 1, choices: [{ id: 'ch-coke', name: 'Coca-Cola', priceDelta: 0, isAvailable: true }, { id: 'ch-fanta', name: 'Fanta Orange', priceDelta: 0, isAvailable: true }, { id: 'ch-sprite', name: 'Sprite', priceDelta: 0, isAvailable: true }, { id: 'ch-krest', name: 'Krest', priceDelta: 0, isAvailable: false }] }], dietaryTags: ['vegan', 'gluten-free'] }),
  item({ id: 'drink-water', categoryId: 'cat-drinks', name: 'Inyange Water (500 ml)', description: 'Still mineral water.', price: 600, prepTimeMinutes: 1, sortOrder: 4, dietaryTags: ['vegan', 'gluten-free'] }),
  item({ id: 'drink-coffee', categoryId: 'cat-drinks', name: 'Rwandan Coffee', description: 'Single-origin from Huye, brewed to order.', price: 2000, prepTimeMinutes: 4, sortOrder: 5, options: [{ id: 'opt-coffee-type', name: 'Style', required: true, minSelect: 1, maxSelect: 1, choices: [{ id: 'ch-c-black', name: 'Black', priceDelta: 0, isAvailable: true }, { id: 'ch-c-latte', name: 'Latte', priceDelta: 500, isAvailable: true }, { id: 'ch-c-african', name: 'African tea', priceDelta: 0, isAvailable: true }] }], allergens: ['dairy'] }),

  // Desserts
  item({ id: 'dessert-churros', categoryId: 'cat-desserts', name: 'Churros', description: 'Cinnamon sugar churros with chocolate dip.', price: 3000, prepTimeMinutes: 8, sortOrder: 1, isPopular: true, dietaryTags: ['vegetarian'], allergens: ['gluten', 'dairy', 'eggs'] }),
  item({ id: 'dessert-mandazi', categoryId: 'cat-desserts', name: 'Mandazi & Honey', description: 'Four warm mandazi with local honey.', price: 1500, prepTimeMinutes: 5, sortOrder: 2, dietaryTags: ['vegetarian'], allergens: ['gluten', 'dairy'] }),
  item({ id: 'dessert-nutella-rolex', categoryId: 'cat-desserts', name: 'Banana Nutella Roll', description: 'Sweet chapati roll with banana and Nutella.', price: 3000, prepTimeMinutes: 6, sortOrder: 3, addOns: [addOn('ao-icecream', 'Scoop of vanilla ice cream', 1000, true, 2)], dietaryTags: ['vegetarian'], allergens: ['gluten', 'nuts', 'dairy'] }),
]
