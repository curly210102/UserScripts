import {
  fetchData,
  inProfilePage,
  getFromStorage,
  saveToStorage,
  inCreatorPage,
  inSelfProfilePage,
  getUserIdFromPathName,
  debugLog,
} from "../utils";
import { tips, star, activityId } from "./static.json";
import wordCount from "word-count";
import renderTipState from "./renderTips";
import renderStarState from "./renderStar";
import { isDebugEnable } from "../userConfigs";
import nm from "nomatter";
import urlRegex from "url-regex";

const articleContentMap = new Map(
  Object.entries(getFromStorage(`${activityId}/article_contents`) ?? [])
);

async function fetchArticleList(requestData = {}) {
  return await request();
  function request(cursor = "0", articles = []) {
    return fetchData({
      url: "https://api.juejin.cn/content_api/v1/article/query_list",
      data: { sort_type: 2, cursor, ...requestData },
    }).then(({ data, has_more, cursor, count }) => {
      let lastPublishTime = Infinity;
      const startTimeStamp = Math.min(tips.startTimeStamp, star.startTimeStamp);
      const endTimeStamp = Math.max(tips.endTimeStamp, star.endTimeStamp);
      const categories = new Set([...tips.categories, ...star.categories]);
      if (data) {
        for (const article of data) {
          const { article_id, article_info, category } = article;
          // 文章字数、内容、发布时间、评论、点赞、收藏、阅读数
          const {
            ctime,
            mtime,
            audit_status,
            verify_status,
            view_count,
            collect_count,
            digg_count,
            comment_count,
          } = article_info;
          const { category_name } = category;
          const publishTime = new Date(ctime * 1000);
          const modifiedTime = new Date(mtime * 1000);
          const verify =
            verify_status === 0
              ? 0
              : audit_status === 2 && verify_status === 1
              ? 1
              : 2;
          if (
            publishTime >= startTimeStamp &&
            publishTime <= endTimeStamp &&
            categories.has(category_name) &&
            verify !== 2
          ) {
            articles.push({
              category: category_name,
              id: article_id,
              publishTime,
              modifiedTime,
              view_count,
              collect_count,
              digg_count,
              comment_count,
            });
          }

          lastPublishTime = publishTime;
          if (lastPublishTime < startTimeStamp) {
            break;
          }
        }
      }

      if (
        lastPublishTime > startTimeStamp &&
        has_more &&
        count !== parseInt(cursor, 10)
      ) {
        return request(cursor, articles);
      } else {
        return articles;
      }
    });
  }
}

async function fetchArticles(userId) {
  const articleList = await fetchArticleList(
    userId
      ? {
          user_id: userId,
        }
      : {}
  );
  const articleDetails = await Promise.all(
    articleList
      .filter(({ articleId, modifiedTime }) => {
        return (
          !articleContentMap.has(articleId) ||
          new Date(articleContentMap.get(articleId)["modifiedTimeStamp"]) !==
            modifiedTime
        );
      })
      .map((article) => {
        return fetchData({
          url: "https://api.juejin.cn/content_api/v1/article/detail",
          data: {
            article_id: article.id,
          },
        });
      })
  );
  articleDetails.forEach(({ data }) => {
    const { article_info } = data;
    const { article_id, mark_content, mtime } = article_info;

    const content = nm(mark_content).split(/\n+/).slice(0, 2).join("\n").trim();

    articleContentMap.set(article_id, {
      content,
      count: wordCount(mark_content),
      modifiedTimeStamp: mtime * 1000,
    });
  });

  saveToStorage(
    `${activityId}/article_contents`,
    Object.fromEntries(articleContentMap)
  );

  return articleList.map((article) => {
    const contentInfo = articleContentMap.get(article.id);
    return {
      ...article,
      content: contentInfo?.content ?? "",
      count: contentInfo?.count ?? "",
    };
  });
}

function generateData(
  articles,
  { startTimeStamp, categories, signalFunction, dayLimit }
) {
  const startTime = new Date(startTimeStamp);
  const efficientArticles = articles.filter((article) => {
    return (
      article.publishTime > startTime &&
      categories.includes(article.category) &&
      article.count >= dayLimit &&
      signalFunction(article.content)
    );
  });
  const publishTimeGroup = [];
  const totalCount = {
    view: 0,
    comment: 0,
    digg: 0,
    collect: 0,
  };
  efficientArticles.forEach(
    ({ publishTime, view_count, digg_count, comment_count, collect_count }) => {
      const day = Math.floor((publishTime - startTime) / (24 * 60 * 60 * 1000));
      publishTimeGroup[day] = (publishTimeGroup[day] ?? 0) + 1;
      totalCount.view += view_count;
      totalCount.digg += digg_count;
      totalCount.collect += collect_count;
      totalCount.comment += comment_count;
    }
  );
  const dayCount = publishTimeGroup.filter(Boolean).length;

  return {
    totalCount,
    dayCount,
    efficientArticles,
  };
}

function renderActivityTips(articles) {
  const data = generateData(articles, {
    ...tips,
    signalFunction(text) {
      const lines = text.split("\n");
      return (
        lines[0]
          ?.match(
            /\p{Script=Han}|\p{Script=Kana}|\p{Script=Hira}|\p{Script=Hangul}|，|！/gu
          )
          ?.join("") ===
          "小知识，大挑战！本文正在参与程序员必备小知识创作活动" &&
        text.match(urlRegex())?.[0] ===
          "https://juejin.cn/post/7008476801634680869"
      );
    },
    dayLimit: 400,
  });
  renderTipState(data);
}

function renderActivityStars(articles) {
  const data = generateData(articles, {
    ...star,
    signalFunction(text) {
      const lines = text.split("\n");
      const isFirstLineMatch =
        lines[0]
          .match(
            /\p{Script=Han}|\p{Script=Kana}|\p{Script=Hira}|\p{Script=Hangul}|，/gu
          )
          .join("") ===
          "本文已参与掘力星计划，赢取创作大礼包，挑战创作激励金" &&
        lines[0].match(urlRegex())?.[0] ===
          "https://juejin.cn/post/7012210233804079141";

      const isSecondLineMatch =
        [
          "本文已参与掘力星计划，赢取创作大礼包，挑战创作激励金",
          "本文同时参与掘力星计划，赢取创作大礼包，挑战创作激励金",
        ].includes(
          lines[1]
            .match(
              /\p{Script=Han}|\p{Script=Kana}|\p{Script=Hira}|\p{Script=Hangul}|，/gu
            )
            .join("")
        ) &&
        lines[1].match(urlRegex())?.[0] ===
          "https://juejin.cn/post/7012210233804079141";

      return isFirstLineMatch || isSecondLineMatch;
    },
    dayLimit: 800,
  });
  renderStarState(data);
}

async function renderPage(userId) {
  const articles = await fetchArticles(userId);
  renderActivityTips(articles);
  renderActivityStars(articles);
}

function onRouteChange(prevRouterPathname, currentRouterPathname) {
  if (
    !inSelfProfilePage(prevRouterPathname) &&
    inSelfProfilePage(currentRouterPathname)
  ) {
    renderPage();
  } else if (
    !inCreatorPage(prevRouterPathname) &&
    inCreatorPage(currentRouterPathname)
  ) {
  } else if (isDebugEnable() && inProfilePage(currentRouterPathname)) {
    const prevUserId = getUserIdFromPathName(prevRouterPathname);
    const currentUserId = getUserIdFromPathName(currentRouterPathname);
    if (currentUserId !== prevUserId) {
      renderPage(currentUserId);
    }
  }
}

export default {
  onRouteChange,
};
