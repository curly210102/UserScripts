// ==UserScript==
// @name         Juejin Activies Enhancer
// @name:zh-CN   掘金活动辅助工具
// @namespace    https://github.com/curly210102/UserScripts
// @version      0.1.1
// @description  Enhances Juejin activies
// @author       curly brackets
// @match        https://juejin.cn/*
// @license      MIT License
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// @supportURL   https://github.com/curly210102/UserScripts/issues
// @updateURL    https://github.com/curly210102/UserScripts/raw/main/Juejin_Enhancer/Juejin_activities.user.js
// @downloadURL  https://github.com/curly210102/UserScripts/raw/main/Juejin_Enhancer/Juejin_activities.user.js
// ==/UserScript==

(function () {
  // Activity: 9.23 - 9.30 "Break the circle"
  const startTimeStamp = 1632355200000;
  const endTimeStamp = 1632441600000;
  const blockTopics = [
    "树洞一下",
    "掘金相亲",
    "反馈建议",
    "沸点福利",
    "掘金官方",
    "上班摸鱼",
  ];

  const userProfileEl = document.querySelector(
    ".user-dropdown-list > .nav-menu-item-group:nth-child(2) > .nav-menu-item > a[href]"
  );
  const userId = userProfileEl?.getAttribute("href").replace(/\/user\//, "");

  if (!userId) {
    return;
  }

  if (/^\/pins(?:\/|$)/.test(document.location.pathname)) {
    doUpdate(document);
  }

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
            doUpdate(node);
          }
        });
      }
    });

    observer.observe(componentBoxEl, {
      childList: true,
    });
  }

  function doUpdate(containerEl) {
    requestShortMsgTopic().then((topicMsgCount) => {
      const topicTitle2Count = Object.fromEntries(
        Object.values(topicMsgCount).map(({ count, title }) => [title, count])
      );
      renderTopicStatus(topicTitle2Count, containerEl);
    });
  }

  function renderTopicStatus(topicTitle2Count, containerEl) {
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
              renderWholeContent(itemEl, topicTitle2Count);
            } else {
              renderItem(itemEl, topicTitle2Count);
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
      itemEl
        .querySelector("[data-tampermonkey='juejin-activies-enhancer']")
        ?.remove();
      const title = itemEl.querySelector(".content_main > .title")?.textContent;

      const isBlockedTopic = blockTopics.includes(title);
      const count = topicTitle2Count[title];
      const iconEl = document.createElement("div");
      iconEl.dataset.tampermonkey = "juejin-activies-enhancer";
      if (count) {
        iconEl.style = `width: 18px;
            height: 18px;
            overflow: hidden;
            border-radius: 50%;
            background-color: ${isBlockedTopic ? "#939aa3" : "#0fbf60"};
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
  }

  function requestShortMsgTopic(cursor = "0", topicMsgCount = {}) {
    console.log("enter");
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: "https://api.juejin.cn/content_api/v1/short_msg/query_list",
        data: JSON.stringify({
          sort_type: 4,
          cursor: cursor,
          limit: 24,
          user_id: userId,
        }),
        headers: {
          "User-agent": window.navigator.userAgent,
          "content-type": "application/json",
        },
        onload: function ({ status, response }) {
          try {
            if (status === 200) {
              const responseData = JSON.parse(response);
              const { data, cursor, has_more } = responseData;
              let lastAuditTime = Infinity;
              for (const msg of data) {
                const { topic, msg_Info } = msg;
                const topicId = topic.topic_id;
                //   const createTime = msg_Info.ctime;
                const auditTime = msg_Info.mtime * 1000;
                if (auditTime > startTimeStamp && auditTime < endTimeStamp) {
                  if (topicId in topicMsgCount) {
                    topicMsgCount[topicId]["count"]++;
                  } else {
                    topicMsgCount[topicId] = {
                      count: 1,
                      title: topic.title,
                    };
                  }
                }
                lastAuditTime = auditTime;
                if (auditTime < startTimeStamp) {
                  break;
                }
              }

              if (lastAuditTime < startTimeStamp && has_more) {
                resolve(requestShortMsgTopic(cursor, topicMsgCount));
              } else {
                resolve(topicMsgCount);
              }
            }
          } catch (err) {
            console.log(err);
            reject(err);
          }
        },
      });
    });
  }
})();
