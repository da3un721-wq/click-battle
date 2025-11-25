// =============================
//  System Repair - Click Battle
//  기본 게임 로직
// =============================
document.addEventListener("DOMContentLoaded", () => {
  // ---- DOM 요소 가져오기 ----
  const introScreen   = document.getElementById("intro-screen");
  const gameScreen    = document.getElementById("game-screen");
  const endScreen     = document.getElementById("end-screen");

  const startBtn      = document.getElementById("start-btn");
  const restartBtn    = document.getElementById("restart-btn");

  const mainTarget    = document.getElementById("main-target");
  const totalClicksEl = document.getElementById("total-clicks");
  const finalClicksEl = document.getElementById("final-clicks");

  const missionLabel   = document.getElementById("mission-label");
  const missionTitle   = document.getElementById("mission-title");
  const missionDesc    = document.getElementById("mission-desc");
  const missionIndexEl = document.getElementById("mission-index");
  const missionTotalEl = document.getElementById("mission-total");
  const nextBtn        = document.getElementById("next-btn");

  const targetLabelEl  = mainTarget.querySelector(".target-label");

  // ---- 상태값 ----
  let totalClicks       = 0;
  let currentMissionIdx = 0;
  let missionClickCount = 0;
  let missionCompleted  = false;

  // ---- 미션 데이터 정의 (10개) ----
  const missions = [
    {
      id: "M1",
      short: "회로 연결",
      title: "회로를 복구하세요",
      desc: "끊어진 네온 회로에 전류를 계속 흘려보내세요.<br>버튼을 반복해서 클릭해 회로를 점등시키면 다음 단계가 열립니다.",
      clicksToComplete: 25,
      targetText: "TAP"
    },
    {
      id: "M2",
      short: "글리치 제거",
      title: "화면의 글리치를 제거하세요",
      desc: "노이즈와 깨진 픽셀을 제거하기 위해 빠르게 클릭하세요.<br>잔상이 사라질수록 시스템이 안정화됩니다.",
      clicksToComplete: 30,
      targetText: "FIX"
    },
    {
      id: "M3",
      short: "전력 누수",
      title: "전력 누수를 막으세요",
      desc: "전력이 새어 나가고 있습니다.<br>버튼을 연속해서 눌러 누수를 일시적으로 억제하세요.",
      clicksToComplete: 35,
      targetText: "SEAL"
    },
    {
      id: "M4",
      short: "AI 눈 뜨기",
      title: "잠든 AI를 깨우세요",
      desc: "AI의 눈에 신호를 주입하세요.<br>충분한 클릭이 모이면 눈이 완전히 떠집니다.",
      clicksToComplete: 40,
      targetText: "PING"
    },
    {
      id: "M5",
      short: "부품 재조립",
      title: "흩어진 부품들을 다시 모으세요",
      desc: "버튼을 클릭해 자석처럼 부품을 끌어당기세요.<br>충분한 수의 부품이 모이면 다음 단계로 이동합니다.",
      clicksToComplete: 30,
      targetText: "PULL"
    },
    {
      id: "M6",
      short: "데이터 누락",
      title: "누락된 데이터를 채우세요",
      desc: "비어 있는 데이터 슬롯에 신호를 채워 넣으세요.<br>지속적인 입력이 필요합니다.",
      clicksToComplete: 35,
      targetText: "FILL"
    },
    {
      id: "M7",
      short: "냉각 과부하",
      title: "과열된 시스템을 식히세요",
      desc: "열기를 식히기 위해 버튼을 계속 눌러 냉각 장치를 가동하세요.",
      clicksToComplete: 40,
      targetText: "COOL"
    },
    {
      id: "M8",
      short: "색상 시스템",
      title: "잃어버린 색을 복구하세요",
      desc: "흑백이 된 인터페이스에 색을 되돌려주세요.<br>클릭할수록 색상 데이터가 회복됩니다.",
      clicksToComplete: 35,
      targetText: "COLOR"
    },
    {
      id: "M9",
      short: "보안 장벽",
      title: "보안 장벽을 해제하세요",
      desc: "잠겨 있는 네온 락을 흔들어 여세요.<br>충분히 많은 클릭이 축적되면 잠금이 풀립니다.",
      clicksToComplete: 45,
      targetText: "UNLOCK"
    },
    {
      id: "M10",
      short: "최종 안정화",
      title: "시스템을 임시 안정화합니다",
      desc: "마지막으로 전체 시스템을 안정화하기 위해 신호를 주입하세요.<br>완전한 복구는 아니지만, 잠시 숨을 고를 수 있습니다.",
      clicksToComplete: 50,
      targetText: "STABILIZE"
    }
  ];

  missionTotalEl.textContent = missions.length.toString();

  // =============================
  //  화면 전환 관련 함수들
  // =============================
  function showScreen(screenName) {
    introScreen.classList.remove("active");
    gameScreen.classList.remove("active");
    endScreen.classList.remove("active");

    if (screenName === "intro") {
      introScreen.classList.add("active");
    } else if (screenName === "game") {
      gameScreen.classList.add("active");
    } else if (screenName === "end") {
      endScreen.classList.add("active");
    }
  }

  function resetGameState() {
    totalClicks       = 0;
    currentMissionIdx = 0;
    missionClickCount = 0;
    missionCompleted  = false;

    totalClicksEl.textContent = "0";
    finalClicksEl.textContent = "0";
    nextBtn.disabled = true;
  }

  // =============================
  //  미션 세팅 / 진행
  // =============================
  function loadMission(index) {
    const mission = missions[index];
    if (!mission) return;

    currentMissionIdx = index;
    missionClickCount = 0;
    missionCompleted  = false;

    missionLabel.textContent = `${mission.id} · ${mission.short}`;
    missionTitle.textContent = mission.title;
    missionDesc.innerHTML    = mission.desc;

    missionIndexEl.textContent = (index + 1).toString();
    targetLabelEl.textContent  = mission.targetText || "TAP";

    nextBtn.disabled = true;
  }

  function handleClick() {
    // 총 클릭 수
    totalClicks++;
    totalClicksEl.textContent = totalClicks.toString();

    // 현재 미션 클릭 수
    missionClickCount++;

    const mission = missions[currentMissionIdx];
    if (!mission) return;

    if (!missionCompleted && missionClickCount >= mission.clicksToComplete) {
      completeMission();
    }
  }

  function completeMission() {
    missionCompleted = true;
    nextBtn.disabled = false;

    // 비주얼 피드백
    mainTarget.classList.add("completed");
    setTimeout(() => {
      mainTarget.classList.remove("completed");
    }, 350);
  }

  function goToNextMission() {
    if (!missionCompleted) return;

    const nextIndex = currentMissionIdx + 1;

    if (nextIndex >= missions.length) {
      // 모든 미션 완료 → 엔딩 화면
      finalClicksEl.textContent = totalClicks.toString();
      showScreen("end");
      return;
    }

    loadMission(nextIndex);
  }

  // =============================
  //  이벤트 연결
  // =============================

  // 시작 버튼: 인트로 → 게임
  startBtn.addEventListener("click", () => {
    resetGameState();
    loadMission(0);
    showScreen("game");
  });

  // 메인 클릭 타겟
  mainTarget.addEventListener("click", handleClick);

  // 다음 미션 버튼
  nextBtn.addEventListener("click", goToNextMission);

  // 재시작 버튼: 엔드 → 인트로
  restartBtn.addEventListener("click", () => {
    resetGameState();
    showScreen("intro");
  });

  // 처음에는 인트로 화면 보여주기
  showScreen("intro");
});
