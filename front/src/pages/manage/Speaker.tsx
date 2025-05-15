import AskNewTalk from "@/components/custom/ask-for-talk";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import UserPlanning from "@/components/user-planning";

function Speaker() {
  return (
    <div className="mx-6 my-4 gap-y-4 flex flex-col">
      <div className="flex gap-x-4">
        <AskNewTalk />
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Proposer un nouveau talk</CardTitle>
            <CardDescription>
              Proposez une nouvelle idée de talk.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>cds</p>
          </CardContent>
        </Card>
      </div>
      <UserPlanning />
    </div>
  );
}

export default Speaker;
