import { blockTopics, startTimeStamp, endTimeStamp } from "./static.json";

const states = {
  userId: "",
  topics: {
    todayEfficientTopicTitles: [],
    efficientDays: 0,
    efficientTopics: {},
  },
};

export function getTopicStates() {
  return states.topics;
}

export function setTopicStates(value) {
  states.topics = value;
}

export function setUserId(userId) {
  states.userId = userId;
}

export function getUserId() {
  return states.userId;
}

export async function fetchStates() {
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
        user_id: getUserId(),
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
                    msg_Info.status === 1 || msg_Info.verify_status === 0
                      ? 0
                      : msg_Info.status === 2 && msg_Info.verify_status === 1
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
    const dailyVerifiedTopicTitles = new Set(
      topics.filter(({ title, verified }) => {
        // 破圈：未被破解 + 已通过审核或正在等待审核
        return !allEfficientTopicTitles.has(title) && verified === 1;
      })
    );
    // 更新达标天数
    if (dailyVerifiedTopicTitles.size >= 3) {
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
        topicCountAndVerified[title]["verified"] ||= verified === 1;
      }
    });
  });

  setTopicStates({
    todayEfficientTopicTitles,
    efficientDays,
    efficientTopics: Object.fromEntries(
      [...allEfficientTopicTitles].map((title) => {
        return [title, topicCountAndVerified[title]];
      })
    ),
  });
}
