import React from 'react';
import { Controls } from './controls';

type Props = {};
export const App: React.FC<Props> = () => {
  console.log('render');
  return <>
    <Controls />
  </>
}