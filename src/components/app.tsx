import React from 'react';
import { Controls } from './controls';
import { Score } from './score';
import { Transport } from './transport';
import { Sequencer } from './sequencer';

type Props = {};
export const App: React.FC<Props> = () => {
  console.log('[App] render');
  return <>
    <Controls />
    <Score />
    <Sequencer />
    <Transport />
  </>
}