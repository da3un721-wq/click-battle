// =============================
//  System Repair - Click Battle
//  미션 훅 + M1 회로 복구 커스텀 로직
// =============================
document.addEventListener("DOMContentLoaded", () => {
  // ---- DOM 요소 가져오기 ----
  const introScreen   = document.getElementById("intro-screen");
  const gameScreen    = document.getElementById("game-screen");
  const endScreen     = document.getElementById("end-screen");

  const startBtn      = document.getElementById("start-btn");
  const restartBtn    = document.getElementById("restart-btn");

  const stage         = document.getElementById("stage");
  const mainTarget    = document.getElementById("main-target");
  const totalClicksEl = document.getElementById("total-clicks");
  const finalClicksEl = document.getElementById("final-clicks");

  const missionLabel   = document.getElementById("mission-label");
  const missionTitle   = document.getElementById("mission-title");
  const missionDesc    = document.getElementById("mission-desc");
  const missionIndexEl = document.getElementById("mission-index");
  const missionTotalEl = document.getElementById("mission-total");

  const targetLabelEl  = mainTarget.querySelector(".target-label");

  // ---- 상태값 ----
  let totalClicks       = 0;
  let currentMissionIdx = -1;    // 아직 로드된 미션 없음
  let missionClickCount = 0;
  let missionCompleted  = false;

  // ---- M1(회로)에서 쓸 전류 게이지 상태 ----
  let circuitCharge     = 0;     // 0.0 ~ 1.0
  let circuitDrainTimer = null;

  // =============================
  //  미션 데이터 정의
  // =============================
  const missions = [
    {
      id: "M1",
      short: "회로 연결",
      title: "회로를 복구하세요",
      desc: "끊어진 네온 회로에 전류를 계속 흘려보내세요.<br>버튼을 반복해서 클릭해 회로를 점등시키면 다음 단계가 열립니다.",
      // 클릭 수는 통계용만, 클리어는 전류 게이지로
      clicksToComplete: 9999,
      targetText: "CHARGE",
      stageClass: "mission-circuit",
      autoCompleteByCount: false,  // ✅ 이 미션은 클릭 수로 자동 클리어 X

      onEnter({ stage, mainTarget, missionIndex }) {
        circuitCharge = 0;
        stage.style.setProperty("--circuit-level", "0");

        // STAGE CLEAR 오버레이 혹시 남아 있으면 제거
        const oldClear = stage.querySelector(".stage-clear-message");
        if (oldClear) oldClear.remove();

        // 버튼 다시 보이게
        mainTarget.style.display = "";

        // 회로 라인 레이어 추가 (기존 있으면 제거)
        const existing = stage.querySelector(".circuit-lines");
        if (existing) existing.remove();

        const lines = document.createElement("div");
        lines.className = "circuit-lines";
        lines.innerHTML = `
          <div class="circuit-line h h1"></div>
          <div class="circuit-line h h2"></div>
          <div class="circuit-line h h3"></div>
          <div class="circuit-line v v1"></div>
          <div class="circuit-line v v2"></div>
          <div class="circuit-line v v3"></div>
        `;
        stage.insertBefore(lines, mainTarget);

        stage.classList.remove("circuit-on");

        // 전류 감소 타이머
        if (circuitDrainTimer) {
          clearInterval(circuitDrainTimer);
          circuitDrainTimer = null;
        }

        circuitDrainTimer = setInterval(() => {
          if (currentMissionIdx !== missionIndex || missionCompleted) return;

          circuitCharge = Math.max(0, circuitCharge - 0.02);
          stage.style.setProperty("--circuit-level", circuitCharge.toString());
        }, 120);
      },

      onClick({ stage, mainTarget, completeMission }) {
        if (missionCompleted) return;

        circuitCharge = Math.min(1, circuitCharge + 0.08);
        stage.style.setProperty("--circuit-level", circuitCharge.toString());

        if (circuitCharge >= 0.98 && !missionCompleted) {
          missionCompleted = true;

          // 회로 ON 효과
          stage.classList.add("circuit-on");

          // 버튼 숨기고 중앙에 STAGE CLEAR 텍스트
          mainTarget.style.display = "none";

          let clear = stage.querySelector(".stage-clear-message");
          if (!clear) {
            clear = document.createElement("div");
            clear.className = "stage-clear-message";
            clear.innerHTML = `
              <div class="clear-title">STAGE CLEAR</div>
              <div class="clear-sub">회로가 점등되었습니다.</div>
              <div class="clear-hint">다음 시스템으로 이동 중...</div>
            `;
            stage.appendChild(clear);
          }

          setTimeout(() => {
            completeMission();
          }, 900);
        }
      },

      onLeave({ stage, mainTarget }) {
        const lines = stage.querySelector(".circuit-lines");
        if (lines) lines.remove();

        const clear = stage.querySelector(".stage-clear-message");
        if (clear) clear.remove();

        if (circuitDrainTimer) {
          clearInterval(circuitDrainTimer);
          circuitDrainTimer = null;
        }

        stage.classList.remove("circuit-on");
        stage.style.removeProperty("--circuit-level");

        // 버튼 다시 복구 (다음 미션에서 쓸 수 있게)
        mainTarget.style.display = "";
      }
    },

    // 이하 미션 2~10: 지금은 골격만, 추후 연출 넣을 예정
    {
      id: "M2",
      short: "글리치 제거",
      title: "화면의 글리치를 제거하세요",
      desc: "노이즈와 깨진 픽셀을 제거하기 위해 빠르게 클릭하세요.<br>잔상이 사라질수록 시스템이 안정화됩니다.",
      clicksToComplete: 30,
      targetText: "FIX",
      stageClass: "mission-glitch",

      onEnter() {},
      onClick() {},
      onLeave() {}
    },
    {
      id: "M3",
      short: "전력 누수",
      title: "전력 누수를 막으세요",
      desc: "전력이 새어 나가고 있습니다.<br>버튼을 연속해서 눌러 누수를 일시적으로 억제하세요.",
      clicksToComplete: 35,
      targetText: "SEAL",
      stageClass: "mission-leak",

      onEnter() {},
      onClick() {},
      onLeave() {}
    },
    {
      id: "M4",
      short: "AI 눈 뜨기",
      title: "잠든 AI를 깨우세요",
      desc: "AI의 눈에 신호를 주입하세요.<br>충분한 클릭이 모이면 눈이 완전히 떠집니다.",
      clicksToComplete: 40,
      targetText: "PING",
      stageClass: "mission-ai",

      onEnter() {},
      onClick() {},
      onLeave() {}
    },
    {
      id: "M5",
      short: "부품 재조립",
      title: "흩어진 부품들을 다시 모으세요",
      desc: "버튼을 클릭해 자석처럼 부품을 끌어당기세요.<br>충분한 수의 부품이 모이면 다음 단계로 이동합니다.",
      clicksToComplete: 30,
      targetText: "PULL",
      stageClass: "mission-parts",

      onEnter() {},
      onClick() {},
      onLeave() {}
    },
    {
      id: "M6",
      short: "데이터 누락",
      title: "누락된 데이터를 채우세요",
      desc: "비어 있는 데이터 슬롯에 신호를 채워 넣으세요.<br>지속적인 입력이 필요합니다.",
      clicksToComplete: 35,
      targetText: "FILL",
      stageClass: "mission-data",

      onEnter() {},
      onClick() {},
      onLeave() {}
    },
    {
      id: "M7",
      short: "냉각 과부하",
      title: "과열된 시스템을 식히세요",
      desc: "열기를 식히기 위해 버튼을 계속 눌러 냉각 장치를 가동하세요.",
      clicksToComplete: 40,
      targetText: "COOL",
      stageClass: "mission-cool",

      onEnter() {},
      onClick() {},
      onLeave() {}
    },
    {
      id: "M8",
      short: "색상 시스템",
      title: "잃어버린 색을 복구하세요",
      desc: "흑백이 된 인터페이스에 색을 되돌려주세요.<br>클릭할수록 색상 데이터가 회복됩니다.",
      clicksToComplete: 35,
      targetText: "COLOR",
      stageClass: "mission-color",

      onEnter() {},
      onClick() {},
      onLeave() {}
    },
    {
      id: "M9",
      short: "보안 장벽",
      title: "보안 장벽을 해제하세요",
      desc: "잠겨 있는 네온 락을 흔들어 여세요.<br>충분히 많은 클릭이 축적되면 잠금이 풀립니다.",
      clicksToComplete: 45,
      targetText: "UNLOCK",
      stageClass: "mission-lock",

      onEnter() {},
      onClick() {},
      onLeave() {}
    },
    {
      id: "M10",
      short: "최종 안정화",
      title: "시스템을 임시 안정화합니다",
      desc: "마지막으로 전체 시스템을 안정화하기 위해 신호를 주입하세요.<br>완전한 복구는 아니지만, 잠시 숨을 고를 수 있습니다.",
      clicksToComplete: 50,
      targetText: "STABILIZE",
      stageClass: "mission-final",

      onEnter() {},
      onClick() {},
      onLeave() {}
    }
  ];

  missionTotalEl.textContent = missions.length.toString();

  // =============================
  //  화면 전환
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
    currentMissionIdx = -1;
    missionClickCount = 0;
    missionCompleted  = false;

    totalClicksEl.textContent = "0";
    finalClicksEl.textContent = "0";

    if (circuitDrainTimer) {
      clearInterval(circuitDrainTimer);
      circuitDrainTimer = null;
    }

    // 버튼 다시 보이게 (안전장치)
    mainTarget.style.display = "";
  }

  // =============================
  //  미션 세팅 / 진행
  // =============================
  function loadMission(index) {
    const mission = missions[index];
    if (!mission) return;

    // 이전 미션 정리 (onLeave)
    if (currentMissionIdx !== -1) {
      const prevMission = missions[currentMissionIdx];
      if (prevMission && typeof prevMission.onLeave === "function") {
        prevMission.onLeave({
          stage,
          mainTarget,
          missionIndex: currentMissionIdx,
          mission: prevMission
        });
      }
    }

    currentMissionIdx = index;
    missionClickCount = 0;
    missionCompleted  = false;

    // 공통 UI 텍스트 업데이트
    missionLabel.textContent   = `${mission.id} · ${mission.short}`;
    missionTitle.textContent   = mission.title;
    missionDesc.innerHTML      = mission.desc;
    missionIndexEl.textContent = (index + 1).toString();
    targetLabelEl.textContent  = mission.targetText || "TAP";

    // stage 클래스 (미션별 테마 적용)
    stage.className = "stage";
    if (mission.stageClass) {
      stage.classList.add(mission.stageClass);
    }

    // 혹시 남아 있는 STAGE CLEAR 메시지 제거
    const oldClear = stage.querySelector(".stage-clear-message");
    if (oldClear) oldClear.remove();

    // 버튼 다시 보이게
    mainTarget.style.display = "";

    // 미션 전용 onEnter 호출
    if (typeof mission.onEnter === "function") {
      mission.onEnter({
        stage,
        mainTarget,
        missionIndex: index,
        mission
      });
    }
  }

  function completeMission() {
    missionCompleted = true;

    mainTarget.classList.add("completed");
    setTimeout(() => {
      mainTarget.classList.remove("completed");
    }, 300);

    setTimeout(() => {
      const nextIndex = currentMissionIdx + 1;

      if (nextIndex >= missions.length) {
        finalClicksEl.textContent = totalClicks.toString();
        showScreen("end");
        return;
      }

      loadMission(nextIndex);
    }, 600);
  }

  function handleClick() {
    const mission = missions[currentMissionIdx];
    if (!mission || missionCompleted) return; // 클리어 컷씬 중에는 무시

    totalClicks++;
    totalClicksEl.textContent = totalClicks.toString();

    missionClickCount++;

    const progress = mission.clicksToComplete
      ? missionClickCount / mission.clicksToComplete
      : 0;

    if (typeof mission.onClick === "function") {
      mission.onClick({
        stage,
        mainTarget,
        missionIndex: currentMissionIdx,
        missionClickCount,
        progress,
        mission,
        totalClicks,
        completeMission
      });
    }

    const autoByCount = mission.autoCompleteByCount !== false;
    if (
      autoByCount &&
      !missionCompleted &&
      mission.clicksToComplete &&
      missionClickCount >= mission.clicksToComplete
    ) {
      completeMission();
    }
  }

  // =============================
  //  이벤트 연결
  // =============================
  startBtn.addEventListener("click", () => {
    resetGameState();
    loadMission(0);
    showScreen("game");
  });

  mainTarget.addEventListener("click", handleClick);

  restartBtn.addEventListener("click", () => {
    resetGameState();
    showScreen("intro");
  });

  showScreen("intro");
});
