import { Easeljs } from './easeljs';
import { AppState, } from './redux/reducers/app_reducer';
import { SongState } from './redux/reducers/song_reducer';
import { AvatarState } from './redux/reducers/avatar_reducer';
import { MenuState } from './redux/reducers/menu_reducer';
import { PartMenuState } from './redux/reducers/partmenu_reducer';


export type AppStateAll = {
  app: AppState
  menu: MenuState
  partmenu: PartMenuState
  song: SongState
  avatar: AvatarState
};

export namespace Groovy {

  export type SpriteAnimation = {
    container: Easeljs.Container
    numFrames: number
    spriteSheet: Easeljs.SpriteSheet
    instrument: string
  }

  export type SpriteAnimationController = {
    configure: (frame: number) => void
    activate: (frame: number) => void
    inactivate: (frame: number) => void
    inactivateAll: () => void
    getSpriteAnimation: () => Groovy.SpriteAnimation
    id: string
    scale: number
    container: Easeljs.Container
    numNotes: number
    trackName: string
  }

  // export interface ISpriteAnimationController {
  //   new(s: Groovy.SpriteAnimation): SpriteAnimationController;
  // }

  export interface ButtonController {
    setOrigPosition: (x: number, y: number) => void
    container: Easeljs.Container
    animController: Groovy.SpriteAnimationController
    parent: Easeljs.Container | null
    threshold: { x: number, y: number }
  }

  export interface PartController {
    getContainer: () => Easeljs.Container
    setPosition: (x: number, y: number) => void
    setScale: (scale: number) => void
    getId: () => string
    getSpriteController: () => SpriteAnimationController
  }

  export type SpriteSheetDataTmp = {
    imageUrls: string[],
    images: HTMLImageElement[]
    frames: number[][]
    framesPassive: number[][]
    framesActive: number[][]
    framerate: number
    color: number
    instrument: string
    frameWidth: number,
    frameHeight: number,
    type: string,
  }

  export type SpriteSheetData = {
    images: HTMLImageElement[]
    framesPassive: number[][]
    framesActive: number[][]
    frameWidth: number,
    frameHeight: number,
  }

  export type ResizeData = {
    width: number
    height: number
    scale: number
    barWidth: number
    startBar: number
    barsPerPage: number
    pageOffsetX: number
    keyeditorMarginLeft: number
    keyeditorMarginRight: number
    partsOnStage: Groovy.PartController[]
    partIconScale: number
  }

  export type NewPart = {
    trackName: string
    numNotes: number
    scale: number
    pointer: Point
    thumb: Point
    touchEventIdentifier: number
  }

  enum Action {
    'start',
    'stop',
    'move'
  }
  export type SelectedPart = {
    id: string
    x: number
    y: number
    action: string
  }

  export type Point = {
    x: number
    y: number
  }

  export type Instrument = {
    translationId: string
    revamount: number
    srcname: string
    release: number
    group: string
  }
}