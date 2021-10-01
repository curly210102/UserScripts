import { profileStateRender } from "../utils";
import { tips } from "./static.json";

import level0Icon from "./badges/level0.svg";
import level1Icon from "./badges/level1.svg";
import level2Icon from "./badges/level2.svg";
import level3Icon from "./badges/level3.svg";
import level4Icon from "./badges/level4.svg";
import level5Icon from "./badges/level5.svg";
import luckyIcon from "./badges/lucky.svg";
import unluckyIcon from "./badges/unlucky.svg";

// 2 篇：青铜
// 4 篇 白银
// 8 篇 黄金
// 16 篇，更文天数 >= 7 钻石
// 32 篇，更文天数 >= 14 精英

// 8 篇，幸运陨石奖

// 综合文章评论、点赞、收藏
export default ({ efficientArticles, dayCount, totalCount }) => {
  const articleCount = efficientArticles.length;
  const containerEl = document.createElement("div");
  let level = Math.min(Math.floor(efficientArticles.length / 2), 5);
  if (level === 5 && dayCount < 14) level--;
  if (level === 4 && dayCount < 7) level--;

  const levelReward = [
    {
      title: "木炭",
      count: 0,
      icon: level0Icon,
    },
    {
      title: "青铜",
      count: 2,
      icon: level1Icon,
    },
    {
      title: "白银",
      count: 4,
      icon: level2Icon,
    },
    {
      title: "黄金",
      count: 8,
      icon: level3Icon,
    },
    {
      title: "钻石",
      count: 16,
      days: 7,
      icon: level4Icon,
    },
    {
      title: "精英",
      count: 32,
      days: 14,
      icon: level5Icon,
    },
  ];

  const nextLevel = levelReward[level + 1];
  const reward = levelReward[level];
  const rewardEl = document.createElement("p");
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
  <tr style="color:#939aa3a3">
  <td style="text-align:left">${
    nextLevel ? `下一等级：${nextLevel.title}` : ""
  }</td>
    <td>${nextLevel ? `${nextLevel.count} 篇` : ""}</td>
    <td>${nextLevel.days ? `${nextLevel.days} 天` : "无限制"}</td>
  </tr>
</table>
<p style="display:flex;align-items:center;color:#939aa3a3;justify-content:space-between"><img style="width: 80px" src="${
    articleCount < 8 ? unluckyIcon : luckyIcon
  }"/><span style="font-size:10px;margin-left:4px;">${
    articleCount < 8 ? "达到 8 篇即可参与抽奖" : "可参与抽奖"
  }</span></p>
<p>

</p>
  `;
  containerEl.appendChild(rewardEl);

  const countLocale = {
    view: "阅读量",
    comment: "评论量",
    digg: "点赞",
    collect: "收藏",
  };
  const countEl = document.createElement("p");
  countEl.style = "display:flex;";
  countEl.innerHTML = `
  ${Object.entries(totalCount)
    .map(([key, count]) => {
      return `<div style="flex:1;text-align:center;">
      <div style="font-size: 16px">${count}</div>
      <div style="color: #939aa3a3;margin-top:4px">${countLocale[key]}</div>
      </div>`;
    })
    .join("")}
  `;
  containerEl.appendChild(countEl);

  profileStateRender.add({
    id: "activity_tips_post",
    title: "“小知识”",
    link: "https://juejin.cn/post/7008476801634680869",
    startTime: new Date(tips.startTimeStamp),
    endTime: new Date(tips.endTimeStamp),
    node: containerEl,
  });
};
