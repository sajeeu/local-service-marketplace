'use client';

import { useState, useEffect, useRef, useId } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { AutocompleteDropdown } from './autocomplete-dropdown';
import type { AutocompleteSuggestionDto } from '@local-service-marketplace/shared-types';

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
}

export function SearchBar({
  defaultValue = '',
  placeholder = 'Search services...',
}: SearchBarProps) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestionDto[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await apiClient.autocomplete(query, 5);
        setSuggestions(response.suggestions);
        setShowDropdown(true);
        setActiveIndex(-1);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSuggestionSelect = (suggestion: AutocompleteSuggestionDto) => {
    if (suggestion.type === 'category' && suggestion.slug) {
      router.push(`/category/${suggestion.slug}`);
    } else if (suggestion.type === 'service') {
      router.push(`/service/${suggestion.id}`);
    } else if (suggestion.type === 'provider') {
      router.push(`/provider/${suggestion.id}`);
    } else {
      setQuery(suggestion.label);
      router.push(`/search?q=${encodeURIComponent(suggestion.label)}`);
    }
    setShowDropdown(false);
    setActiveIndex(-1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      handleSuggestionSelect(suggestions[activeIndex]);
      return;
    }
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) {
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  const activeDescendant = activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex gap-2" role="search">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-9"
            role="combobox"
            aria-expanded={showDropdown && suggestions.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeDescendant}
            autoComplete="off"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>
      {showDropdown ? (
        <AutocompleteDropdown
          listId={listId}
          suggestions={suggestions}
          activeIndex={activeIndex}
          onSelect={handleSuggestionSelect}
        />
      ) : null}
    </div>
  );
}
