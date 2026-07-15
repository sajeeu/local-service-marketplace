'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestionDto[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
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
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await apiClient.autocomplete(query, 5);
        setSuggestions(response.suggestions);
        setShowDropdown(true);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
    }
  };

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
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="submit">Search</Button>
      </form>
      {showDropdown && (
        <AutocompleteDropdown suggestions={suggestions} onSelect={handleSuggestionSelect} />
      )}
    </div>
  );
}
