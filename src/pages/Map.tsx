import { Link } from "react-router-dom";
import WorldMap from "@/components/WorldMap";
import { ArrowLeft } from "lucide-react";

const Map = () => {
  return (
    <div className="min-h-screen pt-16 pb-8 px-4">
      <div className="max-w-[960px] mx-auto">
        <Link
          to="/powers"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Powers
        </Link>
        <h1 className="text-2xl font-serif font-bold text-foreground mb-6 text-center">
          The World Map
        </h1>
        <WorldMap />
        <p className="text-center text-xs text-muted-foreground mt-4">
          Click any location to explore
        </p>
      </div>
    </div>
  );
};

export default Map;
