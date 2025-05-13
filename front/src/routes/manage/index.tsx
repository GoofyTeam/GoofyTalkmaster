import IndexManage from "@/pages/manage/Index";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/manage/")({
  component: IndexManage,
});
