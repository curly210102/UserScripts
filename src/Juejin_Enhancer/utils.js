import { getUserId } from "./globalStates";
import { scriptId } from "./static.json";

export const inPinPage = (pathname) => {
  return /^\/pins(?:\/|$)/.test(pathname);
};

export const inSelfProfilePage = (pathname) => {
  return new RegExp(`^\\/user\\/${getUserId()}(?:\\/|$)`).test(pathname);
};

export const inProfilePage = (pathname) => {
  return /\/user\/(\d+)(?:\/|$)/.test(pathname);
};

export const getUserIdFromPathName = (pathname) => {
  return pathname.match(/\/user\/(\d+)(?:\/|$)/)?.[1];
};

export const inCreatorPage = (pathname) => {
  return /^\/creator(?:\/|$)/.test(pathname);
};

export const saveToStorage = (name, value) => {
  GM_setValue(`${scriptId}/${name}`, value);
};

export const getFromStorage = (name, defaultValue) => {
  GM_getValue(`${scriptId}/${name}`, defaultValue);
};

export const formatDate = (dateInstance, format) => {
  const year = dateInstance.getFullYear();
  const month = dateInstance.getMonth() + 1;
  const date = dateInstance.getDate();

  return format
    .replaceAll("YYYY", year)
    .replaceAll("MM", `${month}`.padStart(2, "0"))
    .replaceAll("DD", `${date}`.padStart(2, "0"))
    .replaceAll("M", month)
    .replaceAll("D", date);
};

export function fetchData({ url, data = {} }) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "POST",
      url,
      data: JSON.stringify({
        user_id: getUserId(),
        ...data,
      }),
      headers: {
        "User-agent": window.navigator.userAgent,
        "content-type": "application/json",
      },
      onload: function ({ status, response }) {
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
      },
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
    contentEl.style.display = getFromStorage("profile_stat_hidden", false)
      ? "none"
      : "block";
    blockEl.appendChild(contentEl);

    this.blockEl = blockEl;
    this.contentEl = contentEl;
    this.data = [];
  }

  add(data) {
    const now = new Date().valueOf();
    const { node, title, link, startTime, endTime } = data;
    const header = document.createElement("h3");
    header.style = "margin:0;";
    header.innerHTML = `<a style="color:inherit" href="${link}" target="__blank">${title}</a> <span style="float:right">${formatDate(
      startTime,
      "MM/DD"
    )} - ${formatDate(endTime, "MM/DD")}</span>`;
    node.firstChild
      ? node.insertBefore(header, node.firstChild)
      : node.appendChild(header);
    node.style["padding-bottom"] = "10px";
    node.style["margin-bottom"] = "20px";
    node.style["border-bottom"] = "1px solid rgba(230, 230, 231, 0.5)";
    this.data = this.data.filter(({ id }) => id !== data.id);
    this.data.push(node);
    this.data.sort((a, b) => {
      const isFinishA = a.endTime > now;
      const isFinishB = b.endTime > now;

      if (isFinishA && !isFinishB) return -1;
      else if (isFinishB && !isFinishA) return 1;

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
        siblingEl.parentElement
          .querySelector(`[data-tampermonkey='${scriptId}']`)
          ?.remove();
        siblingEl.after(this.blockEl);
      } else if (parentEl) {
        parentEl.querySelector(`[data-tampermonkey='${scriptId}']`)?.remove();
        parentEl.firstChild
          ? parentEl.insertBefore(this.blockEl, parentEl.firstChild)
          : parentEl.appendChild(this.blockEl);
      }
    }
  }
}

export const profileStateRender = new ProfileStatRender();
