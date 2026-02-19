import { TOWN_CATEGORIES } from "./townCategories";

interface TownHomepageProps {
  onSelectCategory: (catKey: string) => void;
  onSelectSubcategory: (catKey: string, subKey: string) => void;
  onPostClick: () => void;
  onMyListingsClick: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearch: () => void;
}

const TownHomepage = ({
  onSelectCategory,
  onSelectSubcategory,
  onPostClick,
  onMyListingsClick,
  searchQuery,
  onSearchChange,
  onSearch,
}: TownHomepageProps) => {
  // Split categories into columns like classic Craigslist
  const leftCats = TOWN_CATEGORIES.slice(0, 3);
  const centerCats = TOWN_CATEGORIES.slice(3, 6);
  const rightCats = TOWN_CATEGORIES.slice(6);

  const renderColumn = (cats: typeof TOWN_CATEGORIES) => (
    <div className="space-y-6">
      {cats.map((cat) => (
        <div key={cat.key}>
          <h3
            className="font-bold text-primary cursor-pointer hover:underline text-sm uppercase tracking-wider mb-1"
            onClick={() => onSelectCategory(cat.key)}
          >
            {cat.label}
          </h3>
          <ul className="space-y-0">
            {cat.subcategories.map((sub) => (
              <li key={sub.key}>
                <button
                  onClick={() => onSelectSubcategory(cat.key, sub.key)}
                  className="text-sm text-foreground/80 hover:text-primary hover:underline transition-colors text-left"
                >
                  {sub.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="flex gap-2 items-center border border-border rounded p-2 bg-card/50">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder="search xcrol town"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={onSearch}
          className="text-sm text-primary hover:underline font-medium"
        >
          search
        </button>
      </div>

      {/* Action links */}
      <div className="flex gap-4 text-sm">
        <button
          onClick={onPostClick}
          className="text-primary hover:underline font-medium"
        >
          post to classifieds
        </button>
        <button
          onClick={onMyListingsClick}
          className="text-primary hover:underline font-medium"
        >
          my listings
        </button>
      </div>

      {/* Category grid - classic 3-column Craigslist layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 border-t border-border pt-4">
        {renderColumn(leftCats)}
        {renderColumn(centerCats)}
        {renderColumn(rightCats)}
      </div>
    </div>
  );
};

export default TownHomepage;
