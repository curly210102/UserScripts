// ==UserScript==
// @name         Juejin Activities Enhancer
// @name:zh-CN   掘金活动小助手
// @namespace    https://github.com/curly210102/UserScripts
// @version      0.1.7.5
// @description  Enhances Juejin activities
// @description:zh-CN   跟进掘金上线的活动，提供进度追踪、数据统计、操作辅助等功能。
// @author       curly brackets
// @match        https://juejin.cn/*
// @license      MIT License
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-end
// @supportURL   https://github.com/curly210102/UserScripts/issues
// @updateURL    https://github.com/curly210102/UserScripts/raw/main/Juejin_Enhancer/Juejin_activities.user.js
// @downloadURL  https://github.com/curly210102/UserScripts/raw/main/Juejin_Enhancer/Juejin_activities.user.js
// @connect      juejin.cn
// ==/UserScript==

(function () {
  'use strict';

  var blockTopics = [
  	"树洞一下",
  	"掘金相亲角",
  	"反馈 & 建议",
  	"沸点福利",
  	"掘金官方",
  	"上班摸鱼"
  ];
  var scriptId$1 = "juejin-activies-enhancer/break-the-circle";
  var startTimeStamp = 1632326400000;
  var endTimeStamp = 1633017599999;

  const states$1 = {
    userId: ""
  };
  function getUserId() {
    return states$1.userId;
  }
  function setUserId(userId) {
    states$1.userId = userId;
  }

  var scriptId = "juejin-activies-enhancer";

  const inPinPage = pathname => {
    return /^\/pins(?:\/|$)/.test(pathname);
  };
  const inSelfProfilePage = pathname => {
    return new RegExp(`^\\/user\\/${getUserId()}(?:\\/|$)`).test(pathname);
  };
  const inProfilePage = pathname => {
    return /\/user\/(\d+)(?:\/|$)/.test(pathname);
  };
  const getUserIdFromPathName = pathname => {
    var _pathname$match;

    return pathname === null || pathname === void 0 ? void 0 : (_pathname$match = pathname.match(/\/user\/(\d+)(?:\/|$)/)) === null || _pathname$match === void 0 ? void 0 : _pathname$match[1];
  };
  const inCreatorPage = pathname => {
    return /^\/creator(?:\/|$)/.test(pathname);
  };
  const calcMathPower = number => {
    let power = 0;

    while (number > 1) {
      power++;
      number >>= 1;
    }

    return power;
  };
  const initStorage = (name, version, defaultValue) => {
    const versionPath = `${name}/version`;

    if (getFromStorage(versionPath, 0) < version) {
      saveToStorage(name, defaultValue);
      saveToStorage(versionPath, version);
      return defaultValue;
    } else {
      return getFromStorage(name) ?? defaultValue;
    }
  };
  const saveToStorage = (name, value) => {
    GM_setValue(`${scriptId}/${name}`, value);
  };
  const getFromStorage = (name, defaultValue) => {
    return GM_getValue(`${scriptId}/${name}`, defaultValue);
  };
  const formatDate = (dateInstance, format) => {
    const year = dateInstance.getFullYear();
    const month = dateInstance.getMonth() + 1;
    const date = dateInstance.getDate();
    return format.replaceAll("YYYY", year).replaceAll("MM", `${month}`.padStart(2, "0")).replaceAll("DD", `${date}`.padStart(2, "0")).replaceAll("M", month).replaceAll("D", date);
  };
  function fetchData({
    url,
    data = {}
  }) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "POST",
        url,
        data: JSON.stringify({
          user_id: getUserId(),
          ...data
        }),
        headers: {
          "User-agent": window.navigator.userAgent,
          "content-type": "application/json"
        },
        onload: function ({
          status,
          response
        }) {
          try {
            if (status === 200) {
              const responseData = JSON.parse(response);
              resolve(responseData);
            } else {
              reject(response);
            }
          } catch (err) {
            console.log(err);
            reject(err);
          }
        }
      });
    });
  }

  class ProfileStatRender {
    constructor() {
      const blockEl = document.createElement("div");
      blockEl.dataset.tampermonkey = scriptId;
      blockEl.className = "block shadow";
      blockEl.style = `margin-bottom: 1rem;background-color: #fff;border-radius: 2px;`;
      const titleEl = document.createElement("div");
      titleEl.style = `padding: 1.333rem;
              font-size: 1.333rem;
              font-weight: 600;
              color: #31445b;
              border-bottom: 1px solid rgba(230,230,231,.5);cursor:pointer;`;
      titleEl.textContent = "活动状态";
      titleEl.addEventListener("click", () => {
        const isHidden = contentEl.style.display === "none";
        contentEl.style.display = isHidden ? "block" : "none";
        saveToStorage("profile_stat_hidden", isHidden);
      });
      blockEl.appendChild(titleEl);
      const contentEl = document.createElement("div");
      contentEl.style = `padding: 1.333rem;`;
      contentEl.style.display = getFromStorage("profile_stat_hidden", false) ? "none" : "block";
      blockEl.appendChild(contentEl);
      this.blockEl = blockEl;
      this.contentEl = contentEl;
      this.data = [];
    }

    add(data) {
      const now = new Date().valueOf();
      const {
        node,
        title,
        link,
        startTime,
        endTime
      } = data;
      const header = document.createElement("h3");
      header.style = "margin:0;";
      header.innerHTML = `<a style="color:inherit" href="${link}" target="__blank">${title}</a> <span style="float:right">${formatDate(startTime, "MM/DD")} - ${formatDate(endTime, "MM/DD")}</span>`;
      node.firstChild ? node.insertBefore(header, node.firstChild) : node.appendChild(header);
      node.style["padding-bottom"] = "10px";
      node.style["margin-bottom"] = "20px";
      node.style["border-bottom"] = "1px solid rgba(230, 230, 231, 0.5)";
      this.data = this.data.filter(({
        id
      }) => id !== data.id);
      this.data.push(node);
      this.data.sort((a, b) => {
        const isFinishA = a.endTime > now;
        const isFinishB = b.endTime > now;
        if (isFinishA && !isFinishB) return -1;else if (isFinishB && !isFinishA) return 1;
        return b.startTime - a.startTime;
      });
      this.render();
    }

    render() {
      const container = this.contentEl;
      const currentDOM = container.children;
      this.data.forEach((node, index) => {
        const element = currentDOM[index];

        if (!element) {
          container.appendChild(node);
        } else if (element !== node) {
          element.replaceWith(node);
        }
      });

      for (let i = this.data.length, len = currentDOM.length; i < len; i++) {
        container.removeChild(currentDOM[i]);
      }

      if (!this.blockEl.isConnected) {
        this.mounted = true;
        const siblingEl = document.querySelector(".user-view .follow-block");
        const parentEl = document.querySelector(".user-view .sticky-wrap");

        if (parentEl) {
          parentEl.style.overflow = "auto";
          parentEl.style.height = "calc(100vh - 8rem)";
          parentEl.style["padding-right"] = "16px";
        }

        if (siblingEl) {
          var _siblingEl$parentElem;

          (_siblingEl$parentElem = siblingEl.parentElement.querySelector(`[data-tampermonkey='${scriptId}']`)) === null || _siblingEl$parentElem === void 0 ? void 0 : _siblingEl$parentElem.remove();
          siblingEl.after(this.blockEl);
        } else if (parentEl) {
          var _parentEl$querySelect;

          (_parentEl$querySelect = parentEl.querySelector(`[data-tampermonkey='${scriptId}']`)) === null || _parentEl$querySelect === void 0 ? void 0 : _parentEl$querySelect.remove();
          parentEl.firstChild ? parentEl.insertBefore(this.blockEl, parentEl.firstChild) : parentEl.appendChild(this.blockEl);
        }
      }
    }

  }

  const profileStateRender = new ProfileStatRender();

  const states = GM_getValue(scriptId$1, {
    checkPoint: 0,
    topics: {
      todayEfficientTopicTitles: [],
      efficientDays: 0,
      efficientTopics: {}
    }
  });

  function getCheckPoint() {
    return states.checkPoint;
  }

  function getTopicStates() {
    return states.topics;
  }
  function setTopicStates(value) {
    states.checkPoint = new Date().valueOf();
    states.topics = value;
    GM_setValue(scriptId$1, states);
  }
  async function fetchStates(userId) {
    const isOwner = !userId || userId === getUserId();
    let topicStats;

    if (isOwner) {
      if (getCheckPoint() > endTimeStamp) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(getTopicStates());
          });
        });
      }

      const dailyTopics = await requestShortMsgTopic();
      topicStats = generateTopicStats(dailyTopics);
      setTopicStates(topicStats);
    } else {
      const dailyTopics = await requestShortMsgTopic("0", [], {
        user_id: userId
      });
      topicStats = generateTopicStats(dailyTopics);
    }

    return topicStats;
  }

  function requestShortMsgTopic(cursor = "0", dailyTopics = [], requestData = {}) {
    return fetchData({
      url: "https://api.juejin.cn/content_api/v1/short_msg/query_list",
      data: {
        sort_type: 4,
        limit: 24,
        cursor,
        ...requestData
      }
    }).then(responseData => {
      const {
        data,
        cursor,
        has_more
      } = responseData;
      let lastPublishTime = Infinity;

      if (data) {
        for (const msg of data) {
          const {
            topic,
            msg_Info
          } = msg;
          const publishTime = msg_Info.ctime * 1000;

          if (publishTime > startTimeStamp && publishTime < endTimeStamp && !blockTopics.includes(topic.title)) {
            const day = Math.floor((publishTime - startTimeStamp) / 86400000);

            if (!dailyTopics[day]) {
              dailyTopics[day] = [];
            }

            dailyTopics[day].push({
              title: topic.title,
              // wait: 0, pass: 1, fail: 2
              verified: msg_Info.verify_status === 0 ? 0 : msg_Info.audit_status === 2 && msg_Info.verify_status === 1 ? 1 : 2
            });
          }

          lastPublishTime = publishTime;

          if (publishTime < startTimeStamp) {
            break;
          }
        }
      }

      if (lastPublishTime > startTimeStamp && has_more) {
        return requestShortMsgTopic(cursor, dailyTopics, requestData);
      } else {
        return dailyTopics;
      }
    });
  }

  function generateTopicStats(dailyTopics) {
    const allEfficientTopicTitles = new Set();
    const topicCountAndVerified = {};
    const todayIndex = Math.floor((new Date().valueOf() - startTimeStamp) / 86400000);
    const todayEfficientTopicTitles = [];
    let efficientDays = 0;
    dailyTopics.forEach((topics, index) => {
      // 获取一天破解的圈子
      const dailyEfficientTopicTitles = new Set(topics.filter(({
        title,
        verified
      }) => {
        // 破圈：未被破解 + 已通过审核或正在等待审核
        return !allEfficientTopicTitles.has(title) && verified !== 2;
      }).map(({
        title
      }) => title));
      const dailyVerifiedTopicTitles = new Set(topics.filter(({
        title,
        verified
      }) => {
        // 破圈：未被破解 + 已通过审核或正在等待审核
        return !allEfficientTopicTitles.has(title) && verified === 1;
      })); // 更新达标天数

      if (dailyVerifiedTopicTitles.size >= 3) {
        efficientDays++;
      } // 记录今日破圈数据


      if (index === todayIndex) {
        todayEfficientTopicTitles.push(...dailyEfficientTopicTitles);
      } // 更新已破圈集合


      dailyEfficientTopicTitles.forEach(t => allEfficientTopicTitles.add(t)); // 记录已破圈发帖数

      topics.map(({
        title,
        verified
      }) => {
        if (!topicCountAndVerified[title]) {
          topicCountAndVerified[title] = {
            count: 1,
            verified
          };
        } else {
          var _topicCountAndVerifie, _verified;

          topicCountAndVerified[title]["count"]++;
          (_topicCountAndVerifie = topicCountAndVerified[title])[_verified = "verified"] || (_topicCountAndVerifie[_verified] = verified === 1);
        }
      });
    });
    return {
      todayEfficientTopicTitles,
      efficientDays,
      efficientTopics: Object.fromEntries([...allEfficientTopicTitles].map(title => {
        return [title, topicCountAndVerified[title]];
      }))
    };
  }

  function renderPinPage() {
    var _containerEl$querySel;

    const containerEl = document.querySelector(".main .userbox");

    if (!containerEl) {
      return;
    }

    (_containerEl$querySel = containerEl.querySelector(`[data-tampermonkey='${scriptId$1}']`)) === null || _containerEl$querySel === void 0 ? void 0 : _containerEl$querySel.remove();
    const wrapperEl = document.createElement("div");
    wrapperEl.dataset.tampermonkey = scriptId$1;
    wrapperEl.appendChild(getRewardElement());
    wrapperEl.style = "padding-top:20px;";
    containerEl.appendChild(wrapperEl);
  }
  function renderProfilePage(topicStates) {
    profileStateRender.add({
      id: scriptId$1,
      title: "破圈行动",
      link: "https://juejin.cn/pin/7010556755855802376",
      startTime: new Date(startTimeStamp),
      endTime: new Date(endTimeStamp),
      node: getRewardElement(topicStates)
    });
  }

  function getRewardElement(topicStates = getTopicStates()) {
    const {
      efficientTopics,
      efficientDays
    } = topicStates;
    const topicCount = Object.values(efficientTopics).filter(({
      verified
    }) => !!verified).length;
    const reward = ["幸运奖", "三等奖", "二等奖", "一等奖", "全勤奖"][efficientDays >= 8 ? 4 : Math.floor((efficientDays - 1) / 2)] ?? (topicCount > 1 ? "幸运奖" : "无");
    const descriptionHTML = [`🎯 &nbsp;达成 ${efficientDays} 天`, `⭕ &nbsp;${topicCount} 个圈子`, `🏆 &nbsp;${reward}`].map(text => `<span style="color:#939aa3;font-weight:bold">${text}</span>`).join("");
    const rewardEl = document.createElement("div");
    rewardEl.innerHTML = `<p style="display:flex;flex-direction:row;justify-content: space-between;">
      ${descriptionHTML}
      </p>
      ${endTimeStamp < new Date().valueOf() || efficientDays >= 8 ? getFinishSummary({
    isJoined: topicCount > 0
  }) : getTodayStatus()}
      `;
    return rewardEl;
  }

  function getTodayStatus() {
    const {
      todayEfficientTopicTitles,
      efficientTopics
    } = getTopicStates();
    const todayTopicsHTML = todayEfficientTopicTitles.map(title => {
      var _efficientTopics$titl;

      const isVerified = (_efficientTopics$titl = efficientTopics[title]) === null || _efficientTopics$titl === void 0 ? void 0 : _efficientTopics$titl.verified;
      return renderTag(title, isVerified);
    }).join("");
    const todayVerifiedCount = todayEfficientTopicTitles.filter(title => {
      var _efficientTopics$titl2;

      return (_efficientTopics$titl2 = efficientTopics[title]) === null || _efficientTopics$titl2 === void 0 ? void 0 : _efficientTopics$titl2.verified;
    }).length;
    const todayVerifyCount = todayEfficientTopicTitles.length - todayVerifiedCount;
    return `<p>📅 &nbsp;今天 ${todayVerifiedCount} / 3 ${todayVerifyCount > 0 ? `&nbsp;🧐 人工审核中&nbsp;${todayVerifyCount} 条` : ""}</p>
      <div>
      ${todayTopicsHTML}
      </div>`;
  }

  function getFinishSummary({
    isJoined
  }) {
    const {
      efficientTopics
    } = getTopicStates();

    if (isJoined) {
      return `<details>
    <summary style="cursor:pointer;margin-bottom:8px">🎉&nbsp;恭喜完成活动！展开查看破解列表</summary>
    ${Object.keys(efficientTopics).map(title => {
      return renderTag(title);
    }).join("")}
    </details>`;
    } else {
      return `<p style="color:#939aa3;">⌛️ 活动已结束</p>`;
    }
  }

  function renderTag(title, isVerified = true) {
    return `<span style="display: inline-block;
  padding:2px 10px;
  background-color: ${isVerified ? "#eaf2ff" : "#e5e7ea"};
  color:${isVerified ? "#1e80ff" : "#717682"};
  font-size:12px;
  line-height:20px;
  border-radius:50px;
  margin-left:2px;margin-bottom:2px;">${title}</span>`;
  }

  function renderTopicSelectMenu(containerEl) {
    if (endTimeStamp < new Date().valueOf()) return;
    const topicPanel = containerEl.querySelector(".topicwrapper .new_topic_picker");

    if (!topicPanel) {
      return;
    }

    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(({
        type,
        addedNodes
      }) => {
        if (type === "childList" && addedNodes.length) {
          addedNodes.forEach(itemEl => {
            var _itemEl$classList;

            if (!itemEl) return;else if (itemEl !== null && itemEl !== void 0 && (_itemEl$classList = itemEl.classList) !== null && _itemEl$classList !== void 0 && _itemEl$classList.contains("contents")) {
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
      subtree: true
    });
    renderWholeContent(topicPanel.querySelector(".wrapper .contents"));
  }

  function renderWholeContent(contentEl) {
    if (!contentEl) {
      return;
    }

    const allItemEls = contentEl.querySelectorAll(".item");
    allItemEls.forEach(itemEl => {
      renderItem(itemEl);
    });
  }

  function renderItem(itemEl) {
    var _itemEl$parentElement, _itemEl$parentElement2, _itemEl$querySelector, _itemEl$querySelector2, _efficientTopics$titl, _efficientTopics$titl2;

    const {
      efficientTopics
    } = getTopicStates();
    if (!itemEl || !(itemEl.nodeType === 1 && itemEl.nodeName === "DIV" && itemEl.classList.contains("item")) || !((_itemEl$parentElement = itemEl.parentElement) !== null && _itemEl$parentElement !== void 0 && _itemEl$parentElement.classList.contains("contents")) && !((_itemEl$parentElement2 = itemEl.parentElement) !== null && _itemEl$parentElement2 !== void 0 && _itemEl$parentElement2.classList.contains("searchlist"))) return;
    (_itemEl$querySelector = itemEl.querySelector(`[data-tampermonkey='${scriptId$1}']`)) === null || _itemEl$querySelector === void 0 ? void 0 : _itemEl$querySelector.remove();
    const title = (_itemEl$querySelector2 = itemEl.querySelector(".content_main > .title")) === null || _itemEl$querySelector2 === void 0 ? void 0 : _itemEl$querySelector2.textContent;
    const isBlockedTopic = blockTopics.includes(title);
    const count = (_efficientTopics$titl = efficientTopics[title]) === null || _efficientTopics$titl === void 0 ? void 0 : _efficientTopics$titl.count;
    const verified = (_efficientTopics$titl2 = efficientTopics[title]) === null || _efficientTopics$titl2 === void 0 ? void 0 : _efficientTopics$titl2.verified;
    const iconEl = document.createElement("div");
    iconEl.dataset.tampermonkey = scriptId$1;

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

  function onRouteChange$2(prevRouterPathname, currentRouterPathname) {
    if (inPinPage(currentRouterPathname) && !inPinPage(prevRouterPathname)) {
      fetchStates().then(() => {
        renderTopicSelectMenu(document);
        renderPinPage();
      });
      return;
    }

    if (inSelfProfilePage(currentRouterPathname) && !inSelfProfilePage(prevRouterPathname)) {
      fetchStates().then(() => {
        setTimeout(() => {
          renderProfilePage();
        }, 1000);
      });
      return;
    }

    if (inProfilePage(currentRouterPathname)) {
      const prevUserId = getUserIdFromPathName(prevRouterPathname);
      const currentUserId = getUserIdFromPathName(currentRouterPathname);

      if (currentUserId !== prevUserId) {
        fetchStates(currentUserId).then(topicStats => {
          setTimeout(() => {
            renderProfilePage(topicStats);
          }, 1000);
        });
      }
    }
  }

  function initPopupMutation() {
    const componentBoxEl = document.querySelector(".global-component-box");

    if (componentBoxEl) {
      const observer = new MutationObserver(function (mutations) {
        const mutation = mutations.find(mutation => {
          const {
            type,
            addedNodes
          } = mutation;

          if (type === "childList" && Array.prototype.find.call(addedNodes, node => {
            var _node$classList;

            return (_node$classList = node.classList) === null || _node$classList === void 0 ? void 0 : _node$classList.contains("pin-modal");
          })) {
            return true;
          } else {
            return false;
          }
        });

        if (mutation) {
          mutation.addedNodes.forEach(node => {
            var _node$classList2;

            if ((_node$classList2 = node.classList) !== null && _node$classList2 !== void 0 && _node$classList2.contains("pin-modal")) {
              fetchStates().then(() => {
                renderTopicSelectMenu(node);
              });
            }
          });
        }
      });
      observer.observe(componentBoxEl, {
        childList: true
      });
    }
  }

  var BreakTheCycle = {
    onRouteChange: onRouteChange$2,
    onLoaded: initPopupMutation
  };

  var tips = {
  	categories: [
  		"前端",
  		"后端",
  		"Android",
  		"iOS",
  		"人工智能"
  	],
  	startTimeStamp: 1632412800000,
  	endTimeStamp: 1635695999999
  };
  var star = {
  	categories: [
  		"前端",
  		"后端",
  		"Android",
  		"iOS"
  	],
  	startTimeStamp: 1633017600000,
  	endTimeStamp: 1635695999999
  };
  var activityId = "october-posts";

  /**
   * Word Count
   *
   * Word count in respect of CJK characters.
   *
   * Copyright (c) 2015 - 2016 by Hsiaoming Yang.
   */

  var pattern = /[a-zA-Z0-9_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/g;

  var wordCount = function (data) {
    var m = data.match(pattern);
    var count = 0;
    if (!m) {
      return 0;
    }
    for (var i = 0; i < m.length; i++) {
      if (m[i].charCodeAt(0) >= 0x4e00) {
        count += m[i].length;
      } else {
        count += 1;
      }
    }
    return count;
  };

  var img$f = "data:image/svg+xml,%3csvg width='37' height='12' viewBox='0 0 37 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M6 4.5C6 5.32843 6.67157 6 7.5 6C8.32843 6 9 5.32843 9 4.5C9 3.67157 8.32843 3 7.5 3C6.67157 3 6 3.67157 6 4.5Z' fill='%23C4C4C4' stroke='black' stroke-opacity='0.04' stroke-width='0.5'/%3e%3cpath d='M33.4252 0.884662H12.3509L11.4894 0H4.1757L0.4599 3.83372L7.77358 11.207L9.25686 9.73169L33.4252 9.72362C35.3095 9.74784 36.8547 7.87113 36.9767 5.62356C37.1105 3.16 35.5002 0.872624 33.4252 0.884662V0.884662ZM1.69845 3.83372L4.64751 0.884662H10.8406L13.7896 3.83372L7.77358 9.84934L1.69845 3.83372Z' fill='%23C4C4C4'/%3e%3cpath d='M20.72 2.74L20.606 3.526H22.418L22.34 4.096H20.528L20.12 7.042H18.98L19.394 4.096H17.582L17.66 3.526H19.472L19.55 2.98L19.376 2.74H20.72ZM21.788 4.258L22.082 6.82H20.942L20.648 4.258H21.788ZM19.208 4.258L18.236 6.814H17.096L18.068 4.258H19.208ZM27.6615 3.922L27.5955 4.108H30.9855L30.9075 4.672H27.4035L26.5875 7.042H25.5675L26.3835 4.672H25.8915L25.9695 4.108H26.5755L26.6415 3.922H27.6615ZM27.3615 3.28H28.0095L28.0575 2.956L27.8475 2.74H29.2275L29.1555 3.28H29.8095L29.8575 2.92H30.9075L30.7875 3.802H26.2455L26.3655 2.92H27.4095L27.3615 3.28ZM29.3475 5.854L29.3355 5.86L30.5535 7.036H29.3595L28.6935 6.394L27.9015 7.036H26.7975L28.3455 5.752L28.4655 4.888H29.4795L29.3475 5.854ZM27.3435 4.99H28.1055L28.0215 5.974H27.2595L27.3435 4.99ZM29.5935 5.92L29.8935 5.014H30.6795L30.3795 5.92H29.5935Z' fill='%23666666'/%3e%3c/svg%3e";

  var img$e = "data:image/svg+xml,%3csvg width='37' height='12' viewBox='0 0 37 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M33.4252 0.884662H12.3509L11.4894 0H4.1757L0.459906 3.83372L7.77359 11.207L9.25687 9.73169L33.4252 9.72362C35.3095 9.74784 36.8547 7.87113 36.9767 5.62356C37.1105 3.16 35.5002 0.872624 33.4252 0.884662ZM1.69846 3.83372L4.64752 0.884662H10.8406L13.7896 3.83372L7.77359 9.84934L1.69846 3.83372Z' fill='%23FDEDD4'/%3e%3cpath d='M4.59868 3.49329L6.80726 3.17661L7.80013 1.17637L8.78506 3.17975L10.9925 3.50615L9.38984 5.0592L9.76425 7.26162L7.7911 6.21814L5.8133 7.25314L6.19236 5.05592L4.59868 3.49329Z' fill='%23BABCAF'/%3e%3cpath d='M9.38997 5.0592L9.76425 7.26148L7.79493 4.53787L6.80644 3.17675L7.7993 1.17637L7.7911 6.21814L5.8133 7.25314L8.7841 3.17962L10.9916 3.50615L6.19236 5.05592L4.59868 3.49329' fill='%2395A098'/%3e%3cpath d='M21.896 4.786L21.65 6.544C21.634 6.66 21.58 6.758 21.488 6.838C21.4 6.914 21.3 6.952 21.188 6.952H20.228L20.63 6.526L20.648 6.382H18.368L18.29 6.946H17.264L17.564 4.786H21.896ZM19.322 3.646L19.334 3.532H17.63L17.69 3.076H19.4L19.418 2.962L19.22 2.734H20.588L20.54 3.076H22.25L22.19 3.532H20.474L20.456 3.646H21.944L21.878 4.102H20.396L20.378 4.216H22.208L22.142 4.672H17.354L17.42 4.216H19.238L19.256 4.102H17.66L17.726 3.646H19.322ZM18.512 5.356H20.792L20.81 5.242H18.53L18.512 5.356ZM18.434 5.926H20.714L20.726 5.812H18.446L18.434 5.926ZM30.9735 2.842L30.4335 6.694C30.4175 6.79 30.3735 6.872 30.3015 6.94C30.2335 7.004 30.1535 7.036 30.0615 7.036H29.2515L29.6955 6.55L30.1395 3.418H28.4895L27.9795 7.036H27.2175L27.7695 3.082L27.6675 2.842H30.9735ZM26.0415 5.002L26.0955 4.606H25.8195L25.8975 4.036H27.4095L27.3315 4.606H27.0255L26.9715 5.002H27.3495L27.2655 5.602H26.8875L26.7855 6.328L27.1755 6.25L27.0975 6.802L25.7535 7.042L25.9575 5.602H25.5795L25.6635 5.002H26.0415ZM29.8035 4.54L29.5455 6.37H28.2375L28.4955 4.54H29.8035ZM27.0855 2.734L26.8995 3.184H27.5655L27.4815 3.76H26.6655L26.5755 3.976H25.8075L26.2395 2.914L26.0955 2.734H27.0855ZM29.9235 3.748L29.8515 4.27H28.5435L28.6155 3.748H29.9235ZM29.0475 5.908L29.1795 4.96H29.0055L28.8735 5.908H29.0475Z' fill='%237B9D9F'/%3e%3c/svg%3e";

  var img$d = "data:image/svg+xml,%3csvg width='37' height='12' viewBox='0 0 37 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M33.4252 1.59909H12.3509L11.4894 0.71443H4.17571L0.459908 4.54815L7.77359 11.9215L9.25687 10.4461L33.4252 10.4381C35.3095 10.4623 36.8547 8.58556 36.9767 6.33799C37.1105 3.87443 35.5002 1.58705 33.4252 1.59909ZM1.69846 4.54815L4.64752 1.59909H10.8406L13.7896 4.54815L7.77359 10.5638L1.69846 4.54815Z' fill='%239EC4F6'/%3e%3cpath d='M9.45523 4.66949L7.76484 2.42562L6.08963 4.68152L4.38063 3.16308L5.25367 7.89419H10.276L11.149 3.16308L9.45523 4.66949Z' fill='%23A4D8E4'/%3e%3cpath d='M9.45523 4.66949L7.76483 2.42562L7.76141 2.4289V7.89446H10.276L11.149 3.16308L9.45523 4.66949Z' fill='%2395D3E8'/%3e%3cpath d='M5.00032 6.52116L5.62767 5.44991L4.38063 3.16309L5.00032 6.52116Z' fill='%23B5D3D8'/%3e%3cpath d='M6.08963 4.68153L5.62767 5.44991L4.38063 3.16309L6.08963 4.68153Z' fill='%2385C6D8'/%3e%3cpath d='M9.92539 5.44991L10.5293 6.52116L11.149 3.16309L9.92539 5.44991Z' fill='%23B5D3D8'/%3e%3cpath d='M9.45522 4.66949L9.92539 5.44991L11.149 3.16309L9.45522 4.66949Z' fill='%2385C6D8'/%3e%3cpath d='M7.42927 4.87304C7.42927 5.12215 7.49219 5.35183 7.59424 5.47658C7.69629 5.60134 7.82187 5.60121 7.92392 5.47658C8.02597 5.35196 8.0889 5.12215 8.0889 4.87304C8.0889 4.62393 8.02597 4.39425 7.92392 4.26949C7.82187 4.14474 7.69616 4.14501 7.59424 4.26949C7.49233 4.39398 7.42927 4.62462 7.42927 4.87304Z' fill='%23F7F7F7'/%3e%3cpath d='M7.46388 4.58577C7.46388 4.61664 7.47304 4.64681 7.49019 4.67248C7.50734 4.69815 7.53172 4.71816 7.56024 4.72997C7.58876 4.74178 7.62014 4.74487 7.65042 4.73885C7.6807 4.73283 7.70851 4.71796 7.73034 4.69614C7.75216 4.67431 7.76703 4.64649 7.77305 4.61622C7.77908 4.58594 7.77598 4.55456 7.76417 4.52604C7.75236 4.49751 7.73235 4.47314 7.70668 4.45599C7.68102 4.43884 7.65084 4.42968 7.61997 4.42968C7.57857 4.42968 7.53887 4.44613 7.5096 4.4754C7.48033 4.50467 7.46388 4.54437 7.46388 4.58577V4.58577Z' fill='white'/%3e%3cpath d='M17.84 4.304L18.164 3.878L18.038 3.734H19.634L19.208 4.304H22.406L21.896 7.952H17.108L17.618 4.304H17.84ZM20.834 7.382L20.978 6.356H18.47L18.326 7.382H20.834ZM18.548 5.786H21.056L21.188 4.874H18.68L18.548 5.786ZM30.6135 6.914L30.1755 7.088L30.5355 7.964H29.5095L28.7835 6.014H28.7475L28.5555 7.394L29.1315 7.322L29.0475 7.892L27.4395 8.054L28.0335 3.848H30.9015L30.5955 6.014H29.7435L29.9595 6.548L30.7095 6.242L30.6135 6.914ZM26.1795 5.99L26.2215 5.666H25.8915L25.9695 5.114H27.5775L27.4995 5.666H27.1815L27.1395 5.99H27.5595L27.4815 6.548H27.0615L26.9535 7.298L27.3555 7.214L27.2835 7.736L25.8915 8.048L26.1015 6.548H25.6575L25.7355 5.99H26.1795ZM27.2475 3.74L27.0855 4.13H27.7695L27.6915 4.7H26.8575L26.7375 4.994H25.8795L26.3115 3.92L26.1795 3.74H27.2475ZM28.9275 4.712H29.7975L29.8455 4.382H28.9755L28.9275 4.712ZM29.6895 5.486L29.7315 5.162H28.8615L28.8195 5.486H29.6895Z' fill='white'/%3e%3c/svg%3e";

  var img$c = "data:image/svg+xml,%3csvg width='38' height='12' viewBox='0 0 38 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M33.743 1.59909H12.6687L11.8072 0.714432H4.49352L0.777721 4.54815L8.0914 11.9215L9.57469 10.4461L33.743 10.4381C35.6273 10.4623 37.1725 8.58556 37.2946 6.33799C37.4283 3.87443 35.818 1.58706 33.743 1.59909V1.59909ZM2.01628 4.54815L4.96533 1.59909H11.1584L14.1074 4.54815L8.0914 10.5638L2.01628 4.54815Z' fill='%23FCC12D'/%3e%3cpath d='M5.01321 3.95651L5.03264 3.89809C5.09105 3.70316 5.30541 3.58634 5.51963 3.64475C5.61703 3.68373 5.695 3.74215 5.73399 3.83955C5.77117 3.90667 5.78733 3.98341 5.78038 4.05983C5.77343 4.13625 5.74368 4.20881 5.695 4.26813C5.67544 4.26813 5.67544 4.28769 5.65602 4.30711C5.94821 4.48249 6.22098 4.65772 6.49362 4.81326C6.59102 4.87167 6.70798 4.95006 6.80538 5.00806C6.81364 5.0161 6.82369 5.02209 6.8347 5.02553C6.84571 5.02897 6.85737 5.02977 6.86875 5.02787C6.88012 5.02596 6.89089 5.02141 6.90018 5.01457C6.90946 5.00773 6.91701 4.9988 6.9222 4.9885L6.94176 4.96907C7.27295 4.38468 7.58471 3.80015 7.91576 3.19633C7.84691 3.16696 7.78813 3.11814 7.7466 3.05587C7.70508 2.9936 7.68262 2.92057 7.68197 2.84572C7.68197 2.72871 7.72096 2.63131 7.79893 2.55352C7.95474 2.39757 8.18853 2.41673 8.34434 2.55352L8.36376 2.57295C8.51971 2.76775 8.46116 3.00153 8.20795 3.1769C8.28593 3.33271 8.36376 3.48853 8.46116 3.62491C8.69495 4.05349 8.92873 4.48208 9.16252 4.8911C9.22093 4.9885 9.25992 5.00806 9.33789 4.94951C9.70724 4.73529 10.0587 4.5015 10.4287 4.28728L10.4871 4.24829C10.4093 4.18988 10.3703 4.09248 10.3503 3.99508C10.3308 3.78072 10.5061 3.60535 10.7009 3.58592C10.8763 3.5665 11.0321 3.68332 11.0905 3.8587C11.0905 3.91711 11.11 3.93653 11.11 3.9561V4.09289C11.0515 4.28769 10.9152 4.40451 10.7009 4.40451C10.7009 4.42394 10.6815 4.4435 10.6815 4.48249L10.0388 6.66507C10.0194 6.76247 9.98042 6.7819 9.88302 6.7819H6.24041C6.14301 6.7819 6.10361 6.76247 6.0846 6.66507C5.90923 6.08068 5.73399 5.49629 5.57845 4.89233C5.5396 4.73652 5.48105 4.58071 5.44166 4.40533C5.36869 4.40582 5.29673 4.3883 5.23216 4.35432C5.16759 4.32034 5.1124 4.27095 5.07148 4.21054C5.05206 4.15212 5.0325 4.13256 5.01307 4.09371V3.95651H5.01321ZM8.07157 7.15166H9.7859C9.94171 7.15166 10.0781 7.26862 10.0781 7.42443C10.0781 7.56123 9.9807 7.69707 9.84431 7.71663H6.35737C6.29744 7.71595 6.23916 7.69692 6.19038 7.66208C6.14161 7.62725 6.10469 7.5783 6.0846 7.52183C6.04561 7.40487 6.0846 7.26862 6.182 7.21007C6.23915 7.17056 6.30733 7.15012 6.3768 7.15166C6.94177 7.13223 7.5066 7.15166 8.07157 7.15166V7.15166Z' fill='%23FFF142'/%3e%3cpath d='M8.06185 2.44463C8.16443 2.44675 8.26219 2.48852 8.33463 2.56118L8.35405 2.58061C8.50986 2.77554 8.45145 3.00919 8.19824 3.18456C8.27621 3.34038 8.35405 3.49632 8.45145 3.63257C8.68524 4.06116 8.91902 4.48974 9.1528 4.8989C9.21122 4.9963 9.2502 5.01572 9.32804 4.95731C9.69821 4.74295 10.0488 4.5093 10.419 4.29494L10.4774 4.25595C10.3996 4.19754 10.3606 4.10014 10.3406 4.00274C10.3212 3.78852 10.4966 3.61315 10.6914 3.59372C10.8666 3.57416 11.0225 3.69112 11.081 3.86636C11.081 3.88592 11.1004 3.90535 11.1004 3.92477V4.06157C11.042 4.25636 10.9056 4.37333 10.6914 4.37333C10.6914 4.39275 10.6718 4.41231 10.6718 4.45116L10.0288 6.63306C10.0094 6.73046 9.97044 6.74989 9.87304 6.74989H8.06185V2.44463V2.44463ZM8.06185 7.11992H9.77619C9.932 7.11992 10.0684 7.23675 10.0684 7.39256C10.0684 7.52935 9.97098 7.66533 9.8346 7.68489H8.08128' fill='%23FFC41F'/%3e%3cpath d='M18.428 4.73L18.458 4.544H17.75L17.822 4.034H18.524L18.548 3.884L18.404 3.74H19.7L19.658 4.034H20.6L20.612 3.95L20.48 3.74H21.764L21.722 4.034H22.358L22.286 4.544H21.65L21.62 4.73H22.484L22.412 5.24H20.546L20.528 5.372H22.052L21.788 7.25H17.474L17.738 5.372H19.334L19.352 5.24H17.42L17.492 4.73H18.428ZM20.078 7.364H21.398L22.01 8.048H20.696L20.078 7.364ZM18.302 8.042H17.036L18.074 7.358H19.358L18.302 8.042ZM19.562 4.73H20.498L20.528 4.544H19.586L19.562 4.73ZM18.626 6.062H19.238L19.262 5.876H18.656L18.626 6.062ZM19.142 6.746L19.166 6.572H18.56L18.536 6.746H19.142ZM20.456 5.876L20.432 6.062H20.96L20.99 5.876H20.456ZM20.87 6.746L20.894 6.572H20.36L20.336 6.746H20.87ZM30.2715 5.444L30.2415 5.672H28.9875L28.9335 6.068H30.7575L30.6795 6.638H28.8555L28.7475 7.382H29.0295L29.4375 6.812H30.4635L30.0555 7.382H30.6855L30.6075 7.952H25.5915L25.6695 7.382H26.3715L26.1315 6.812H27.1575L27.3735 7.382H27.6075L27.7155 6.638H25.8915L25.9695 6.068H27.7935L27.8475 5.672H26.5935L26.6235 5.444H25.9455L27.0855 3.986L26.9655 3.848H30.1575L30.9675 5.444H30.2715ZM27.5235 5.102H29.4795L29.1375 4.418H28.0635L27.5235 5.102Z' fill='white'/%3e%3c/svg%3e";

  var img$b = "data:image/svg+xml,%3csvg width='37' height='12' viewBox='0 0 37 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M33.2936 1.59909H12.2193L11.3578 0.714432H4.04411L0.328308 4.54815L7.64199 11.9215L9.12527 10.4461L33.2936 10.4381C35.1779 10.4623 36.7231 8.58556 36.8451 6.33799C36.9789 3.87443 35.3686 1.58706 33.2936 1.59909V1.59909ZM1.56686 4.54815L4.51592 1.59909H10.709L13.658 4.54815L7.64199 10.5638L1.56686 4.54815Z' fill='%234CB4E7'/%3e%3cpath d='M10.0357 3.65063C9.95941 3.65513 9.88589 3.68056 9.82317 3.72413C9.76045 3.76771 9.71096 3.82773 9.68014 3.8976C9.64931 3.96748 9.63835 4.0445 9.64846 4.1202C9.65857 4.19589 9.68936 4.26734 9.73744 4.32668L9.69366 4.50889C9.64799 4.70064 9.53538 4.8698 9.3761 4.98594C9.21682 5.10207 9.02133 5.15755 8.82479 5.14239C8.62826 5.12724 8.44358 5.04244 8.30399 4.90327C8.1644 4.76409 8.07906 4.57966 8.06332 4.38317L8.02228 3.86677C8.13181 3.79453 8.21514 3.68891 8.25989 3.56558C8.30465 3.44224 8.30846 3.30777 8.27075 3.1821C8.23304 3.05643 8.15582 2.94627 8.05056 2.86795C7.94529 2.78963 7.81758 2.74734 7.68638 2.74734C7.55518 2.74734 7.42747 2.78963 7.3222 2.86795C7.21693 2.94627 7.13972 3.05643 7.10201 3.1821C7.0643 3.30777 7.06811 3.44224 7.11287 3.56558C7.15762 3.68891 7.24095 3.79453 7.35048 3.86677L7.30944 4.38317C7.2937 4.57966 7.20836 4.76409 7.06877 4.90327C6.92918 5.04244 6.7445 5.12724 6.54796 5.14239C6.35143 5.15755 6.15594 5.10207 5.99666 4.98594C5.83738 4.8698 5.72477 4.70064 5.6791 4.50889L5.63601 4.32668C5.68408 4.26735 5.71487 4.19591 5.72498 4.12023C5.7351 4.04454 5.72415 3.96753 5.69334 3.89766C5.66253 3.82779 5.61306 3.76777 5.55036 3.72418C5.48766 3.6806 5.41415 3.65515 5.33793 3.65063C5.24026 3.64425 5.14346 3.67246 5.06451 3.73032C4.98555 3.78817 4.92949 3.87197 4.90614 3.96702C4.88279 4.06207 4.89364 4.16231 4.9368 4.25016C4.97996 4.33801 5.05267 4.40786 5.14217 4.44747L5.51289 7.06671H9.85823V7.06534L10.2291 4.44747C10.3183 4.40788 10.3908 4.33823 10.4339 4.25066C10.477 4.16308 10.488 4.06316 10.465 3.9683C10.442 3.87344 10.3864 3.78968 10.3079 3.73163C10.2295 3.67357 10.1331 3.6449 10.0357 3.65063V3.65063Z' fill='%23C2FEFF'/%3e%3cpath d='M9.20353 7.90732H6.14613C6.06152 7.90736 5.97774 7.89072 5.89957 7.85836C5.8214 7.826 5.75037 7.77855 5.69055 7.71873C5.63072 7.6589 5.58328 7.58787 5.55091 7.5097C5.51855 7.43153 5.50192 7.34775 5.50195 7.26315H9.8477C9.84763 7.43397 9.77974 7.59777 9.65895 7.71857C9.53816 7.83936 9.37435 7.90725 9.20353 7.90732Z' fill='%2370C3ED'/%3e%3cpath d='M4.89581 4.06594C4.89581 4.14851 4.92029 4.22923 4.96617 4.29789C5.01204 4.36655 5.07725 4.42006 5.15354 4.45166C5.22983 4.48326 5.31377 4.49153 5.39476 4.47542C5.47575 4.45931 5.55014 4.41955 5.60853 4.36116C5.66692 4.30277 5.70668 4.22838 5.72279 4.14739C5.7389 4.0664 5.73063 3.98246 5.69903 3.90617C5.66743 3.82988 5.61392 3.76468 5.54526 3.7188C5.4766 3.67292 5.39588 3.64844 5.31331 3.64844C5.25848 3.64842 5.20418 3.65921 5.15352 3.68018C5.10285 3.70116 5.05682 3.73191 5.01805 3.77068C4.97928 3.80945 4.94852 3.85549 4.92755 3.90615C4.90657 3.95681 4.89579 4.01111 4.89581 4.06594Z' fill='%23C2FEFF'/%3e%3cpath d='M10.0357 3.65063C9.95942 3.65513 9.8859 3.68056 9.82317 3.72413C9.76045 3.7677 9.71096 3.82773 9.68014 3.8976C9.64932 3.96747 9.63836 4.04449 9.64846 4.12019C9.65857 4.19589 9.68936 4.26734 9.73744 4.32667L9.69366 4.50889C9.64799 4.70064 9.53538 4.8698 9.3761 4.98593C9.21683 5.10207 9.02133 5.15754 8.8248 5.14239C8.62826 5.12723 8.44358 5.04244 8.30399 4.90326C8.1644 4.76409 8.07906 4.57966 8.06332 4.38317L8.02228 3.86676C8.13325 3.79531 8.21795 3.68969 8.26358 3.56585C8.30922 3.442 8.31331 3.30668 8.27525 3.1803C8.23718 3.05393 8.15902 2.94338 8.05258 2.86535C7.94614 2.78732 7.81719 2.74605 7.68522 2.74777V7.06739H9.85823V7.06602L10.2291 4.44815C10.3183 4.40848 10.3908 4.33877 10.4339 4.25117C10.477 4.16356 10.488 4.06361 10.465 3.96872C10.442 3.87383 10.3864 3.79003 10.3079 3.7319C10.2295 3.67377 10.1331 3.64501 10.0357 3.65063V3.65063Z' fill='%2399FFFF'/%3e%3cpath d='M9.64496 4.06594C9.64496 4.14838 9.66941 4.22897 9.71521 4.29752C9.76101 4.36606 9.82611 4.41949 9.90227 4.45103C9.97844 4.48258 10.0622 4.49084 10.1431 4.47475C10.224 4.45867 10.2982 4.41897 10.3565 4.36068C10.4148 4.30239 10.4545 4.22812 10.4706 4.14726C10.4867 4.06641 10.4784 3.9826 10.4469 3.90643C10.4153 3.83027 10.3619 3.76517 10.2934 3.71937C10.2248 3.67357 10.1442 3.64912 10.0618 3.64912C10.007 3.64911 9.95283 3.65988 9.90225 3.68082C9.85167 3.70176 9.80572 3.73246 9.76701 3.77117C9.7283 3.80988 9.6976 3.85583 9.67666 3.90641C9.65572 3.95699 9.64495 4.0112 9.64496 4.06594V4.06594ZM7.07018 3.3468C7.07021 3.48271 7.11508 3.6148 7.19783 3.7226C7.28058 3.8304 7.39659 3.90789 7.52787 3.94303C7.65915 3.97818 7.79835 3.96904 7.9239 3.91701C8.04945 3.86498 8.15432 3.77298 8.22225 3.65527C8.29018 3.53757 8.31737 3.40074 8.29961 3.266C8.28185 3.13127 8.22013 3.00616 8.12402 2.91007C8.02791 2.81399 7.90278 2.75231 7.76804 2.73459C7.6333 2.71687 7.49648 2.7441 7.3788 2.81207C7.28494 2.86626 7.207 2.94421 7.15282 3.03808C7.09865 3.13195 7.07015 3.23842 7.07018 3.3468Z' fill='%23C2FEFF'/%3e%3cpath d='M7.67428 7.26314V7.90732H9.21898C9.30165 7.90744 9.38354 7.89125 9.45994 7.85967C9.53634 7.8281 9.60576 7.78175 9.66422 7.72329C9.72268 7.66483 9.76902 7.59541 9.8006 7.51901C9.83218 7.44261 9.84837 7.36073 9.84825 7.27805V7.2626L7.67428 7.26314Z' fill='%234CB4E7'/%3e%3cpath d='M5.61563 3.77771C5.56625 4.0327 5.3564 4.2539 5.05476 4.39097C5.12786 4.45032 5.21915 4.48273 5.31331 4.48276C5.39499 4.48281 5.4749 4.45888 5.54311 4.41395C5.61132 4.36901 5.66484 4.30503 5.69703 4.22996C5.72922 4.15488 5.73867 4.07201 5.7242 3.99162C5.70973 3.91123 5.67198 3.83685 5.61563 3.77771V3.77771ZM10.3655 3.78127C10.3083 4.0327 10.0949 4.24898 9.79325 4.38167C9.85354 4.43379 9.92755 4.46746 10.0065 4.47866C10.0854 4.48986 10.1658 4.47811 10.2382 4.44482C10.3106 4.41153 10.3719 4.35811 10.4148 4.29092C10.4577 4.22374 10.4803 4.14564 10.48 4.06594C10.479 3.96003 10.4381 3.85837 10.3655 3.78127V3.78127ZM8.11695 2.90468C8.13011 2.94191 8.13704 2.98106 8.13747 3.02054C8.13747 3.31083 7.7751 3.5468 7.32873 3.5468C7.25065 3.54699 7.17274 3.53938 7.09618 3.52409C7.12309 3.61453 7.17039 3.6976 7.23444 3.7669C7.29848 3.8362 7.37757 3.88989 7.46561 3.92384C7.55365 3.95779 7.64831 3.97109 7.7423 3.96273C7.83629 3.95437 7.92712 3.92457 8.00779 3.87561C8.08845 3.82665 8.15682 3.75985 8.20763 3.68033C8.25844 3.60082 8.29033 3.51071 8.30086 3.41693C8.31139 3.32316 8.30028 3.22822 8.26837 3.13942C8.23646 3.05061 8.18462 2.97031 8.11681 2.90468H8.11695Z' fill='%239CFFFF'/%3e%3cpath d='M5.10346 3.88373C5.11194 3.8985 5.13807 3.90138 5.17268 3.89153C5.20902 3.88025 5.24235 3.86094 5.27021 3.83503C5.29634 3.81027 5.30701 3.78619 5.29853 3.77142C5.29005 3.75665 5.26392 3.75377 5.22931 3.76362C5.19292 3.77479 5.15956 3.79411 5.13178 3.82012C5.10565 3.84488 5.09498 3.86964 5.10346 3.88373ZM10.1295 3.86882C10.1641 3.88865 10.2009 3.90001 10.2253 3.89714C10.2496 3.89426 10.2592 3.87881 10.2492 3.8561C10.2392 3.83339 10.2118 3.80671 10.1764 3.78688C10.141 3.76704 10.1051 3.75583 10.0807 3.7587C10.0562 3.76157 10.0467 3.77703 10.0566 3.79974C10.0664 3.82245 10.0942 3.84912 10.1295 3.86882V3.86882ZM7.4424 2.91384C7.4424 2.94709 7.54692 2.9739 7.67619 2.9739C7.80546 2.9739 7.90997 2.94654 7.90997 2.91384C7.90997 2.88115 7.80546 2.85379 7.67619 2.85379C7.54692 2.85379 7.4424 2.88129 7.4424 2.91384V2.91384Z' fill='white'/%3e%3cpath d='M7.87331 6.03964H7.5264C7.48856 6.03964 7.45227 6.02461 7.42551 5.99785C7.39875 5.97109 7.38372 5.9348 7.38372 5.89696C7.38372 5.85912 7.39875 5.82283 7.42551 5.79607C7.45227 5.76931 7.48856 5.75428 7.5264 5.75428H7.87331C7.91115 5.75428 7.94745 5.76931 7.9742 5.79607C8.00096 5.82283 8.01599 5.85912 8.01599 5.89696C8.01599 5.9348 8.00096 5.97109 7.9742 5.99785C7.94745 6.02461 7.91115 6.03964 7.87331 6.03964V6.03964Z' fill='%23B298E5'/%3e%3cpath d='M7.87331 5.7536H7.68686V6.04087H7.87331C7.91141 6.04087 7.94794 6.02574 7.97488 5.9988C8.00182 5.97187 8.01695 5.93533 8.01695 5.89724C8.01695 5.85914 8.00182 5.82261 7.97488 5.79567C7.94794 5.76873 7.91141 5.7536 7.87331 5.7536V5.7536Z' fill='%238F5EDD'/%3e%3cpath d='M20.204 5.648L20.45 3.902L20.306 3.74H21.506L21.41 4.412H22.358L22.274 4.988H21.332L21.236 5.648H22.166L21.842 7.946H19.082L19.406 5.648H20.204ZM17.762 5.972L17.804 5.654H17.45L17.534 5.06H19.31L19.226 5.654H18.782L18.74 5.972H19.184L19.1 6.572H18.656L18.554 7.292L19.058 7.19L18.974 7.778L17.474 8.042L17.678 6.572H17.162L17.246 5.972H17.762ZM18.782 3.74L18.59 4.154H19.544L19.46 4.736H18.326L18.224 4.958H17.39L17.87 3.92L17.702 3.74H18.782ZM20.912 7.4L21.074 6.236H20.33L20.168 7.4H20.912ZM30.9435 3.848L30.8655 4.418H28.5735L28.1415 5.102H30.7695L30.3675 7.952H26.4915L26.6355 6.926H25.6095L27.2055 4.418H26.0775L26.1555 3.848H30.9435ZM29.3055 7.382L29.5455 5.672H27.9495L27.7095 7.382H29.3055Z' fill='white'/%3e%3c/svg%3e";

  var img$a = "data:image/svg+xml,%3csvg width='37' height='12' viewBox='0 0 37 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M10.3329 7.7868C10.0239 9.29662 9.10174 10.4307 8.02365 10.5822C7.11628 10.7097 6.30946 10.1121 5.72547 9.67938C4.85162 9.03165 4.36941 8.25861 4.12468 7.7868C3.47258 7.36146 2.89101 6.83675 2.40105 6.2317C1.79148 5.4774 1.33978 4.91845 1.41611 4.22079C1.48903 3.55227 2.00899 3.09701 2.64728 2.5382C3.09156 2.14974 3.58905 1.82674 4.12468 1.57898H10.3329C12.2315 1.39841 13.8438 2.87157 13.8929 4.58973C13.9439 6.37041 12.3037 7.96833 10.3329 7.7868V7.7868Z' fill='black'/%3e%3cpath d='M3.85314 3.5955C3.80628 3.59461 3.7607 3.58005 3.72201 3.55359C3.68332 3.52713 3.65321 3.48994 3.63539 3.44659C3.61757 3.40324 3.61281 3.35562 3.6217 3.3096C3.63059 3.26358 3.65274 3.22117 3.68543 3.18757L4.83958 2.02481C4.88226 1.97849 4.9416 1.95104 5.00453 1.94847C5.06746 1.9459 5.12883 1.96844 5.17514 2.01113C5.17897 2.01455 5.18253 2.0181 5.18608 2.0218C5.23059 2.06681 5.25556 2.12757 5.25556 2.19088C5.25556 2.25418 5.23059 2.31494 5.18608 2.35996L4.02331 3.52273C4.00148 3.5459 3.97509 3.56433 3.94581 3.57685C3.91653 3.58937 3.88498 3.59572 3.85314 3.5955V3.5955ZM3.19652 4.255C3.13419 4.25445 3.07434 4.23053 3.0288 4.18797C2.98423 4.14298 2.95922 4.08221 2.95922 4.01889C2.95922 3.95556 2.98423 3.89479 3.0288 3.84981L3.12661 3.752C3.17088 3.70721 3.23111 3.68182 3.29408 3.68141C3.35705 3.681 3.41761 3.7056 3.46245 3.74981L3.46477 3.752C3.50928 3.79702 3.53425 3.85777 3.53425 3.92108C3.53425 3.98438 3.50928 4.04514 3.46477 4.09016L3.36697 4.18797C3.34451 4.21017 3.3179 4.22774 3.28865 4.23967C3.25941 4.25159 3.2281 4.25764 3.19652 4.25746V4.255Z' fill='white'/%3e%3cpath d='M10.7552 3.88893L10.7021 6.22514L7.70164 8.96914L10.7552 3.88893Z' fill='%23FF8A52'/%3e%3cpath d='M10.7552 3.88893L7.70164 8.96914L8.62665 5.05676L10.7552 3.88893Z' fill='%23FF8A52'/%3e%3cpath d='M10.3082 4.63228L10.3333 5.06825L9.96725 5.1967L10.3082 4.63228Z' fill='%23FF8B53'/%3e%3cpath d='M10.3082 4.63228L9.93648 4.81107L9.98121 5.1967L10.3082 4.63228Z' fill='%23FFA47B'/%3e%3cpath d='M7.70163 8.96914L4.69978 6.22514L4.6467 3.88893L7.70163 8.96914ZM6.77675 5.04308L7.70163 8.95546L4.6467 3.88893L6.77675 5.04308Z' fill='%23FF8A52'/%3e%3cpath d='M5.43479 5.1967L5.06872 5.06825L5.09389 4.63228L5.43479 5.1967Z' fill='%23FF8B53'/%3e%3cpath d='M5.43478 5.1967L5.47952 4.81107L5.09389 4.63228L5.43478 5.1967Z' fill='%23FFA47B'/%3e%3cpath d='M9.60119 2.83546L10.1913 5.30012L7.70164 8.96913L9.60119 2.83546Z' fill='%23FFCB71'/%3e%3cpath d='M9.60119 2.83546L7.70163 8.96913L7.65143 4.60711L9.60119 2.83546Z' fill='%23FFCB71'/%3e%3cpath d='M9.33567 3.68497L9.49216 4.17401L9.07589 4.52613L9.33567 3.68497Z' fill='%23FF8741'/%3e%3cpath d='M9.33566 3.68497L8.91091 3.96444L9.07589 4.52326L9.33566 3.68497Z' fill='%23FFE971'/%3e%3cpath d='M19.6937 5.89806L19.7362 6.07411L19.126 6.97328L19.2013 6.4767L19.6937 5.89806Z' fill='%23FFB259'/%3e%3cpath d='M7.70164 8.96913L5.21194 5.30012L5.80154 2.83546L7.70164 8.96913Z' fill='%23FFCB71'/%3e%3cpath d='M7.75129 4.60711L7.70164 8.96913L5.80085 2.83546L7.75129 4.60711Z' fill='%23FFCB71'/%3e%3cpath d='M6.32614 4.52613L5.9096 4.17401L6.06609 3.68497L6.32614 4.52613Z' fill='%23FF8741'/%3e%3cpath d='M6.32614 4.52612L6.49098 3.96717L6.06623 3.68784L6.32614 4.52612Z' fill='%23FFE971'/%3e%3cpath d='M7.39357 6.94318L7.70164 8.96914L5.21194 5.30012L5.38513 4.58194L7.39357 6.94318Z' fill='%23FFB259'/%3e%3cpath d='M7.70163 2.06707L6.30385 4.42831L7.70163 8.96913V2.06707Z' fill='%23FFFCB0'/%3e%3cpath d='M7.70164 2.06707V8.96913L9.11214 4.47852L7.70164 2.06707Z' fill='%23FFD96F'/%3e%3cpath d='M7.70163 3.19592L7.18755 3.93927L7.70163 4.56525V3.19592Z' fill='%23FF8BA5'/%3e%3cpath d='M7.70164 3.19592L8.18795 3.93927L7.70164 4.56525V3.19592Z' fill='%23F05A57'/%3e%3cpath d='M33.2936 1.59909H12.2193L11.3578 0.714432H4.04411L0.328308 4.54815L7.64199 11.9215L9.12527 10.4461L33.2936 10.4381C35.1779 10.4623 36.7231 8.58556 36.8451 6.33799C36.9789 3.87443 35.3686 1.58706 33.2936 1.59909V1.59909ZM1.56686 4.54815L4.51592 1.59909H10.709L13.658 4.54815L7.64199 10.5638L1.56686 4.54815Z' fill='%23FCC12D'/%3e%3cpath d='M19.81 8.036L20.092 7.706L20.122 7.49H19.102L19.024 8.036H18.226L18.544 5.774H21.166L20.902 7.64C20.886 7.756 20.848 7.852 20.788 7.928C20.728 8 20.642 8.036 20.53 8.036H19.81ZM19.558 4.592L19.582 4.418H18.622L18.682 3.956H19.636L19.48 3.746H20.596L20.566 3.956H21.532L21.472 4.418H20.5L20.476 4.592H21.448L21.382 5.048H20.416L20.392 5.216H21.358L21.292 5.672H18.448L18.514 5.216H19.474L19.498 5.048H18.538L18.604 4.592H19.558ZM16.93 5.786H16.276L16.354 5.216H17.014L17.188 3.98L17.116 3.74H17.974L17.764 5.216H18.334L18.256 5.786H17.68L17.362 8.048H16.612L16.93 5.786ZM18.088 7.832H17.596L17.722 5.948H18.232L18.088 7.832ZM16.366 5.948H16.834L16.456 7.832H15.988L16.366 5.948ZM18.604 3.956L18.34 5.102H17.848L18.106 3.956H18.604ZM17.014 3.962L16.96 5.102H16.486L16.534 3.962H17.014ZM19.246 6.464H20.266L20.296 6.242H19.276L19.246 6.464ZM19.156 7.088H20.176L20.206 6.866H19.186L19.156 7.088ZM28.0595 4.862L28.0235 5.102H29.6375L29.4755 6.236H29.8115L29.7335 6.8H28.3715L29.5595 8.048H28.1855L27.3575 7.106L26.1215 8.048H24.5435L26.2475 6.8H24.7235L24.8015 6.236H25.1375L25.2995 5.102H26.8835L26.9195 4.862H28.0595ZM29.3255 4.016H30.0095L29.9315 4.586H29.2475L29.2235 4.748H28.0835L28.1015 4.586H27.1955L27.1715 4.748H26.0315L26.0495 4.586H25.1435L25.2215 4.016H26.1275L26.1395 3.962L25.9475 3.734H27.3155L27.2735 4.016H28.1795L28.1915 3.962L27.9995 3.734H29.3675L29.3255 4.016ZM27.9515 5.612L27.8615 6.236H28.4435L28.5335 5.612H27.9515ZM26.1635 6.236H26.7275L26.8175 5.612H26.2535L26.1635 6.236Z' fill='white'/%3e%3c/svg%3e";

  var img$9 = "data:image/svg+xml,%3csvg width='47' height='13' viewBox='0 0 47 13' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M40.6435 12.1324H10.9269C11.2449 11.8971 13.7951 9.94004 13.8951 6.48275C14.0026 2.7676 11.1876 0.601875 10.9269 0.408775H40.6435C43.7545 0.549264 46.2353 3.11391 46.2804 6.18385C46.3266 9.31738 43.8198 11.9878 40.6435 12.1324Z' fill='%234DA5F7'/%3e%3cpath d='M6.61974 0.412247C5.60077 0.412174 4.59987 0.681413 3.71845 1.19269C2.83703 1.70397 2.1064 2.43912 1.60056 3.32367C1.09472 4.20823 0.831654 5.21076 0.838005 6.22971C0.844356 7.24867 1.1199 8.24784 1.63672 9.12602L6.63882 6.21623L6.61974 0.412247Z' fill='white'/%3e%3cpath d='M1.63672 9.12602C2.14968 9.99803 2.88249 10.7202 3.76193 11.2203C4.64136 11.7204 5.63664 11.981 6.64833 11.976C7.66001 11.971 8.65268 11.7007 9.52715 11.1919C10.4016 10.6832 11.1273 9.95389 11.6317 9.07688L6.63882 6.21622L1.63672 9.12602Z' fill='white'/%3e%3cpath d='M6.63882 0.408775C5.49536 0.408775 4.37758 0.74785 3.42683 1.38312C2.47608 2.01839 1.73505 2.92133 1.29747 3.97775C0.859889 5.03417 0.745397 6.19662 0.968475 7.31811C1.19155 8.4396 1.74218 9.46975 2.55073 10.2783C3.35928 11.0868 4.38943 11.6375 5.51092 11.8606C6.6324 12.0836 7.79486 11.9691 8.85128 11.5316C9.9077 11.094 10.8106 10.3529 11.4459 9.4022C12.0812 8.45145 12.4203 7.33367 12.4203 6.19021C12.4203 5.43098 12.2707 4.67918 11.9802 3.97775C11.6896 3.27631 11.2638 2.63897 10.7269 2.10212C10.1901 1.56526 9.55271 1.1394 8.85128 0.848861C8.14984 0.558316 7.39805 0.408775 6.63882 0.408775V0.408775ZM8.48888 8.80515L6.61974 7.82693L4.75176 8.80399L5.1079 6.75794L3.59547 5.33513L5.73056 4.979L6.61974 3.11159L7.59796 4.979L9.64401 5.33513L8.13158 6.75794L8.48888 8.80515Z' fill='%234DA5F7'/%3e%3cpath d='M17.088 6.83L17.13 6.506H15.546L15.618 5.996H16.35L16.212 5.546H17.316L17.454 5.996H18.06L18.324 5.546H19.434L19.164 5.996H19.938L19.866 6.506H18.276L18.234 6.83H20.1L20.028 7.334H18.162L18.06 8.054H16.914L17.016 7.334H15.144L15.216 6.83H17.088ZM17.346 4.916L17.388 4.616H15.822L15.888 4.13H17.454L17.478 3.962L17.286 3.734H18.672L18.612 4.13H20.196L20.13 4.616H18.546L18.504 4.916H20.37L20.304 5.402H15.42L15.486 4.916H17.346ZM20.7355 7.952L21.0475 7.358L21.3295 5.33H21.1015L21.1855 4.76H22.4395L22.1035 7.136L22.9255 7.382H25.7155L25.6375 7.952H22.4455L21.8515 7.778L21.7615 7.952H20.7355ZM25.3555 5.9L25.5235 7.154H24.6115L24.5875 6.998L22.4515 7.1L22.5235 6.584L23.0755 5.558H22.5535L22.6315 4.988H25.8235L25.7455 5.558H24.2155L23.6935 6.53L24.5215 6.494L24.4435 5.9H25.3555ZM25.7575 3.854L25.6795 4.418H22.9435L23.0215 3.854H25.7575ZM22.2235 3.848L22.4695 4.532H21.5575L21.3115 3.848H22.2235ZM27.4311 4.436L26.9271 8.036H26.1171L26.7051 3.848H28.5111L28.4271 4.43L28.1691 5.33H28.3731L28.3431 5.846L28.0131 7.382H27.1551L27.2271 6.872H27.4071L27.6231 5.846H27.3591L27.4311 5.33L27.6891 4.436H27.4311ZM28.8291 4.118L28.6311 3.848H31.4751L31.2891 5.174H28.6791L28.8291 4.118ZM30.3771 6.878L30.5211 5.876H29.2791L29.1351 6.866L28.7991 7.148H28.3071L28.5591 5.372H31.3851L31.1331 7.148H30.6771L30.3771 6.878ZM30.2991 8.036L29.6871 7.448L28.9491 8.036H28.0011L29.3571 6.902L29.4711 6.074H30.2811L30.1491 6.998L31.2051 8.036H30.2991ZM29.6391 4.316L29.5851 4.712H30.4851L30.5391 4.316H29.6391ZM36.9826 3.848L36.9046 4.418H34.6126L34.1806 5.102H36.8086L36.4066 7.952H32.5306L32.6746 6.926H31.6486L33.2446 4.418H32.1166L32.1946 3.848H36.9826ZM35.3446 7.382L35.5846 5.672H33.9886L33.7486 7.382H35.3446ZM38.3801 6.926H37.3841L37.4621 6.356H39.0281L39.2861 6.128H40.7021L40.4441 6.356H42.2501L42.1721 6.926H41.0681L42.1241 8.054H40.6481L39.7181 6.998L38.5241 8.054H37.1081L38.3801 6.926ZM41.3441 3.734L41.2001 3.962H42.5681L42.4601 4.76L41.5001 6.008H39.5381L39.6221 5.438H39.8681L39.7301 4.868H40.6601L40.7981 5.438H40.8701L41.4821 4.532H40.8521L40.7141 4.754H39.6521L40.2161 3.884L40.0901 3.734H41.3441ZM38.3501 5.714L37.5161 6.014L37.6121 5.348L38.4461 5.048L38.4701 4.844L37.7021 4.7L37.7921 4.07L38.5601 4.214L38.5961 3.974L38.4281 3.734H39.7001L39.3821 6.002H38.3141L38.3501 5.714Z' fill='white'/%3e%3c/svg%3e";

  var img$8 = "data:image/svg+xml,%3csvg width='47' height='13' viewBox='0 0 47 13' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M40.6435 12.6369H10.9269C11.2449 12.4016 13.7951 10.4446 13.8951 6.98728C14.0026 3.27502 11.1877 1.1093 10.9269 0.915619H40.6435C43.7545 1.05669 46.2353 3.62133 46.2804 6.69069C46.3266 9.82423 43.8198 12.4953 40.6435 12.6369Z' fill='%23A4A4A5'/%3e%3cpath d='M6.61974 0.995983L6.63881 6.79765L11.6317 9.65888C12.137 8.77986 12.4023 7.7834 12.4009 6.76948C12.3995 5.75555 12.1315 4.75982 11.6237 3.8822C11.116 3.00457 10.3863 2.2759 9.50804 1.76932C8.62974 1.26273 7.63366 0.996031 6.61974 0.995983V0.995983Z' fill='%23D3D3D3'/%3e%3cpath d='M6.61974 0.995983C5.60068 0.99585 4.59969 1.26508 3.71819 1.77638C2.83669 2.28769 2.10599 3.02291 1.60014 3.90755C1.09428 4.7922 0.831245 5.79483 0.83767 6.81387C0.844095 7.83291 1.11976 8.83214 1.63673 9.71034L6.63882 6.79765L6.61974 0.995983Z' fill='%23D3D3D3'/%3e%3cpath d='M1.63672 9.71033C2.14968 10.5823 2.88248 11.3045 3.76192 11.8046C4.64136 12.3047 5.63664 12.5653 6.64832 12.5603C7.66001 12.5554 8.65267 12.285 9.52715 11.7763C10.4016 11.2675 11.1273 10.5382 11.6317 9.66119L6.63881 6.79765L1.63672 9.71033Z' fill='%23D3D3D3'/%3e%3cpath d='M6.63882 0.915619C5.49536 0.915619 4.37758 1.25469 3.42683 1.88997C2.47608 2.52524 1.73505 3.42817 1.29747 4.48459C0.859889 5.54101 0.745397 6.70346 0.968475 7.82495C1.19155 8.94644 1.74218 9.97659 2.55073 10.7851C3.35928 11.5937 4.38943 12.1443 5.51092 12.3674C6.6324 12.5905 7.79486 12.476 8.85128 12.0384C9.9077 11.6008 10.8106 10.8598 11.4459 9.90904C12.0812 8.95829 12.4203 7.84051 12.4203 6.69705C12.4203 5.93782 12.2707 5.18603 11.9802 4.48459C11.6896 3.78316 11.2638 3.14582 10.7269 2.60896C10.1901 2.07211 9.55271 1.64625 8.85128 1.3557C8.14984 1.06516 7.39805 0.915619 6.63882 0.915619V0.915619ZM8.48888 9.31199L6.61974 8.33378L4.75176 9.31199L5.1079 7.26652L3.59547 5.84313L5.73056 5.48758L6.61974 3.61786L7.59796 5.48584L9.64401 5.8414L8.13158 7.26479L8.48888 9.31199Z' fill='%23A4A4A5'/%3e%3cpath d='M17.088 7.83L17.13 7.506H15.546L15.618 6.996H16.35L16.212 6.546H17.316L17.454 6.996H18.06L18.324 6.546H19.434L19.164 6.996H19.938L19.866 7.506H18.276L18.234 7.83H20.1L20.028 8.334H18.162L18.06 9.054H16.914L17.016 8.334H15.144L15.216 7.83H17.088ZM17.346 5.916L17.388 5.616H15.822L15.888 5.13H17.454L17.478 4.962L17.286 4.734H18.672L18.612 5.13H20.196L20.13 5.616H18.546L18.504 5.916H20.37L20.304 6.402H15.42L15.486 5.916H17.346ZM20.7355 8.952L21.0475 8.358L21.3295 6.33H21.1015L21.1855 5.76H22.4395L22.1035 8.136L22.9255 8.382H25.7155L25.6375 8.952H22.4455L21.8515 8.778L21.7615 8.952H20.7355ZM25.3555 6.9L25.5235 8.154H24.6115L24.5875 7.998L22.4515 8.1L22.5235 7.584L23.0755 6.558H22.5535L22.6315 5.988H25.8235L25.7455 6.558H24.2155L23.6935 7.53L24.5215 7.494L24.4435 6.9H25.3555ZM25.7575 4.854L25.6795 5.418H22.9435L23.0215 4.854H25.7575ZM22.2235 4.848L22.4695 5.532H21.5575L21.3115 4.848H22.2235ZM27.4311 5.436L26.9271 9.036H26.1171L26.7051 4.848H28.5111L28.4271 5.43L28.1691 6.33H28.3731L28.3431 6.846L28.0131 8.382H27.1551L27.2271 7.872H27.4071L27.6231 6.846H27.3591L27.4311 6.33L27.6891 5.436H27.4311ZM28.8291 5.118L28.6311 4.848H31.4751L31.2891 6.174H28.6791L28.8291 5.118ZM30.3771 7.878L30.5211 6.876H29.2791L29.1351 7.866L28.7991 8.148H28.3071L28.5591 6.372H31.3851L31.1331 8.148H30.6771L30.3771 7.878ZM30.2991 9.036L29.6871 8.448L28.9491 9.036H28.0011L29.3571 7.902L29.4711 7.074H30.2811L30.1491 7.998L31.2051 9.036H30.2991ZM29.6391 5.316L29.5851 5.712H30.4851L30.5391 5.316H29.6391ZM36.9826 4.848L36.9046 5.418H34.6126L34.1806 6.102H36.8086L36.4066 8.952H32.5306L32.6746 7.926H31.6486L33.2446 5.418H32.1166L32.1946 4.848H36.9826ZM35.3446 8.382L35.5846 6.672H33.9886L33.7486 8.382H35.3446ZM38.3801 7.926H37.3841L37.4621 7.356H39.0281L39.2861 7.128H40.7021L40.4441 7.356H42.2501L42.1721 7.926H41.0681L42.1241 9.054H40.6481L39.7181 7.998L38.5241 9.054H37.1081L38.3801 7.926ZM41.3441 4.734L41.2001 4.962H42.5681L42.4601 5.76L41.5001 7.008H39.5381L39.6221 6.438H39.8681L39.7301 5.868H40.6601L40.7981 6.438H40.8701L41.4821 5.532H40.8521L40.7141 5.754H39.6521L40.2161 4.884L40.0901 4.734H41.3441ZM38.3501 6.714L37.5161 7.014L37.6121 6.348L38.4461 6.048L38.4701 5.844L37.7021 5.7L37.7921 5.07L38.5601 5.214L38.5961 4.974L38.4281 4.734H39.7001L39.3821 7.002H38.3141L38.3501 6.714Z' fill='white'/%3e%3c/svg%3e";

  // 4 篇 白银
  // 8 篇 黄金
  // 16 篇，更文天数 >= 7 钻石
  // 32 篇，更文天数 >= 14 精英
  // 8 篇，幸运陨石奖
  // 综合文章评论、点赞、收藏

  var renderTipState = (({
    efficientArticles,
    dayCount,
    totalCount
  }) => {
    const articleCount = efficientArticles.length;
    const containerEl = document.createElement("div");
    let level = Math.min(calcMathPower(efficientArticles.length), 5);
    if (level === 5 && dayCount < 14) level--;
    if (level === 4 && dayCount < 7) level--;
    const levelReward = [{
      title: "木炭",
      count: 0,
      icon: img$f
    }, {
      title: "青铜",
      count: 2,
      icon: img$e
    }, {
      title: "白银",
      count: 4,
      icon: img$d
    }, {
      title: "黄金",
      count: 8,
      icon: img$c
    }, {
      title: "钻石",
      count: 16,
      days: 7,
      icon: img$b
    }, {
      title: "精英",
      count: 32,
      days: 14,
      icon: img$a
    }];
    const reward = levelReward[level];
    const rewardEl = document.createElement("p");
    const nextLevel = levelReward[level + 1];
    const nextLevelHTML = nextLevel ? `<tr style="color:#939aa3a3">
  <td style="text-align:left">${nextLevel ? `下一等级：${nextLevel.title}` : ""}</td>
    <td>${nextLevel ? `${nextLevel.count} 篇` : ""}</td>
    <td>${nextLevel.days ? `${nextLevel.days} 天` : "无限制"}</td>
  </tr>` : "";
    rewardEl.innerHTML = `
  <table style="width:100%;text-align:center;">
  <tr>
    <td style="text-align:left">
      <img style="width: 80px" src="${reward.icon}" />
    </td>
    <td style="font-weight:bold;font-size:16px;color:#939aa3">
      ${articleCount} 篇
    </td>
    <td style="font-weight:bold;font-size:16px;color:#939aa3">
      ${dayCount} 天
    </td>
  </tr>
  ${nextLevelHTML}
</table>
<p style="display:flex;align-items:center;color:#939aa3a3;justify-content:space-between"><img style="width: 80px" src="${articleCount < 8 ? img$8 : img$9}"/><span style="font-size:10px;margin-left:4px;">${articleCount < 8 ? "达到 8 篇即可参与抽奖" : "可参与抽奖"}</span></p>
<p>

</p>
  `;
    containerEl.appendChild(rewardEl);
    const countLocale = {
      view: "阅读量",
      comment: "评论量",
      digg: "点赞",
      collect: "收藏"
    };
    const countEl = document.createElement("p");
    countEl.style = "display:flex;";
    countEl.innerHTML = `
  ${Object.entries(totalCount).map(([key, count]) => {
    return `<div style="flex:1;text-align:center;">
      <div style="font-size: 16px">${count}</div>
      <div style="color: #939aa3a3;margin-top:4px">${countLocale[key]}</div>
      </div>`;
  }).join("")}
  `;
    containerEl.appendChild(countEl);
    profileStateRender.add({
      id: "activity_tips_post",
      title: "“小知识”",
      link: "https://juejin.cn/post/7008476801634680869",
      startTime: new Date(tips.startTimeStamp),
      endTime: new Date(tips.endTimeStamp),
      node: containerEl
    });
  });

  var img$7 = "data:image/svg+xml,%3csvg width='47' height='13' viewBox='0 0 47 13' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M40.6435 12.1324H10.9269C11.2449 11.8971 13.7951 9.94004 13.8951 6.48275C14.0026 2.7676 11.1877 0.601875 10.9269 0.408775H40.6435C43.7545 0.549264 46.2353 3.11391 46.2804 6.18385C46.3266 9.31738 43.8198 11.9878 40.6435 12.1324Z' fill='%234DA5F7'/%3e%3cpath d='M6.61974 0.412247C5.60076 0.412174 4.59987 0.681413 3.71845 1.19269C2.83703 1.70397 2.10639 2.43912 1.60056 3.32367C1.09472 4.20823 0.831652 5.21076 0.838003 6.22971C0.844354 7.24867 1.1199 8.24784 1.63672 9.12602L6.63882 6.21623L6.61974 0.412247Z' fill='white'/%3e%3cpath d='M1.63672 9.12602C2.14968 9.99803 2.88248 10.7202 3.76192 11.2203C4.64136 11.7204 5.63664 11.981 6.64832 11.976C7.66001 11.971 8.65267 11.7007 9.52715 11.1919C10.4016 10.6832 11.1273 9.95389 11.6317 9.07688L6.63881 6.21622L1.63672 9.12602Z' fill='white'/%3e%3cpath d='M6.63881 0.408775C5.49535 0.408775 4.37757 0.74785 3.42682 1.38312C2.47607 2.01839 1.73505 2.92133 1.29746 3.97775C0.859881 5.03417 0.745389 6.19662 0.968467 7.31811C1.19155 8.4396 1.74217 9.46975 2.55072 10.2783C3.35927 11.0868 4.38942 11.6375 5.51091 11.8606C6.6324 12.0836 7.79485 11.9691 8.85127 11.5316C9.90769 11.094 10.8106 10.3529 11.4459 9.4022C12.0812 8.45145 12.4202 7.33367 12.4202 6.19021C12.4202 5.43098 12.2707 4.67918 11.9802 3.97775C11.6896 3.27631 11.2638 2.63897 10.7269 2.10212C10.19 1.56526 9.55271 1.1394 8.85127 0.848861C8.14983 0.558316 7.39804 0.408775 6.63881 0.408775V0.408775ZM8.48887 8.80515L6.61973 7.82693L4.75175 8.80399L5.10789 6.75794L3.59547 5.33513L5.73055 4.979L6.61973 3.11159L7.59795 4.979L9.644 5.33513L8.13158 6.75794L8.48887 8.80515Z' fill='%234DA5F7'/%3e%3cpath d='M19.8397 4.412L19.4437 7.208H18.7657L19.1617 4.412H19.8397ZM20.9977 3.83L20.4517 7.73C20.4357 7.842 20.3837 7.924 20.2957 7.976C20.2077 8.024 20.1077 8.048 19.9957 8.048H19.0897L19.6057 7.532L20.0977 4.04L19.9537 3.83H20.9977ZM15.7117 8L16.0957 5.246H18.6217L18.4297 6.614C18.4137 6.726 18.3837 6.802 18.3397 6.842C18.2997 6.882 18.2217 6.902 18.1057 6.902H17.0257L17.5237 6.494L17.6257 5.756H16.9477L16.7257 7.34H18.4597L18.6937 7.172L18.5797 8H15.7117ZM16.7917 3.914L16.6657 3.746H18.4117L18.8617 5.18H17.8897L17.5537 4.328H17.5117L16.9417 5.18H15.9217L16.7917 3.914ZM23.3192 3.884L23.1932 3.734H24.2732L24.1472 4.19H26.4872L26.4092 4.76H25.1492L25.0592 5.39H26.0912L26.0132 5.954H24.9812L24.8912 6.584H26.0372L25.9592 7.154H24.8132L24.6872 8.054H23.6012L24.0632 4.76H23.9912L23.8052 5.444H22.8932L23.3192 3.884ZM22.8692 4.418L22.3532 8.054H21.2672L21.7532 4.64L21.3992 4.706L21.4952 4.022L22.9652 3.734L22.8692 4.418ZM30.3747 6.332L30.2907 8.054H29.5887L29.6007 7.868L28.3707 8.03L28.8627 4.484L28.5507 4.496L27.8427 8.048H26.8467L27.6027 4.19L27.4287 3.98L31.9467 3.812L31.8687 4.37L31.4607 4.388L31.6827 8.054H30.6447L30.4287 4.424L29.8347 4.448L29.4387 7.322L29.6427 7.298L29.7147 6.332H30.3747ZM32.3363 8.054L33.3923 6.188H32.8283L32.9123 5.612H37.0163L36.7283 7.658C36.7123 7.77 36.6583 7.864 36.5663 7.94C36.4783 8.016 36.3763 8.054 36.2603 8.054H35.0723L35.6123 7.496L35.7923 6.188H34.5323L33.4763 8.054H32.3363ZM33.6203 5.444H32.4803L33.7463 3.872L33.6323 3.734H35.0003L33.6203 5.444ZM36.5963 3.734L37.4963 5.444H36.3563L35.4563 3.734H36.5963ZM38.9778 6.926H37.9818L38.0598 6.356H39.6258L39.8838 6.128H41.2998L41.0418 6.356H42.8478L42.7698 6.926H41.6658L42.7218 8.054H41.2458L40.3158 6.998L39.1218 8.054H37.7058L38.9778 6.926ZM41.9418 3.734L41.7978 3.962H43.1658L43.0578 4.76L42.0978 6.008H40.1358L40.2198 5.438H40.4658L40.3278 4.868H41.2578L41.3958 5.438H41.4678L42.0798 4.532H41.4498L41.3118 4.754H40.2498L40.8138 3.884L40.6878 3.734H41.9418ZM38.9478 5.714L38.1138 6.014L38.2098 5.348L39.0438 5.048L39.0678 4.844L38.2998 4.7L38.3898 4.07L39.1578 4.214L39.1938 3.974L39.0258 3.734H40.2978L39.9798 6.002H38.9118L38.9478 5.714Z' fill='white'/%3e%3c/svg%3e";

  var img$6 = "data:image/svg+xml,%3csvg width='47' height='13' viewBox='0 0 47 13' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M40.6435 12.1324H10.9269C11.2449 11.8971 13.7951 9.94004 13.8951 6.48275C14.0026 2.7676 11.1877 0.601875 10.9269 0.408775H40.6435C43.7545 0.549264 46.2353 3.11391 46.2804 6.18385C46.3266 9.31738 43.8198 11.9878 40.6435 12.1324Z' fill='%234DA5F7'/%3e%3cpath d='M6.61974 0.412247C5.60076 0.412174 4.59987 0.681413 3.71845 1.19269C2.83703 1.70397 2.10639 2.43912 1.60056 3.32367C1.09472 4.20823 0.831652 5.21076 0.838003 6.22971C0.844354 7.24867 1.1199 8.24784 1.63672 9.12602L6.63882 6.21623L6.61974 0.412247Z' fill='white'/%3e%3cpath d='M1.63672 9.12602C2.14968 9.99803 2.88248 10.7202 3.76192 11.2203C4.64136 11.7204 5.63664 11.981 6.64832 11.976C7.66001 11.971 8.65267 11.7007 9.52715 11.1919C10.4016 10.6832 11.1273 9.95389 11.6317 9.07688L6.63881 6.21622L1.63672 9.12602Z' fill='white'/%3e%3cpath d='M6.63883 0.408775C5.49537 0.408775 4.37759 0.74785 3.42683 1.38312C2.47608 2.01839 1.73506 2.92133 1.29748 3.97775C0.859896 5.03417 0.745405 6.19662 0.968483 7.31811C1.19156 8.4396 1.74219 9.46975 2.55074 10.2783C3.35928 11.0868 4.38944 11.6375 5.51092 11.8606C6.63241 12.0836 7.79487 11.9691 8.85128 11.5316C9.9077 11.094 10.8106 10.3529 11.4459 9.4022C12.0812 8.45145 12.4203 7.33367 12.4203 6.19021C12.4203 5.43098 12.2707 4.67918 11.9802 3.97775C11.6896 3.27631 11.2638 2.63897 10.7269 2.10212C10.1901 1.56526 9.55272 1.1394 8.85128 0.848861C8.14985 0.558316 7.39805 0.408775 6.63883 0.408775V0.408775ZM8.48888 8.80515L6.61975 7.82693L4.75177 8.80399L5.1079 6.75794L3.59548 5.33513L5.73056 4.979L6.61975 3.11159L7.59797 4.979L9.64401 5.33513L8.13159 6.75794L8.48888 8.80515Z' fill='%234DA5F7'/%3e%3cpath d='M19.242 4.412L18.846 7.208H18.168L18.564 4.412H19.242ZM20.4 3.83L19.854 7.73C19.838 7.842 19.786 7.924 19.698 7.976C19.61 8.024 19.51 8.048 19.398 8.048H18.492L19.008 7.532L19.5 4.04L19.356 3.83H20.4ZM15.114 8L15.498 5.246H18.024L17.832 6.614C17.816 6.726 17.786 6.802 17.742 6.842C17.702 6.882 17.624 6.902 17.508 6.902H16.428L16.926 6.494L17.028 5.756H16.35L16.128 7.34H17.862L18.096 7.172L17.982 8H15.114ZM16.194 3.914L16.068 3.746H17.814L18.264 5.18H17.292L16.956 4.328H16.914L16.344 5.18H15.324L16.194 3.914ZM22.7215 3.884L22.5955 3.734H23.6755L23.5495 4.19H25.8895L25.8115 4.76H24.5515L24.4615 5.39H25.4935L25.4155 5.954H24.3835L24.2935 6.584H25.4395L25.3615 7.154H24.2155L24.0895 8.054H23.0035L23.4655 4.76H23.3935L23.2075 5.444H22.2955L22.7215 3.884ZM22.2715 4.418L21.7555 8.054H20.6695L21.1555 4.64L20.8015 4.706L20.8975 4.022L22.3675 3.734L22.2715 4.418ZM30.1731 3.848L29.3511 5.102H31.4271L31.3491 5.672H30.2811L31.1811 8.054H29.9271L29.0331 5.672H28.9791L27.4191 8.054H26.1651L27.7251 5.672H26.6751L26.7531 5.102H28.0971L28.8231 3.998L28.6911 3.848H30.1731ZM34.2646 7.958L34.8226 3.968L34.6066 3.74H35.9626L35.4646 7.274H36.5026L36.7786 7.04L36.6526 7.958H34.2646ZM33.9406 7.388L33.4306 6.812L33.2566 8.048H32.2786L32.4766 6.644H31.8526L33.1126 5.018H32.1466L32.2246 4.454H34.1866L34.0846 5.192L33.5626 5.858V5.888L34.0726 6.47L33.9406 7.388ZM33.8446 4.352H32.8786L32.7466 3.89L32.6146 3.746H33.6886L33.8446 4.352ZM39.1601 4.076H42.3521L42.0221 6.458C42.0021 6.574 41.9481 6.672 41.8601 6.752C41.7721 6.828 41.6701 6.866 41.5541 6.866H40.7081L40.9661 6.644L41.2481 4.646H38.8901L38.7281 4.988H40.8581L40.6361 6.584H38.8121L38.7161 7.268H41.9081L42.1661 7.04L42.0401 7.952H37.7081L38.0081 5.786H37.3241L38.2121 3.908L38.0681 3.734H39.3221L39.1601 4.076ZM38.9501 5.558L38.8901 6.014H39.8021L39.8681 5.558H38.9501Z' fill='white'/%3e%3c/svg%3e";

  var img$5 = "data:image/svg+xml,%3csvg width='47' height='13' viewBox='0 0 47 13' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M40.6435 12.1324H10.9269C11.2449 11.8971 13.7951 9.94004 13.8951 6.48275C14.0026 2.7676 11.1877 0.601875 10.9269 0.408775H40.6435C43.7545 0.549264 46.2353 3.11391 46.2804 6.18385C46.3266 9.31738 43.8198 11.9878 40.6435 12.1324Z' fill='%234DA5F7'/%3e%3cpath d='M6.61974 0.412247C5.60076 0.412174 4.59987 0.681413 3.71845 1.19269C2.83703 1.70397 2.10639 2.43912 1.60056 3.32367C1.09472 4.20823 0.831652 5.21076 0.838003 6.22971C0.844354 7.24867 1.1199 8.24784 1.63672 9.12602L6.63882 6.21623L6.61974 0.412247Z' fill='white'/%3e%3cpath d='M1.63672 9.12602C2.14968 9.99803 2.88248 10.7202 3.76192 11.2203C4.64136 11.7204 5.63664 11.981 6.64832 11.976C7.66001 11.971 8.65267 11.7007 9.52715 11.1919C10.4016 10.6832 11.1273 9.95389 11.6317 9.07688L6.63881 6.21622L1.63672 9.12602Z' fill='white'/%3e%3cpath d='M6.63883 0.408775C5.49537 0.408775 4.37759 0.74785 3.42683 1.38312C2.47608 2.01839 1.73506 2.92133 1.29748 3.97775C0.859896 5.03417 0.745405 6.19662 0.968483 7.31811C1.19156 8.4396 1.74219 9.46975 2.55074 10.2783C3.35928 11.0868 4.38944 11.6375 5.51092 11.8606C6.63241 12.0836 7.79487 11.9691 8.85128 11.5316C9.9077 11.094 10.8106 10.3529 11.4459 9.4022C12.0812 8.45145 12.4203 7.33367 12.4203 6.19021C12.4203 5.43098 12.2707 4.67918 11.9802 3.97775C11.6896 3.27631 11.2638 2.63897 10.7269 2.10212C10.1901 1.56526 9.55272 1.1394 8.85128 0.848861C8.14985 0.558316 7.39805 0.408775 6.63883 0.408775V0.408775ZM8.48888 8.80515L6.61975 7.82693L4.75177 8.80399L5.1079 6.75794L3.59548 5.33513L5.73056 4.979L6.61975 3.11159L7.59797 4.979L9.64401 5.33513L8.13159 6.75794L8.48888 8.80515Z' fill='%234DA5F7'/%3e%3cpath d='M19.242 4.412L18.846 7.208H18.168L18.564 4.412H19.242ZM20.4 3.83L19.854 7.73C19.838 7.842 19.786 7.924 19.698 7.976C19.61 8.024 19.51 8.048 19.398 8.048H18.492L19.008 7.532L19.5 4.04L19.356 3.83H20.4ZM15.114 8L15.498 5.246H18.024L17.832 6.614C17.816 6.726 17.786 6.802 17.742 6.842C17.702 6.882 17.624 6.902 17.508 6.902H16.428L16.926 6.494L17.028 5.756H16.35L16.128 7.34H17.862L18.096 7.172L17.982 8H15.114ZM16.194 3.914L16.068 3.746H17.814L18.264 5.18H17.292L16.956 4.328H16.914L16.344 5.18H15.324L16.194 3.914ZM22.7215 3.884L22.5955 3.734H23.6755L23.5495 4.19H25.8895L25.8115 4.76H24.5515L24.4615 5.39H25.4935L25.4155 5.954H24.3835L24.2935 6.584H25.4395L25.3615 7.154H24.2155L24.0895 8.054H23.0035L23.4655 4.76H23.3935L23.2075 5.444H22.2955L22.7215 3.884ZM22.2715 4.418L21.7555 8.054H20.6695L21.1555 4.64L20.8015 4.706L20.8975 4.022L22.3675 3.734L22.2715 4.418ZM28.0971 5.918L28.1331 5.672H27.5271L27.7611 4.004H28.3431L28.4871 3.866L28.3611 3.74H29.3331L29.0571 4.004H29.7171L29.4831 5.672H28.9071L28.8711 5.918H29.5911L29.5191 6.41H28.4991L28.4451 6.566H29.3991L29.2251 7.802C29.2171 7.874 29.1651 7.934 29.0691 7.982C28.9771 8.026 28.8731 8.048 28.7571 8.048H28.2231L28.4931 7.844L28.6071 7.046H28.2711L27.9231 8.048H27.1731L27.7491 6.41H27.4431L27.5151 5.918H28.0971ZM30.8931 3.746L30.7011 4.31H31.5591L31.4811 4.868H31.3731L31.2531 5.738L30.7491 6.674L31.2651 8.048H30.4911L30.3051 7.502L30.0171 8.048H29.2251L30.0051 6.596L29.6451 5.51H30.3231L30.4311 5.804L30.5931 5.504L30.6831 4.868H30.5151L30.3831 5.276H29.6391L30.1371 3.746H30.8931ZM26.0391 8.048L26.5371 6.368H27.3171L26.8191 8.048H26.0391ZM26.5731 6.128L26.5431 5.102H27.3231L27.3531 6.128H26.5731ZM26.7471 4.874L26.7171 3.848H27.4971L27.5271 4.874H26.7471ZM28.7871 5.246L28.8171 5.024H28.3731L28.3431 5.246H28.7871ZM28.4271 4.664H28.8711L28.9011 4.454H28.4571L28.4271 4.664ZM35.1226 5.09H34.9306L35.0086 4.514H35.2666L35.4106 3.932L35.2366 3.74H36.2806L36.0886 4.514H37.0606L36.6226 7.64C36.6066 7.756 36.5646 7.852 36.4966 7.928C36.4286 8 36.3366 8.036 36.2206 8.036H35.3026L35.8186 7.454L36.1486 5.09H35.9446L35.2186 8.042H34.4026L35.1226 5.09ZM33.6586 7.616L33.8806 6.044H33.6646L33.2026 8.054H32.4706L33.1246 5.222H33.0046L33.0826 4.67H34.7686L34.6906 5.222H33.8566L33.7786 5.558H34.6546L34.3606 7.64C34.3446 7.756 34.2906 7.854 34.1986 7.934C34.1106 8.01 34.0086 8.048 33.8926 8.048H33.2626L33.6586 7.616ZM34.9486 3.848L34.8706 4.406H33.0346L32.3386 8.036H31.5766L32.3026 4.064L32.1886 3.848H34.9486ZM41.8301 5.444L41.8001 5.672H40.5461L40.4921 6.068H42.3161L42.2381 6.638H40.4141L40.3061 7.382H40.5881L40.9961 6.812H42.0221L41.6141 7.382H42.2441L42.1661 7.952H37.1501L37.2281 7.382H37.9301L37.6901 6.812H38.7161L38.9321 7.382H39.1661L39.2741 6.638H37.4501L37.5281 6.068H39.3521L39.4061 5.672H38.1521L38.1821 5.444H37.5041L38.6441 3.986L38.5241 3.848H41.7161L42.5261 5.444H41.8301ZM39.0821 5.102H41.0381L40.6961 4.418H39.6221L39.0821 5.102Z' fill='white'/%3e%3c/svg%3e";

  var img$4 = "data:image/svg+xml,%3csvg width='47' height='13' viewBox='0 0 47 13' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M40.6434 12.6369H10.9269C11.2449 12.4016 13.795 10.4446 13.8951 6.98728C14.0026 3.27502 11.1876 1.1093 10.9269 0.915619H40.6434C43.7544 1.05669 46.2352 3.62133 46.2803 6.69069C46.3266 9.82423 43.8198 12.4953 40.6434 12.6369Z' fill='%23A4A4A5'/%3e%3cpath d='M6.61975 0.995983L6.63883 6.79765L11.6317 9.65888C12.137 8.77986 12.4023 7.7834 12.4009 6.76948C12.3995 5.75555 12.1315 4.75982 11.6237 3.8822C11.116 3.00457 10.3864 2.2759 9.50806 1.76932C8.62976 1.26273 7.63368 0.996031 6.61975 0.995983V0.995983Z' fill='%23D3D3D3'/%3e%3cpath d='M6.61971 0.995983C5.60065 0.99585 4.59966 1.26508 3.71816 1.77638C2.83666 2.28769 2.10596 3.02291 1.60011 3.90755C1.09425 4.7922 0.831214 5.79483 0.837639 6.81387C0.844064 7.83291 1.11973 8.83214 1.63669 9.71034L6.63879 6.79765L6.61971 0.995983Z' fill='%23D3D3D3'/%3e%3cpath d='M1.63672 9.71033C2.14968 10.5823 2.88248 11.3045 3.76192 11.8046C4.64136 12.3047 5.63664 12.5653 6.64832 12.5603C7.66001 12.5554 8.65267 12.285 9.52715 11.7763C10.4016 11.2675 11.1273 10.5382 11.6317 9.66119L6.63881 6.79765L1.63672 9.71033Z' fill='%23D3D3D3'/%3e%3cpath d='M6.6388 0.915619C5.49534 0.915619 4.37756 1.25469 3.4268 1.88997C2.47605 2.52524 1.73503 3.42817 1.29745 4.48459C0.859866 5.54101 0.745374 6.70346 0.968452 7.82495C1.19153 8.94644 1.74216 9.97659 2.55071 10.7851C3.35925 11.5937 4.38941 12.1443 5.51089 12.3674C6.63238 12.5905 7.79484 12.476 8.85125 12.0384C9.90767 11.6008 10.8106 10.8598 11.4459 9.90904C12.0812 8.95829 12.4202 7.84051 12.4202 6.69705C12.4202 5.93782 12.2707 5.18603 11.9801 4.48459C11.6896 3.78316 11.2637 3.14582 10.7269 2.60896C10.19 2.07211 9.55269 1.64625 8.85125 1.3557C8.14982 1.06516 7.39802 0.915619 6.6388 0.915619V0.915619ZM8.48885 9.31199L6.61972 8.33378L4.75174 9.31199L5.10787 7.26652L3.59545 5.84313L5.73053 5.48758L6.61972 3.61786L7.59794 5.48584L9.64398 5.8414L8.13156 7.26479L8.48885 9.31199Z' fill='%23A4A4A5'/%3e%3cpath d='M20.192 8.952L20.594 6.102L20.396 5.874H21.764L21.68 6.444H23.966L24.11 5.418H20.576L20.654 4.848H25.328L25.022 7.014H21.602L21.428 8.268L24.764 8.28L25.106 8.04L24.98 8.952H20.192ZM29.2635 5.874L28.8255 6.102H30.8835L30.8115 6.612H30.2115L30.7635 6.96H29.4555L28.9035 6.612H27.8415L27.1755 6.96H25.8615L26.5275 6.612H26.0235L26.0955 6.102H27.5115L27.9495 5.874H29.2635ZM29.6595 5.874L29.6055 5.7L26.2455 5.814L26.3295 5.244L26.9355 4.83L26.8575 4.734H28.2255L27.5295 5.208L29.4375 5.142L29.3475 4.848H30.4875L30.7995 5.874H29.6595ZM30.6735 7.584L25.8675 7.698L25.9395 7.182L30.7455 7.068L30.6735 7.584ZM30.5775 8.268L25.7715 8.382L25.8435 7.866L30.6495 7.752L30.5775 8.268ZM30.4815 8.952L25.6755 9.054L25.7475 8.556L30.5535 8.436L30.4815 8.952ZM36.5831 5.076L36.0431 8.928H33.8831L34.4231 5.076H36.5831ZM31.9391 5.88H31.5251L31.6091 5.298H32.1131L32.1971 5.01L32.0171 4.8H33.2411L33.0971 5.298H34.2131L33.7451 8.646C33.7251 8.758 33.6711 8.852 33.5831 8.928C33.4951 9.004 33.3931 9.042 33.2771 9.042H32.2871L32.8151 8.49L33.1811 5.88H32.9291L32.0171 9.042H31.0211L31.9391 5.88ZM35.2211 8.268L35.5751 5.73H35.2511L34.8971 8.268H35.2211Z' fill='white'/%3e%3c/svg%3e";

  var img$3 = "data:image/svg+xml,%3csvg width='47' height='13' viewBox='0 0 47 13' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M40.6434 12.1324H10.9269C11.2449 11.8971 13.795 9.94004 13.8951 6.48275C14.0026 2.7676 11.1876 0.601875 10.9269 0.408775H40.6434C43.7544 0.549264 46.2352 3.11391 46.2803 6.18385C46.3266 9.31738 43.8198 11.9878 40.6434 12.1324Z' fill='%234DA5F7'/%3e%3cpath d='M6.61974 0.412247C5.60076 0.412174 4.59987 0.681413 3.71845 1.19269C2.83703 1.70397 2.10639 2.43912 1.60056 3.32367C1.09472 4.20823 0.831652 5.21076 0.838003 6.22971C0.844354 7.24867 1.1199 8.24784 1.63672 9.12602L6.63882 6.21623L6.61974 0.412247Z' fill='white'/%3e%3cpath d='M1.63672 9.12602C2.14968 9.99803 2.88248 10.7202 3.76192 11.2203C4.64136 11.7204 5.63664 11.981 6.64832 11.976C7.66001 11.971 8.65267 11.7007 9.52715 11.1919C10.4016 10.6832 11.1273 9.95389 11.6317 9.07688L6.63881 6.21622L1.63672 9.12602Z' fill='white'/%3e%3cpath d='M6.6388 0.408775C5.49534 0.408775 4.37756 0.74785 3.4268 1.38312C2.47605 2.01839 1.73503 2.92133 1.29745 3.97775C0.859866 5.03417 0.745374 6.19662 0.968452 7.31811C1.19153 8.4396 1.74216 9.46975 2.55071 10.2783C3.35925 11.0868 4.38941 11.6375 5.51089 11.8606C6.63238 12.0836 7.79484 11.9691 8.85125 11.5316C9.90767 11.094 10.8106 10.3529 11.4459 9.4022C12.0812 8.45145 12.4202 7.33367 12.4202 6.19021C12.4202 5.43098 12.2707 4.67918 11.9801 3.97775C11.6896 3.27631 11.2637 2.63897 10.7269 2.10212C10.19 1.56526 9.55269 1.1394 8.85125 0.848861C8.14982 0.558316 7.39802 0.408775 6.6388 0.408775V0.408775ZM8.48885 8.80515L6.61972 7.82693L4.75174 8.80399L5.10787 6.75794L3.59545 5.33513L5.73053 4.979L6.61972 3.11159L7.59794 4.979L9.64398 5.33513L8.13156 6.75794L8.48885 8.80515Z' fill='%234DA5F7'/%3e%3cpath d='M20.192 7.952L20.594 5.102L20.396 4.874H21.764L21.68 5.444H23.966L24.11 4.418H20.576L20.654 3.848H25.328L25.022 6.014H21.602L21.428 7.268L24.764 7.28L25.106 7.04L24.98 7.952H20.192ZM29.2635 4.874L28.8255 5.102H30.8835L30.8115 5.612H30.2115L30.7635 5.96H29.4555L28.9035 5.612H27.8415L27.1755 5.96H25.8615L26.5275 5.612H26.0235L26.0955 5.102H27.5115L27.9495 4.874H29.2635ZM29.6595 4.874L29.6055 4.7L26.2455 4.814L26.3295 4.244L26.9355 3.83L26.8575 3.734H28.2255L27.5295 4.208L29.4375 4.142L29.3475 3.848H30.4875L30.7995 4.874H29.6595ZM30.6735 6.584L25.8675 6.698L25.9395 6.182L30.7455 6.068L30.6735 6.584ZM30.5775 7.268L25.7715 7.382L25.8435 6.866L30.6495 6.752L30.5775 7.268ZM30.4815 7.952L25.6755 8.054L25.7475 7.556L30.5535 7.436L30.4815 7.952ZM36.5831 4.076L36.0431 7.928H33.8831L34.4231 4.076H36.5831ZM31.9391 4.88H31.5251L31.6091 4.298H32.1131L32.1971 4.01L32.0171 3.8H33.2411L33.0971 4.298H34.2131L33.7451 7.646C33.7251 7.758 33.6711 7.852 33.5831 7.928C33.4951 8.004 33.3931 8.042 33.2771 8.042H32.2871L32.8151 7.49L33.1811 4.88H32.9291L32.0171 8.042H31.0211L31.9391 4.88ZM35.2211 7.268L35.5751 4.73H35.2511L34.8971 7.268H35.2211Z' fill='white'/%3e%3c/svg%3e";

  var img$2 = "data:image/svg+xml,%3csvg width='47' height='13' viewBox='0 0 47 13' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M39.8059 11.7213H10.0894C10.4073 11.486 12.9575 9.52896 13.0575 6.07166C13.1651 2.3594 10.3501 0.193678 10.0894 0H39.8059C42.9169 0.141067 45.3977 2.70571 45.4428 5.77507C45.4891 8.90861 42.9822 11.5796 39.8059 11.7213Z' fill='%23A4A4A5'/%3e%3cpath d='M5.78223 0.0803604L5.80131 5.88203L10.7941 8.74326C11.2995 7.86424 11.5648 6.86778 11.5634 5.85385C11.562 4.83993 11.294 3.8442 10.7862 2.96657C10.2785 2.08894 9.54884 1.36028 8.67054 0.853694C7.79223 0.347106 6.79615 0.0804083 5.78223 0.0803604V0.0803604Z' fill='%23D3D3D3'/%3e%3cpath d='M5.78219 0.0803605C4.76313 0.0802275 3.76214 0.349453 2.88064 0.86076C1.99913 1.37207 1.26844 2.10729 0.762584 2.99193C0.25673 3.87657 -0.00631009 4.87921 0.000114943 5.89824C0.00653998 6.91728 0.282201 7.91652 0.79917 8.79471L5.80127 5.88203L5.78219 0.0803605Z' fill='%23D3D3D3'/%3e%3cpath d='M0.799194 8.79471C1.31216 9.66672 2.04496 10.3889 2.9244 10.889C3.80384 11.3891 4.79911 11.6497 5.8108 11.6447C6.82248 11.6397 7.81515 11.3694 8.68963 10.8606C9.5641 10.3519 10.2898 9.62258 10.7941 8.74557L5.80129 5.88203L0.799194 8.79471Z' fill='%23D3D3D3'/%3e%3cpath d='M5.80127 0C4.65781 0 3.54003 0.339075 2.58928 0.974347C1.63853 1.60962 0.897507 2.51256 0.459924 3.56897C0.0223414 4.62539 -0.0921502 5.78785 0.130928 6.90933C0.354005 8.03082 0.904634 9.06097 1.71318 9.86952C2.52173 10.6781 3.55188 11.2287 4.67337 11.4518C5.79486 11.6749 6.95731 11.5604 8.01373 11.1228C9.07015 10.6852 9.97308 9.94418 10.6084 8.99342C11.2436 8.04267 11.5827 6.92489 11.5827 5.78143C11.5827 5.0222 11.4332 4.27041 11.1426 3.56897C10.8521 2.86754 10.4262 2.2302 9.88936 1.69334C9.35251 1.15649 8.71517 0.730629 8.01373 0.440085C7.31229 0.149541 6.5605 0 5.80127 0V0ZM7.65133 8.39637L5.78219 7.41816L3.91421 8.39637L4.27035 6.3509L2.75793 4.92751L4.89301 4.57196L5.78219 2.70224L6.76041 4.57022L8.80646 4.92578L7.29404 6.34917L7.65133 8.39637Z' fill='%23A4A4A5'/%3e%3cpath d='M18.242 4.412L17.846 7.208H17.168L17.564 4.412H18.242ZM19.4 3.83L18.854 7.73C18.838 7.842 18.786 7.924 18.698 7.976C18.61 8.024 18.51 8.048 18.398 8.048H17.492L18.008 7.532L18.5 4.04L18.356 3.83H19.4ZM14.114 8L14.498 5.246H17.024L16.832 6.614C16.816 6.726 16.786 6.802 16.742 6.842C16.702 6.882 16.624 6.902 16.508 6.902H15.428L15.926 6.494L16.028 5.756H15.35L15.128 7.34H16.862L17.096 7.172L16.982 8H14.114ZM15.194 3.914L15.068 3.746H16.814L17.264 5.18H16.292L15.956 4.328H15.914L15.344 5.18H14.324L15.194 3.914ZM21.7215 3.884L21.5955 3.734H22.6755L22.5495 4.19H24.8895L24.8115 4.76H23.5515L23.4615 5.39H24.4935L24.4155 5.954H23.3835L23.2935 6.584H24.4395L24.3615 7.154H23.2155L23.0895 8.054H22.0035L22.4655 4.76H22.3935L22.2075 5.444H21.2955L21.7215 3.884ZM21.2715 4.418L20.7555 8.054H19.6695L20.1555 4.64L19.8015 4.706L19.8975 4.022L21.3675 3.734L21.2715 4.418ZM28.7771 6.332L28.6931 8.054H27.9911L28.0031 7.868L26.7731 8.03L27.2651 4.484L26.9531 4.496L26.2451 8.048H25.2491L26.0051 4.19L25.8311 3.98L30.3491 3.812L30.2711 4.37L29.8631 4.388L30.0851 8.054H29.0471L28.8311 4.424L28.2371 4.448L27.8411 7.322L28.0451 7.298L28.1171 6.332H28.7771ZM30.7386 8.054L31.7946 6.188H31.2306L31.3146 5.612H35.4186L35.1306 7.658C35.1146 7.77 35.0606 7.864 34.9686 7.94C34.8806 8.016 34.7786 8.054 34.6626 8.054H33.4746L34.0146 7.496L34.1946 6.188H32.9346L31.8786 8.054H30.7386ZM32.0226 5.444H30.8826L32.1486 3.872L32.0346 3.734H33.4026L32.0226 5.444ZM34.9986 3.734L35.8986 5.444H34.7586L33.8586 3.734H34.9986ZM37.3801 6.926H36.3841L36.4621 6.356H38.0281L38.2861 6.128H39.7021L39.4441 6.356H41.2501L41.1721 6.926H40.0681L41.1241 8.054H39.6481L38.7181 6.998L37.5241 8.054H36.1081L37.3801 6.926ZM40.3441 3.734L40.2001 3.962H41.5681L41.4601 4.76L40.5001 6.008H38.5381L38.6221 5.438H38.8681L38.7301 4.868H39.6601L39.7981 5.438H39.8701L40.4821 4.532H39.8521L39.7141 4.754H38.6521L39.2161 3.884L39.0901 3.734H40.3441ZM37.3501 5.714L36.5161 6.014L36.6121 5.348L37.4461 5.048L37.4701 4.844L36.7021 4.7L36.7921 4.07L37.5601 4.214L37.5961 3.974L37.4281 3.734H38.7001L38.3821 6.002H37.3141L37.3501 5.714Z' fill='white'/%3e%3c/svg%3e";

  var img$1 = "data:image/svg+xml,%3csvg width='47' height='13' viewBox='0 0 47 13' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M39.8059 11.7213H10.0894C10.4073 11.486 12.9575 9.52896 13.0575 6.07166C13.1651 2.3594 10.3501 0.193678 10.0894 0H39.8059C42.9169 0.141067 45.3977 2.70571 45.4428 5.77507C45.4891 8.90861 42.9822 11.5796 39.8059 11.7213Z' fill='%23A4A4A5'/%3e%3cpath d='M5.78223 0.0803623L5.80131 5.88203L10.7941 8.74326C11.2995 7.86424 11.5648 6.86778 11.5634 5.85386C11.562 4.83993 11.294 3.8442 10.7862 2.96658C10.2785 2.08895 9.54884 1.36028 8.67054 0.853696C7.79223 0.347107 6.79615 0.0804102 5.78223 0.0803623V0.0803623Z' fill='%23D3D3D3'/%3e%3cpath d='M5.78219 0.0803624C4.76313 0.0802294 3.76214 0.349455 2.88064 0.860761C1.99913 1.37207 1.26844 2.10729 0.762584 2.99193C0.25673 3.87657 -0.00631009 4.87921 0.000114943 5.89825C0.00653998 6.91729 0.282201 7.91652 0.79917 8.79472L5.80127 5.88203L5.78219 0.0803624Z' fill='%23D3D3D3'/%3e%3cpath d='M0.799194 8.79471C1.31216 9.66672 2.04496 10.3889 2.9244 10.889C3.80384 11.3891 4.79911 11.6497 5.8108 11.6447C6.82248 11.6397 7.81515 11.3694 8.68963 10.8606C9.5641 10.3519 10.2898 9.62258 10.7941 8.74557L5.80129 5.88203L0.799194 8.79471Z' fill='%23D3D3D3'/%3e%3cpath d='M5.80127 0C4.65781 0 3.54003 0.339075 2.58928 0.974347C1.63853 1.60962 0.897507 2.51256 0.459924 3.56897C0.0223414 4.62539 -0.0921502 5.78785 0.130928 6.90933C0.354005 8.03082 0.904634 9.06097 1.71318 9.86952C2.52173 10.6781 3.55188 11.2287 4.67337 11.4518C5.79486 11.6749 6.95731 11.5604 8.01373 11.1228C9.07015 10.6852 9.97308 9.94418 10.6084 8.99342C11.2436 8.04267 11.5827 6.92489 11.5827 5.78143C11.5827 5.0222 11.4332 4.27041 11.1426 3.56897C10.8521 2.86754 10.4262 2.2302 9.88936 1.69334C9.35251 1.15649 8.71517 0.730629 8.01373 0.440085C7.31229 0.149541 6.5605 0 5.80127 0V0ZM7.65133 8.39637L5.78219 7.41816L3.91421 8.39637L4.27035 6.3509L2.75793 4.92751L4.89301 4.57196L5.78219 2.70224L6.76041 4.57022L8.80646 4.92578L7.29404 6.34917L7.65133 8.39637Z' fill='%23A4A4A5'/%3e%3cpath d='M18.242 4.412L17.846 7.208H17.168L17.564 4.412H18.242ZM19.4 3.83L18.854 7.73C18.838 7.842 18.786 7.924 18.698 7.976C18.61 8.024 18.51 8.048 18.398 8.048H17.492L18.008 7.532L18.5 4.04L18.356 3.83H19.4ZM14.114 8L14.498 5.246H17.024L16.832 6.614C16.816 6.726 16.786 6.802 16.742 6.842C16.702 6.882 16.624 6.902 16.508 6.902H15.428L15.926 6.494L16.028 5.756H15.35L15.128 7.34H16.862L17.096 7.172L16.982 8H14.114ZM15.194 3.914L15.068 3.746H16.814L17.264 5.18H16.292L15.956 4.328H15.914L15.344 5.18H14.324L15.194 3.914ZM21.7215 3.884L21.5955 3.734H22.6755L22.5495 4.19H24.8895L24.8115 4.76H23.5515L23.4615 5.39H24.4935L24.4155 5.954H23.3835L23.2935 6.584H24.4395L24.3615 7.154H23.2155L23.0895 8.054H22.0035L22.4655 4.76H22.3935L22.2075 5.444H21.2955L21.7215 3.884ZM21.2715 4.418L20.7555 8.054H19.6695L20.1555 4.64L19.8015 4.706L19.8975 4.022L21.3675 3.734L21.2715 4.418ZM29.1731 3.848L28.3511 5.102H30.4271L30.3491 5.672H29.2811L30.1811 8.054H28.9271L28.0331 5.672H27.9791L26.4191 8.054H25.1651L26.7251 5.672H25.6751L25.7531 5.102H27.0971L27.8231 3.998L27.6911 3.848H29.1731ZM33.2646 7.958L33.8226 3.968L33.6066 3.74H34.9626L34.4646 7.274H35.5026L35.7786 7.04L35.6526 7.958H33.2646ZM32.9406 7.388L32.4306 6.812L32.2566 8.048H31.2786L31.4766 6.644H30.8526L32.1126 5.018H31.1466L31.2246 4.454H33.1866L33.0846 5.192L32.5626 5.858V5.888L33.0726 6.47L32.9406 7.388ZM32.8446 4.352H31.8786L31.7466 3.89L31.6146 3.746H32.6886L32.8446 4.352ZM38.1601 4.076H41.3521L41.0221 6.458C41.0021 6.574 40.9481 6.672 40.8601 6.752C40.7721 6.828 40.6701 6.866 40.5541 6.866H39.7081L39.9661 6.644L40.2481 4.646H37.8901L37.7281 4.988H39.8581L39.6361 6.584H37.8121L37.7161 7.268H40.9081L41.1661 7.04L41.0401 7.952H36.7081L37.0081 5.786H36.3241L37.2121 3.908L37.0681 3.734H38.3221L38.1601 4.076ZM37.9501 5.558L37.8901 6.014H38.8021L38.8681 5.558H37.9501Z' fill='white'/%3e%3c/svg%3e";

  var img = "data:image/svg+xml,%3csvg width='47' height='13' viewBox='0 0 47 13' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M39.8059 11.7213H10.0894C10.4073 11.486 12.9575 9.52896 13.0575 6.07166C13.1651 2.3594 10.3501 0.193678 10.0894 0H39.8059C42.9169 0.141067 45.3977 2.70571 45.4428 5.77507C45.4891 8.90861 42.9822 11.5796 39.8059 11.7213Z' fill='%23A4A4A5'/%3e%3cpath d='M5.78223 0.0803623L5.80131 5.88203L10.7941 8.74326C11.2995 7.86424 11.5648 6.86778 11.5634 5.85386C11.562 4.83993 11.294 3.8442 10.7862 2.96658C10.2785 2.08895 9.54884 1.36028 8.67054 0.853696C7.79223 0.347107 6.79615 0.0804102 5.78223 0.0803623V0.0803623Z' fill='%23D3D3D3'/%3e%3cpath d='M5.78219 0.0803624C4.76313 0.0802294 3.76214 0.349455 2.88064 0.860761C1.99913 1.37207 1.26844 2.10729 0.762584 2.99193C0.25673 3.87657 -0.00631009 4.87921 0.000114943 5.89825C0.00653998 6.91729 0.282201 7.91652 0.79917 8.79472L5.80127 5.88203L5.78219 0.0803624Z' fill='%23D3D3D3'/%3e%3cpath d='M0.799194 8.79471C1.31216 9.66672 2.04496 10.3889 2.9244 10.889C3.80384 11.3891 4.79911 11.6497 5.8108 11.6447C6.82248 11.6397 7.81515 11.3694 8.68963 10.8606C9.5641 10.3519 10.2898 9.62258 10.7941 8.74557L5.80129 5.88203L0.799194 8.79471Z' fill='%23D3D3D3'/%3e%3cpath d='M5.80127 0C4.65781 0 3.54003 0.339075 2.58928 0.974347C1.63853 1.60962 0.897507 2.51256 0.459924 3.56897C0.0223414 4.62539 -0.0921502 5.78785 0.130928 6.90933C0.354005 8.03082 0.904634 9.06097 1.71318 9.86952C2.52173 10.6781 3.55188 11.2287 4.67337 11.4518C5.79486 11.6749 6.95731 11.5604 8.01373 11.1228C9.07015 10.6852 9.97308 9.94418 10.6084 8.99342C11.2436 8.04267 11.5827 6.92489 11.5827 5.78143C11.5827 5.0222 11.4332 4.27041 11.1426 3.56897C10.8521 2.86754 10.4262 2.2302 9.88936 1.69334C9.35251 1.15649 8.71517 0.730629 8.01373 0.440085C7.31229 0.149541 6.5605 0 5.80127 0V0ZM7.65133 8.39637L5.78219 7.41816L3.91421 8.39637L4.27035 6.3509L2.75793 4.92751L4.89301 4.57196L5.78219 2.70224L6.76041 4.57022L8.80646 4.92578L7.29404 6.34917L7.65133 8.39637Z' fill='%23A4A4A5'/%3e%3cpath d='M18.242 4.412L17.846 7.208H17.168L17.564 4.412H18.242ZM19.4 3.83L18.854 7.73C18.838 7.842 18.786 7.924 18.698 7.976C18.61 8.024 18.51 8.048 18.398 8.048H17.492L18.008 7.532L18.5 4.04L18.356 3.83H19.4ZM14.114 8L14.498 5.246H17.024L16.832 6.614C16.816 6.726 16.786 6.802 16.742 6.842C16.702 6.882 16.624 6.902 16.508 6.902H15.428L15.926 6.494L16.028 5.756H15.35L15.128 7.34H16.862L17.096 7.172L16.982 8H14.114ZM15.194 3.914L15.068 3.746H16.814L17.264 5.18H16.292L15.956 4.328H15.914L15.344 5.18H14.324L15.194 3.914ZM21.7215 3.884L21.5955 3.734H22.6755L22.5495 4.19H24.8895L24.8115 4.76H23.5515L23.4615 5.39H24.4935L24.4155 5.954H23.3835L23.2935 6.584H24.4395L24.3615 7.154H23.2155L23.0895 8.054H22.0035L22.4655 4.76H22.3935L22.2075 5.444H21.2955L21.7215 3.884ZM21.2715 4.418L20.7555 8.054H19.6695L20.1555 4.64L19.8015 4.706L19.8975 4.022L21.3675 3.734L21.2715 4.418ZM27.0971 5.918L27.1331 5.672H26.5271L26.7611 4.004H27.3431L27.4871 3.866L27.3611 3.74H28.3331L28.0571 4.004H28.7171L28.4831 5.672H27.9071L27.8711 5.918H28.5911L28.5191 6.41H27.4991L27.4451 6.566H28.3991L28.2251 7.802C28.2171 7.874 28.1651 7.934 28.0691 7.982C27.9771 8.026 27.8731 8.048 27.7571 8.048H27.2231L27.4931 7.844L27.6071 7.046H27.2711L26.9231 8.048H26.1731L26.7491 6.41H26.4431L26.5151 5.918H27.0971ZM29.8931 3.746L29.7011 4.31H30.5591L30.4811 4.868H30.3731L30.2531 5.738L29.7491 6.674L30.2651 8.048H29.4911L29.3051 7.502L29.0171 8.048H28.2251L29.0051 6.596L28.6451 5.51H29.3231L29.4311 5.804L29.5931 5.504L29.6831 4.868H29.5151L29.3831 5.276H28.6391L29.1371 3.746H29.8931ZM25.0391 8.048L25.5371 6.368H26.3171L25.8191 8.048H25.0391ZM25.5731 6.128L25.5431 5.102H26.3231L26.3531 6.128H25.5731ZM25.7471 4.874L25.7171 3.848H26.4971L26.5271 4.874H25.7471ZM27.7871 5.246L27.8171 5.024H27.3731L27.3431 5.246H27.7871ZM27.4271 4.664H27.8711L27.9011 4.454H27.4571L27.4271 4.664ZM34.1226 5.09H33.9306L34.0086 4.514H34.2666L34.4106 3.932L34.2366 3.74H35.2806L35.0886 4.514H36.0606L35.6226 7.64C35.6066 7.756 35.5646 7.852 35.4966 7.928C35.4286 8 35.3366 8.036 35.2206 8.036H34.3026L34.8186 7.454L35.1486 5.09H34.9446L34.2186 8.042H33.4026L34.1226 5.09ZM32.6586 7.616L32.8806 6.044H32.6646L32.2026 8.054H31.4706L32.1246 5.222H32.0046L32.0826 4.67H33.7686L33.6906 5.222H32.8566L32.7786 5.558H33.6546L33.3606 7.64C33.3446 7.756 33.2906 7.854 33.1986 7.934C33.1106 8.01 33.0086 8.048 32.8926 8.048H32.2626L32.6586 7.616ZM33.9486 3.848L33.8706 4.406H32.0346L31.3386 8.036H30.5766L31.3026 4.064L31.1886 3.848H33.9486ZM40.8301 5.444L40.8001 5.672H39.5461L39.4921 6.068H41.3161L41.2381 6.638H39.4141L39.3061 7.382H39.5881L39.9961 6.812H41.0221L40.6141 7.382H41.2441L41.1661 7.952H36.1501L36.2281 7.382H36.9301L36.6901 6.812H37.7161L37.9321 7.382H38.1661L38.2741 6.638H36.4501L36.5281 6.068H38.3521L38.4061 5.672H37.1521L37.1821 5.444H36.5041L37.6441 3.986L37.5241 3.848H40.7161L41.5261 5.444H40.8301ZM38.0821 5.102H40.0381L39.6961 4.418H38.6221L38.0821 5.102Z' fill='white'/%3e%3c/svg%3e";

  // 4 篇 白银
  // 8 篇 黄金
  // 16 篇，更文天数 >= 7 钻石
  // 32 篇，更文天数 >= 14 精英
  // 8 篇，幸运陨石奖
  // 综合文章评论、点赞、收藏

  var renderStarState = (({
    efficientArticles: activityArticles,
    totalCount
  }) => {
    var _activityArticles$, _activityArticles$2, _activityArticles$3;

    activityArticles.sort((a, b) => b.view_count - a.view_count);
    const efficientArticles = activityArticles.filter(article => !article.isFitTips);
    const isNotSameBaseData = activityArticles.length !== efficientArticles.length;
    const isJoined = efficientArticles.length >= 4; // 参与成功，可进入奖项评选

    let efficientArticlesTotalCount = totalCount;

    if (isNotSameBaseData) {
      const totalCount = {
        view: 0,
        digg: 0,
        collect: 0,
        comment: 0
      };
      efficientArticles.forEach(({
        view_count,
        digg_count,
        comment_count,
        collect_count
      }) => {
        totalCount.view += view_count;
        totalCount.digg += digg_count;
        totalCount.collect += collect_count;
        totalCount.comment += comment_count;
      });
      efficientArticlesTotalCount = totalCount;
    }

    const containerEl = document.createElement("div");
    const rewards = [];

    if (isJoined) {
      rewards.push({
        icon: img$3
      });
      const viewCountUpper100 = efficientArticles.filter(article => article.view_count >= 100);
      const partitionRewardArticles = viewCountUpper100.filter(article => article.digg_count >= 6 && article.comment_count >= 3); // 阅读 ≧ 100 的文章 ≧ 2 篇，每篇文章点赞 ≧ 6 ，评论互动 ≧ 3 条

      const isPartitionReward = partitionRewardArticles.length >= 2; // 阅读 ≧ 100 的文章 ≧ 4 篇，每篇文章点赞 ≧ 6 ，评论互动 ≧ 3 条

      const isPartitionRewardPlus = partitionRewardArticles.length >= 4; // 阅读 ≧ 100 的文章 ≧ 4 篇，所有投稿文章累计阅读 ≧ 2000，点赞 ≧ 40，评论≧ 10

      const isSpreeReward = viewCountUpper100 >= 4 && efficientArticlesTotalCount.view >= 2000 && efficientArticlesTotalCount.digg >= 40 && efficientArticlesTotalCount.comment >= 10;

      if (isPartitionRewardPlus) {
        rewards.push({
          icon: img$7
        });
      } else if (isPartitionReward) {
        rewards.push({
          icon: img$7
        });
      } else {
        rewards.push({
          icon: img$2,
          description: "单篇阅读100+，点赞6+，评论3+ 的文章两篇"
        });
      }

      if (isSpreeReward) {
        rewards.push({
          icon: img$6
        });
      } else {
        rewards.push({
          icon: img$1,
          description: "阅读100+的文章至少 4 篇，累计阅读2000+，点赞40+，评论10+"
        });
      }
    } else {
      rewards.push({
        icon: img$4,
        description: "发布 4 篇点亮，已参与“小知识”的文章无法同时参与。"
      });
    }

    containerEl.appendChild(renderRewards(rewards, efficientArticles));

    if (isNotSameBaseData) {
      containerEl.appendChild(renderCounts(efficientArticlesTotalCount));
      containerEl.appendChild(renderAmounts(efficientArticles));
      containerEl.appendChild(renderFooterNote("（注：已参与“小知识”的文章无法同时参与瓜分奖和大礼包）"));
    }

    const incentiveRewards = [];
    const isJoinIncentiveReward = activityArticles.length >= 4;
    const isIncentiveRewardLevel3 = isJoinIncentiveReward && ((_activityArticles$ = activityArticles[0]) === null || _activityArticles$ === void 0 ? void 0 : _activityArticles$["view_count"]) >= 3000 && totalCount.view >= 10000 && totalCount.digg >= 200 && totalCount.comment >= 50;
    const isIncentiveRewardLevel2 = isJoinIncentiveReward && ((_activityArticles$2 = activityArticles[0]) === null || _activityArticles$2 === void 0 ? void 0 : _activityArticles$2["view_count"]) >= 1500 && totalCount.view >= 5000 && totalCount.digg >= 100 && totalCount.comment >= 25;
    const isIncentiveRewardLevel1 = isJoinIncentiveReward && ((_activityArticles$3 = activityArticles[0]) === null || _activityArticles$3 === void 0 ? void 0 : _activityArticles$3["view_count"]) >= 500 && totalCount.view >= 3000 && totalCount.digg >= 60 && totalCount.comment >= 15;

    if (isIncentiveRewardLevel1 || isIncentiveRewardLevel2 || isIncentiveRewardLevel3) {
      incentiveRewards.push({
        icon: img$5,
        description: "有望参与创作激励金评选"
      });
    } else {
      incentiveRewards.push({
        icon: img,
        description: "文章数量 ≧4 篇，单篇文章阅读 ≧ 500，所有文章阅读量累计 ≧ 3000，点赞 ≧ 60，评论 ≧ 15，已参与“小知识”的文章可同时参与。"
      });
    }

    containerEl.appendChild(renderRewards(incentiveRewards, activityArticles));
    containerEl.appendChild(renderCounts(totalCount));
    containerEl.appendChild(renderAmounts(activityArticles));

    if (isNotSameBaseData) {
      containerEl.appendChild(renderFooterNote("（注：已参与“小知识”的文章可同时参与激励金）"));
    }

    profileStateRender.add({
      id: "activity_star_post",
      title: "掘力星计划",
      link: "https://juejin.cn/post/7012210233804079141",
      startTime: new Date(star.startTimeStamp),
      endTime: new Date(star.endTimeStamp),
      node: containerEl
    });
  });

  function renderRewards(rewards, articles) {
    const rewardEl = document.createElement("p");
    rewardEl.style.marginBottom = 0;
    rewardEl.innerHTML = `<table style="width:100%">
  <tr>
  <td>${rewards.map(({
    icon,
    description
  }) => `<div><img style="height:24px" src="${icon}" />${description ? `<div style="font-size:10px;margin-top:4px;color:#939aa3a3;margin-left: 1em;">${description}</div>` : ""}</div>`).join("")}</td>
    <td style="font-weight:bold;font-size:16px;color:#939aa3;text-align:right;width:3em;vertical-align:top">
      ${articles.length} 篇
    </td>
  </tr>
  </table>`;
    return rewardEl;
  }

  function renderCounts(totalCount) {
    const countLocale = {
      view: "阅读量",
      comment: "评论量",
      digg: "点赞",
      collect: "收藏"
    };
    const countEl = document.createElement("p");
    countEl.style = "display:flex;";
    countEl.innerHTML = `
  ${Object.entries(totalCount).map(([key, count]) => {
    return `<div style="flex:1;text-align:center;">
      <div style="font-size: 16px">${count}</div>
      <div style="color: #939aa3a3;">${countLocale[key]}</div>
      </div>`;
  }).join("")}
  `;
    return countEl;
  }

  function renderAmounts(articles) {
    const readAmountEl = document.createElement("p");
    const readAmountLevels = [0, 20, 40, 60, 80, 100, 500, 1500, 3000];
    const amountLevelSize = readAmountLevels.length;
    const readLevelCounts = new Array(amountLevelSize).fill(0);
    articles.forEach(({
      view_count
    }) => {
      if (view_count >= 3000) {
        readLevelCounts[amountLevelSize - 1]++;
      } else if (view_count >= 1500) {
        readLevelCounts[amountLevelSize - 2]++;
      } else if (view_count >= 500) {
        readLevelCounts[amountLevelSize - 3]++;
      } else {
        readLevelCounts[Math.floor(Math.min(100, view_count) / 20)]++;
      }
    });
    const maxReadLevelCount = Math.max(...readLevelCounts);
    let readElHTML = "";

    for (let i = amountLevelSize - 1; i >= 0; i--) {
      const level = readAmountLevels[i];
      const count = readLevelCounts[i];

      if (count > 0) {
        readElHTML += `<label for="count" style="text-align:right">${level}+</label><progress id="count" max="${maxReadLevelCount}" value="${count}">${count}篇</progress><span>${count}篇</span>`;
      }
    }

    if (readElHTML) {
      readAmountEl.style = "display: grid;grid-template-columns: auto max-content auto;grid-gap: 10px;color:#939aa3a3;";
      readAmountEl.innerHTML = readElHTML;
    }

    return readAmountEl;
  }

  function renderFooterNote(title) {
    const textEl = document.createElement("p");
    textEl.textContent = title;
    textEl.style = "color: #939aa3a3;font-size:10px;margin-bottom:2em";
    return textEl;
  }

  function nomatter(content, { open = '---', close = open } = {}) {
    const openRE = new RegExp('^\\n*' + open + '\\n', 'g');
    const closeRE = new RegExp('\\n' + close + '(\\n\\s*|$)', 'g');

    let match = openRE.exec(content);
    if (match) {
      closeRE.lastIndex = openRE.lastIndex - 1;
      match = closeRE.exec(content);
      if (match) {
        return content.slice(closeRE.lastIndex);
      }
    }

    return content;
  }

  var nomatter_1 = nomatter;

  const articleStoragePath = `${activityId}/article_contents`;
  const articleContentMap = new Map(Object.entries(initStorage(articleStoragePath, 2, [])));

  async function fetchArticleList(requestData = {}) {
    return await request();

    function request(cursor = "0", articles = []) {
      return fetchData({
        url: "https://api.juejin.cn/content_api/v1/article/query_list",
        data: {
          sort_type: 2,
          cursor,
          ...requestData
        }
      }).then(({
        data,
        has_more,
        cursor,
        count
      }) => {
        let lastPublishTime = Infinity;
        const startTimeStamp = Math.min(tips.startTimeStamp, star.startTimeStamp);
        const endTimeStamp = Math.max(tips.endTimeStamp, star.endTimeStamp);
        const categories = new Set([...tips.categories, ...star.categories]);

        if (data) {
          for (const article of data) {
            const {
              article_id,
              article_info,
              category
            } = article; // 文章字数、内容、发布时间、评论、点赞、收藏、阅读数

            const {
              ctime,
              mtime,
              audit_status,
              verify_status,
              view_count,
              collect_count,
              digg_count,
              comment_count
            } = article_info;
            const {
              category_name
            } = category;
            const publishTime = new Date(ctime * 1000);
            const modifiedTime = new Date(mtime * 1000);
            const verify = verify_status === 0 ? 0 : audit_status === 2 && verify_status === 1 ? 1 : 2;

            if (publishTime >= startTimeStamp && publishTime <= endTimeStamp && categories.has(category_name) && verify !== 2) {
              articles.push({
                category: category_name,
                id: article_id,
                publishTime,
                modifiedTime,
                view_count,
                collect_count,
                digg_count,
                comment_count
              });
            }

            lastPublishTime = publishTime;

            if (lastPublishTime < startTimeStamp) {
              break;
            }
          }
        }

        if (lastPublishTime > startTimeStamp && has_more && count !== parseInt(cursor, 10)) {
          return request(cursor, articles);
        } else {
          return articles;
        }
      });
    }
  }

  async function fetchArticles(userId) {
    const articleList = await fetchArticleList(userId ? {
      user_id: userId
    } : {});
    const articleDetails = await Promise.all(articleList.filter(({
      id,
      modifiedTime
    }) => {
      return !articleContentMap.has(id) || articleContentMap.get(id)["modifiedTimeStamp"] !== modifiedTime.valueOf();
    }).map(article => {
      return fetchData({
        url: "https://api.juejin.cn/content_api/v1/article/detail",
        data: {
          article_id: article.id
        }
      });
    }));
    articleDetails.forEach(({
      data
    }) => {
      const {
        article_info
      } = data;
      const {
        article_id,
        mark_content,
        mtime
      } = article_info;
      const content = nomatter_1(mark_content).trim();
      articleContentMap.set(article_id, {
        isFitTips: content.includes("程序员必备小知识") && /https:\/\/juejin\.cn\/post\/7008476801634680869(?:\/|$)?/.test(content),
        isFitStar: content.includes("掘力星计划") && /https:\/\/juejin\.cn\/post\/7012210233804079141(?:\/|$)?/.test(content),
        count: wordCount(mark_content),
        modifiedTimeStamp: mtime * 1000
      });
    });
    saveToStorage(articleStoragePath, Object.fromEntries(articleContentMap));
    return articleList.map(article => {
      const contentInfo = articleContentMap.get(article.id);
      return { ...article,
        isFitTips: (contentInfo === null || contentInfo === void 0 ? void 0 : contentInfo.isFitTips) ?? false,
        isFitStar: (contentInfo === null || contentInfo === void 0 ? void 0 : contentInfo.isFitStar) ?? false,
        count: (contentInfo === null || contentInfo === void 0 ? void 0 : contentInfo.count) ?? ""
      };
    });
  }

  function generateData(articles, {
    startTimeStamp,
    categories,
    signalFunction,
    dayLimit
  }) {
    const startTime = new Date(startTimeStamp);
    const efficientArticles = articles.filter(article => {
      return article.publishTime > startTime && categories.includes(article.category) && article.count >= dayLimit && signalFunction(article);
    });
    const publishTimeGroup = [];
    const totalCount = {
      view: 0,
      comment: 0,
      digg: 0,
      collect: 0
    };
    efficientArticles.forEach(({
      publishTime,
      view_count,
      digg_count,
      comment_count,
      collect_count
    }) => {
      const day = Math.floor((publishTime - startTime) / (24 * 60 * 60 * 1000));
      publishTimeGroup[day] = (publishTimeGroup[day] ?? 0) + 1;
      totalCount.view += view_count;
      totalCount.digg += digg_count;
      totalCount.collect += collect_count;
      totalCount.comment += comment_count;
    });
    const dayCount = publishTimeGroup.filter(Boolean).length;
    return {
      totalCount,
      dayCount,
      efficientArticles
    };
  }

  function renderActivityTips(articles) {
    const data = generateData(articles, { ...tips,

      signalFunction({
        isFitTips
      }) {
        return isFitTips;
      },

      dayLimit: 400
    });
    renderTipState(data);
  }

  function renderActivityStars(articles) {
    const data = generateData(articles, { ...star,

      signalFunction({
        isFitStar
      }) {
        return isFitStar;
      },

      dayLimit: 800
    });
    renderStarState(data);
  }

  async function renderPage(userId) {
    const articles = await fetchArticles(userId);
    renderActivityTips(articles);
    renderActivityStars(articles);
  }

  function onRouteChange$1(prevRouterPathname, currentRouterPathname) {
    if (!inSelfProfilePage(prevRouterPathname) && inSelfProfilePage(currentRouterPathname)) {
      renderPage();
    } else if (!inCreatorPage(prevRouterPathname) && inCreatorPage(currentRouterPathname)) ; else if (inProfilePage(currentRouterPathname)) {
      const prevUserId = getUserIdFromPathName(prevRouterPathname);
      const currentUserId = getUserIdFromPathName(currentRouterPathname);

      if (currentUserId !== prevUserId) {
        renderPage(currentUserId);
      }
    }
  }

  var OctoberPost = {
    onRouteChange: onRouteChange$1
  };

  const activities = [BreakTheCycle, OctoberPost];
  let currentRouterPathname = "";

  function updateUserId() {
    const userProfileEl = document.querySelector(".user-dropdown-list > .nav-menu-item-group:nth-child(2) > .nav-menu-item > a[href]");
    const userId = getUserIdFromPathName(userProfileEl === null || userProfileEl === void 0 ? void 0 : userProfileEl.getAttribute("href"));

    if (!userId) {
      return;
    }

    setUserId(userId);
  }

  (function start() {
    updateUserId();
    initRouter();
    activities.forEach(({
      onLoaded
    }) => onLoaded === null || onLoaded === void 0 ? void 0 : onLoaded());
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
      activities.forEach(({
        onRouteChange
      }) => {
        onRouteChange === null || onRouteChange === void 0 ? void 0 : onRouteChange(prevRouterPathname, currentRouterPathname);
      });
    }
  }

})();
