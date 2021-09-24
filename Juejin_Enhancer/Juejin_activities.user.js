// ==UserScript==
// @name         Juejin Activities Enhancer
// @name:zh-CN   掘金活动辅助工具
// @namespace    https://github.com/curly210102/UserScripts
// @version      0.1.4
// @description  Enhances Juejin activities
// @author       curly brackets
// @match        https://juejin.cn/*
// @license      MIT License
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// @supportURL   https://github.com/curly210102/UserScripts/issues
// @updateURL    https://github.com/curly210102/UserScripts/raw/main/Juejin_Enhancer/Juejin_activities.user.js
// @downloadURL  https://github.com/curly210102/UserScripts/raw/main/Juejin_Enhancer/Juejin_activities.user.js
// @connect      juejin.cn
// ==/UserScript==

// Activity: 9.23 - 9.30 "Break the circle"
(function () {
  const id = "juejin-activies-enhancer/break-the-circle";
  const startTimeStamp = 1632355200000;
  const endTimeStamp = 1633017600000;
  const blockTopics = [
    "树洞一下",
    "掘金相亲",
    "反馈建议",
    "沸点福利",
    "掘金官方",
    "上班摸鱼",
  ];

  function getStates() {
    return GM_getValue(`${id}/states`, {
      days: 0,
      topicStats: {},
    });
  }

  function setStates(value) {
    GM_setValue(`${id}/states`, value);
  }

  const userProfileEl = document.querySelector(
    ".user-dropdown-list > .nav-menu-item-group:nth-child(2) > .nav-menu-item > a[href]"
  );
  const userId = userProfileEl?.getAttribute("href").replace(/\/user\//, "");

  if (!userId) {
    return;
  }

  const _historyPushState = history.pushState;
  const _historyReplaceState = history.replaceState;
  history.pushState = function () {
    _historyPushState.apply(history, arguments);
    initByRouter();
  }
  history.replaceState = function () {
    _historyReplaceState.apply(history, arguments);
    initByRouter();
  }
  window.addEventListener("popstate", function () {
    initByRouter();
  })

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

  function initByRouter () {
    if (/^\/pins(?:\/|$)/.test(document.location.pathname)) {
      // initRewardProgress();
      doUpdate(document).then(() => {
        const containerEl = document.querySelector(".main .userbox");
        if (!containerEl) {
          return;
        }
        containerEl.querySelector(`[data-tampermonkey='${id}']`)?.remove();
        const wrapperEl = document.createElement("div");
        wrapperEl.dataset.tampermonkey = id;
        wrapperEl.appendChild(getRewardElement());
        wrapperEl.style = "padding-top:20px;"
        containerEl.appendChild(wrapperEl);
      });
    }
  
    if (
      new RegExp(`^\\/user\\/${userId}(?:\\/|$)`).test(document.location.pathname)
    ) {
      requestShortMsgTopic().then(() => {
        setTimeout(() => {
          const siblingEl = document.querySelector(".user-view .stat-block");
          if (!siblingEl) return;
          siblingEl.querySelector(`[data-tampermonkey='${id}']`)?.remove();
          const blockEl = document.createElement("div");
          blockEl.dataset.tampermonkey = id;
          blockEl.className = "block shadow";
          blockEl.style = `margin-bottom: 1rem;background-color: #fff;border-radius: 2px;`
          const titleEl = document.createElement("div");
          titleEl.style = `padding: 1.333rem;
          font-size: 1.333rem;
          font-weight: 600;
          color: #31445b;
          border-bottom: 1px solid rgba(230,230,231,.5);`;
          titleEl.textContent = "活动状态";
          blockEl.appendChild(titleEl);
          const contentEl = document.createElement("div");
          contentEl.style = `padding: 1.333rem;`
          contentEl.appendChild(getRewardElement());
          blockEl.appendChild(contentEl);
          siblingEl.after(blockEl);
        }, 1000);
      });
    }
  }

  function doUpdate(containerEl) {
    return requestShortMsgTopic().then(() => {
      renderTopicStatus(containerEl);
    });
  }

  function renderTopicStatus(containerEl) {
    const topicTitle2Count = getStates()["topicStats"];
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
      itemEl.querySelector(`[data-tampermonkey='${id}']`)?.remove();
      const title = itemEl.querySelector(".content_main > .title")?.textContent;

      const isBlockedTopic = blockTopics.includes(title);
      const count = topicTitle2Count[title]?.count;
      const efficient = topicTitle2Count[title]?.efficient;
      const isNoneEfficient = !efficient || isBlockedTopic;
      const iconEl = document.createElement("div");
      iconEl.dataset.tampermonkey = id;
      if (count) {
        iconEl.style = `width: 18px;
            height: 18px;
            overflow: hidden;
            border-radius: 50%;
            background-color: ${isNoneEfficient ? "#939aa3" : "#0fbf60"};
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

  function requestShortMsgTopic(cursor = "0", dailyTopics = []) {
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
                // const topicId = topic.topic_id;
                // const createTime = msg_Info.ctime;
                // 审核时间
                const auditTime = msg_Info.rtime * 1000;
                if (auditTime > startTimeStamp && auditTime < endTimeStamp) {
                  const day = Math.floor(
                    (auditTime - startTimeStamp) / 86400000
                  );
                  if (!dailyTopics[day]) {
                    dailyTopics[day] = [];
                  }
                  dailyTopics[day].push(topic.title);
                }
                lastAuditTime = auditTime;
                if (auditTime < startTimeStamp) {
                  break;
                }
              }

              if (lastAuditTime > startTimeStamp && has_more) {
                resolve(requestShortMsgTopic(cursor, dailyTopics));
              } else {
                const efficientTopics = new Set();
                const title2Count = {};
                let efficientDays = 0;
                dailyTopics.forEach((topics) => {
                  topics.map((title) => {
                    if (!title2Count[title]) {
                      title2Count[title] = 1;
                    } else {
                      title2Count[title]++;
                    }
                  });
                  const dailyEfficientTopics = topics.filter((title) => {
                    return !efficientTopics.has(title);
                  });
                  if (dailyEfficientTopics.length >= 3) {
                    dailyEfficientTopics.forEach((title) => {
                      efficientTopics.add(title);
                    });
                    efficientDays++;
                  }
                });
                setStates({
                  days: efficientDays,
                  topicStats: Object.fromEntries(
                    Object.entries(title2Count).map(([title, count]) => {
                      return [
                        title,
                        {
                          count,
                          efficient: efficientTopics.has(title),
                        },
                      ];
                    })
                  ),
                });
                resolve();
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

  // function initRewardProgress() {
  //   const listenId = GM_addValueChangeListener(
  //     `${id}/states`,
  //     function (name, old_value, new_value) {
  //       if (old_value !== new_value) {
  //         getRewardElement();
  //       }
  //     }
  //   );
  //   window.addEventListener("beforeunload", function () {
  //     GM_removeValueChangeListener(listenId);
  //   });
  // }

  function getRewardElement() {
    const { days, topicStats } = getStates();
    const reward = ["幸运奖", "三等奖", "二等奖", "一等奖", "全勤奖"][
      days >= 8 ? 4 : Math.floor((days - 1) / 2)
    ];
    const topicCount = Object.values(topicStats).filter(
      ({ efficient }) => !!efficient
    ).length;
    const descriptionHTML = [
      `🎯 达成 ${days} 天`,
      `⭕ ${topicCount} 个圈子`,
      `🏆 ${reward}`,
    ]
      .map(
        (text) => `<span style="color:#939aa3;font-weight:bold">${text}</span>`
      )
      .join("");
    const rewardEl = document.createElement("div");
    rewardEl.innerHTML = `<h3 style="margin:0">破圈行动 <span style="float:right">9/23 - 9/30</span></h3>
    <p style="display:flex;flex-direction:row;justify-content: space-between;">
    ${descriptionHTML}
    </p>
    `;

    return rewardEl;
  }
})();
