import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8080/api' })

export const getProducts       = ()        => api.get('/products').then(r => r.data)
export const getProduct        = (id)      => api.get(`/products/${id}`).then(r => r.data)
export const addProduct        = (product) => api.post('/products', product).then(r => r.data)
export const deleteProduct     = (id)      => api.delete(`/products/${id}`).then(r => r.data)

export const processSale       = (productId, quantity) => api.post('/billing/sell', { productId, quantity }).then(r => r.data)
export const undoSale          = ()        => api.post('/billing/undo').then(r => r.data)
export const getSaleHistory    = ()        => api.get('/billing/history').then(r => r.data)

export const getAlerts         = ()        => api.get('/alerts').then(r => r.data)
export const getLowStockAlerts = ()        => api.get('/alerts/lowstock').then(r => r.data)
export const getExpiryAlerts   = (days=7)  => api.get(`/alerts/expiry?days=${days}`).then(r => r.data)
export const getVelocityAlerts = ()        => api.get('/alerts/velocity').then(r => r.data)

export const getDashboard      = ()        => api.get('/dashboard').then(r => r.data)
export const getDailySales     = (days=14) => api.get(`/analytics/daily?days=${days}`).then(r => r.data)
export const getTopSelling     = (days=14) => api.get(`/analytics/top?days=${days}&n=5`).then(r => r.data)
export const getForecast       = (id,w=7)  => api.get(`/analytics/forecast/${id}?window=${w}`).then(r => r.data)

export const getExpiredLog     = ()        => api.get('/expired-log').then(r => r.data)
export const clearExpiredLog   = ()        => api.delete('/expired-log').then(r => r.data)