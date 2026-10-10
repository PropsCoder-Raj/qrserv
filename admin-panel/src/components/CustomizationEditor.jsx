import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { SPICE_LEVEL_PRESETS, ADD_ON_PRESETS } from '../utils/customizationPresets';

const emptyOption = () => ({ name: '', emoji: '', priceDelta: 0 });

function OptionGroupEditor({ title, hint, options, presets, onChange, showPrice }) {
  const updateOption = (idx, patch) => {
    const next = options.map((opt, i) => (i === idx ? { ...opt, ...patch } : opt));
    onChange(next);
  };

  const removeOption = (idx) => {
    onChange(options.filter((_, i) => i !== idx));
  };

  const addOption = (preset) => {
    onChange([...options, preset ? { ...preset, priceDelta: 0 } : emptyOption()]);
  };

  const isPresetAdded = (preset) =>
    options.some((opt) => opt.name.trim().toLowerCase() === preset.name.toLowerCase());

  return (
    <div className="rounded-lg border border-stroke p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">{title}</p>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
        <button
          type="button"
          onClick={() => addOption()}
          className="inline-flex items-center gap-1 rounded-lg border border-stroke px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <HiOutlinePlus size={14} /> Custom
        </button>
      </div>

      {presets?.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              type="button"
              key={preset.name}
              disabled={isPresetAdded(preset)}
              onClick={() => addOption(preset)}
              className="inline-flex items-center gap-1 rounded-full border border-stroke bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>{preset.emoji}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      )}

      {options.length === 0 ? (
        <p className="text-xs text-slate-400">No options added yet.</p>
      ) : (
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                value={opt.emoji}
                onChange={(e) => updateOption(idx, { emoji: e.target.value })}
                placeholder="😀"
                className="w-14 rounded-lg border border-stroke px-2 py-1.5 text-center text-sm outline-none focus:border-primary"
              />
              <input
                value={opt.name}
                onChange={(e) => updateOption(idx, { name: e.target.value })}
                placeholder="Option name"
                className="flex-1 rounded-lg border border-stroke px-3 py-1.5 text-sm outline-none focus:border-primary"
              />
              {showPrice && (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={opt.priceDelta ?? 0}
                  onChange={(e) => updateOption(idx, { priceDelta: Number(e.target.value) })}
                  placeholder="+Price"
                  className="w-24 rounded-lg border border-stroke px-2 py-1.5 text-sm outline-none focus:border-primary"
                />
              )}
              <button
                type="button"
                onClick={() => removeOption(idx)}
                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <HiOutlineTrash size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustomizationEditor({ value, onChange }) {
  const customization = {
    spiceLevels: value?.spiceLevels || [],
    addOns: value?.addOns || [],
    allowSpecialInstructions: value?.allowSpecialInstructions !== false,
  };

  const update = (patch) => onChange({ ...customization, ...patch });

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">Customization & Add-ons</p>
      <OptionGroupEditor
        title="Spice Levels"
        hint="Customer selects one spice level (e.g. Mild, Medium, Hot)"
        options={customization.spiceLevels}
        presets={SPICE_LEVEL_PRESETS}
        onChange={(spiceLevels) => update({ spiceLevels })}
        showPrice={false}
      />
      <OptionGroupEditor
        title="Add-ons"
        hint="Customer can select multiple add-ons (e.g. Extra Cheese, Extra Butter)"
        options={customization.addOns}
        presets={ADD_ON_PRESETS}
        onChange={(addOns) => update({ addOns })}
        showPrice
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={customization.allowSpecialInstructions}
          onChange={(e) => update({ allowSpecialInstructions: e.target.checked })}
          className="h-4 w-4 rounded border-stroke text-primary"
        />
        <span className="font-medium text-slate-700">Allow customer special instructions</span>
      </label>
    </div>
  );
}
