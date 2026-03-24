const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("status");

let blinked = false;
let mouthOpened = false;

// 计算两点距离
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// 眼睛开合判断（简单版）
function isEyeClosed(landmarks) {
  const leftTop = landmarks[159];
  const leftBottom = landmarks[145];
  return dist(leftTop, leftBottom) < 0.01;
}

// 嘴巴开合
function isMouthOpen(landmarks) {
  const top = landmarks[13];
  const bottom = landmarks[14];
  return dist(top, bottom) > 0.05;
}

const faceMesh = new FaceMesh({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
  }
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

faceMesh.onResults((results) => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0);

  if (results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];

    // 眨眼检测
    if (isEyeClosed(landmarks)) {
      blinked = true;
    }

    // 张嘴检测
    if (isMouthOpen(landmarks)) {
      mouthOpened = true;
    }

    if (!blinked) {
      statusText.innerText = "请眨眼 👁️";
    } else if (!mouthOpened) {
      statusText.innerText = "请张嘴 😮";
    } else {
      statusText.innerText = "验证成功 ✅";
    }

  } else {
    statusText.innerText = "未检测到人脸";
  }
});

// 启动摄像头
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" }
  });

  video.srcObject = stream;

  const camera = new Camera(video, {
    onFrame: async () => {
      await faceMesh.send({ image: video });
    },
    width: 640,
    height: 480
  });

  camera.start();
}

startCamera();
