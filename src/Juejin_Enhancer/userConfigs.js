const defaultConfigs = {
  __debug_enable__: false,
  __is_dev_mode__: false,
};

const configs = defaultConfigs;

export const isDebugEnable = () => {
  return configs.__debug_enable__;
};

export const isDevMode = () => {
  return isDebugEnable() && configs.__is_dev_mode__;
};
