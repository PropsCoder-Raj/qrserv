import { useState, useRef, useEffect } from 'react';
import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

export default function SearchSelect({ options, value, onChange, placeholder = 'Search...', required = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Hidden input for form required validation */}
      {required && (
        <input
          tabIndex={-1}
          value={value || ''}
          onChange={() => {}}
          required
          className="absolute left-0 top-0 h-0 w-0 opacity-0"
        />
      )}

      {/* Trigger button */}
      <div
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 0); }}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-stroke px-3 py-2.5 text-sm outline-none focus-within:border-primary"
      >
        <span className={selected ? 'text-slate-800' : 'text-slate-400'}>
          {selected ? selected.label : placeholder}
        </span>
        {value ? (
          <button type="button" onClick={handleClear} className="text-slate-400 hover:text-slate-600">
            <HiOutlineX size={16} />
          </button>
        ) : (
          <HiOutlineSearch size={16} className="text-slate-400" />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-stroke bg-white shadow-lg">
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-stroke px-3 py-2">
            <HiOutlineSearch size={16} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="w-full text-sm outline-none"
            />
          </div>

          {/* Options list */}
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">No results found</li>
            ) : (
              filtered.map((o) => (
                <li
                  key={o.value}
                  onClick={() => handleSelect(o.value)}
                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 ${o.value === value ? 'bg-blue-50 font-medium text-primary' : 'text-slate-700'}`}
                >
                  {o.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
