import MemoryGame from "@/components/game/MemoryGame";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export default function NotFoundPage() {
  const [clickCount, setClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [animateTitle, setAnimateTitle] = useState(false);
  const [showGame, setShowGame] = useState(false);

  const handleInteraction = () => {
    setClickCount((prev) => prev + 1);
    setAnimateTitle(true);
  };

  useEffect(() => {
    if (animateTitle) {
      const timer = setTimeout(() => {
        setAnimateTitle(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [animateTitle]);

  useEffect(() => {
    if (clickCount >= 5 && !showEasterEgg) {
      setShowEasterEgg(true);
    }
  }, [clickCount, showEasterEgg]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] pb-16 px-4 md:px-6 pt-6 mx-auto max-w-5xl">
      <div className="w-full flex flex-col items-center mb-auto">
        <button
          type="button"
          className={`text-7xl md:text-9xl font-bold transition-all duration-300 cursor-pointer select-none bg-transparent border-none text-primary
            ${animateTitle ? "scale-110 rotate-3" : ""}`}
          onClick={handleInteraction}
          aria-label="Cliquez plusieurs fois pour découvrir un easter egg"
        >
          {showEasterEgg ? (
            <span className="inline-flex items-center">
              <span className="mr-2">🎉</span>
              <span
                className="text-gradient bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
                style={{
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                Trouvé !
              </span>
              <span className="ml-2">🎉</span>
            </span>
          ) : (
            "404"
          )}
        </button>
        <div
          className={`w-16 h-1 my-6 transition-colors ${showEasterEgg ? "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" : "bg-primary"}`}
        />

        {showEasterEgg ? (
          <div className="w-full max-w-md my-4 flex flex-col items-center">
            {!showGame ? (
              <>
                <h2 className="text-3xl text-center font-medium mb-4">
                  Easter Egg Découvert !
                </h2>
                <p className="text-muted-foreground mb-6 text-center">
                  Vous avez trouvé l'easter egg secret de GoofyTalkmaster !
                  Envie de jouer à un petit jeu ?
                </p>
                <Button
                  onClick={() => setShowGame(true)}
                  className="flex items-center gap-2"
                >
                  <span>🧠</span> Jouer au Jeu de Mémoire
                </Button>
              </>
            ) : (
              <div className="w-full overflow-hidden">
                <MemoryGame onBack={() => setShowGame(false)} />
              </div>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-medium mb-4">Page introuvable</h2>
            <p className="text-muted-foreground max-w-md mb-8 text-center">
              Désolé, la page que vous recherchez semble avoir disparu ou
              n'existe pas.
            </p>
          </>
        )}
      </div>

      <div className="mt-8 mb-4 w-full flex justify-center">
        <Button asChild variant="outline">
          <Link to="/app">Retourner à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
}
