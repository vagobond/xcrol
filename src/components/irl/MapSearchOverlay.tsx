import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface MapSearchOverlayProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  searchResults: any[];
  showSearchResults: boolean;
  setShowSearchResults: (val: boolean) => void;
  isSearching: boolean;
  onSelectResult: (result: any) => void;
}

export const MapSearchOverlay = ({
  searchQuery,
  onSearch,
  searchResults,
  showSearchResults,
  setShowSearchResults,
  isSearching,
  onSelectResult,
}: MapSearchOverlayProps) => {
  return (
    <div className="absolute top-4 right-4 z-10 w-72">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
          onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
          className="pl-9 bg-card/95 backdrop-blur border-primary/20"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showSearchResults && searchResults.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-card border border-primary/20 rounded-lg shadow-lg overflow-hidden z-50">
          {searchResults.map((result, index) => (
            <button
              key={result.id || index}
              onClick={() => onSelectResult(result)}
              className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-b-0"
            >
              <p className="font-medium text-sm truncate">{result.text}</p>
              <p className="text-xs text-muted-foreground truncate">{result.place_name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
