'use client';

import type { AutocompleteSuggestionDto } from '@local-service-marketplace/shared-types';
import { cn } from '@/lib/utils';

interface AutocompleteDropdownProps {
  suggestions: AutocompleteSuggestionDto[];
  onSelect: (suggestion: AutocompleteSuggestionDto) => void;
  activeIndex: number;
  listId: string;
}

export function AutocompleteDropdown({
  suggestions,
  onSelect,
  activeIndex,
  listId,
}: AutocompleteDropdownProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <ul
      id={listId}
      role="listbox"
      className="absolute top-full z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-md"
    >
      {suggestions.map((suggestion, index) => {
        const optionId = `${listId}-option-${index}`;
        const active = index === activeIndex;
        return (
          <li key={`${suggestion.type}-${suggestion.id}`} role="presentation">
            <button
              type="button"
              id={optionId}
              role="option"
              aria-selected={active}
              onClick={() => onSelect(suggestion)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                active ? 'bg-muted text-foreground' : 'hover:bg-muted',
              )}
            >
              <span className="text-xs text-muted-foreground capitalize">{suggestion.type}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{suggestion.label}</div>
                {suggestion.subtitle ? (
                  <div className="truncate text-xs text-muted-foreground">
                    {suggestion.subtitle}
                  </div>
                ) : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
