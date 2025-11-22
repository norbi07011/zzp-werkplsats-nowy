# 🔍 Funkcja Wyszukiwania Użytkowników

## Przegląd

Funkcja pozwala wyszukiwać zarejestrowanych użytkowników (pracodawców i księgowych) po nazwie firmy lub numerze KVK, a następnie wyświetlać tylko ich posty w feed'zie.

## Lokalizacja Plików

- **Service**: `src/services/searchService.ts`
- **UI Component**: `pages/FeedPage_PREMIUM.tsx`

## Jak to działa?

### 1. Wyszukiwanie (Backend)

```typescript
// searchService.ts
export interface SearchResult {
  id: string;
  profile_id: string;
  type: "employer" | "accountant" | "worker";
  name: string;
  company_name?: string;
  kvk_number?: string;
  avatar_url?: string;
  post_count: number;
}

export async function searchUsers(searchQuery: string): Promise<SearchResult[]>;
```

**Funkcjonalność:**

- Przeszukuje tabele `employers` i `accountants` w Supabase
- Używa SQL `ILIKE` dla pattern matching (case-insensitive)
- Wyszukuje w polach: `company_name` i `kvk_number`
- Zlicza posty użytkownika (`post_count`)
- Sortuje wyniki po liczbie postów (najbardziej aktywni na górze)
- Limit: 10 wyników na zapytanie

### 2. UI Implementation (Frontend)

**Komponenty:**

1. **Search Input** - premium search bar z animowanym gradient border
2. **Search Results Dropdown** - lista znalezionych firm z avatarem, nazwą, KVK i liczbą postów
3. **Selected User Banner** - wyświetla się nad postami gdy użytkownik jest wybrany
4. **Clear Filter Button** - usuwa filtr i pokazuje wszystkie posty

**Stan React:**

```typescript
const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
const [showSearchResults, setShowSearchResults] = useState(false);
const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

### 3. Debouncing

Wyszukiwanie jest opóźnione o 500ms (debounce), aby nie wysyłać zapytań przy każdej literze:

```typescript
const handleSearchInput = (value: string) => {
  setSearchQuery(value);

  if (searchTimeoutRef.current) {
    clearTimeout(searchTimeoutRef.current);
  }

  if (!value.trim()) {
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedUser(null);
    return;
  }

  searchTimeoutRef.current = setTimeout(async () => {
    const results = await searchUsers(value);
    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  }, 500);
};
```

### 4. Filtrowanie Postów

Po wybraniu użytkownika, posty są filtrowane po `author_id`:

```typescript
const filteredPosts = posts.filter((post) => {
  // Filter by category
  if (activeCategory !== "all" && post.type !== activeCategory) {
    return false;
  }

  // Filter by selected user
  if (selectedUser && post.author_id !== selectedUser.id) {
    return false;
  }

  return true;
});
```

## Przepływ Użytkownika

1. **User wpisuje w search bar**: `"ABC Transport"` lub `"12345678"`
2. **Po 500ms debounce**: wysyłane jest zapytanie do `searchUsers()`
3. **Dropdown pokazuje wyniki**: lista firm z awatarem, nazwą, KVK, liczbą postów
4. **User klika na firmę**:
   - `selectedUser` jest ustawiony
   - `showSearchResults` = false (dropdown znika)
   - Posty są filtrowane
5. **Banner wyświetla wybraną firmę**: nad postami
6. **User klika "Wyczyść filtr"**: wszystko resetowane, pokazuje wszystkie posty

## Przykłady Wyszukiwania

### Wyszukiwanie po nazwie firmy:

```
Input: "transport"
Wyniki:
  - ABC Transport BV (KVK: 12345678) - 5 posts
  - XYZ Transport (KVK: 87654321) - 3 posts
```

### Wyszukiwanie po KVK:

```
Input: "12345"
Wyniki:
  - ABC Transport BV (KVK: 12345678) - 5 posts
```

## Technologie

- **React Hooks**: useState, useEffect, useRef
- **Supabase**: PostgreSQL queries z ILIKE
- **TypeScript**: Strict typing dla Search Results
- **Debouncing**: setTimeout dla optymalizacji
- **Tailwind CSS**: Premium styling z gradient borders

## Przyszłe Rozszerzenia

- [ ] Wyszukiwanie po imieniu/nazwisku contact person
- [ ] Wyszukiwanie workers (ZZP'erów)
- [ ] Historia ostatnich wyszukiwań
- [ ] Autocomplete suggestions
- [ ] Keyboard navigation (↑↓ Enter)
- [ ] Search highlights (podświetlanie matched text)
- [ ] Filtrowanie po typie użytkownika (employer/accountant)
