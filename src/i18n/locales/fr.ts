import type { Resources } from './en'

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }

// French: partial for now. Missing keys fall back to English.
const fr: DeepPartial<Resources> = {
  common: { loading: 'Chargement…', retry: 'Réessayer', cancel: 'Annuler', save: 'Enregistrer', close: 'Fermer', back: 'Retour', soldOut: 'Épuisé' },
  nav: { menu: 'Menu', cart: 'Panier', orders: 'Commandes', account: 'Compte', skipToContent: 'Aller au contenu' },
}

export default fr
