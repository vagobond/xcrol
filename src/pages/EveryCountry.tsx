import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EveryCountryGame } from "@/components/EveryCountryGame";
import { ArrowLeft } from "lucide-react";

const EveryCountry = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 space-y-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/irl-layer")}
          className="mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </Button>

        <EveryCountryGame />
      </div>
    </div>
  );
};

export default EveryCountry;
