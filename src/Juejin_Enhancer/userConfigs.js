import { scriptId } from "./static.json";
const defaultConfigs = {
  __debug_enable__: true,
  __is_dev_mode__: false,
};

// const configs = GM_getValue(scriptId, defaultConfigs);

const configs = defaultConfigs;

// GM_registerMenuCommand("切换调试模式", () => {
//   configs.__debug_enable__ = !configs.__debug_enable__;
//   GM_setValue(scriptId, configs);
// });

export const isDebugEnable = () => {
  return configs.__debug_enable__;
};

export const isDevMode = () => {
  return isDebugEnable() && configs.__is_dev_mode__;
};
