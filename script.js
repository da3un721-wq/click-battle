// --- 화면 / 버튼 DOM ---
const introScreen    = document.getElementById('intro-screen');
const tutorialScreen = document.getElementById('tutorial-screen');
const gameScreen     = document.getElementById('game-screen');

const introStartBtn  = document.getElementById('intro-start-btn');
const tutorialStartGameBtn = document.getElementById('tutorial-start-game-btn');
const quitToMenuBtn  = document.getElementById('quit-to-menu-btn');

const statusText     = document.getElementById('status-text');
const turnInfoText   = document.getElementById('turn-info');

const carrotLeftBtn  = document.getElementById('btn-carrot-left');
const carrotRightBtn = document.getElementById('btn-carrot-right');
const bunnyBtn       = document.getElementById('btn-bunny');

const gameCircle     = document.getElementById('game-circle');
const slots          = Array.from(gameCircle.querySelectorAll('.player-slot'));
const passIndicator  = document.getElementById('pass-indicator');

const gameOverOverlay = document.getElementById('game-over-overlay');
const gameOverText    = document.getElementById('game-over-text');
const restartBtn      = document.getElementById('restart-btn');

// 리듬 텍스트
const beatTop    = document.getElementById('beat-top');
const beatBottom = document.getElementById('beat-bottom');

// --- 게임 상태 ---
// ✅ 5명(4 NPC + Player)
const numPlayers   = 5;
const playerIndex  = 4; // 플레이어 (아래 중앙)

/*
  index → 캐릭터

  0: NPC1 (좌측 하단)
  1: NPC2 (좌측 상단)
  2: NPC3 (우측 상단)
  3: NPC4 (우측 하단)
  4: Player (아래 중앙)

  이웃(양 옆):

  npc1(0): player(4), npc2(1)
  npc2(1): npc1(0), npc3(2)
  npc3(2): npc2(1), npc4(3)
  npc4(3): npc3(2), player(4)
  player(4): npc1(0), npc4(3)
*/

// ✅ 이웃 맵 수정
const leftNeighbor = {
  0: 4, // npc1의 왼쪽 이웃: player
  1: 0, // npc2의 왼쪽 이웃: npc1
  2: 1, // npc3의 왼쪽 이웃: npc2
  3: 2, // npc4의 왼쪽 이웃: npc3
  4: 3  // player의 왼쪽 이웃: npc4
};

const rightNeighbor = {
  0: 1, // npc1의 오른쪽 이웃: npc2
  1: 2, // npc2의 오른쪽 이웃: npc3
  2: 3, // npc3의 오른쪽 이웃: npc4
  3: 4, // npc4의 오른쪽 이웃: player
  4: 0  // player의 오른쪽 이웃: npc1
};

let currentBunny   = 1;  // 시작용
let prevBunny      = 1;
let currentTurn    = 0;

let gameRunning       = false;
let requiredAction    = 'none'; // 'none' | 'bunny' | 'carrot'
let carrotStage       = 0;      // 0: 아직, 1: 왼쪽 성공, 2: 양쪽 성공
let bunnyPressed      = false;
let selectingTarget   = false;

let currentTimeoutId      = null;
let carrotHighlightTimer  = null;

// 템포 (느리게 시작 → 서서히 빨라지게)
// 🔻 속도 살짝 다운 (이전 1800/650/0.94 → 조금 느리게)
let baseInterval   = 2000;
let currentInterval= 2000;
const minInterval  = 800;
const speedFactor  = 0.95;

// 비트(리듬) 표시용
let beatPhase   = 0;   // 0: 없음, 1: 첫 타이밍, 2: 두 번째 타이밍
let beatTimer1  = null;
let beatTimer2  = null;

// ---- 화면 전환 ----
function showScreen(screen) {
  [introScreen, tutorialScreen, gameScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');

  if (screen === tutorialScreen || screen === gameScreen) {
    setTimeout(layoutCircles, 0);
  }
}

// ---- 캐릭터 배치 ----
// NPC1 (좌하단), NPC2(좌상단), NPC3(우상단), NPC4(우하단), Player(아래 중앙)
function layoutCircles() {
  const circles = document.querySelectorAll('.circle');

  // ✅ 각도 재설정
  const npcAngles = {
    0: 140,   // npc1: 좌측 하단
    1: -140,  // npc2: 좌측 상단
    2: -40,   // npc3: 우측 상단
    3: 40     // npc4: 우측 하단
  };

  circles.forEach(circle => {
    const children = Array.from(circle.querySelectorAll('.player-slot'));
    const rect = circle.getBoundingClientRect();
    const w = rect.width  || 340;
    const h = rect.height || 280;
    const cx = w / 2;
    const cy = h / 2;
    const rx = w * 0.38;
    const ry = h * 0.34;

    children.forEach(slot => {
      const idx = Number(slot.dataset.pos);

      // 플레이어는 아래 중앙 고정
      if (idx === playerIndex) {
        const px = cx;
        const py = cy + ry * 0.95;
        slot.style.left = `${px}px`;
        slot.style.top  = `${py}px`;
        return;
      }

      const deg = npcAngles[idx];
      if (deg === undefined) return;

      const rad = deg * Math.PI / 180;
      const x = cx + rx * Math.cos(rad);
      const y = cy + ry * Math.sin(rad);

      slot.style.left = `${x}px`;
      slot.style.top  = `${y}px`;
    });
  });
}

// ---- 이모티콘 표시 ----
function resetSlotsEmoji() {
  slots.forEach(slot => {
    const idx = Number(slot.dataset.pos);
    slot.textContent = '😀';
    slot.classList.remove('is-bunny', 'is-carrot', 'player');
    if (idx === playerIndex) {
      slot.classList.add('player');
    }
  });
}

function updateRolesVisual() {
  resetSlotsEmoji();

  // 바니
  const bunnySlot = slots[currentBunny];
  if (bunnySlot) {
    bunnySlot.textContent = '🐰';
    bunnySlot.classList.add('is-bunny');
  }

  // 양 옆 당근
  const leftIdx  = leftNeighbor[currentBunny];
  const rightIdx = rightNeighbor[currentBunny];

  [leftIdx, rightIdx].forEach(idx => {
    if (idx === undefined) return;
    const s = slots[idx];
    if (!s) return;
    s.textContent = '🥕';
    s.classList.add('is-carrot');
  });
}

// ---- 패스 애니메이션용 ----
function animatePass(fromIdx, toIdx) {
  if (fromIdx === toIdx) return;
  const fromSlot = slots[fromIdx];
  const toSlot   = slots[toIdx];
  if (!fromSlot || !toSlot) return;

  const circleRect = gameCircle.getBoundingClientRect();
  const fromRect   = fromSlot.getBoundingClientRect();
  const toRect     = toSlot.getBoundingClientRect();

  const fromX = fromRect.left + fromRect.width / 2 - circleRect.left;
  const fromY = fromRect.top  + fromRect.height / 2 - circleRect.top;
  const toX   = toRect.left   + toRect.width   / 2 - circleRect.left;
  const toY   = toRect.top    + toRect.height  / 2 - circleRect.top;

  // 시작 위치 세팅
  passIndicator.style.transition = 'none';
  passIndicator.style.opacity = '1';
  passIndicator.style.left = `${fromX}px`;
  passIndicator.style.top  = `${fromY}px`;

  // 다음 프레임부터 이동
  requestAnimationFrame(() => {
    passIndicator.style.transition =
      'left 0.35s ease-out, top 0.35s ease-out, opacity 0.35s ease-out';
    passIndicator.style.left = `${toX}px`;
    passIndicator.style.top  = `${toY}px`;
    passIndicator.style.opacity = '0';
  });
}

// ---- 버튼 상태 ----
function resetButtonsHighlight() {
  [carrotLeftBtn, carrotRightBtn, bunnyBtn].forEach(btn => {
    btn.classList.remove('highlight', 'disabled');
  });
}

function disableAllControls(disabled = true) {
  const method = disabled ? 'add' : 'remove';
  [carrotLeftBtn, carrotRightBtn, bunnyBtn].forEach(btn => {
    btn.classList[method]('disabled');
  });
}

// 당근 하이라이트 (왼쪽 → 오른쪽 순서)
function updateCarrotHighlight(stage) {
  carrotLeftBtn.classList.remove('highlight');
  carrotRightBtn.classList.remove('highlight');

  if (stage === 0) {
    carrotLeftBtn.classList.add('highlight');   // 왼쪽 먼저
  } else if (stage === 1) {
    carrotRightBtn.classList.add('highlight');  // 이후 오른쪽
  }
}

// ---- 비트(리듬) 텍스트 ----
function clearBeatTimers() {
  if (beatTimer1) {
    clearTimeout(beatTimer1);
    beatTimer1 = null;
  }
  if (beatTimer2) {
    clearTimeout(beatTimer2);
    beatTimer2 = null;
  }
}

function updateBeatDisplay(phase) {
  beatPhase = phase;

  if (!beatTop || !beatBottom) return;

  if (phase === 0) {
    beatTop.textContent = '';
    beatBottom.textContent = '';
    beatTop.className = 'beat-text beat-top';
    beatBottom.className = 'beat-text beat-bottom';
    return;
  }

  // 공통 텍스트
  beatTop.textContent = '바니바니';
  beatBottom.textContent = '당근';

  // 색상/스타일
  if (phase === 1) {
    beatTop.className = 'beat-text beat-top phase1'; // 핑크
  } else {
    beatTop.className = 'beat-text beat-top phase2'; // 빨강
  }
  beatBottom.className = 'beat-text beat-bottom';
}

// ---- 게임 오버 ----
function gameOver(reason = '실패했습니다!') {
  gameRunning = false;
  requiredAction = 'none';
  selectingTarget = false;

  if (currentTimeoutId) {
    clearTimeout(currentTimeoutId);
    currentTimeoutId = null;
  }
  if (carrotHighlightTimer) {
    clearTimeout(carrotHighlightTimer);
    carrotHighlightTimer = null;
  }

  clearBeatTimers();
  updateBeatDisplay(0);

  gameOverText.textContent = `${reason}\n턴: ${currentTurn}`;
  gameOverOverlay.classList.add('active');
  statusText.textContent = '게임 오버...';
}

// ---- 다음 턴 예약 ----
function scheduleNextTurn(forcedNextBunny = null) {
  if (!gameRunning) return;
  currentTurn++;

  if (currentInterval > minInterval) {
    currentInterval = Math.max(minInterval, currentInterval * speedFactor);
  }

  turnInfoText.textContent = `턴: ${currentTurn} | 속도: ${(currentInterval / 1000).toFixed(2)}초`;

  const doStartTurn = () => startTurn(forcedNextBunny);
  // (여긴 그대로 둠) 텀: 0.15배
  currentTimeoutId = setTimeout(doStartTurn, currentInterval * 0.15);
}

// ---- 턴 시작 ----
function startTurn(forcedNextBunny = null) {
  if (!gameRunning) return;

  if (currentTimeoutId) {
    clearTimeout(currentTimeoutId);
    currentTimeoutId = null;
  }
  if (carrotHighlightTimer) {
    clearTimeout(carrotHighlightTimer);
    carrotHighlightTimer = null;
  }

  resetButtonsHighlight();

  prevBunny = currentBunny;

  if (forcedNextBunny !== null && forcedNextBunny !== undefined) {
    currentBunny = forcedNextBunny;
  } else {
    // 다음 바니 랜덤 (현재와 같지는 않게)
    let next;
    do {
      next = Math.floor(Math.random() * numPlayers);
    } while (next === currentBunny);
    currentBunny = next;
  }

  animatePass(prevBunny, currentBunny);
  updateRolesVisual();

  // --- 이번 턴 리듬 텍스트(바니바니/당근) 표시 ---
  clearBeatTimers();
  updateBeatDisplay(1); // 첫 타이밍: 바니바니(핑크) / 당근(주황)

  // 중간쯤에 2타이밍(빨간 바니바니)으로 변경
  beatTimer1 = setTimeout(() => {
    if (!gameRunning) return;
    updateBeatDisplay(2);
  }, currentInterval * 0.5);

  // 턴이 거의 끝날 때 텍스트 잠깐 꺼주기
  beatTimer2 = setTimeout(() => {
    if (!gameRunning) return;
    updateBeatDisplay(0);
  }, currentInterval * 1.1);

  const leftIdx  = leftNeighbor[currentBunny];
  const rightIdx = rightNeighbor[currentBunny];

  if (currentBunny === playerIndex) {
    // --- 내가 바니 ---
    requiredAction  = 'bunny';
    bunnyPressed    = false;
    selectingTarget = false;
    carrotStage     = 0;

    statusText.textContent = '너 차례! 🐰 버튼을 누르고, 다음 바니로 만들 얼굴을 탭해!';
    disableAllControls(false);
    bunnyBtn.classList.add('highlight');

    currentTimeoutId = setTimeout(() => {
      if (!gameRunning) return;
      if (!bunnyPressed) {
        gameOver('바니바니를 제때 누르지 못했어요!');
      } else {
        gameOver('지목할 사람을 선택하지 못했어요!');
      }
    }, currentInterval * 1.3);

  } else if (playerIndex === leftIdx || playerIndex === rightIdx) {
    // --- 내가 당근 자리 ---
    requiredAction = 'carrot';
    carrotStage    = 0;
    bunnyPressed   = false;
    selectingTarget = false;

    statusText.textContent = '당근당근! 🥕 왼쪽 → 🥕 오른쪽 순서로 눌러!';
    disableAllControls(false);

    // 왼쪽 먼저 하이라이트
    updateCarrotHighlight(0);
    carrotHighlightTimer = setTimeout(() => {
      if (!gameRunning || requiredAction !== 'carrot') return;
      updateCarrotHighlight(1); // 오른쪽 하이라이트
    }, currentInterval * 0.5);

    currentTimeoutId = setTimeout(() => {
      if (!gameRunning) return;
      if (carrotStage < 2) {
        gameOver('당근당근을 제대로 하지 못했어요!');
      } else {
        scheduleNextTurn();
      }
    }, currentInterval);

  } else {
    // --- 아무 역할도 아님 ---
    requiredAction = 'none';
    bunnyPressed   = false;
    carrotStage    = 0;
    selectingTarget = false;

    statusText.textContent = '지켜보는 중... 지금은 아무것도 누르지 마!';
    disableAllControls(false);

    currentTimeoutId = setTimeout(() => {
      if (!gameRunning) return;
      scheduleNextTurn();
    }, currentInterval);
  }
}

// ---- 버튼 이벤트 ----

// 바니 버튼
bunnyBtn.addEventListener('click', () => {
  if (!gameRunning) return;
  if (requiredAction !== 'bunny') {
    gameOver('지금은 바니바니 차례가 아니에요!');
    return;
  }
  if (bunnyPressed) return;

  bunnyPressed = true;
  selectingTarget = true;
  statusText.textContent = '좋아! 이제 다음 바니로 만들 얼굴을 탭해!';
});

// 당근 왼쪽
carrotLeftBtn.addEventListener('click', () => {
  if (!gameRunning) return;
  if (requiredAction !== 'carrot') {
    gameOver('지금은 당근당근 차례가 아니에요!');
    return;
  }
  if (carrotStage !== 0) {
    gameOver('당근은 왼쪽 → 오른쪽 순서로 눌러야 해요!');
    return;
  }
  carrotStage = 1;
  updateCarrotHighlight(1); // 오른쪽 하이라이트
  statusText.textContent = '좋아! 이제 오른쪽 당근을 눌러!';
});

// 당근 오른쪽
carrotRightBtn.addEventListener('click', () => {
  if (!gameRunning) return;
  if (requiredAction !== 'carrot') {
    gameOver('지금은 당근당근 차례가 아니에요!');
    return;
  }
  if (carrotStage !== 1) {
    gameOver('당근은 왼쪽 → 오른쪽 순서로 눌러야 해요!');
    return;
  }
  carrotStage = 2;
  updateCarrotHighlight(2); // 둘 다 off
  statusText.textContent = '완벽한 당근당근! 🥕';

  if (currentTimeoutId) {
    clearTimeout(currentTimeoutId);
    currentTimeoutId = null;
  }
  scheduleNextTurn();
});

// 얼굴 클릭 → 바니인 경우에만 지목
slots.forEach(slot => {
  slot.addEventListener('click', () => {
    if (!gameRunning) return;
    const idx = Number(slot.dataset.pos);

    if (requiredAction === 'bunny' && bunnyPressed && selectingTarget) {
      if (idx === playerIndex) {
        statusText.textContent = '자기 자신에게는 지목할 수 없어요!';
        return;
      }

      selectingTarget = false;

      if (currentTimeoutId) {
        clearTimeout(currentTimeoutId);
        currentTimeoutId = null;
      }

      statusText.textContent = `${idx}번 자리에 바니를 넘겼다!`;
      scheduleNextTurn(idx);
      return;
    }

    // 그 외 상황의 얼굴 탭은 그냥 무시
  });
});

// ---- 메뉴 / 흐름 ----
introStartBtn.addEventListener('click', () => {
  showScreen(tutorialScreen);
});

tutorialStartGameBtn.addEventListener('click', () => {
  showScreen(gameScreen);
  startGame();
});

quitToMenuBtn.addEventListener('click', () => {
  gameRunning = false;
  if (currentTimeoutId) {
    clearTimeout(currentTimeoutId);
    currentTimeoutId = null;
  }
  if (carrotHighlightTimer) {
    clearTimeout(carrotHighlightTimer);
    carrotHighlightTimer = null;
  }
  clearBeatTimers();
  updateBeatDisplay(0);
  gameOverOverlay.classList.remove('active');
  showScreen(introScreen);
});

restartBtn.addEventListener('click', () => {
  gameOverOverlay.classList.remove('active');
  startGame();
});

// ---- 게임 시작 ----
function startGame() {
  layoutCircles();
  resetSlotsEmoji();

  gameRunning     = true;
  currentTurn     = 0;
  baseInterval    = 2000;
  currentInterval = baseInterval;
  requiredAction  = 'none';
  carrotStage     = 0;
  bunnyPressed    = false;
  selectingTarget = false;

  if (currentTimeoutId) {
    clearTimeout(currentTimeoutId);
    currentTimeoutId = null;
  }
  if (carrotHighlightTimer) {
    clearTimeout(carrotHighlightTimer);
    carrotHighlightTimer = null;
  }

  clearBeatTimers();
  updateBeatDisplay(0);

  gameOverOverlay.classList.remove('active');
  statusText.textContent = '게임 시작! 누가 첫 바니가 될까?';
  turnInfoText.textContent = '턴: 0 | 속도: -';

  // 첫 바니는 플레이어를 제외한 NPC들 중 한 명
  let first;
  do {
    first = Math.floor(Math.random() * numPlayers);
  } while (first === playerIndex);
  currentBunny = first;
  prevBunny    = first;
  updateRolesVisual();

  // 바로 첫 턴 시작
  startTurn(currentBunny);
}


