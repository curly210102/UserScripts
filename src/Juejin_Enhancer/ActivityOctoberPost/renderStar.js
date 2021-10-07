import { profileStateRender } from "../utils";
import { star } from "./static.json";

import partitionIcon from "./badges/partition.svg";
import partitionPlusIcon from "./badges/partition.svg";
import spreeIcon from "./badges/spree.svg";
import incentiveIcon from "./badges/incentive.svg";
import unjoinedIcon from "./badges/unjoined.svg";
import joinedIcon from "./badges/joined.svg";
import unpartitionIcon from "./badges/unpartition.svg";
import unspreeIcon from "./badges/unspree.svg";

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

  const containerEl = document.createElement("div");
  const rewardEl = document.createElement("p");
  const rewards = [];
  if (isJoined) {
    rewards.push({
      icon: joinedIcon,
    });
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
      (efficientArticles[0]?.["view_count"] >= 500) &
        (totalCount.view >= 3000) &&
      totalCount.digg >= 60 &&
      totalCount.comment >= 15;
    if (isPartitionRewardPlus) {
      rewards.push({
        icon: partitionPlusIcon,
      });
    } else if (isPartitionReward) {
      rewards.push({
        icon: partitionIcon,
      });
    } else {
      rewards.push({
        icon: unpartitionIcon,
        description: "单篇阅读100+，点赞6+，评论3+ 的文章两篇",
      });
    }

    if (isSpreeReward) {
      rewards.push({
        icon: spreeIcon,
      });
    } else {
      rewards.push({
        icon: unspreeIcon,
        description: "阅读100+的文章至少 4 篇，累计阅读2000+，点赞40+，评论10+",
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
  } else {
    rewards.push({
      icon: unjoinedIcon,
      description: "发布 4 篇点亮",
    });
  }
  rewardEl.innerHTML = `<table style="width:100%">
  <tr>
  <td>${rewards
    .map(
      ({ icon, description }) =>
        `<div><img style="height:24px" src="${icon}" />${
          description
            ? `<div style="font-size:10px;margin-top:4px;color:#939aa3a3;margin-left: 1em;margin-bottom:1em">${description}</div>`
            : ""
        }</div>`
    )
    .join("")}</td>
    <td style="font-weight:bold;font-size:16px;color:#939aa3;text-align:right;width:3em;vertical-align:top">
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

  const readAmountEl = document.createElement("p");
  const readAmountLevels = [0, 20, 40, 60, 80, 100, 500, 1500, 3000];
  const amountLevelSize = readAmountLevels.length;
  const readLevelCounts = new Array(amountLevelSize).fill(0);
  efficientArticles.forEach(({ view_count }) => {
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

  let endIndex = amountLevelSize - 1;
  let startIndex = 0;
  while (readLevelCounts[endIndex] === 0) {
    endIndex--;
  }
  while (readLevelCounts[startIndex] === 0) {
    startIndex++;
  }
  const maxReadLevelCount = Math.max(...readLevelCounts);
  let readElHTML = "";
  for (let i = endIndex; i >= startIndex; i--) {
    const level = readAmountLevels[i];
    const count = readLevelCounts[i];
    readElHTML += `<label for="count" style="text-align:right">${level}+</label><progress id="count" max="${maxReadLevelCount}" value="${count}">${count}篇</progress><span>${count}篇</span>`;
  }
  readAmountEl.style =
    "display: grid;grid-template-columns: auto max-content auto;grid-gap: 10px;color:#939aa3a3";
  readAmountEl.innerHTML = readElHTML;
  containerEl.appendChild(readAmountEl);

  profileStateRender.add({
    id: "activity_star_post",
    title: "掘力星计划",
    link: "https://juejin.cn/post/7012210233804079141",
    startTime: new Date(star.startTimeStamp),
    endTime: new Date(star.endTimeStamp),
    node: containerEl,
  });
};
