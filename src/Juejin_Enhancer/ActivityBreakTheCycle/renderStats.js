import { getTopicStates } from "./states";
import { scriptId } from "./static.json";

export function renderPinPage() {
  const containerEl = document.querySelector(".main .userbox");
  if (!containerEl) {
    return;
  }
  containerEl.querySelector(`[data-tampermonkey='${scriptId}']`)?.remove();
  const wrapperEl = document.createElement("div");
  wrapperEl.dataset.tampermonkey = scriptId;
  wrapperEl.appendChild(getRewardElement());
  wrapperEl.style = "padding-top:20px;";
  containerEl.appendChild(wrapperEl);
}

export function renderProfilePage() {
  const siblingEl = document.querySelector(".user-view .stat-block");
  const parentEl = document.querySelector(".user-view .sticky-wrap");
  const blockEl = document.createElement("div");
  blockEl.dataset.tampermonkey = scriptId;
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

  if (siblingEl) {
    siblingEl.parentElement
      .querySelector(`[data-tampermonkey='${scriptId}']`)
      ?.remove();
    siblingEl.after(blockEl);
    return;
  }
  if (parentEl) {
    parentEl.querySelector(`[data-tampermonkey='${scriptId}']`)?.remove();
    parentEl.firstChild
      ? parentEl.insertBefore(blockEl, parentEl.firstChild)
      : parentEl.appendChild(blockEl);
  }
}

function getRewardElement() {
  const { efficientTopics, efficientDays, todayEfficientTopicTitles } =
    getTopicStates();
  const topicCount = Object.values(efficientTopics).filter(
    ({ verified }) => !!verified
  ).length;
  const reward =
    ["幸运奖", "三等奖", "二等奖", "一等奖", "全勤奖"][
      efficientDays >= 8 ? 4 : Math.floor((efficientDays - 1) / 2)
    ] ?? (topicCount > 1 ? "幸运奖" : "无");

  const descriptionHTML = [
    `🎯 &nbsp;达成 ${efficientDays} 天`,
    `⭕ &nbsp;${topicCount} 个圈子`,
    `🏆 &nbsp;${reward}`,
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
            background-color: ${isVerified ? "#eaf2ff" : "#e5e7ea"};
            color:${isVerified ? "#1e80ff" : "#717682"};
            font-size:12px;
            line-height:20px;
            border-radius:50px;
            margin-left:2px;margin-bottom:2px;">${title}</span>`;
    })
    .join("");
  const todayVerifiedCount = todayEfficientTopicTitles.filter((title) => {
    return efficientTopics[title]?.verified;
  }).length;
  const todayVerifyCount =
    todayEfficientTopicTitles.length - todayVerifiedCount;
  const rewardEl = document.createElement("div");
  rewardEl.innerHTML = `<h3 style="margin:0;"><a style="color:inherit" href="https://juejin.cn/pin/7010556755855802376" target="__blank">破圈行动</a> <span style="float:right">9/23 - 9/30</span></h3>
      <p style="display:flex;flex-direction:row;justify-content: space-between;">
      ${descriptionHTML}
      </p>
      <p>📅 &nbsp;今天 ${todayVerifiedCount} / 3 ${
    todayVerifyCount > 0
      ? `&nbsp;🧐 人工审核中&nbsp;${todayVerifyCount} 条`
      : ""
  }</p>
      <div>
      ${todayTopicsHTML}
      </div>
      `;

  return rewardEl;
}
