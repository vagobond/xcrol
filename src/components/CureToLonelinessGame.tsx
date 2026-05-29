import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Sparkles, MapPin, Plane, ExternalLink, RefreshCw } from "lucide-react";
import {
  boredActivities,
  homeResources,
  homeSuggestions,
  awayResources,
  awaySuggestions,
} from "./loneliness/loneliness-data";

type GameState = "menu" | "bored" | "lonely-choice" | "lonely-home" | "lonely-away";

type Resource = { name: string; url: string; description: string };

const ResourceList = ({ resources }: { resources: Resource[] }) => (
  <div className="grid gap-3">
    {resources.map((resource) => (
      <a
        key={resource.name}
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors"
      >
        <div>
          <p className="font-medium text-foreground">{resource.name}</p>
          <p className="text-sm text-muted-foreground">{resource.description}</p>
        </div>
        <ExternalLink className="h-4 w-4 text-primary" />
      </a>
    ))}
  </div>
);

const SuggestionList = ({ suggestions }: { suggestions: string[] }) => (
  <ul className="space-y-2">
    {suggestions.map((suggestion, index) => (
      <li key={index} className="flex items-start gap-2 text-muted-foreground">
        <span className="text-primary mt-1">•</span>
        <span>{suggestion}</span>
      </li>
    ))}
  </ul>
);

export default function CureToLonelinessGame() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [currentActivity, setCurrentActivity] = useState<string>("");

  const getRandomActivity = () => {
    const randomIndex = Math.floor(Math.random() * boredActivities.length);
    setCurrentActivity(boredActivities[randomIndex]);
    setGameState("bored");
  };

  const resetGame = () => {
    setGameState("menu");
    setCurrentActivity("");
  };

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-primary/30">
      <CardHeader>
        <CardTitle className="text-2xl text-primary flex items-center gap-2">
          <Heart className="h-6 w-6" />
          The Cure to Loneliness and Boredom
        </CardTitle>
        <CardDescription>
          Find connection or adventure - the choice is yours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameState === "menu" && (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="mystical" size="lg" className="flex-1" onClick={() => setGameState("lonely-choice")}>
              <Heart className="mr-2 h-5 w-5" />
              I am Lonely
            </Button>
            <Button variant="mystical" size="lg" className="flex-1" onClick={getRandomActivity}>
              <Sparkles className="mr-2 h-5 w-5" />
              I am Bored
            </Button>
          </div>
        )}

        {gameState === "bored" && (
          <div className="space-y-4">
            <div className="p-6 bg-primary/10 rounded-lg border border-primary/30">
              <Badge variant="secondary" className="mb-3">Your Quest</Badge>
              <p className="text-lg text-foreground font-medium">{currentActivity}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetGame}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button variant="mystical" onClick={getRandomActivity}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Another One
              </Button>
            </div>
          </div>
        )}

        {gameState === "lonely-choice" && (
          <div className="space-y-4">
            <p className="text-muted-foreground">Where are you right now?</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="mystical" size="lg" className="flex-1" onClick={() => setGameState("lonely-home")}>
                <MapPin className="mr-2 h-5 w-5" />
                I'm in the place I live
              </Button>
              <Button variant="mystical" size="lg" className="flex-1" onClick={() => setGameState("lonely-away")}>
                <Plane className="mr-2 h-5 w-5" />
                I'm away from home
              </Button>
            </div>
            <Button variant="outline" onClick={resetGame}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        )}

        {gameState === "lonely-home" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Find Your People Locally</h3>
              <ResourceList resources={homeResources} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">More Ideas</h3>
              <SuggestionList suggestions={homeSuggestions} />
            </div>
            <Button variant="outline" onClick={resetGame}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        )}

        {gameState === "lonely-away" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Connect While Traveling</h3>
              <ResourceList resources={awayResources} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">More Ideas</h3>
              <SuggestionList suggestions={awaySuggestions} />
            </div>
            <Button variant="outline" onClick={resetGame}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
