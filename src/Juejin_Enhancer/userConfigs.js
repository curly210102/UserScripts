import { scriptId } from "./static.json";
const configs = GM_getValue(scriptId, {
  __debug_enable__: false,
});

GM_registerMenuCommand("切换调试模式", () => {
  configs.__debug_enable__ = !configs.__debug_enable__;
  GM_setValue(scriptId, configs);
});

export const isDebugEnable = () => {
  return configs.__debug_enable__;
};
