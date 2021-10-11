import BreakTheCycle from "./ActivityBreakTheCycle";
import OctoberPost from "./ActivityOctoberPost";
import { setUserId } from "./globalStates";
import { getUserIdFromPathName } from "./utils";

const activities = [BreakTheCycle, OctoberPost].filter(
  ({ isOffShelf }) => !isOffShelf
);

let currentRouterPathname = "";

function updateUserId() {
  const userProfileEl = document.querySelector(
    ".user-dropdown-list > .nav-menu-item-group:nth-child(2) > .nav-menu-item > a[href]"
  );
  const userId = getUserIdFromPathName(userProfileEl?.getAttribute("href"));

  if (!userId) {
    return;
  }

  setUserId(userId);
}

(function start() {
  updateUserId();
  initRouter();
  activities.forEach(({ onLoaded }) => onLoaded?.());
})();

function initRouter() {
  const _historyPushState = history.pushState;
  const _historyReplaceState = history.replaceState;
  history.pushState = function () {
    _historyPushState.apply(history, arguments);
    onRouteChange();
  };
  history.replaceState = function () {
    _historyReplaceState.apply(history, arguments);
    onRouteChange();
  };
  window.addEventListener("popstate", function () {
    onRouteChange();
  });
}

function onRouteChange() {
  const prevRouterPathname = currentRouterPathname;
  currentRouterPathname = document.location.pathname;

  if (prevRouterPathname !== currentRouterPathname) {
    activities.forEach(({ onRouteChange }) => {
      onRouteChange?.(prevRouterPathname, currentRouterPathname);
    });
  }
}
