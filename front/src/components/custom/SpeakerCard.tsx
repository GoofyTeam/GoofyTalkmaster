import { Phone } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter } from "../ui/card";

interface ProfileCardProps {
  name: string;
  phoneNumber: string;
  description: string;
  onCancel?: () => void;
  onPromote?: () => void;
}

const SpeakerCard = ({
  name,
  phoneNumber,
  description,
  onCancel = () => {},
  onPromote = () => {},
}: ProfileCardProps) => {
  return (
    <Card className="w-full overflow-hidden ">
      <CardContent className="px-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="flex-shrink-0">
            <h3 className="text-lg font-semibold">{name}</h3>
            <div className="mt-1 flex items-center text-sm text-muted-foreground">
              <Phone className="mr-1 h-3 w-3" />
              {phoneNumber}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 p-4 pt-0">
        <Button variant="outline" onClick={onCancel}>
          Refuser
        </Button>
        <Button onClick={onPromote}>Promouvoir</Button>
      </CardFooter>
    </Card>
  );
};

export default SpeakerCard;
