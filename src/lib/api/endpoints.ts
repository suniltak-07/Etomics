const API_PREFIX = "/api";

function resource(path: string): string {
  return `${API_PREFIX}${path}`;
}

export const API_ENDPOINTS = {
  auth: {
    login: resource("/auth/login"),
    signup: resource("/auth/signup"),
    logout: resource("/auth/logout"),
    me: resource("/auth/me"),
    refresh: resource("/auth/refresh"),
    forgotPassword: resource("/auth/forgot-password"),
    changePassword: resource("/auth/change-password"),
    resetPassword: resource("/auth/reset-password"),
  },
  users: {
    list: resource("/users"),
    detail: (id: string) => resource(`/users/${id}`),
  },
  customers: {
    list: resource("/customers"),
    detail: (id: string) => resource(`/customers/${id}`),
    update: (id: string) => resource(`/customers/${id}`),
    activate: (id: string) => resource(`/customers/${id}/activate`),
    deactivate: (id: string) => resource(`/customers/${id}/deactivate`),
  },
  plans: {
    list: resource("/plans"),
    detail: (id: string) => resource(`/plans/${id}`),
    bySlug: (slug: string) => resource(`/plans/slug/${slug}`),
    create: resource("/plans"),
    update: (id: string) => resource(`/plans/${id}`),
    delete: (id: string) => resource(`/plans/${id}`),
    duplicate: (id: string) => resource(`/plans/${id}/duplicate`),
    reorder: resource("/plans/reorder"),
  },
  addresses: {
    list: resource("/addresses"),
    detail: (id: string) => resource(`/addresses/${id}`),
    create: resource("/addresses"),
    update: (id: string) => resource(`/addresses/${id}`),
    delete: (id: string) => resource(`/addresses/${id}`),
    setDefault: (id: string) => resource(`/addresses/${id}/default`),
  },
  subscriptions: {
    list: resource("/subscriptions"),
    detail: (id: string) => resource(`/subscriptions/${id}`),
    create: resource("/subscriptions"),
    update: (id: string) => resource(`/subscriptions/${id}`),
    pause: (id: string) => resource(`/subscriptions/${id}/pause`),
    resume: (id: string) => resource(`/subscriptions/${id}/resume`),
    cancel: (id: string) => resource(`/subscriptions/${id}/cancel`),
    changeAddress: (id: string) => resource(`/subscriptions/${id}/address`),
    skips: (id: string) => resource(`/subscriptions/${id}/skips`),
    meals: (id: string) => resource(`/subscriptions/${id}/meals`),
  },
  vouchers: {
    list: resource("/vouchers"),
    detail: (id: string) => resource(`/vouchers/${id}`),
    create: resource("/vouchers"),
    update: (id: string) => resource(`/vouchers/${id}`),
    delete: (id: string) => resource(`/vouchers/${id}`),
    validate: resource("/vouchers/validate"),
    byCode: (code: string) =>
      resource(`/vouchers/code/${encodeURIComponent(code)}`),
  },
  payments: {
    list: resource("/payments"),
    detail: (id: string) => resource(`/payments/${id}`),
    create: resource("/payments"),
    confirm: (id: string) => resource(`/payments/${id}/confirm`),
    refund: (id: string) => resource(`/payments/${id}/refund`),
  },
  orders: {
    list: resource("/orders"),
    detail: (id: string) => resource(`/orders/${id}`),
  },
  notifications: {
    list: resource("/notifications"),
    detail: (id: string) => resource(`/notifications/${id}`),
    markRead: (id: string) => resource(`/notifications/${id}/read`),
    markAllRead: resource("/notifications/read-all"),
  },
  dashboard: {
    admin: resource("/dashboard/admin"),
    customer: resource("/dashboard/customer"),
  },
  reports: {
    revenue: resource("/reports/revenue"),
    subscriptions: resource("/reports/subscriptions"),
    planPopularity: resource("/reports/plans/popularity"),
  },
  checkout: {
    preview: resource("/checkout/preview"),
    create: resource("/checkout"),
  },
  cities: {
    list: resource("/cities"),
    detail: (id: string) => resource(`/cities/${id}`),
    create: resource("/cities"),
    update: (id: string) => resource(`/cities/${id}`),
    delete: (id: string) => resource(`/cities/${id}`),
  },
  pincodes: {
    list: resource("/pincodes"),
    detail: (id: string) => resource(`/pincodes/${id}`),
    create: resource("/pincodes"),
    update: (id: string) => resource(`/pincodes/${id}`),
    delete: (id: string) => resource(`/pincodes/${id}`),
  },
  deliveryPersons: {
    list: resource("/delivery-persons"),
    detail: (id: string) => resource(`/delivery-persons/${id}`),
    route: (id: string) => resource(`/delivery-persons/${id}/stops`),
    create: resource("/delivery-persons"),
    update: (id: string) => resource(`/delivery-persons/${id}`),
    delete: (id: string) => resource(`/delivery-persons/${id}`),
  },
  serviceability: {
    check: resource("/serviceability"),
  },
  menus: {
    list: resource("/menus"),
    detail: (id: string) => resource(`/menus/${id}`),
  },
  kitchen: {
    list: resource("/kitchen"),
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
