// ==UserScript==
// @name         Juejin Activities Enhancer
// @name:zh-CN   掘金活动辅助工具
// @namespace    https://github.com/curly210102/UserScripts
// @version      0.1.6.4
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
  const startTimeStamp = 1632326400000;
  const endTimeStamp = 1633017600000;
  const blockTopics = [
    "树洞一下",
    "掘金相亲角",
    "反馈 & 建议",
    "沸点福利",
    "掘金官方",
    "上班摸鱼",
  ];
  let currentRouterPathname = "";

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
  };
  history.replaceState = function () {
    _historyReplaceState.apply(history, arguments);
    initByRouter();
  };
  window.addEventListener("popstate", function () {
    initByRouter();
  });

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

  function initByRouter() {
    const prevRouterPathname = currentRouterPathname;
    currentRouterPathname = document.location.pathname;
    const pagePinsRegexp = /^\/pins(?:\/|$)/;
    const pageProfileRegexp = new RegExp(`^\\/user\\/${userId}(?:\\/|$)`);
    if (pagePinsRegexp.test(currentRouterPathname) && !pagePinsRegexp.test(prevRouterPathname)) {
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
        wrapperEl.style = "padding-top:20px;";
        containerEl.appendChild(wrapperEl);
      });
    }
    else if (
      pageProfileRegexp.test(
        currentRouterPathname
      ) && !pageProfileRegexp.test(prevRouterPathname)
    ) {
      fetchAndUpdateGlobalStates().then(() => {
        setTimeout(() => {
          const siblingEl = document.querySelector(".user-view .stat-block");
          if (!siblingEl) return;
          siblingEl.parentElement
            .querySelector(`[data-tampermonkey='${id}']`)
            ?.remove();
          const blockEl = document.createElement("div");
          blockEl.dataset.tampermonkey = id;
          blockEl.className = "block shadow";
          blockEl.style = `margin-bottom: 1rem;background-color: #fff;border-radius: 2px;`;
          const titleEl = document.createElement("div");
          titleEl.style = `padding: 1.333rem;
          font-size: 1.333rem;
          font-weight: 600;
          color: #31445b;
          border-bottom: 1px solid rgba(230,230,231,.5);`;
          titleEl.textContent = "活动状态";
          blockEl.appendChild(titleEl);
          const contentEl = document.createElement("div");
          contentEl.style = `padding: 1.333rem;`;
          contentEl.appendChild(getRewardElement());
          blockEl.appendChild(contentEl);
          siblingEl.after(blockEl);
        }, 1000);
      });
    }
  }

  function doUpdate(containerEl) {
    return fetchAndUpdateGlobalStates().then(() => {
      renderTopicSelectMenu(containerEl);
    });
  }

  function renderTopicSelectMenu(containerEl) {
    const { efficientTopics } = getStates();
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
      const count = efficientTopics[title]?.count;
      const verified = efficientTopics[title]?.verified;
      const iconEl = document.createElement("div");
      iconEl.dataset.tampermonkey = id;
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
  }

  async function fetchAndUpdateGlobalStates() {
    const dailyTopics = await requestShortMsgTopic();
    updateGlobalStates(dailyTopics);
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
              let lastPublishTime = Infinity;
              for (const msg of data) {
                const { topic, msg_Info } = msg;
                // const topicId = topic.topic_id;
                // const createTime = msg_Info.ctime;
                const publishTime = msg_Info.ctime * 1000;
                if (
                  publishTime > startTimeStamp &&
                  publishTime < endTimeStamp &&
                  !blockTopics.includes(topic.title)
                ) {
                  const day = Math.floor(
                    (publishTime - startTimeStamp) / 86400000
                  );
                  if (!dailyTopics[day]) {
                    dailyTopics[day] = [];
                  }
                  dailyTopics[day].push({
                    title: topic.title,
                    // wait: 0, pass: 1, fail: 2
                    verified:
                      msg_Info.status === 1 ||
                      msg_Info.verify_status === 0
                        ? 0
                        : msg_Info.status === 2 &&
                          msg_Info.verify_status === 1
                        ? 1
                        : 2,
                  });
                }
                lastPublishTime = publishTime;
                if (publishTime < startTimeStamp) {
                  break;
                }
              }

              if (lastPublishTime > startTimeStamp && has_more) {
                resolve(requestShortMsgTopic(cursor, dailyTopics));
              } else {
                resolve(dailyTopics);
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

  function updateGlobalStates(dailyTopics) {
    const allEfficientTopicTitles = new Set();
    const topicCountAndVerified = {};
    const todayIndex = Math.floor(
      (new Date().valueOf() - startTimeStamp) / 86400000
    );
    const todayEfficientTopicTitles = [];
    let efficientDays = 0;
    dailyTopics.forEach((topics, index) => {
      // 获取一天破解的圈子
      const dailyEfficientTopicTitles = new Set(
        topics
          .filter(({ title, verified }) => {
            // 破圈：未被破解 + 已通过审核或正在等待审核
            return !allEfficientTopicTitles.has(title) && verified !== 2;
          })
          .map(({ title }) => title)
      );
      // 更新达标天数
      if (dailyEfficientTopicTitles.size >= 3) {
        efficientDays++;
      }
      // 记录今日破圈数据
      if (index === todayIndex) {
        todayEfficientTopicTitles.push(...dailyEfficientTopicTitles);
      }
      // 更新已破圈集合
      dailyEfficientTopicTitles.forEach((t) => allEfficientTopicTitles.add(t));
      // 记录已破圈发帖数
      topics.map(({ title, verified }) => {
        if (!topicCountAndVerified[title]) {
          topicCountAndVerified[title] = {
            count: 1,
            verified,
          };
        } else {
          topicCountAndVerified[title]["count"]++;
          topicCountAndVerified[title]["verified"] ||= (verified === 1);
        }
      });
    });

    setStates({
      todayEfficientTopicTitles,
      efficientDays,
      efficientTopics: Object.fromEntries(
        [...allEfficientTopicTitles].map((title) => {
          return [title, topicCountAndVerified[title]];
        })
      ),
    });
  }

  function getRewardElement() {
    const { efficientTopics, efficientDays, todayEfficientTopicTitles } =
      getStates();
    const topicCount = Object.values(efficientTopics).filter(
      ({ verified }) => !!verified
    ).length;
    const reward =
      ["幸运奖", "三等奖", "二等奖", "一等奖", "全勤奖"][
        efficientDays >= 8 ? 4 : Math.floor((efficientDays - 1) / 2)
      ] ?? (topicCount > 1 ? "幸运奖" : "无");

    const descriptionHTML = [
      `🎯 达成 ${efficientDays} 天`,
      `⭕ ${topicCount} 个圈子`,
      `🏆 ${reward}`,
    ]
      .map(
        (text) => `<span style="color:#939aa3;font-weight:bold">${text}</span>`
      )
      .join("");
    const todayTopicsHTML = todayEfficientTopicTitles
      .map((title) => {
        const isVerified = efficientTopics[title]?.verified;
        return `<span style="display: inline-block;
          padding:2px 10px;
          background-color: ${isVerified ? "#eaf2ff" : "#c2c6cc"};
          color:${isVerified ? "#1e80ff" : "#393a3c"};
          font-size:12px;
          line-height:20px;
          border-radius:50px;
          margin-left:2px;margin-bottom:2px;">${title}</span>`;
      })
      .join("");
    const rewardEl = document.createElement("div");
    rewardEl.innerHTML = `<h3 style="margin:0">破圈行动 <span style="float:right">9/23 - 9/30</span></h3>
    <p style="display:flex;flex-direction:row;justify-content: space-between;">
    ${descriptionHTML}
    </p>
    <p>📅 今天 ${todayEfficientTopicTitles.length} / 3</p>
    <div>
    ${todayTopicsHTML}
    </div>
    `;

    return rewardEl;
  }
})();
