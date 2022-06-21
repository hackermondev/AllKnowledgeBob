const response = document.getElementById("response");
const questionEle = document.getElementById("yourquestion");
const shareURLEle = document.getElementById("shareurl");

class Bob {
  /**
    * Knowledge 🧠
    * @param { string } text
		* @param { DomElement } responseElement
    * @returns {
			"error": "Error" | null,
			"response": "result" | null, 
			"id": "1742bca2-c771-4755-aaf5-4986383f10ea"
		}
  */

  async knowledge(text, responseElement) {
    try {
      const data = {
        text,
        createdAt: new Date().toUTCString(),
        stream: true,
      };

      this._debug(`sending data ${JSON.stringify(data)}`);
      const req = await fetch(`/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": JSON.stringify(data).length,
        },

        body: JSON.stringify(data),
      });

      if (req.ok && data.stream) {
        // stream
        await new Promise((resolve, reject) => {
          const reader = req.body.getReader();

          let text = "";
          const textDecoder = new TextDecoder();
          const i = setInterval(async () => {
            const data = await reader.read();
            if (data.done) {
              clearInterval(i);
              resolve();
              return;
            }

            const value = textDecoder.decode(data.value).replaceAll("\n", "");

            if (value == "") return;
            this._debug("got chunk", value);
            text += value;
            if (responseElement) {
              responseElement.innerText = text;
            }
          }, 50);
        });

        return {
          error: null,
          result: text,
          id: req.headers.get("x-response-id"),
        };
      }

      const response = await req.json();
      return response;
    } catch (err) {
      this._debug(`fetch error, ${err}`);
      return {
        error: err.toString(),
        result: null,
        id: null,
      };
    }
  }

  _debug(text) {
    console.log(`%c[debug] ${text}`, "color: gray;");
  }

  formSubmit(e) {
    if (e) e.preventDefault();

    let isThinking = true;
    let text = `Bob is thinking. `;
    response.placeholder = text;

    const i = setInterval(() => {
      if (!isThinking) {
        clearInterval(i);
        return;
      }

      text = text + "🧠";
      response.placeholder = text;
    }, 1000);

    this._debug(`form submit called.`);
    const question = questionEle.value || questionEle.nodeValue;
    questionEle.disabled = true;

    this.knowledge(question, response).then((result) => {
      isThinking = false;
      questionEle.disabled = false;
      this._debug(`got result ${JSON.stringify(result)}`);
      // if(result.error) throw new Error(result.error)
      response.placeholder = result.error || result.response;
      shareURLEle.value = `https://${location.host}/response/${result.id}`;
    });
  }

  hideBanner(name) {
    const ele = document.getElementById(`${name}-banner`);
    if (!ele) throw new Error("could not find banner");

    ele.classList.add("hidden");
    localStorage.setItem(`hide-${name}-banner`, "yes");
  }
}

window.Bob = new Bob();
document
  .getElementById("form")
  .addEventListener("submit", (e) => window.Bob.formSubmit(e));

const banners = document.querySelectorAll('div[id$="banner"]');
for (var l in banners) {
  const banner = banners[l];
  if (!banner) continue;

  const id = banner.getAttribute("id").split("-")[0];
  window.Bob._debug(`checking banner ${id}`);
  const shouldNotShow = localStorage.getItem(`hide-${id}-banner`);
  if (shouldNotShow) {
    window.Bob._debug(`removed banner ${id}`);
    window.Bob.hideBanner(id);
  }
}
