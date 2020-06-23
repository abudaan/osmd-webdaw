import React from "react";
import { Controls } from "./controls";
import { Score } from "./score";
import { List } from "./List";

type Props = {};
export const App: React.FC<Props> = () => {
  console.log("[App] render");
  return (
    <>
      <Controls />
      <Score />
      {/* <List /> */}
    </>
  );
};
