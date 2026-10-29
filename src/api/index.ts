// The only entry point the UI uses for data. Each module documents the REST endpoint
// its functions call on the backend (backend/README.md lists them).
export * as authApi from './auth'
export * as customersApi from './customers'
export * as menuApi from './menu'
export * as ordersApi from './orders'
export * as paymentsApi from './payments'
export * as placesApi from './places'
export * as promotionsApi from './promotions'
export * as reportsApi from './reports'
export * as settingsApi from './settings'
export * as staffApi from './staff'
export { ApiError, isOffline } from './client'
