import { useVirtualizer } from "@tanstack/react-virtual";

import { useLoaderData } from "@tanstack/react-router";
import { useRef } from "react";
import { TalkCard } from "../TalkCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

const TalksList = () => {
  const { talks } = useLoaderData({
    from: "/manage/speaker",
  });
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: talks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 250 + 20, // valeur par défaut basse
    measureElement: (el) => el.getBoundingClientRect().height + 20,
    overscan: 5,
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Vos propositions</CardTitle>
        <CardDescription>Voici la liste de vos propostion.</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={parentRef} style={{ overflow: "auto", height: "25vh" }}>
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const talk = talks[virtualRow.index];
              return (
                <div
                  key={talk.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    marginBottom: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  <TalkCard
                    talk={{
                      id: talk.id,
                      title: talk.title,
                      topic: talk.topic,
                      description: talk.description,
                      speaker: {
                        id: talk.speaker_id,
                        name: talk.speaker_name,
                      },
                      status: talk.status,
                      scheduledDate: talk.scheduledDate,
                    }}
                    showStatus
                    className="h-full mb-4"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TalksList;
