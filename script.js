const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("status");

let blinked = false;
let mouthOpened = false;

// 距离函数
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// 眼睛闭合判断
function isEyeClosed(landmarks) {
  const top = landmarks[159];
  const bottom = landmarks[145];
  return dist(top, bottom) < 0.015;
}

// 嘴巴张开判断
function isMouthOpen(landmarks) {
  const top = landmarks[13];
  const bottom = landmarks[14];
  return dist(top, bottom) > 0.06;
}

// MediaPipe 初始化
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

// 绘制脸部轮廓
function drawFaceMesh(landmarks, width, height) {
  ctx.strokeStyle = "#00FFAA";
  ctx.lineWidth = 1;

  for (let i = 0; i < landmarks.length; i++) {
    const x = landmarks[i].x * width;
    const y = landmarks[i].y * height;

    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
    ctx.fillStyle = "#00FFAA";
    ctx.fill();
  }
}

faceMesh.onResults((results) => {
  const width = video.clientWidth;
  const height = video.clientHeight;

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);

  // 画视频
  ctx.drawImage(video, 0, 0, width, height);

  if (results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];

    // 👇 画脸部网格点
    drawFaceMesh(landmarks, width, height);

    // 眨眼检测
    if (isEyeClosed(landmarks)) {
      blinked = true;
    }

    // 张嘴检测
    if (isMouthOpen(landmarks)) {
      mouthOpened = true;
    }

    // 状态提示
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
