import { profileStateRender } from "../utils";
import { star } from "./static.json";

import partitionIcon from "./badges/partition.svg";
import partitionPlusIcon from "./badges/partition.svg";
import spreeIcon from "./badges/spree.svg";
import incentiveIcon from "./badges/incentive.svg";
import unjoinedIcon from "./badges/unjoined.svg";
import joinedIcon from "./badges/joined.svg";

// 2 篇：青铜
// 4 篇 白银
// 8 篇 黄金
// 16 篇，更文天数 >= 7 钻石
// 32 篇，更文天数 >= 14 精英

// 8 篇，幸运陨石奖

// 综合文章评论、点赞、收藏
export default ({ efficientArticles, totalCount }) => {
  const isJoined = efficientArticles.length >= 4; // 参与成功，可进入奖项评选

  efficientArticles.sort((a, b) => b.view_count - a.view_count);
  const viewCountUpper100 = efficientArticles.filter(
    (article) => article.view_count >= 100
  );

  const partitionRewardArticles = viewCountUpper100.filter(
    (article) => article.digg_count >= 6 && article.comment_count >= 3
  );
  // 阅读 ≧ 100 的文章 ≧ 2 篇，每篇文章点赞 ≧ 6 ，评论互动 ≧ 3 条
  const isPartitionReward = partitionRewardArticles.length >= 2;
  // 阅读 ≧ 100 的文章 ≧ 4 篇，每篇文章点赞 ≧ 6 ，评论互动 ≧ 3 条
  const isPartitionRewardPlus = partitionRewardArticles.length >= 4;
  // 阅读 ≧ 100 的文章 ≧ 4 篇，所有投稿文章累计阅读 ≧ 2000，点赞 ≧ 40，评论≧ 10
  const isSpreeReward =
    viewCountUpper100 >= 4 &&
    totalCount.view >= 2000 &&
    totalCount.digg >= 40 &&
    totalCount.comment >= 10;

  const isIncentiveRewardLevel3 =
    efficientArticles[0]?.["view_count"] >= 3000 &&
    totalCount.view >= 10000 &&
    totalCount.digg >= 200 &&
    totalCount.comment >= 50;

  const isIncentiveRewardLevel2 =
    (efficientArticles[0]?.["view_count"] >= 1500) &
      (totalCount.view >= 5000) &&
    totalCount.digg >= 100 &&
    totalCount.comment >= 25;

  const isIncentiveRewardLevel1 =
    (efficientArticles[0]?.["view_count"] >= 500) & (totalCount.view >= 3000) &&
    totalCount.digg >= 60 &&
    totalCount.comment >= 15;

  const containerEl = document.createElement("div");
  const rewardEl = document.createElement("p");
  const rewards = [];
  if (isJoined) {
    rewards.push({
      icon: joinedIcon,
    });
  } else {
    rewards.push({
      icon: unjoinedIcon,
      description: "发布 4 篇点亮",
    });
  }
  if (isPartitionRewardPlus) {
    rewards.push({
      icon: partitionPlusIcon,
    });
  } else if (isPartitionReward) {
    rewards.push({
      icon: partitionIcon,
    });
  }

  if (isSpreeReward) {
    rewards.push({
      icon: spreeIcon,
    });
  }

  if (
    isIncentiveRewardLevel1 ||
    isIncentiveRewardLevel2 ||
    isIncentiveRewardLevel3
  ) {
    rewards.push({
      icon: incentiveIcon,
      description: "有望获得创作激励金",
    });
  }
  rewardEl.innerHTML = `<table style="width:100%">
  <tr>
  <td>${rewards
    .map(
      ({ icon, description }) =>
        `<div><img style="height:24px" src="${icon}" />${
          description
            ? `<div style="font-size:10px;margin-top:4px;color:#939aa3a3;margin-left: 1em;">${description}</div>`
            : ""
        }</div>`
    )
    .join("")}</td>
    <td style="font-weight:bold;font-size:16px;color:#939aa3;text-align:right">
      ${efficientArticles.length} 篇
    </td>
  </tr>
  </table>`;
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
    id: "activity_star_post",
    title: "掘力星计划",
    link: "https://juejin.cn/post/7012210233804079141",
    startTime: new Date(star.startTimeStamp),
    endTime: new Date(star.endTimeStamp),
    node: containerEl,
  });
};
