import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineCreditCard,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheck,
  HiOutlineShoppingCart,
  HiOutlineStar,
  HiOutlineOfficeBuilding,
  HiOutlineBookOpen,
  HiOutlineTag,
  HiOutlineQrcode,
  HiOutlineDatabase,
  HiOutlineLightningBolt,
  HiOutlineFire,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineGlobeAlt,
  HiOutlinePuzzle,
  HiOutlineChip,
  HiOutlineChartBar,
  HiOutlineCube,
} from 'react-icons/hi';
import Modal from '../components/Modal';
import subscriptionService from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

const USE_RAZORPAY = false;

const PLAN_STYLE_PRESETS = [
  { background: 'linear-gradient(to right, #3b82f6, #2563eb)', color: '#2563eb', badge: 'Classic' }, // blue
  { background: 'linear-gradient(to right, #14b8a6, #0d9488)', color: '#0d9488', badge: 'Value' }, // teal
  { background: 'linear-gradient(to right, #a855f7, #9333ea)', color: '#9333ea', badge: 'Pro' }, // purple
  { background: 'linear-gradient(to right, #f97316, #ea580c)', color: '#ea580c', badge: 'Hot' }, // orange
  { background: 'linear-gradient(to right, #22c55e, #16a34a)', color: '#16a34a', badge: 'Popular' }, // green
  { background: 'linear-gradient(to right, #ec4899, #db2777)', color: '#db2777', badge: 'Trending' }, // pink
  { background: 'linear-gradient(to right, #06b6d4, #0891b2)', color: '#0891b2', badge: 'Fresh' }, // cyan
  { background: 'linear-gradient(to right, #eab308, #ca8a04)', color: '#ca8a04', badge: 'Recommended' }, // yellow
  { background: 'linear-gradient(to right, #64748b, #334155)', color: '#334155', badge: 'Solid' }, // slate
  { background: 'linear-gradient(to right, #f43f5e, #e11d48)', color: '#e11d48', badge: 'Limited' }, // rose
];

const PLAN_ICON_PRESETS = [
  HiOutlineStar,
  HiOutlineLightningBolt,
  HiOutlineFire,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineGlobeAlt,
  HiOutlinePuzzle,
  HiOutlineChip,
  HiOutlineChartBar,
  HiOutlineCube,
];

function getPlanStyle(name, index = 0) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('gold') || lower.includes('premium')) {
    return {
      background: 'linear-gradient(to right, #f59e0b, #d97706)',
      color: '#d97706',
      badge: 'Recommended',
    };
  }
  if (lower.includes('pro') || lower.includes('plus')) {
    return {
      background: 'linear-gradient(to right, #a855f7, #9333ea)',
      color: '#9333ea',
      badge: 'Most Popular',
    };
  }

  // Deterministic “random” style by index (up to 10 presets)
  return PLAN_STYLE_PRESETS[index % PLAN_STYLE_PRESETS.length];
}

function getDaysRemaining(expiryDate) {
  if (!expiryDate) return -1;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function getDaysBadge(days) {
  if (days < 0) return { text: 'Expired', bg: '#fee2e2', fg: '#b91c1c' };
  if (days === 0) return { text: 'Expires today', bg: '#fee2e2', fg: '#b91c1c' };
  if (days <= 7) return { text: `${days} day${days !== 1 ? 's' : ''} left`, bg: '#fef9c3', fg: '#a16207' };
  return { text: `${days} days left`, bg: '#dcfce7', fg: '#15803d' };
}

function getOfferPercentForMonths(plan, months) {
  const offers = Array.isArray(plan?.offers) ? plan.offers : [];
  const row = offers.find((o) => Number(o?.months) === Number(months));
  const pct = Number(row?.offerPercent) || 0;
  return Math.min(100, Math.max(0, pct));
}

function applyPercentDiscount(amount, percent) {
  const base = Number(amount) || 0;
  const pct = Math.min(100, Math.max(0, Number(percent) || 0));
  if (base <= 0 || pct <= 0) return base;
  return Math.max(0, base - (base * pct) / 100);
}

function applyPlanDiscount(amount, plan) {
  const base = Number(amount) || 0;
  const type = plan?.discountType || 'none';
  const value = Number(plan?.discountValue) || 0;

  if (base <= 0) return 0;
  if (type === 'none' || value <= 0) return base;
  if (type === 'flat') return Math.max(0, base - value);

  // percentage
  const pct = Math.min(100, Math.max(0, value));
  return Math.max(0, base - (base * pct) / 100);
}

// Matches backend logic:
// total = (price * months) -> apply offer% (month-wise) -> apply plan discountType/discountValue
function calculatePayableAmount(plan, months = 1) {
  const m = Number(months) || 1;
  const baseTotal = (Number(plan?.price) || 0) * m;
  const offerPercent = getOfferPercentForMonths(plan, m);
  const afterOffer = applyPercentDiscount(baseTotal, offerPercent);
  const finalTotal = applyPlanDiscount(afterOffer, plan);

  return {
    months: m,
    baseTotal,
    offerPercent,
    afterOffer,
    finalTotal,
    monthlyFinal: m > 0 ? finalTotal / m : finalTotal,
  };
}

function formatDiscount(plan) {
  if (!plan) return null;
  if (!plan.discountType || plan.discountType === 'none' || !plan.discountValue) return null;
  return plan.discountType === 'flat'
    ? `-${Number(plan.discountValue).toLocaleString()}`
    : `-${Number(plan.discountValue)}%`;
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function MySubscription() {
  const { user, organization, subscription, refreshOrgData } = useAuth();
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState({ records: [], totalPurchases: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [autoPay, setAutoPay] = useState(false);
  const [togglingAutoPay, setTogglingAutoPay] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, plan: null });
  const [selectedMonths, setSelectedMonths] = useState(1);
  const razorpayDismissed = useRef(false);
  const plansSliderRef = useRef(null);
  const [, setActiveSlide] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, historyRes] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getMyHistory(),
      ]);
      setPlans(plansRes.data.data || []);
      setHistory(historyRes.data.data || { records: [], totalPurchases: 0, totalSpent: 0 });
    } catch {
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!confirmModal.plan) return;
    const plan = confirmModal.plan;
    if (plan.isPaymentGatewayAllocated && !USE_RAZORPAY) {
      toast.error('Online payments are currently unavailable.');
      return;
    }
    const usesRazorpay = USE_RAZORPAY && plan.isPaymentGatewayAllocated;
    const { finalTotal: payableAmount } = calculatePayableAmount(
      plan,
      selectedMonths,
    );
    setPurchasing(true);

    if (!usesRazorpay) {
      try {
        await subscriptionService.purchase(plan._id, selectedMonths, false);
        toast.success('Subscription activated!');
        setConfirmModal({ open: false, plan: null });
        setSelectedMonths(1);
        setAutoPay(false);
        await refreshOrgData();
        await loadData();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to activate subscription');
      } finally {
        setPurchasing(false);
      }
      return;
    }

    if (payableAmount === 0) {
      toast.error('This plan cannot be purchased because payment gateway is enabled but payable amount is zero.');
      setPurchasing(false);
      return;
    }

    // Paid plan — Razorpay checkout
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please try again.');
        setPurchasing(false);
        return;
      }

      // AutoPay enabled => create Razorpay Subscription and open checkout in subscription mode
      if (autoPay) {
        const subRes = await subscriptionService.createAutopaySubscription(
          plan._id,
          selectedMonths,
        );

        const { keyId, razorpaySubscriptionId } = subRes.data.data;
        razorpayDismissed.current = false;
        setConfirmModal({ open: false, plan: null });

        const options = {
          key: keyId,
          name: 'QR Order',
          description: `${plan.name} — Auto Pay (Monthly)`,
          subscription_id: razorpaySubscriptionId,
          handler: async () => {
            // On success, webhook will update org expiry/status. We refresh org data.
            toast.success('Auto Pay enabled successfully');
            await refreshOrgData();
            await loadData();
            setPurchasing(false);
            setSelectedMonths(1);
            setAutoPay(false);
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: { color: '#3c50e0' },
          modal: {
            ondismiss: () => {
              if (!razorpayDismissed.current) {
                razorpayDismissed.current = true;
                setPurchasing(false);
                toast.error('Payment cancelled');
              }
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      const orderRes = await subscriptionService.createOrder(plan._id, selectedMonths, autoPay);
      const { razorpayOrderId, amount, currency, keyId } = orderRes.data.data;

      razorpayDismissed.current = false;
      setConfirmModal({ open: false, plan: null });

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'QR Order',
        description: `${plan.name} — ${selectedMonths} month${selectedMonths !== 1 ? 's' : ''}`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          console.log("🚀 ~ handlePurchase ~ response:", response)
          try {
            await subscriptionService.verifyPayment({
              subscriptionId: plan._id,
              months: selectedMonths,
              autoPay: false,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            console.log("1=>>>>>>>>>>>>>>>>");

            toast.success('Payment successful! Subscription activated.');

            console.log("2=>>>>>>>>>>>>>>>>");
            await refreshOrgData();

            console.log("3=>>>>>>>>>>>>>>>>");
            await loadData();

            console.log("4=>>>>>>>>>>>>>>>>");
          } catch {
            toast.error('Payment verification failed. Please contact support.');
          } finally {
            setPurchasing(false);
            setSelectedMonths(1);
            setAutoPay(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#3c50e0' },
        modal: {
          ondismiss: () => {
            if (!razorpayDismissed.current) {
              razorpayDismissed.current = true;
              setPurchasing(false);
              toast.error('Payment cancelled');
            }
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setPurchasing(false);
    }
  };

  const handleDisableAutoPay = async () => {
    if (togglingAutoPay) return;
    setTogglingAutoPay(true);
    try {
      await subscriptionService.setMyAutoPay(false);
      toast.success('Auto Pay disabled');
      await refreshOrgData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable Auto Pay');
    } finally {
      setTogglingAutoPay(false);
    }
  };

  const currentPlanId = subscription?._id || organization?.subscriptionPlan?._id || organization?.subscriptionPlan;
  const expiryDate = organization?.subscriptionExpiry;
  const autoPayEnabled = Boolean(organization?.subscriptionAutoPayEnabled);
  const daysRemaining = getDaysRemaining(expiryDate);
  const daysBadge = getDaysBadge(daysRemaining);

  const activeHistory = history.records?.find((r) => r.status === 'active');
  const activeMonths = activeHistory?.months || 1;
  // trialDays is stored on the active subscription history record.
  // Some APIs might also project it onto `subscription`, so we fallback.
  const trialDays = Number(
    subscription?.trialDays ?? activeHistory?.trialDays ?? 0,
  );

  const scrollToSlide = (index) => {
    const container = plansSliderRef.current;
    if (!container) return;
    const clamped = Math.max(0, Math.min(index, plans.length - 1));
    const child = container.children?.[clamped];
    if (!child) return;
    child.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  // keep eslint happy (we may add slider navigation UI later)
  void scrollToSlide;

  useEffect(() => {
    const container = plansSliderRef.current;
    if (!container) return;

    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = null;
        const children = Array.from(container.children || []);
        if (!children.length) return;

        const left = container.getBoundingClientRect().left;
        let bestIdx = 0;
        let bestDist = Number.POSITIVE_INFINITY;
        children.forEach((el, idx) => {
          const dist = Math.abs(el.getBoundingClientRect().left - left);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = idx;
          }
        });
        setActiveSlide(bestIdx);
      });
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      container.removeEventListener('scroll', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [plans.length]);

  if (user?.role !== 'org_admin') return <Navigate to="/" />;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Subscription</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your subscription plan and view purchase history</p>
      </div>

      {/* Current Plan Status Banner */}
      {subscription && (
        <div
          className="rounded-xl border p-6"
          style={{ background: 'linear-gradient(to right, rgba(60,80,224,0.05), rgba(60,80,224,0.10))', borderColor: 'rgba(60,80,224,0.10)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <HiOutlineCreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {subscription.name || 'Current Plan'}
                </h2>
                {activeHistory && (
                  <p className="text-sm text-slate-500">
                    Duration: {activeMonths} month{activeMonths !== 1 ? 's' : ''}
                  </p>
                )}
                {trialDays > 0 && (
                  <p className="text-sm text-slate-500">
                    Bonus: +{trialDays} day{trialDays !== 1 ? 's' : ''} trial
                  </p>
                )}
                {expiryDate && (
                  <p className="text-sm text-slate-500">
                    Expires on {new Date(expiryDate).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {trialDays > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
                  <HiOutlineSparkles className="h-4 w-4" />
                  +{trialDays} day{trialDays !== 1 ? 's' : ''} trial
                </span>
              )}
              {expiryDate && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
                  style={{ backgroundColor: daysBadge.bg, color: daysBadge.fg }}
                >
                  <HiOutlineClock className="h-4 w-4" />
                  {daysBadge.text}
                </span>
              )}

              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
                style={
                  autoPayEnabled
                    ? { backgroundColor: '#dcfce7', color: '#15803d' }
                    : { backgroundColor: '#f1f5f9', color: '#475569' }
                }
                title={
                  autoPayEnabled
                    ? 'Auto Pay is enabled for your subscription'
                    : 'Auto Pay is disabled'
                }
              >
                <HiOutlineCreditCard className="h-4 w-4" />
                Auto Pay: {autoPayEnabled ? 'On' : 'Off'}
              </span>

              {autoPayEnabled && (
                <button
                  type="button"
                  onClick={handleDisableAutoPay}
                  disabled={togglingAutoPay}
                  className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 cursor-pointer"
                  title="Disable Auto Pay"
                >
                  {togglingAutoPay ? 'Disabling...' : 'Disable Auto Pay'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plan Cards Grid */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Available Plans</h2>
        </div>

        <div
          ref={plansSliderRef}
          className="flex gap-6 overflow-x-auto pb-2 pr-2 snap-x snap-mandatory"
          style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        >
          {plans.map((plan, idx) => {
            const style = getPlanStyle(plan.name, idx);
            const PlanIcon = PLAN_ICON_PRESETS[idx % PLAN_ICON_PRESETS.length];
            const isCurrent = String(currentPlanId) === String(plan._id);
            const usesRazorpay = USE_RAZORPAY && plan.isPaymentGatewayAllocated;
            const paymentUnavailable =
              plan.isPaymentGatewayAllocated && !USE_RAZORPAY;
            const { finalTotal: payableAmount } = calculatePayableAmount(plan, 1);
            const discountLabel = formatDiscount(plan);
            const discountValue = Number(plan?.discountValue) || 0;
            const maxOfferPercent = Number(plan?.maxOfferPercent) || 0;
            const perMonthPriceAfterOffer = Number(
              plan?.perMonthPriceAfterOffer ?? plan?.price,
            ) || 0;
            const useOfferMonthlyPrice = discountValue === 0;
            const displayPrice = useOfferMonthlyPrice
              ? perMonthPriceAfterOffer
              : payableAmount;
            const showMaxOfferBadge = useOfferMonthlyPrice && maxOfferPercent > 0;
            const showOfferPriceRow =
              showMaxOfferBadge && Number(plan?.price) > displayPrice;

            return (
              <div
                key={plan._id}
                className={`snap-start shrink-0 w-[320px] sm:w-[360px] md:w-[420px] relative overflow-hidden rounded-xl bg-card shadow-sm border transition-all hover:shadow-md ${isCurrent ? 'ring-2 ring-primary/20 border-primary/30' : 'border-stroke'
                  }`}
              >
                {/* Card Header */}
                <div className="relative text-white" style={{ background: style.background, padding: '2rem 1.5rem' }}>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                      <PlanIcon className="h-6 w-6" />
                    </div>
                    <div>
                      {style.badge && (
                        <span
                          className="inline-block rounded-full px-3 py-1 text-xs font-semibold mt-2"
                          style={{ background: '#fff', color: `${style.color}` }}
                        >
                          {style.badge}
                        </span>
                      )}
                      {isCurrent && (
                        <span
                          className="inline-block rounded-full px-3 py-1 text-xs font-semibold mt-2"
                          style={{ background: '#fff', backgroundImage: style.background, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                        >
                          Current Plan
                        </span>
                      )}
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-end gap-2 flex-wrap">
                      <span className="text-3xl font-bold">
                        {displayPrice === 0 ? 'Free' : `${displayPrice.toLocaleString()}`}
                      </span>
                      {displayPrice > 0 && (
                        <span className="text-sm text-white/80">
                          {useOfferMonthlyPrice ? ' / month' : ` / ${plan.duration} days`}
                        </span>
                      )}
                      {showMaxOfferBadge && (
                        <span className="text-xs font-semibold rounded-full bg-white/20 px-2 py-1">
                          {maxOfferPercent}% OFF
                        </span>
                      )}
                      {!showMaxOfferBadge && discountLabel && (
                        <span className="text-xs font-semibold rounded-full bg-white/20 px-2 py-1">
                          {discountLabel}
                        </span>
                      )}
                    </div>
                    {showOfferPriceRow && (
                      <div className="mt-1 text-xs text-white/80">
                        <span className="line-through">{Number(plan.price).toLocaleString()}</span>
                        <span className="ml-2">You save {Math.max(0, Number(plan.price) - displayPrice).toLocaleString()}</span>
                      </div>
                    )}
                    {!showMaxOfferBadge && discountLabel && payableAmount > 0 && (
                      <div className="mt-1 text-xs text-white/80">
                        <span className="line-through">{Number(plan.price).toLocaleString()}</span>
                        <span className="ml-2">You save {Math.max(0, Number(plan.price) - payableAmount).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body - Features */}
                <div className="px-6 py-5">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2.5 text-sm text-slate-600">
                      <HiOutlineOfficeBuilding className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className='ml-2'>{plan.maxRestaurants === 0 ? 'Unlimited' : plan.maxRestaurants} Outlets</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-slate-600">
                      <HiOutlineBookOpen className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className='ml-2'>{plan.maxMenuItems === 0 ? 'Unlimited' : plan.maxMenuItems} Menu Items</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-slate-600">
                      <HiOutlineTag className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className='ml-2'>{plan.maxCategories === 0 ? 'Unlimited' : plan.maxCategories} Categories</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-slate-600">
                      <HiOutlineQrcode className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className='ml-2'>{plan.maxTables === 0 ? 'Unlimited' : plan.maxTables} Tables</span>
                    </li>
                    {plan.customerDataAccess && (
                      <li className="flex items-center gap-2.5 text-sm text-slate-600">
                        <HiOutlineDatabase className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className='ml-2'>Customer Data ({plan.customerDataAccess})</span>
                      </li>
                    )}
                    {plan.features?.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <HiOutlineCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className='ml-2'>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Footer */}
                <div className="border-t border-stroke px-6 py-4">
                  {isCurrent ? (
                    <span className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-primary/30 px-4 py-2.5 text-sm font-semibold text-primary">
                      <HiOutlineCheck className="h-5 w-5" />
                      Current Plan
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        const offerMonths = Array.from(
                          new Set(
                            (Array.isArray(plan?.offers) ? plan.offers : [])
                              .map((o) => Number(o?.months))
                              .filter((m) => Number.isFinite(m) && m > 0),
                          ),
                        ).sort((a, b) => a - b);

                        const hasMaxOfferPercent =
                          (Number(plan?.maxOfferPercent) || 0) > 0;
                        let defaultMonths = offerMonths.length
                          ? offerMonths[0]
                          : 1;

                        if (hasMaxOfferPercent) {
                          const bestOffer = (Array.isArray(plan?.offers)
                            ? plan.offers
                            : []
                          )
                            .map((o) => ({
                              months: Number(o?.months),
                              offerPercent: Number(o?.offerPercent) || 0,
                            }))
                            .filter(
                              (o) =>
                                Number.isFinite(o.months) &&
                                o.months > 0 &&
                                Number.isFinite(o.offerPercent) &&
                                o.offerPercent > 0,
                            )
                            .sort(
                              (a, b) =>
                                b.offerPercent - a.offerPercent ||
                                a.months - b.months,
                            )[0];

                          if (bestOffer?.months) {
                            defaultMonths = bestOffer.months;
                          }
                        }

                        setSelectedMonths(defaultMonths);
                        setConfirmModal({ open: true, plan });
                      }}
                      disabled={paymentUnavailable}
                      className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      style={{ background: style.background }}
                    >
                      {paymentUnavailable ? null : (
                        <HiOutlineShoppingCart className="h-5 w-5" />
                      )}
                      {paymentUnavailable
                        ? 'Payments Unavailable'
                        : usesRazorpay
                          ? 'Buy Now'
                          : 'Activate Plan'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {plans.length === 0 && (
          <div className="rounded-xl border border-stroke bg-card p-8 text-center">
            <p className="text-slate-500">No subscription plans available at the moment.</p>
          </div>
        )}
      </div>

      {/* Purchase History Section */}
      <div className="rounded-xl border border-stroke bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stroke px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Purchase History</h2>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span className="text-sm text-slate-500">
              Total Purchases: <strong className="text-slate-700">{history.totalPurchases}</strong>
            </span>
            <span className="text-sm text-slate-500">
              Total Spent: <strong className="text-slate-700">&#8377;{(history.totalSpent || 0).toLocaleString()}</strong>
            </span>
          </div>
        </div>
        {history.records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke bg-slate-50">
                  <th className="px-6 py-3 text-left font-medium text-slate-500">#</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Plan</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Price</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Duration</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Purchased</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Expires</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Payment</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.records.map((record, index) => (
                  <tr key={record._id} className="border-b border-stroke last:border-0">
                    <td className="px-6 py-4 text-slate-600">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{record.planName}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {record.price === 0 ? 'Free' : `${record.price.toLocaleString()}`}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>
                          {record.months
                            ? `${record.months} month${record.months !== 1 ? 's' : ''}`
                            : `${record.duration} days`}
                        </span>
                        {Number(record?.trialDays) > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                            <HiOutlineSparkles className="h-3.5 w-3.5" />
                            +{Number(record.trialDays)}d trial
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(record.purchasedAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(record.expiresAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                        style={
                          record.paymentStatus === 'paid'
                            ? { backgroundColor: '#dcfce7', color: '#15803d' }
                            : record.paymentStatus === 'pending'
                              ? { backgroundColor: '#fef9c3', color: '#a16207' }
                              : { backgroundColor: '#f1f5f9', color: '#475569' }
                        }
                      >
                        {record.paymentStatus === 'paid' ? 'Paid' : record.paymentStatus === 'pending' ? 'Pending' : 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                        style={
                          record.status === 'active'
                            ? { backgroundColor: '#dcfce7', color: '#15803d' }
                            : record.status === 'expired'
                              ? { backgroundColor: '#f1f5f9', color: '#475569' }
                              : { backgroundColor: '#fee2e2', color: '#b91c1c' }
                        }
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <HiOutlineCalendar className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No purchase history yet.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.open}
        onClose={() =>
          !purchasing && (
            setConfirmModal({ open: false, plan: null }),
            setSelectedMonths(1),
            setAutoPay(false)
          )
        }
        title="Confirm Purchase"
      >
        {confirmModal.plan && (
          (() => {
            const offerMonths = Array.from(
              new Set(
                (Array.isArray(confirmModal.plan?.offers)
                  ? confirmModal.plan.offers
                  : [])
                  .map((o) => Number(o?.months))
                  .filter((m) => Number.isFinite(m) && m > 0),
              ),
            ).sort((a, b) => a - b);
            const hasMonthOffers = offerMonths.length > 0;
            const usesRazorpay =
              USE_RAZORPAY && confirmModal.plan.isPaymentGatewayAllocated;

            const breakdown = calculatePayableAmount(confirmModal.plan, selectedMonths);
            const payableAmount = breakdown.finalTotal;
            const discountLabel = formatDiscount(confirmModal.plan);
            const baseTotal = breakdown.baseTotal;
            const afterOffer = breakdown.afterOffer;
            const offerDiscount = Math.max(0, baseTotal - afterOffer);
            const planDiscount = Math.max(0, afterOffer - payableAmount);

            const monthlyFinal = breakdown.monthlyFinal;

            return (
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Plan</span>
                    <span className="text-sm font-semibold text-slate-800">{confirmModal.plan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Price</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {payableAmount === 0 ? (
                        'Free'
                      ) : (
                        <span>
                          {discountLabel && (
                            <span className="mr-2 text-slate-400 line-through">
                              {Number(baseTotal).toLocaleString()}
                            </span>
                          )}
                          {payableAmount.toLocaleString()}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-sm text-slate-500">Purchase Flow</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {usesRazorpay
                        ? 'Payment Gateway'
                        : 'Direct Activation'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-sm text-slate-500">Duration</span>
                    {hasMonthOffers ? (
                      <div className="flex items-center gap-2">
                        {offerMonths.map((m) => (
                          <button
                            key={m}
                            type="button"
                            disabled={purchasing}
                            onClick={() => setSelectedMonths(m)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 ${selectedMonths === m
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-stroke bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                          >
                            {m} {m === 1 ? 'month' : 'months'}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-slate-800">
                        {confirmModal.plan.duration} days
                      </span>
                    )}
                  </div>

                  {usesRazorpay && payableAmount > 0 && (
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-sm text-slate-500">Auto Pay</span>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoPay}
                          disabled={purchasing}
                          onChange={(e) => setAutoPay(e.target.checked)}
                          className="h-4 w-4 rounded border-stroke"
                        />
                        Enable auto renewal
                      </label>
                    </div>
                  )}
                  {hasMonthOffers && breakdown.offerPercent > 0 && payableAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Offer</span>
                      <span className="text-sm font-semibold text-green-600">
                        -{breakdown.offerPercent}% (save {offerDiscount.toLocaleString()})
                      </span>
                    </div>
                  )}
                  {discountLabel && payableAmount > 0 && planDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Plan Discount</span>
                      <span className="text-sm font-semibold text-green-600">
                        {discountLabel} (save {planDiscount.toLocaleString()})
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Monthly Price</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {payableAmount === 0 ? 'Free' : `${monthlyFinal.toLocaleString()}`}
                    </span>
                  </div>
                </div>
                {currentPlanId && (
                  <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
                    Note: This will replace your current active subscription plan.
                  </p>
                )}
                {usesRazorpay && payableAmount > 0 && (
                  <p className="text-sm text-blue-600 bg-blue-50 rounded-lg p-3">
                    You will be redirected to Razorpay to complete the payment securely.
                  </p>
                )}
                {!usesRazorpay && (
                  <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3">
                    This plan will be activated directly without payment gateway checkout.
                  </p>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setConfirmModal({ open: false, plan: null })}
                    disabled={purchasing}
                    className="flex-1 rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
                  >
                    {purchasing
                      ? 'Processing...'
                        : usesRazorpay
                        ? 'Proceed to Pay'
                        : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })()
        )}
      </Modal>
    </div>
  );
}
