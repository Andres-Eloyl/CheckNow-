/**
 * CheckNow! — API Services Barrel Export
 * Central re-export for all service modules and the API client.
 */

export { api, ApiError, getWebSocketUrl, getComensalWebSocketUrl, getStaffWebSocketUrl, getSlug, getStaffToken, getSessionToken, getSessionUserId, setStaffAuth, setSessionAuth, clearStaffAuth, clearSessionAuth } from './client';
export { authService } from './auth.service';
export { restaurantService } from './restaurant.service';
export { staffService } from './staff.service';
export { tablesService } from './tables.service';
export { menuService } from './menu.service';
export { sessionService } from './session.service';
export { orderService } from './order.service';
export { checkoutService } from './checkout.service';
export { splitService } from './split.service';
