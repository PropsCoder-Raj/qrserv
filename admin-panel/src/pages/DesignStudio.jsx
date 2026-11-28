import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineColorSwatch,
  HiOutlineDesktopComputer,
  HiOutlineDeviceMobile,
  HiOutlineLockClosed,
  HiOutlineRefresh,
  HiOutlineSparkles,
  HiOutlineTemplate,
  HiOutlineViewGrid,
  HiOutlineViewList,
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import restaurantService from '../services/restaurantService';
import designService from '../services/designService';
import SearchSelect from '../components/SearchSelect';
import StorefrontThemeRenderer from '../components/design/StorefrontThemeRenderer';
import {
  BORDER_RADIUS_OPTIONS,
  BUTTON_STYLE_OPTIONS,
  COLOR_FIELDS,
  COLOR_PRESETS,
  DEFAULT_CLASSIC_CONFIG,
  FONT_OPTIONS,
  THEME_CATALOG,
  isValidHexColor,
  mergeClassicConfig,
  normalizeHexInput,
} from '../utils/designTheme';

function AccordionSection({ title, icon: Icon, isOpen, onToggle, children }) {
  return (
    <div className="border-b border-stroke last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-slate-50"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          {Icon && <Icon size={17} className="text-primary" />}
          {title}
        </span>
        <HiOutlineChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && <div className="space-y-4 px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-stroke bg-slate-50/70 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        {description && (
          <p className="text-[11px] text-slate-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4.5' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}

export default function DesignStudio() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [restaurants, setRestaurants] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingDesign, setLoadingDesign] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [viewport, setViewport] = useState('mobile');
  const [activeTheme, setActiveTheme] = useState('classic');
  const [classicConfig, setClassicConfig] = useState(() =>
    mergeClassicConfig(DEFAULT_CLASSIC_CONFIG),
  );
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [hexDrafts, setHexDrafts] = useState(DEFAULT_CLASSIC_CONFIG.colors);

  const [openSections, setOpenSections] = useState({
    themes: true,
    colors: true,
    typography: false,
    layout: false,
  });

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r._id === selectedId) || null,
    [restaurants, selectedId],
  );

  const currentSnapshot = useMemo(
    () => JSON.stringify({ activeTheme, classicConfig }),
    [activeTheme, classicConfig],
  );
  const hasUnsavedChanges = Boolean(
    savedSnapshot && currentSnapshot !== savedSnapshot,
  );

  const applyLoadedDesign = useCallback((designData) => {
    const theme = designData?.activeTheme || 'classic';
    const merged = mergeClassicConfig(designData?.classicConfig);
    setActiveTheme(theme);
    setClassicConfig(merged);
    setHexDrafts({ ...merged.colors });
    setSavedSnapshot(JSON.stringify({ activeTheme: theme, classicConfig: merged }));
  }, []);

  const loadRestaurants = useCallback(async () => {
    setLoadingRestaurants(true);
    try {
      const res =
        user?.role === 'super_admin'
          ? await restaurantService.getAll({ limit: 100 })
          : await restaurantService.getMy({ limit: 100 });
      const list = res.data?.data?.data || res.data?.data || [];
      const safeList = Array.isArray(list) ? list : [];
      setRestaurants(safeList);

      if (safeList.length > 0) {
        const initial =
          safeList.find((r) => r._id === user?.restaurantId) || safeList[0];
        setSelectedId(initial._id);
      }
    } catch {
      toast.error('Failed to load restaurants');
    } finally {
      setLoadingRestaurants(false);
    }
  }, [user]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    const fetchDesign = async () => {
      setLoadingDesign(true);
      try {
        const res = await designService.getByRestaurant(selectedId);
        if (active) {
          applyLoadedDesign(res.data?.data);
        }
      } catch {
        if (active) {
          applyLoadedDesign(null);
          toast.error('Failed to load storefront design; using defaults');
        }
      } finally {
        if (active) setLoadingDesign(false);
      }
    };
    fetchDesign();
    return () => {
      active = false;
    };
  }, [selectedId, applyLoadedDesign]);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateColor = (colorKey, rawValue) => {
    setHexDrafts((prev) => ({ ...prev, [colorKey]: rawValue }));
    if (isValidHexColor(rawValue)) {
      const normalized = normalizeHexInput(
        rawValue,
        DEFAULT_CLASSIC_CONFIG.colors[colorKey],
      );
      setClassicConfig((prev) => ({
        ...prev,
        colors: { ...prev.colors, [colorKey]: normalized },
      }));
    }
  };

  const handleHexBlur = (colorKey) => {
    const currentDraft = hexDrafts[colorKey];
    if (!isValidHexColor(currentDraft)) {
      setHexDrafts((prev) => ({
        ...prev,
        [colorKey]: classicConfig.colors[colorKey],
      }));
      toast.error('Enter a valid hex color like #E11D48');
      return;
    }
    const normalized = normalizeHexInput(
      currentDraft,
      classicConfig.colors[colorKey],
    );
    setHexDrafts((prev) => ({ ...prev, [colorKey]: normalized }));
  };

  const applyPreset = (preset) => {
    setClassicConfig((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        primary: preset.primary,
        secondary: preset.secondary,
      },
    }));
    setHexDrafts((prev) => ({
      ...prev,
      primary: preset.primary,
      secondary: preset.secondary,
    }));
  };

  const updateTypography = (fontFamily) => {
    setClassicConfig((prev) => ({
      ...prev,
      typography: { ...prev.typography, fontFamily },
    }));
  };

  const updateShape = (field, value) => {
    setClassicConfig((prev) => ({
      ...prev,
      shape: { ...prev.shape, [field]: value },
    }));
  };

  const updateLayout = (field, value) => {
    setClassicConfig((prev) => ({
      ...prev,
      layout: { ...prev.layout, [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!selectedId) {
      toast.error('Select a restaurant first');
      return;
    }
    const invalidColor = Object.entries(hexDrafts).find(
      ([, v]) => !isValidHexColor(v),
    );
    if (invalidColor) {
      toast.error(`Invalid hex value for ${invalidColor[0]}`);
      return;
    }

    setSaving(true);
    try {
      const res = await designService.save(selectedId, {
        activeTheme,
        classicConfig,
      });
      applyLoadedDesign(res.data?.data);
      toast.success('Design saved & published to customer menu');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedId) return;
    setResetting(true);
    try {
      const res = await designService.reset(selectedId);
      applyLoadedDesign(res.data?.data);
      toast.success('Reset to Classic defaults');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reset design');
    } finally {
      setResetting(false);
    }
  };

  if (loadingRestaurants) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="-m-4 sm:-m-6 flex h-[calc(100vh-4rem)] flex-col bg-slate-100">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stroke bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/settings/restaurant-profile')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stroke text-slate-600 transition hover:bg-slate-50"
            title="Back to Settings"
          >
            <HiOutlineArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 sm:text-lg">
                Design Studio
              </h1>
              {hasUnsavedChanges ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  Unsaved changes
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  Published
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Customize your customer QR storefront in real time
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {restaurants.length > 1 && (
            <div className="w-52">
              <SearchSelect
                options={restaurants.map((r) => ({
                  value: r._id,
                  label: r.name,
                }))}
                value={selectedId}
                onChange={(val) => val && setSelectedId(val)}
                placeholder="Select restaurant..."
              />
            </div>
          )}

          {/* Viewport Switcher */}
          <div className="inline-flex rounded-lg border border-stroke bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                viewport === 'mobile'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <HiOutlineDeviceMobile size={15} />
              Mobile
            </button>
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                viewport === 'desktop'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <HiOutlineDesktopComputer size={15} />
              Desktop
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={resetting || saving || !selectedId}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stroke bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <HiOutlineRefresh
              size={15}
              className={resetting ? 'animate-spin' : ''}
            />
            Reset to Default
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || resetting || !selectedId}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:opacity-95 disabled:opacity-60"
          >
            <HiOutlineCheck size={15} />
            {saving ? 'Publishing...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {/* Split-Screen Studio Body */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left Controls Panel (~380px) */}
        <aside className="w-full shrink-0 overflow-y-auto border-b border-stroke bg-white lg:w-[380px] lg:border-b-0 lg:border-r">
          {loadingDesign ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            </div>
          ) : (
            <div>
              {/* 1. Theme Selector */}
              <AccordionSection
                title="Theme Selector"
                icon={HiOutlineTemplate}
                isOpen={openSections.themes}
                onToggle={() => toggleSection('themes')}
              >
                <div className="space-y-2.5">
                  {THEME_CATALOG.map((theme) => {
                    const isSelected = activeTheme === theme.id && !theme.locked;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        disabled={theme.locked}
                        onClick={() => !theme.locked && setActiveTheme(theme.id)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          theme.locked
                            ? 'cursor-not-allowed border-stroke bg-slate-50 opacity-65'
                            : isSelected
                              ? 'border-primary bg-emerald-50/40 ring-1 ring-primary/30'
                              : 'border-stroke bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-800">
                            {theme.name}
                          </span>
                          {theme.locked ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              <HiOutlineLockClosed size={11} />
                              {theme.badge}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                              <HiOutlineCheck size={11} />
                              Active
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {theme.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </AccordionSection>

              {/* 2. Brand & Colors */}
              <AccordionSection
                title="Brand & Colors"
                icon={HiOutlineColorSwatch}
                isOpen={openSections.colors}
                onToggle={() => toggleSection('colors')}
              >
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Quick Brand Presets
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-stroke bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-slate-300"
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: preset.primary }}
                        />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {COLOR_FIELDS.map(({ key, label }) => {
                    const currentHex = classicConfig.colors[key];
                    const draft = hexDrafts[key] ?? currentHex;
                    const valid = isValidHexColor(draft);
                    return (
                      <div key={key} className="space-y-1">
                        <label className="block text-xs font-medium text-slate-700">
                          {label}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={currentHex}
                            onChange={(e) => updateColor(key, e.target.value)}
                            className="h-9 w-11 cursor-pointer rounded-lg border border-stroke bg-white p-0.5"
                          />
                          <input
                            type="text"
                            value={draft}
                            onChange={(e) => updateColor(key, e.target.value)}
                            onBlur={() => handleHexBlur(key)}
                            placeholder="#E11D48"
                            className={`w-full rounded-lg border px-3 py-2 font-mono text-xs uppercase outline-none ${
                              valid
                                ? 'border-stroke focus:border-primary'
                                : 'border-red-400 bg-red-50'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionSection>

              {/* 3. Typography & Shape */}
              <AccordionSection
                title="Typography & Shape"
                icon={HiOutlineSparkles}
                isOpen={openSections.typography}
                onToggle={() => toggleSection('typography')}
              >
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Font Family
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FONT_OPTIONS.map((font) => {
                      const active =
                        classicConfig.typography.fontFamily === font.value;
                      return (
                        <button
                          key={font.value}
                          type="button"
                          onClick={() => updateTypography(font.value)}
                          style={{ fontFamily: `"${font.value}", sans-serif` }}
                          className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                            active
                              ? 'border-primary bg-emerald-50/40 font-semibold text-primary'
                              : 'border-stroke bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {font.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Card Border Radius
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {BORDER_RADIUS_OPTIONS.map((opt) => {
                      const active =
                        classicConfig.shape.borderRadius === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateShape('borderRadius', opt.value)}
                          className={`rounded-lg border px-2.5 py-2 text-center transition ${
                            active
                              ? 'border-primary bg-emerald-50/40 text-primary'
                              : 'border-stroke bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xs font-semibold">{opt.label}</div>
                          <div className="text-[10px] text-slate-400">
                            {opt.subtitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Button Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {BUTTON_STYLE_OPTIONS.map((opt) => {
                      const active =
                        classicConfig.shape.buttonStyle === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateShape('buttonStyle', opt.value)}
                          className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                            active
                              ? 'border-primary bg-emerald-50/40 text-primary'
                              : 'border-stroke bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </AccordionSection>

              {/* 4. Header & Layout Options */}
              <AccordionSection
                title="Header & Layout (Classic)"
                icon={HiOutlineViewGrid}
                isOpen={openSections.layout}
                onToggle={() => toggleSection('layout')}
              >
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Menu Item Card Layout
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        value: 'list',
                        label: 'List View',
                        icon: HiOutlineViewList,
                      },
                      {
                        value: 'grid',
                        label: '2-Column Grid',
                        icon: HiOutlineViewGrid,
                      },
                    ].map((opt) => {
                      const active =
                        classicConfig.layout.itemViewMode === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateLayout('itemViewMode', opt.value)}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                            active
                              ? 'border-primary bg-emerald-50/40 text-primary'
                              : 'border-stroke bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <opt.icon size={15} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <ToggleRow
                    label="Show Restaurant Banner"
                    description="Hero gradient header with table & order type"
                    checked={classicConfig.layout.showBanner}
                    onChange={(val) => updateLayout('showBanner', val)}
                  />
                  <ToggleRow
                    label="Show Logo & Tagline"
                    description="Brand mark and subtitle in storefront header"
                    checked={classicConfig.layout.showLogo}
                    onChange={(val) => updateLayout('showLogo', val)}
                  />
                  <ToggleRow
                    label="Show Dietary Badges"
                    description="Veg & Non-Veg indicators on menu cards"
                    checked={classicConfig.layout.showDietaryBadges}
                    onChange={(val) => updateLayout('showDietaryBadges', val)}
                  />
                  <ToggleRow
                    label="Show Item Descriptions"
                    description="Dish descriptions below item titles"
                    checked={classicConfig.layout.showDescriptions}
                    onChange={(val) => updateLayout('showDescriptions', val)}
                  />
                </div>
              </AccordionSection>
            </div>
          )}
        </aside>

        {/* Right Live Interactive Preview Canvas */}
        <main
          className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto p-4 sm:p-8"
          style={{
            backgroundImage:
              'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        >
          {viewport === 'mobile' ? (
            <div className="flex flex-col items-center">
              <div className="w-[375px] overflow-hidden rounded-[40px] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
                {/* Phone Speaker Notch */}
                <div className="flex items-center justify-center bg-slate-900 py-2">
                  <div className="h-1.5 w-16 rounded-full bg-slate-700" />
                </div>
                <div className="h-[660px] overflow-y-auto bg-white">
                  <StorefrontThemeRenderer
                    activeTheme={activeTheme}
                    classicConfig={classicConfig}
                    restaurant={selectedRestaurant}
                    viewport="mobile"
                  />
                </div>
                <div className="flex items-center justify-center bg-slate-900 py-2">
                  <div className="h-1 w-24 rounded-full bg-slate-700" />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">
                Interactive Mobile Preview (375px)
              </p>
            </div>
          ) : (
            <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl">
              {/* Browser Frame Top */}
              <div className="flex items-center gap-3 border-b border-stroke bg-slate-100 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 rounded-md border border-stroke bg-white px-3 py-1 text-center text-[11px] text-slate-500">
                  customer.qrserv.in/restaurant/{selectedId || 'preview'}
                </div>
              </div>
              <div className="max-h-[700px] overflow-y-auto">
                <StorefrontThemeRenderer
                  activeTheme={activeTheme}
                  classicConfig={classicConfig}
                  restaurant={selectedRestaurant}
                  viewport="desktop"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
