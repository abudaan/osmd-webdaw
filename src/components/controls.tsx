import React, { SyntheticEvent } from 'react';
import Slider, { Range } from 'rc-slider';
import { useDispatch } from 'react-redux';

type Props = {};
export const Controls: React.FC<Props> = ({ }: Props) => {

  return <>
    <div>
      <Slider />
      <Range />
    </div>
    <input type="button" value="play" />
    <input type="button" value="stop" />
  </>
}