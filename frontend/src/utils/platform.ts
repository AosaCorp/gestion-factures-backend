export const isCapacitor = () => {
  return !!(window as any).Capacitor?.isNativePlatform();
};