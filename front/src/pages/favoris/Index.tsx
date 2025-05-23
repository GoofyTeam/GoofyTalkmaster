import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";

function FavorisPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Mes Favoris</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vos conférences favorites</CardTitle>
            <CardDescription>
              Retrouvez ici toutes les conférences que vous avez ajoutées à vos
              favoris
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Affichage si aucun favori */}
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore ajouté de conférences à vos favoris.
              </p>
              <Button onClick={() => navigate({ to: "/app" })}>
                Découvrir les conférences
              </Button>
            </div>

            {/* Liste des favoris (à implémenter) */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FavorisPage;
