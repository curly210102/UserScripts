import { renderPinPage, renderProfilePage } from "./renderStats";
import { renderTopicSelectMenu } from "./renderMenuSelect";
import { fetchStates, setUserId, getUserId } from "./states";
let currentRouterPathname = "";

export default function () {
  const userProfileEl = document.querySelector(
    ".user-dropdown-list > .nav-menu-item-group:nth-child(2) > .nav-menu-item > a[href]"
  );
  const userId = userProfileEl?.getAttribute("href").replace(/\/user\//, "");

  if (!userId) {
    return;
  }

  setUserId(userId);
  initRouter();
  initPopupMutation();
}

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
  const pagePinsRegexp = /^\/pins(?:\/|$)/;
  const pageProfileRegexp = new RegExp(`^\\/user\\/${getUserId()}(?:\\/|$)`);
  if (
    pagePinsRegexp.test(currentRouterPathname) &&
    !pagePinsRegexp.test(prevRouterPathname)
  ) {
    fetchStates().then(() => {
      renderTopicSelectMenu(document);
      renderPinPage();
    });
  } else if (
    pageProfileRegexp.test(currentRouterPathname) &&
    !pageProfileRegexp.test(prevRouterPathname)
  ) {
    fetchStates().then(() => {
      setTimeout(() => {
        renderProfilePage();
      }, 1000);
    });
  }
}

function initPopupMutation() {
  const componentBoxEl = document.querySelector(".global-component-box");
  if (componentBoxEl) {
    const observer = new MutationObserver(function (mutations) {
      const mutation = mutations.find((mutation) => {
        const { type, addedNodes } = mutation;
        if (
          type === "childList" &&
          Array.prototype.find.call(addedNodes, (node) =>
            node.classList?.contains("pin-modal")
          )
        ) {
          return true;
        } else {
          return false;
        }
      });

      if (mutation) {
        mutation.addedNodes.forEach((node) => {
          if (node.classList?.contains("pin-modal")) {
            fetchStates().then(() => {
              renderTopicSelectMenu(node);
            });
          }
        });
      }
    });

    observer.observe(componentBoxEl, {
      childList: true,
    });
  }
}
