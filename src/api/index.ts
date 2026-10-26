// The only entry point the UI uses for data. Each module documents the REST endpoint
// its functions stand in for, so a real backend can replace the mock bodies one by one.
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
export { resetDb as resetDemoData } from './mock/db'
