export const getMenuPdfAccess = (restaurant) => {
  const organization = restaurant?.organizationId;
  const subscriptionPlan = organization?.subscriptionPlan;
  const subscriptionExpiry = organization?.subscriptionExpiry;
  const hasActivePlan = Boolean(
    subscriptionPlan &&
    (!subscriptionExpiry || new Date(subscriptionExpiry) >= new Date())
  );
  const isMenuPdfEnabled = Boolean(
    hasActivePlan && subscriptionPlan?.isMenuPdfEnabled
  );
  const hasMenuPdf = Boolean(restaurant?.menuPdf);
  return {
    hasActivePlan,
    isMenuPdfEnabled,
    hasMenuPdf,
    canShowPdfQr: isMenuPdfEnabled && hasMenuPdf,
  };
};

export default getMenuPdfAccess;
