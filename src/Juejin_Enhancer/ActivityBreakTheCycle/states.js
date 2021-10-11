import {
  scriptId,
  blockTopics,
  startTimeStamp,
  endTimeStamp,
} from "./static.json";
import { fetchData } from "../utils";
import { getUserId } from "../globalStates";

const states = GM_getValue(scriptId, {
  checkPoint: 0,
  topics: {
    todayEfficientTopicTitles: [],
    efficientDays: 0,
    efficientTopics: {},
  },
});

function getCheckPoint() {
  return states.checkPoint;
}

export function getTopicStates() {
  return states.topics;
}

export function setTopicStates(value) {
  states.checkPoint = new Date().valueOf();
  states.topics = value;
  GM_setValue(scriptId, states);
}
export async function fetchStates(userId) {
  const isOwner = !userId || userId === getUserId();
  let topicStats;

  if (isOwner) {
    if (getCheckPoint() > 1633948801188) {
      return new Promise((resolve) => {
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
      user_id: userId,
    });
    topicStats = generateTopicStats(dailyTopics);
  }

  return topicStats;
}

function requestShortMsgTopic(
  cursor = "0",
  dailyTopics = [],
  requestData = {}
) {
  return fetchData({
    url: "https://api.juejin.cn/content_api/v1/short_msg/query_list",
    data: {
      sort_type: 4,
      limit: 24,
      cursor,
      ...requestData,
    },
  }).then((responseData) => {
    const { data, cursor, has_more } = responseData;
    let lastPublishTime = Infinity;

    if (data) {
      for (const msg of data) {
        const { topic, msg_Info } = msg;
        const publishTime = msg_Info.ctime * 1000;
        if (
          publishTime > startTimeStamp &&
          publishTime < endTimeStamp &&
          !blockTopics.includes(topic.title)
        ) {
          const day = Math.floor((publishTime - startTimeStamp) / 86400000);
          if (!dailyTopics[day]) {
            dailyTopics[day] = [];
          }
          dailyTopics[day].push({
            title: topic.title,
            // wait: 0, pass: 1, fail: 2
            verified:
              msg_Info.verify_status === 0
                ? 0
                : msg_Info.audit_status === 2 && msg_Info.verify_status === 1
                ? 1
                : 2,
            publishTime,
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
  const todayIndex = Math.floor(
    (new Date().valueOf() - startTimeStamp) / 86400000
  );
  const todayEfficientTopicTitles = [];
  let efficientDays = 0;

  const trueDailyTopics = [];

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
    const dailyVerifiedTopicTitles = new Set(
      topics
        .filter(({ title, verified }) => {
          // 破圈：未被破解 + 已通过审核或正在等待审核
          return !allEfficientTopicTitles.has(title) && verified === 1;
        })
        .sort((a1, a2) => a1.publishTime - a2.publishTime)
        .map(({ title }) => title)
    );

    // 更新达标天数
    if (dailyVerifiedTopicTitles.size >= 3) {
      efficientDays++;
    }

    trueDailyTopics.push(
      [...dailyVerifiedTopicTitles].map((title) => {
        return topics.find((topic) => topic.title === title);
      })
    );
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
        topicCountAndVerified[title]["verified"] ||= verified === 1;
      }
    });
  });

  console.table(
    dailyTopics.map((topics) => {
      return topics
        .sort((a1, a2) => a1.publishTime - a2.publishTime)
        .map(
          ({ title, publishTime }) =>
            title +
            " " +
            new Date(publishTime).toLocaleString("zh-CN", {
              hour12: false,
              timeZone: "Asia/Shanghai",
            })
        );
    })
  );

  console.table(
    trueDailyTopics.map((topics) => {
      return topics
        .sort((a1, a2) => a1.publishTime - a2.publishTime)
        .map(
          ({ title, publishTime }) =>
            title +
            " " +
            new Date(publishTime).toLocaleString("zh-CN", {
              hour12: false,
              timeZone: "Asia/Shanghai",
            })
        );
    })
  );

  return {
    todayEfficientTopicTitles,
    efficientDays,
    efficientTopics: Object.fromEntries(
      [...allEfficientTopicTitles].map((title) => {
        return [title, topicCountAndVerified[title]];
      })
    ),
  };
}
