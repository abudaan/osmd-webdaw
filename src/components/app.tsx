import React from "react";
import { Controls } from "./controls";
import { Score } from "./score";
import { List } from "./List";
// import { Transport } from "./transport";

type Props = {};
export const App: React.FC<Props> = () => {
  console.log("[App] render");
  return (
    <>
      <Controls />
      <Score />
      <List />
      {/* <Sequencer /> */}
      {/* <Transport /> */}
    </>
  );
};
