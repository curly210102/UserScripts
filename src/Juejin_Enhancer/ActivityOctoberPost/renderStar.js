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
import uncentiveIcon from "./badges/uncentive.svg";

// 2 篇：青铜
// 4 篇 白银
// 8 篇 黄金
// 16 篇，更文天数 >= 7 钻石
// 32 篇，更文天数 >= 14 精英

// 8 篇，幸运陨石奖

// 综合文章评论、点赞、收藏
export default ({ efficientArticles: activityArticles, totalCount }) => {
  activityArticles.sort((a, b) => b.view_count - a.view_count);
  const efficientArticles = activityArticles.filter(
    (article) => !article.isFitTips
  );
  const isNotSameBaseData =
    activityArticles.length !== efficientArticles.length;
  const isJoined = efficientArticles.length >= 4; // 参与成功，可进入奖项评选
  let efficientArticlesTotalCount = totalCount;
  if (isNotSameBaseData) {
    const totalCount = {
      view: 0,
      digg: 0,
      collect: 0,
      comment: 0,
    };
    efficientArticles.forEach(
      ({ view_count, digg_count, comment_count, collect_count }) => {
        totalCount.view += view_count;
        totalCount.digg += digg_count;
        totalCount.collect += collect_count;
        totalCount.comment += comment_count;
      }
    );
    efficientArticlesTotalCount = totalCount;
  }

  const containerEl = document.createElement("div");
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
      efficientArticlesTotalCount.view >= 2000 &&
      efficientArticlesTotalCount.digg >= 40 &&
      efficientArticlesTotalCount.comment >= 10;

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
  } else {
    rewards.push({
      icon: unjoinedIcon,
      description: "发布 4 篇点亮，已参与“小知识”的文章无法同时参与。",
    });
  }

  containerEl.appendChild(renderRewards(rewards, efficientArticles));
  if (isNotSameBaseData) {
    containerEl.appendChild(renderCounts(efficientArticlesTotalCount));
    containerEl.appendChild(renderAmounts(efficientArticles));
    containerEl.appendChild(
      renderFooterNote("（注：已参与“小知识”的文章无法同时参与瓜分奖和大礼包）")
    );
  }

  const incentiveRewards = [];
  const isJoinIncentiveReward = activityArticles.length >= 4;
  const isIncentiveRewardLevel3 =
    isJoinIncentiveReward &&
    activityArticles[0]?.["view_count"] >= 3000 &&
    totalCount.view >= 10000 &&
    totalCount.digg >= 200 &&
    totalCount.comment >= 50;

  const isIncentiveRewardLevel2 =
    isJoinIncentiveReward &&
    activityArticles[0]?.["view_count"] >= 1500 &&
    totalCount.view >= 5000 &&
    totalCount.digg >= 100 &&
    totalCount.comment >= 25;

  const isIncentiveRewardLevel1 =
    isJoinIncentiveReward &&
    activityArticles[0]?.["view_count"] >= 500 &&
    totalCount.view >= 3000 &&
    totalCount.digg >= 60 &&
    totalCount.comment >= 15;

  if (
    isIncentiveRewardLevel1 ||
    isIncentiveRewardLevel2 ||
    isIncentiveRewardLevel3
  ) {
    incentiveRewards.push({
      icon: incentiveIcon,
      description: "有望参与创作激励金评选",
    });
  } else {
    incentiveRewards.push({
      icon: uncentiveIcon,
      description:
        "文章数量 ≧4 篇，单篇文章阅读 ≧ 500，所有文章阅读量累计 ≧ 3000，点赞 ≧ 60，评论 ≧ 15，已参与“小知识”的文章可同时参与。",
    });
  }
  containerEl.appendChild(renderRewards(incentiveRewards, activityArticles));
  containerEl.appendChild(renderCounts(totalCount));
  containerEl.appendChild(renderAmounts(activityArticles));
  if (isNotSameBaseData) {
    containerEl.appendChild(
      renderFooterNote("（注：已参与“小知识”的文章可同时参与激励金）")
    );
  }

  profileStateRender.add({
    id: "activity_star_post",
    title: "掘力星计划",
    link: "https://juejin.cn/post/7012210233804079141",
    startTime: new Date(star.startTimeStamp),
    endTime: new Date(star.endTimeStamp),
    node: containerEl,
  });
};

function renderRewards(rewards, articles) {
  const rewardEl = document.createElement("p");
  rewardEl.style.marginBottom = 0;
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
    collect: "收藏",
  };
  const countEl = document.createElement("p");
  countEl.style = "display:flex;";
  countEl.innerHTML = `
  ${Object.entries(totalCount)
    .map(([key, count]) => {
      return `<div style="flex:1;text-align:center;">
      <div style="font-size: 16px">${count}</div>
      <div style="color: #939aa3a3;">${countLocale[key]}</div>
      </div>`;
    })
    .join("")}
  `;
  return countEl;
}

function renderAmounts(articles) {
  const readAmountEl = document.createElement("p");
  const readAmountLevels = [0, 20, 40, 60, 80, 100, 500, 1500, 3000];
  const amountLevelSize = readAmountLevels.length;
  const readLevelCounts = new Array(amountLevelSize).fill(0);
  articles.forEach(({ view_count }) => {
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
    readAmountEl.style =
      "display: grid;grid-template-columns: auto max-content auto;grid-gap: 10px;color:#939aa3a3;";
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
