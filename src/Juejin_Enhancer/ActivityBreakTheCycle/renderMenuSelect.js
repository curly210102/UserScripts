import { getTopicStates } from "./states";
import { scriptId, blockTopics, endTimeStamp } from "./static.json";

export function renderTopicSelectMenu(containerEl) {
  if (endTimeStamp < new Date().valueOf()) return;
  const topicPanel = containerEl.querySelector(
    ".topicwrapper .new_topic_picker"
  );
  if (!topicPanel) {
    return;
  }

  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(({ type, addedNodes }) => {
      if (type === "childList" && addedNodes.length) {
        addedNodes.forEach((itemEl) => {
          if (!itemEl) return;
          else if (itemEl?.classList?.contains("contents")) {
            renderWholeContent(itemEl);
          } else {
            renderItem(itemEl);
          }
        });
      }
    });
  });
  observer.observe(topicPanel, {
    childList: true,
    subtree: true,
  });

  renderWholeContent(topicPanel.querySelector(".wrapper .contents"));
}

function renderWholeContent(contentEl) {
  if (!contentEl) {
    return;
  }
  const allItemEls = contentEl.querySelectorAll(".item");
  allItemEls.forEach((itemEl) => {
    renderItem(itemEl);
  });
}

function renderItem(itemEl) {
  const { efficientTopics } = getTopicStates();
  if (
    !itemEl ||
    !(
      itemEl.nodeType === 1 &&
      itemEl.nodeName === "DIV" &&
      itemEl.classList.contains("item")
    ) ||
    (!itemEl.parentElement?.classList.contains("contents") &&
      !itemEl.parentElement?.classList.contains("searchlist"))
  )
    return;
  itemEl.querySelector(`[data-tampermonkey='${scriptId}']`)?.remove();
  const title = itemEl.querySelector(".content_main > .title")?.textContent;

  const isBlockedTopic = blockTopics.includes(title);
  const count = efficientTopics[title]?.count;
  const verified = efficientTopics[title]?.verified;
  const iconEl = document.createElement("div");
  iconEl.dataset.tampermonkey = scriptId;
  if (count) {
    iconEl.style = `width: 18px;
            height: 18px;
            overflow: hidden;
            border-radius: 50%;
            background-color: ${!verified ? "#939aa3" : "#0fbf60"};
            color: #fff;
            font-size: 12px;
            text-align: center;
            line-height: 18px;
            font-weight: bold;
            font-family: monospace;
            margin-left: auto;
            margin-right: 15px;`;
    iconEl.innerText = count;
  } else {
    iconEl.style = `margin-left: auto;margin-right: 15px;color: #c2c6cc`;
    if (isBlockedTopic) {
      iconEl.innerHTML = `<svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.46457 14.1213C8.07404 14.5118 8.07404 15.145 8.46457 15.5355C8.85509 15.926 9.48825 15.926 9.87878 15.5355L15.5356 9.87862C15.9262 9.4881 15.9262 8.85493 15.5356 8.46441C15.1451 8.07388 14.5119 8.07388 14.1214 8.46441L8.46457 14.1213Z"
                  fill="currentColor"
                />
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12ZM12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z"
                  fill="currentColor"
                />
              </svg>`;
    } else {
      iconEl.innerHTML = `<svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.2426 16.3137L6 12.071L7.41421 10.6568L10.2426 13.4853L15.8995 7.8284L17.3137 9.24262L10.2426 16.3137Z"
                  fill="currentColor"
                />
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12ZM12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z"
                  fill="currentColor"
                />
              </svg>`;
    }
  }
  itemEl.appendChild(iconEl);
}
