import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { RiderLayout } from '@/components/layout/RiderLayout'
import { RouteError } from '@/components/layout/RouteError'
import { RouteFocus } from '@/components/layout/RouteFocus'
import { RequireCustomer } from '@/features/auth/RequireCustomer'
import { RequireStaff } from '@/features/auth/RequireStaff'

// Every screen is code-split so the first load only ships the customer shell.
const MenuPage = lazy(() => import('@/pages/customer/MenuPage'))
const CartPage = lazy(() => import('@/pages/customer/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/customer/CheckoutPage'))
const PaymentPage = lazy(() => import('@/pages/customer/PaymentPage'))
const OrderConfirmedPage = lazy(() => import('@/pages/customer/OrderConfirmedPage'))
const OrderTrackingPage = lazy(() => import('@/pages/customer/OrderTrackingPage'))
const OrdersPage = lazy(() => import('@/pages/customer/OrdersPage'))
const LoginPage = lazy(() => import('@/pages/customer/LoginPage'))
const AccountPage = lazy(() => import('@/pages/customer/account/AccountPage'))
const ProfilePage = lazy(() => import('@/pages/customer/account/ProfilePage'))
const AddressesPage = lazy(() => import('@/pages/customer/account/AddressesPage'))
const FavouritesPage = lazy(() => import('@/pages/customer/account/FavouritesPage'))
const ItemRedirectPage = lazy(() => import('@/pages/customer/ItemRedirectPage'))
const LiveOrdersPage = lazy(() => import('@/pages/admin/LiveOrdersPage'))
const PrintPage = lazy(() => import('@/pages/admin/PrintPage'))
const PromotionsPage = lazy(() => import('@/pages/admin/PromotionsPage'))
const StaffPage = lazy(() => import('@/pages/admin/StaffPage'))
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'))
const CustomersPage = lazy(() => import('@/pages/admin/CustomersPage'))
const RiderPage = lazy(() => import('@/pages/rider/RiderPage'))
const DeliveryPage = lazy(() => import('@/pages/admin/DeliveryPage'))
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'))
const MenuManagementPage = lazy(() => import('@/pages/admin/menu/MenuManagementPage'))
const ItemEditorPage = lazy(() => import('@/pages/admin/menu/ItemEditorPage'))
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const UiKitPage = lazy(() => import('@/pages/dev/UiKitPage'))

export const router = createBrowserRouter([
  {
    // One boundary for every screen: failed chunk loads and render crashes land here.
    errorElement: <RouteError />,
    element: <RouteFocus />,
    children: [
      {
        element: <CustomerLayout />,
        children: [
          { index: true, element: <MenuPage /> },
          { path: 'item/:itemId', element: <ItemRedirectPage /> },
          { path: 'cart', element: <CartPage /> },
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'checkout/pay/:orderId', element: <PaymentPage /> },
          { path: 'order/:orderId/confirmed', element: <OrderConfirmedPage /> },
          { path: 'order/:orderId', element: <OrderTrackingPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'account', element: <AccountPage /> },
          { path: 'account/profile', element: <RequireCustomer><ProfilePage /></RequireCustomer> },
          { path: 'account/addresses', element: <RequireCustomer><AddressesPage /></RequireCustomer> },
          { path: 'account/favourites', element: <RequireCustomer><FavouritesPage /></RequireCustomer> },
          { path: 'login', element: <LoginPage /> },
          { path: 'dev/ui', element: <UiKitPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      { path: 'admin/login', element: <AdminLoginPage /> },
      { path: 'admin/print/:orderId', element: <Suspense fallback={null}><RequireStaff permission="orders.view"><PrintPage /></RequireStaff></Suspense> },
      {
        path: 'admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/orders" replace /> },
          { path: 'orders', element: <RequireStaff permission="orders.view"><LiveOrdersPage /></RequireStaff> },
          { path: 'menu', element: <RequireStaff permission="menu.view"><MenuManagementPage /></RequireStaff> },
          { path: 'menu/items/new', element: <RequireStaff permission="menu.edit"><ItemEditorPage /></RequireStaff> },
          { path: 'menu/items/:itemId', element: <RequireStaff permission="menu.edit"><ItemEditorPage /></RequireStaff> },
          { path: 'delivery', element: <RequireStaff permission="delivery.manage"><DeliveryPage /></RequireStaff> },
          { path: 'promotions', element: <RequireStaff permission="promotions.manage"><PromotionsPage /></RequireStaff> },
          { path: 'reports', element: <RequireStaff permission="reports.view"><ReportsPage /></RequireStaff> },
          { path: 'customers', element: <RequireStaff permission="customers.view"><CustomersPage /></RequireStaff> },
          { path: 'staff', element: <RequireStaff permission="staff.manage"><StaffPage /></RequireStaff> },
          { path: 'settings', element: <RequireStaff permission="settings.manage"><SettingsPage /></RequireStaff> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        path: 'rider',
        element: <RiderLayout />,
        children: [{ index: true, element: <RequireStaff permission="rider.app"><RiderPage /></RequireStaff> }],
      },
    ],
  },
])
