'use client';

import type { AutocompleteSuggestionDto } from '@local-service-marketplace/shared-types';

interface AutocompleteDropdownProps {
  suggestions: AutocompleteSuggestionDto[];
  onSelect: (suggestion: AutocompleteSuggestionDto) => void;
}

export function AutocompleteDropdown({ suggestions, onSelect }: AutocompleteDropdownProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
      <div className="py-1">
        {suggestions.map((suggestion) => (
          <button
            key={`${suggestion.type}-${suggestion.id}`}
            onClick={() => onSelect(suggestion)}
            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <span className="text-xs text-muted-foreground capitalize">{suggestion.type}</span>
            <div className="flex-1">
              <div className="font-medium">{suggestion.label}</div>
              {suggestion.subtitle && (
                <div className="text-xs text-muted-foreground">{suggestion.subtitle}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
