import AskNewTalk from "@/components/custom/ask-for-talk";
import TalksList from "@/components/custom/talks-list";

import UserPlanning from "@/components/user-planning";

function Speaker() {
  return (
    <div className="mx-6 my-4 gap-y-4 flex flex-col">
      <div className="flex gap-x-4">
        <AskNewTalk />
        <TalksList />
      </div>
      <UserPlanning />
    </div>
  );
}

export default Speaker;
