import { getTopicStates } from "./states";
import { scriptId, startTimeStamp, endTimeStamp } from "./static.json";
import { profileStateRender } from "../utils";

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
  profileStateRender.add({
    startTime: new Date(startTimeStamp),
    endTime: new Date(endTimeStamp),
    node: getRewardElement(),
  });
}

function getRewardElement() {
  const { efficientTopics, efficientDays } = getTopicStates();
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
  const rewardEl = document.createElement("div");
  rewardEl.innerHTML = `<h3 style="margin:0;"><a style="color:inherit" href="https://juejin.cn/pin/7010556755855802376" target="__blank">破圈行动</a> <span style="float:right">9/23 - 9/30</span></h3>
      <p style="display:flex;flex-direction:row;justify-content: space-between;">
      ${descriptionHTML}
      </p>
      ${
        endTimeStamp >= new Date().valueOf()
          ? getTodayStatus()
          : getFinishSummary()
      }
      `;

  return rewardEl;
}

function getTodayStatus() {
  const { todayEfficientTopicTitles, efficientTopics } = getTopicStates();
  const todayTopicsHTML = todayEfficientTopicTitles
    .map((title) => {
      const isVerified = efficientTopics[title]?.verified;
      return renderTag(title, isVerified);
    })
    .join("");
  const todayVerifiedCount = todayEfficientTopicTitles.filter((title) => {
    return efficientTopics[title]?.verified;
  }).length;
  const todayVerifyCount =
    todayEfficientTopicTitles.length - todayVerifiedCount;

  return `<p>📅 &nbsp;今天 ${todayVerifiedCount} / 3 ${
    todayVerifyCount > 0
      ? `&nbsp;🧐 人工审核中&nbsp;${todayVerifyCount} 条`
      : ""
  }</p>
      <div>
      ${todayTopicsHTML}
      </div>`;
}

function getFinishSummary() {
  const { efficientTopics } = getTopicStates();

  return `<details>
  <summary style="cursor:pointer;margin-bottom:4px">🎉&nbsp;展开查看破解列表</summary>
  ${Object.keys(efficientTopics)
    .map((title) => {
      return renderTag(title);
    })
    .join("")}
  </details>`;
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
