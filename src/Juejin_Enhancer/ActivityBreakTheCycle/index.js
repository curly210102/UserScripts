import { renderPinPage, renderProfilePage } from "./renderStats";
import { renderTopicSelectMenu } from "./renderMenuSelect";
import { fetchStates } from "./states";
import { inPinPage, inProfilePage } from "../utils";

function onRouteChange(prevRouterPathname, currentRouterPathname) {
  if (inPinPage(currentRouterPathname) && !inPinPage(prevRouterPathname)) {
    fetchStates().then(() => {
      renderTopicSelectMenu(document);
      renderPinPage();
    });
  } else if (
    inProfilePage(currentRouterPathname) &&
    !inProfilePage(prevRouterPathname)
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

export default {
  onRouteChange,
  onLoaded: initPopupMutation,
};
