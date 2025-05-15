import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";

// Types pour le jeu de mémoire
type CardType = {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
};

type MemoryGameProps = {
  onBack: () => void;
};

const EMOJIS = ["🚀", "🎮", "🎯", "🎨", "🎭", "🎪", "🎡", "🎢"];

export default function MemoryGame({ onBack }: MemoryGameProps) {
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Initialiser le jeu
  const initGame = useCallback(() => {
    // Créer un tableau avec des paires d'emojis
    const duplicatedEmojis = [...EMOJIS, ...EMOJIS];

    // Mélanger les emojis
    const shuffledEmojis = duplicatedEmojis
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        flipped: false,
        matched: false,
      }));

    setCards(shuffledEmojis);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setGameOver(false);
    setGameStarted(true);
  }, []);

  // Gérer le clic sur une carte
  const handleCardClick = (id: number) => {
    // Ignorer si déjà 2 cartes sont retournées ou si la carte est déjà retournée ou déjà matchée
    if (flippedCards.length === 2 || cards[id].flipped || cards[id].matched) {
      return;
    }

    // Retourner la carte
    const newCards = [...cards];
    newCards[id].flipped = true;
    setCards(newCards);

    // Ajouter à la liste des cartes retournées
    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);

    // Si 2 cartes sont retournées, vérifier si elles correspondent
    if (newFlippedCards.length === 2) {
      setMoves((prev) => prev + 1);

      const [firstId, secondId] = newFlippedCards;

      if (cards[firstId].emoji === cards[secondId].emoji) {
        // Les cartes correspondent
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[firstId].matched = true;
          matchedCards[secondId].matched = true;
          setCards(matchedCards);
          setFlippedCards([]);
          setMatchedPairs((prev) => prev + 1);
        }, 500);
      } else {
        // Les cartes ne correspondent pas
        setTimeout(() => {
          const unmatchedCards = [...cards];
          unmatchedCards[firstId].flipped = false;
          unmatchedCards[secondId].flipped = false;
          setCards(unmatchedCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // Vérifier si le jeu est terminé
  useEffect(() => {
    if (matchedPairs === EMOJIS.length && gameStarted) {
      setGameOver(true);
    }
  }, [matchedPairs, gameStarted]);

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-xl md:text-2xl font-medium mb-2">Jeu de Mémoire</h2>

      {!gameStarted ? (
        <div className="text-center mb-4">
          <p className="mb-4">
            Retrouvez les paires d'emoji en retournant les cartes!
          </p>
          <Button onClick={initGame}>Commencer</Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between w-full max-w-xs mb-4">
            <p className="font-medium text-sm md:text-base">
              Paires: {matchedPairs}/{EMOJIS.length}
            </p>
            <p className="font-medium text-sm md:text-base">Coups: {moves}</p>
          </div>

          <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-4 w-full max-w-[320px] mx-auto">
            {cards.map((card) => (
              <button
                type="button"
                key={card.id}
                className={`w-full aspect-square flex items-center justify-center text-xl md:text-2xl rounded-md transition-all transform hover:scale-105 ${
                  card.flipped || card.matched
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-200 hover:bg-gray-300"
                } ${card.matched ? "opacity-70" : ""}`}
                onClick={() => handleCardClick(card.id)}
                disabled={card.matched}
                aria-label={
                  card.flipped || card.matched
                    ? `Emoji ${card.emoji}`
                    : "Carte non révélée"
                }
              >
                {card.flipped || card.matched ? card.emoji : "?"}
              </button>
            ))}
          </div>

          {gameOver && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-center w-full max-w-xs">
              <p className="font-bold">Félicitations!</p>
              <p>Vous avez trouvé toutes les paires en {moves} coups!</p>
              <Button onClick={initGame} className="mt-2">
                Rejouer
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs justify-center mt-2">
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full sm:w-auto"
            >
              Retour
            </Button>
            <Button onClick={initGame} className="w-full sm:w-auto">
              Recommencer
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
