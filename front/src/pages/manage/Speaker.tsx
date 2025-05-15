import AskNewTalk from "@/components/custom/ask-for-talk";
import TalksList from "@/components/custom/talks-list";

import UserPlanning from "@/components/user-planning";
import { useLoaderData } from "@tanstack/react-router";

function Speaker() {
  const { onlyAcceptedTalks } = useLoaderData({
    from: "/manage/speaker",
  });

  return (
    <div className="mx-6 my-4 gap-y-4 flex flex-col">
      <div className="flex gap-x-4">
        <AskNewTalk />
        <TalksList />
      </div>
      <UserPlanning talks={onlyAcceptedTalks} />
    </div>
  );
}

export default Speaker;
