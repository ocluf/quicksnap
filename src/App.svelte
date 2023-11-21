<script>
  import { onMount, onDestroy } from "svelte";
  let windowsPromise = null;
  let windowIndex = 0;
  let checkmark = false;

  function handleMessageFromMain(message) {
    windowsPromise = new Promise((resolve) => resolve(message));
    windowIndex = 0;
  }

  async function captureScreen(sourceId) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sourceId,
          },
        },
      });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);
        const imageSrc = canvas.toDataURL();
        api.sendScreenshot(imageSrc);
        stream.getTracks().forEach((track) => track.stop());
      };
    } catch (e) {
      console.error(e);
    }
  }

  async function handleWindowSelect(id) {
    checkmark = true;
    await captureScreen(id);
    setTimeout(() => {
      api.hideWindow();
      checkmark = false;
    }, 300);
  }

  onMount(() => {
    window.api.onReceiveMessage("message-from-main", handleMessageFromMain);
  });

  onDestroy(() => {
    window.api.removeReceiveMessageListener(
      "message-from-main",
      handleMessageFromMain
    );
  });
</script>

{#if windowsPromise}
  {#await windowsPromise then windows}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="flex flex-col w-screen h-screen items-center"
      on:click={() => window.api.hideWindow()}
    >
      <div class="absolute inset-0 -z-10 opacity-60 bg-black" />

      <img
        src={windows[windowIndex].thumbnail}
        alt="screenshot"
        class="object-contain w-auto h-[200px] bg-transparent shadow-none mx-auto mt-[15vh] rounded-2xl shadow-white"
      />
      <div class="max-w-[80vw] w-fit flex justify-center mt-20">
        <div class="p-4 pb-0 bg-gray-400 rounded-2xl">
          <div
            class="flex items-center justify-center rounded-xl flex-wrap gap-4"
          >
            {#each windows as window, index}
              <div
                class={"relative w-40 group/item hover:cursor-pointer"}
                on:mouseenter={() => (windowIndex = index)}
                on:click|stopPropagation={() => handleWindowSelect(window.id)}
              >
                {#if window.appIcon}
                  <img
                    src={window.appIcon}
                    alt="app logo"
                    class="object-contain rounded-xl max-h-full max-w-full group-hover/item:bg-gray-200"
                  />
                {:else}
                  <svg
                    class="object-contain rounded-xl max-h-full max-w-full group-hover/item:bg-gray-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6zM7.5 6h.008v.008H7.5V6zm2.25 0h.008v.008H9.75V6z"
                    />
                  </svg>
                {/if}

                {#if checkmark && windowIndex === index}
                  <svg
                    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-6 w-10 h-10 text-green-500"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                {:else if !checkmark}
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-6 w-10 h-10 group-hover/item:block opacity-60"
                    ><rect
                      width="14"
                      height="14"
                      x="8"
                      y="8"
                      rx="2"
                      ry="2"
                    /><path
                      d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                    /></svg
                  >
                {/if}

                <p class="text-center mt-1 text-ellipsis line-clamp-1">
                  {window.name}
                </p>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/await}
{/if}
