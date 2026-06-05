export const GAME_MODES = {
  START_MENU: "START_MENU",
  OPTIONS: "OPTIONS",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER: "GAME_OVER",
};

export function isFrontendMode(mode) {
  return mode === GAME_MODES.START_MENU || mode === GAME_MODES.OPTIONS;
}
