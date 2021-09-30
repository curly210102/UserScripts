import { getUserId } from "./globalStates";

const scriptId = "juejin-activies-enhancer";

export const inPinPage = (pathname) => {
  return /^\/pins(?:\/|$)/.test(pathname);
};

export const inProfilePage = (pathname) => {
  return new RegExp(`^\\/user\\/${getUserId()}(?:\\/|$)`).test(pathname);
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
              border-bottom: 1px solid rgba(230,230,231,.5);`;
    titleEl.textContent = "活动状态";
    blockEl.appendChild(titleEl);
    const contentEl = document.createElement("div");
    contentEl.style = `padding: 1.333rem;`;
    blockEl.appendChild(contentEl);

    this.blockEl = blockEl;
    this.contentEl = contentEl;
    this.data = [];
  }

  add(data) {
    const now = new Date().valueOf();
    this.data.push(data);
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
    this.data.forEach(({ node }, index) => {
      const element = currentDOM[index];

      if (!element) {
        container.appendChild(node);
        return;
      }

      if (element !== node) {
        element.replaceWith(node);
      }
    });

    for (let i = this.data.length, len = currentDOM.length; i < len; i++) {
      container.removeChild(currentDOM[i]);
    }

    if (!this.blockEl.isConnected) {
      const siblingEl = document.querySelector(".user-view .stat-block");
      const parentEl = document.querySelector(".user-view .sticky-wrap");

      if (siblingEl) {
        siblingEl.parentElement
          .querySelector(`[data-tampermonkey='${scriptId}']`)
          ?.remove();
        siblingEl.after(this.blockEl);
        return;
      }
      if (parentEl) {
        parentEl.querySelector(`[data-tampermonkey='${scriptId}']`)?.remove();
        parentEl.firstChild
          ? parentEl.insertBefore(this.blockEl, parentEl.firstChild)
          : parentEl.appendChild(this.blockEl);
      }
    }
  }
}

export const profileStateRender = new ProfileStatRender();
