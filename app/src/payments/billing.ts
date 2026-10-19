// Google Play purchases through RevenueCat (used when app_settings.payments_mode is 'live').
// The app only starts the purchase; the server adds the credits when RevenueCat confirms it
// (supabase/functions/revenuecat), so a tampered app cannot create credits.
import { Platform } from 'react-native';

/** RevenueCat's PUBLIC Android SDK key (safe to ship in the app). Empty until RevenueCat is set up. */
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

export const storeBillingAvailable = Platform.OS === 'android' && ANDROID_KEY.length > 0;

// Loaded only when needed, so the web preview and Expo Go never touch the native module.
const purchases = async () => (await import('react-native-purchases')).default;

let configuredFor: string | null = null;

/** Links purchases to the signed-in user (their account id is what the server credits). */
async function ready(userId: string) {
  const Purchases = await purchases();
  if (configuredFor === null) Purchases.configure({ apiKey: ANDROID_KEY, appUserID: userId });
  else if (configuredFor !== userId) await Purchases.logIn(userId);
  configuredFor = userId;
  return Purchases;
}

/** Local prices from Google Play for the given product ids (e.g. "₹49.00"). */
export async function storePrices(userId: string, productIds: string[]): Promise<Record<string, string>> {
  if (!storeBillingAvailable) return {};
  const Purchases = await ready(userId);
  const products = await Purchases.getProducts(productIds, Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION);
  return Object.fromEntries(products.map((p) => [p.identifier, p.priceString]));
}

export type StorePlanPrice = { price: string; perMonth: string | null };

// Google Play subscriptions are fetched by subscription id ("premium"); each base plan comes
// back as its own product, named "premium:monthly", "premium:yearly" and so on.
async function subscriptionProducts(userId: string, productIds: string[]) {
  const Purchases = await ready(userId);
  const ids = [...new Set(productIds.map((id) => id.split(':')[0]))];
  const products = await Purchases.getProducts(ids, Purchases.PRODUCT_CATEGORY.SUBSCRIPTION);
  return { Purchases, products: products.filter((p) => productIds.includes(p.identifier)) };
}

/** Local prices of subscription plans from Google Play (e.g. "₹199.00", and per month). */
export async function subscriptionPrices(userId: string, productIds: string[]): Promise<Record<string, StorePlanPrice>> {
  if (!storeBillingAvailable) return {};
  const { products } = await subscriptionProducts(userId, productIds);
  return Object.fromEntries(products.map((p) => [p.identifier, { price: p.priceString, perMonth: p.pricePerMonthString }]));
}

/** Starts a Google Play subscription (with its free trial, if the plan has one and the account has not used it). */
export async function subscribeInStore(userId: string, productId: string): Promise<'bought' | 'cancelled'> {
  const { Purchases, products } = await subscriptionProducts(userId, [productId]);
  const [product] = products;
  if (!product) throw new Error(`Subscription ${productId} is not set up in Google Play`);
  try {
    await Purchases.purchaseStoreProduct(product);
    return 'bought';
  } catch (err) {
    if ((err as { userCancelled?: boolean }).userCancelled) return 'cancelled';
    throw err;
  }
}

/** Asks Google Play again for this account's purchases (after reinstalling or on a new phone). */
export async function restoreStorePurchases(userId: string): Promise<void> {
  const Purchases = await ready(userId);
  await Purchases.restorePurchases();
}

/** Google Play's own page where people cancel or change subscriptions. */
export const MANAGE_SUBSCRIPTIONS_URL = 'https://play.google.com/store/account/subscriptions';

/** Opens Google Play's payment sheet. Resolves 'bought' or 'cancelled'; throws on other errors. */
export async function buyFromStore(userId: string, productId: string): Promise<'bought' | 'cancelled'> {
  const Purchases = await ready(userId);
  const [product] = await Purchases.getProducts([productId], Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION);
  if (!product) throw new Error(`Product ${productId} is not set up in Google Play`);
  try {
    await Purchases.purchaseStoreProduct(product);
    return 'bought';
  } catch (err) {
    if ((err as { userCancelled?: boolean }).userCancelled) return 'cancelled';
    throw err;
  }
}
