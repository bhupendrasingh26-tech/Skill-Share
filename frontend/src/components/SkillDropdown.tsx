import React, { useState, useRef, useEffect } from 'react';

interface SkillDropdownProps {
  skills: string[];
  value: string;
  onChange: (skill: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const SkillDropdown: React.FC<SkillDropdownProps> = ({
  skills,
  value,
  onChange,
  placeholder = 'Select a skill...',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter skills based on search term
  const filteredSkills = skills.filter(skill =>
    skill.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (skill: string) => {
    onChange(skill);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-zinc-700 dark:border-zinc-600 dark:text-white dark:placeholder-zinc-400 dark:focus:ring-indigo-400 transition-all disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
          autoComplete="off"
        />
        <svg
          className={`absolute right-3 top-3 w-5 h-5 text-zinc-500 dark:text-zinc-400 pointer-events-none transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filteredSkills.length > 0 ? (
            <ul className="py-2">
              {filteredSkills.map((skill, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => handleSelect(skill)}
                    className={`w-full text-left px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors ${
                      value === skill
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{skill}</span>
                      {value === skill && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {searchTerm ? 'No skills found' : 'No skills available'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
