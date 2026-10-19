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
