export function renderArViewerHtml(
  title: string,
  modelUrl: string,
  patternUrl: string | null,
): string {
  const safeTitle = title.replace(/</g, "&lt;");
  const modelUrlJson = JSON.stringify(modelUrl);
  const patternUrlJson = JSON.stringify(patternUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <title>${safeTitle}</title>
    <script src="https://aframe.io/releases/1.3.0/aframe.min.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.2/aframe/build/aframe-ar.js"></script>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background-color: transparent; }
      #overlay { position: fixed; top: 12px; left: 12px; right: 12px; z-index: 2; color: #fff; font-family: Arial, sans-serif; }
      #status { background: rgba(0,0,0,0.6); padding: 10px 12px; border-radius: 8px; max-width: 520px; }
      #hint { margin-top: 8px; font-size: 12px; color: #facc15; }
      #fallback { margin-top: 8px; font-size: 12px; color: #fff; }
      #slider-container { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 10; width: 80%; max-width: 400px; background: rgba(0,0,0,0.6); padding: 15px; border-radius: 12px; color: white; font-family: Arial, sans-serif; text-align: center; box-sizing: border-box; }
      #scale-slider { width: 100%; margin-top: 10px; }
    </style>
  </head>
  <body>
    <div id="overlay">
      <div id="status">Point your camera at the printed marker to view the 3D model.</div>
      <div id="hint" style="display: none;">Marker pattern missing. Ask an admin to upload the .patt file for this model.</div>
      <div id="fallback" style="display: none;">Using default Hiro marker as a fallback.</div>
    </div>

    <div id="slider-container">
      <label for="scale-slider">Adjust Size: <span id="scale-value">0.05</span>x</label>
      <input type="range" id="scale-slider" min="0.005" max="5.0" step="0.005" value="0.05" />
    </div>

    <a-scene
      embedded
      renderer="colorManagement: true; precision: medium; alpha: true;"
      vr-mode-ui="enabled: false"
      arjs="sourceType: webcam; debugUIEnabled: false;"
    >
      <a-entity light="type: ambient; intensity: 0.8"></a-entity>
      <a-entity light="type: directional; intensity: 0.8" position="1 2 1"></a-entity>
      <a-entity camera></a-entity>
    </a-scene>
    <script>
      (function () {
        const scene = document.querySelector("a-scene");
        const marker = document.createElement("a-marker");
        const modelEl = document.createElement("a-entity");
        const modelUrl = ${modelUrlJson};
        const patternUrl = ${patternUrlJson};

        if (patternUrl) {
          marker.setAttribute("type", "pattern");
          marker.setAttribute("url", patternUrl);
        } else {
          marker.setAttribute("preset", "hiro");
          document.getElementById("hint").style.display = "block";
          document.getElementById("fallback").style.display = "block";
        }

        modelEl.setAttribute("gltf-model", modelUrl);
        modelEl.setAttribute("position", "0 0 0");
        modelEl.setAttribute("rotation", "0 0 0");
        modelEl.setAttribute("scale", "0.05 0.05 0.05");

        marker.appendChild(modelEl);
        scene.appendChild(marker);

        let currentScale = 0.05;
        let currentRotation = 0;
        let lastTouchDistance = null;
        let lastTouchX = null;

        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
        const getDistance = (touches) => {
          const dx = touches[0].clientX - touches[1].clientX;
          const dy = touches[0].clientY - touches[1].clientY;
          return Math.hypot(dx, dy);
        };

        const slider = document.getElementById("scale-slider");
        const scaleValueDisplay = document.getElementById("scale-value");

        const updateScale = (newScale) => {
          currentScale = clamp(newScale, 0.005, 5.0);
          modelEl.setAttribute(
            "scale",
            currentScale + " " + currentScale + " " + currentScale
          );
          slider.value = currentScale;
          scaleValueDisplay.textContent = currentScale.toFixed(3);
        };

        slider.addEventListener("input", (event) => {
          updateScale(parseFloat(event.target.value));
        });

        scene.addEventListener("touchstart", (event) => {
          if (event.touches.length === 1) {
            lastTouchX = event.touches[0].clientX;
          } else if (event.touches.length === 2) {
            lastTouchDistance = getDistance(event.touches);
          }
        }, { passive: true });

        scene.addEventListener("touchmove", (event) => {
          if (event.touches.length === 1 && lastTouchX !== null) {
            const dx = event.touches[0].clientX - lastTouchX;
            currentRotation += dx * 0.4;
            modelEl.setAttribute("rotation", "0 " + currentRotation + " 0");
            lastTouchX = event.touches[0].clientX;
          } else if (event.touches.length === 2 && lastTouchDistance !== null) {
            const newDistance = getDistance(event.touches);
            const delta = newDistance - lastTouchDistance;
            updateScale(currentScale + delta / 1000);
            lastTouchDistance = newDistance;
          }
        }, { passive: true });

        scene.addEventListener("wheel", (event) => {
          updateScale(currentScale + event.deltaY * -0.0005);
        }, { passive: true });
      })();
    </script>
  </body>
</html>`;
}
