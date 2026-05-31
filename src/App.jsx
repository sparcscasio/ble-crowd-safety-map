import { useEffect, useMemo, useState } from "react";
import "./App.css";

const SAFETY_LEVELS = {
  safe: {
    label: "안전",
    color: "#7BC96F",
    bg: "rgba(123, 201, 111, 0.18)",
    message: "인파 밀집도가 낮아 안전한 상태입니다.",
  },
  caution: {
    label: "주의",
    color: "#F4D35E",
    bg: "rgba(244, 211, 94, 0.25)",
    message: "인파가 증가하고 있습니다. 현장 확인이 필요합니다.",
  },
  crowded: {
    label: "혼잡",
    color: "#F28C38",
    bg: "rgba(242, 140, 56, 0.22)",
    message: "혼잡도가 높습니다. 동선 분산 안내가 필요합니다.",
  },
  danger: {
    label: "위험",
    color: "#E85D75",
    bg: "rgba(232, 93, 117, 0.22)",
    message: "위험 수준입니다. 즉시 안전요원 배치와 우회 안내가 필요합니다.",
  },
};

const initialZones = [
  {
    id: "A",
    name: "메인 무대",
    distance: 3,
    area: 85,
    rawRssi: -86.5,
    filteredRssi: -84.8,
    envOffset: -1.2,
    x: 65,
    y: 34,
  },
  {
    id: "B",
    name: "먹거리 부스",
    distance: 4,
    area: 70,
    rawRssi: -82.2,
    filteredRssi: -80.9,
    envOffset: -0.5,
    x: 25,
    y: 65,
  },
  {
    id: "C",
    name: "체험 부스",
    distance: 5,
    area: 95,
    rawRssi: -79.5,
    filteredRssi: -78.6,
    envOffset: 0.2,
    x: 25,
    y: 83,
  },
  {
    id: "D",
    name: "출입구",
    distance: 2,
    area: 55,
    rawRssi: -87.8,
    filteredRssi: -86.4,
    envOffset: -0.8,
    x: 77,
    y: 83,
  },
  {
    id: "E",
    name: "안내 부스",
    distance: 6,
    area: 100,
    rawRssi: -75.2,
    filteredRssi: -74.5,
    envOffset: 0.4,
    x: 25,
    y: 23,
  },
  {
    id: "F",
    name: "이동 통로",
    distance: 3,
    area: 65,
    rawRssi: -84.3,
    filteredRssi: -83.1,
    envOffset: -0.4,
    x: 50,
    y: 72,
  },
];

function estimatePeople({ distance, filteredRssi, envOffset }) {
  const p0 = -69.74;
  const n = 1.6697;
  const alpha = 0.8624;

  const expectedRssi = p0 - 10 * n * Math.log10(distance) + envOffset;
  const people = Math.max(0, Math.round((expectedRssi - filteredRssi) / alpha));

  return people;
}

function getDensityLevel(density) {
  if (density < 0.08) return "safe";
  if (density < 0.16) return "caution";
  if (density < 0.25) return "crowded";
  return "danger";
}

function StatusBadge({ level }) {
  const status = SAFETY_LEVELS[level];

  return (
    <span
      className="status-badge"
      style={{
        background: status.bg,
        color: status.color,
        borderColor: status.color,
      }}
    >
      {status.label}
    </span>
  );
}

function ZoneCard({ zone, selected, onClick }) {
  const people = estimatePeople(zone);
  const density = people / zone.area;
  const level = getDensityLevel(density);
  const status = SAFETY_LEVELS[level];

  return (
    <button
      className={`zone-card ${selected ? "selected" : ""}`}
      onClick={onClick}
      type="button"
    >
      <div className="zone-card-top">
        <strong>{zone.name}</strong>
        <StatusBadge level={level} />
      </div>

      <div className="zone-card-body">
        <div>
          <span>추정 인원</span>
          <b>{people}명</b>
        </div>
        <div>
          <span>밀집도</span>
          <b>{density.toFixed(2)} 명/㎡</b>
        </div>
      </div>

      <p>{status.message}</p>
    </button>
  );
}

function MapZone({ zone, selected, onClick }) {
  const people = estimatePeople(zone);
  const density = people / zone.area;
  const level = getDensityLevel(density);
  const status = SAFETY_LEVELS[level];

  return (
    <button
      type="button"
      className={`map-zone ${selected ? "selected" : ""}`}
      style={{
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        background: status.bg,
        borderColor: status.color,
      }}
      onClick={onClick}
    >
      <span>{zone.id}</span>
      <strong>{zone.name}</strong>
      <em>{status.label}</em>
    </button>
  );
}

function AlertPanel({ zones }) {
  const dangerZones = zones
    .map((zone) => {
      const people = estimatePeople(zone);
      const density = people / zone.area;
      const level = getDensityLevel(density);

      return {
        ...zone,
        people,
        density,
        level,
      };
    })
    .filter((zone) => zone.level === "danger" || zone.level === "crowded");

  if (dangerZones.length === 0) {
    return (
      <section className="alert-panel safe-alert">
        <h3>경고 알림</h3>
        <p>현재 즉시 조치가 필요한 위험 구역은 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="alert-panel">
      <h3>경고 알림</h3>

      {dangerZones.map((zone) => (
        <div className="alert-item" key={zone.id}>
          <strong>
            {zone.name} · {SAFETY_LEVELS[zone.level].label}
          </strong>
          <p>
            추정 인원 {zone.people}명, 밀집도 {zone.density.toFixed(2)} 명/㎡.
            안전요원 배치, 우회 동선 안내, 현장 방송을 권장합니다.
          </p>
        </div>
      ))}
    </section>
  );
}

function SelectedZoneDetail({ zone }) {
  const people = estimatePeople(zone);
  const density = people / zone.area;
  const level = getDensityLevel(density);
  const status = SAFETY_LEVELS[level];

  return (
    <section className="detail-panel">
      <div className="section-title">
        <h3>선택 구역 상세 정보</h3>
        <StatusBadge level={level} />
      </div>

      <h2>{zone.name}</h2>
      <p>{status.message}</p>

      <div className="metric-grid">
        <div>
          <span>RSSI 원시값</span>
          <strong>{zone.rawRssi} dBm</strong>
        </div>
        <div>
          <span>보정 RSSI</span>
          <strong>{zone.filteredRssi} dBm</strong>
        </div>
        <div>
          <span>기준 거리</span>
          <strong>{zone.distance} m</strong>
        </div>
        <div>
          <span>구역 면적</span>
          <strong>{zone.area} ㎡</strong>
        </div>
        <div>
          <span>추정 인원</span>
          <strong>{people}명</strong>
        </div>
        <div>
          <span>밀집도</span>
          <strong>{density.toFixed(2)} 명/㎡</strong>
        </div>
      </div>

      <div className="action-box">
        <strong>권장 조치</strong>
        {level === "safe" && <p>정상 모니터링을 유지합니다.</p>}
        {level === "caution" && <p>현장 상황을 확인하고 안내 인력을 대기시킵니다.</p>}
        {level === "crowded" && <p>인파 분산 안내와 우회 동선 표시를 시작합니다.</p>}
        {level === "danger" && (
          <p>즉시 안전요원을 배치하고, 진입 제한 및 현장 방송을 실시합니다.</p>
        )}
      </div>
    </section>
  );
}

export default function App() {
  const [zones, setZones] = useState(initialZones);
  const [selectedZoneId, setSelectedZoneId] = useState("A");
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const selectedZone = zones.find((zone) => zone.id === selectedZoneId);

  const summary = useMemo(() => {
    const analyzed = zones.map((zone) => {
      const people = estimatePeople(zone);
      const density = people / zone.area;
      const level = getDensityLevel(density);

      return { ...zone, people, density, level };
    });

    return {
      totalPeople: analyzed.reduce((sum, zone) => sum + zone.people, 0),
      dangerCount: analyzed.filter((zone) => zone.level === "danger").length,
      crowdedCount: analyzed.filter((zone) => zone.level === "crowded").length,
      averageDensity:
        analyzed.reduce((sum, zone) => sum + zone.density, 0) / analyzed.length,
    };
  }, [zones]);

  function updateRandomData() {
    setZones((prev) =>
      prev.map((zone) => {
        const rawMovement = Number((Math.random() * 6 - 3).toFixed(1));
        const filteredMovement = Number((rawMovement * 0.65).toFixed(1));

        const nextRawRssi = Math.max(
          -96,
          Math.min(-65, Number((zone.rawRssi + rawMovement).toFixed(1)))
        );

        const nextFilteredRssi = Math.max(
          -96,
          Math.min(
            -65,
            Number((zone.filteredRssi + filteredMovement).toFixed(1))
          )
        );

        return {
          ...zone,
          rawRssi: nextRawRssi,
          filteredRssi: nextFilteredRssi,
        };
      })
    );

    setLastUpdatedAt(new Date());
  }

  function toggleSimulation() {
    setIsSimulationRunning((prev) => !prev);
  }

  function resetSimulation() {
    setIsSimulationRunning(false);
    setZones(initialZones);
    setSelectedZoneId("A");
    setLastUpdatedAt(null);
  }

  useEffect(() => {
    if (!isSimulationRunning) return;

    const intervalId = setInterval(() => {
      updateRandomData();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isSimulationRunning]);

  return (
    <main className="page">
      <header className="header">
        <div>
          <p className="eyebrow">BLE RSSI 기반 실시간 안전관리</p>
          <h1>횡성한우축제 인파 밀집도 안전지도</h1>
          <p>
            BLE 신호 감쇄, RSSI 보정, 구역별 밀집도 추정을 이용해 축제장
            혼잡 상태를 시각적으로 표시하는 관리자용 와이어프레임입니다.
          </p>
        </div>

        <div className="simulation-control">
          <div className="simulation-buttons">
            <button
              className={`primary-button ${isSimulationRunning ? "stop" : ""}`}
              onClick={toggleSimulation}
              type="button"
            >
              {isSimulationRunning ? "시뮬레이션 종료" : "시뮬레이션 시작"}
            </button>

            <button
              className="secondary-button"
              onClick={resetSimulation}
              type="button"
            >
              초기화
            </button>
          </div>

          <span className="simulation-status">
            {isSimulationRunning ? "진행 중" : "대기 중"}
            {lastUpdatedAt && (
              <>
                {" · 마지막 갱신 "}
                {lastUpdatedAt.toLocaleTimeString("ko-KR")}
              </>
            )}
          </span>
        </div>
      </header>

      <section className="summary-grid">
        <article>
          <span>전체 추정 인원</span>
          <strong>{summary.totalPeople}명</strong>
        </article>
        <article>
          <span>평균 밀집도</span>
          <strong>{summary.averageDensity.toFixed(2)} 명/㎡</strong>
        </article>
        <article>
          <span>혼잡 구역</span>
          <strong>{summary.crowdedCount}곳</strong>
        </article>
        <article>
          <span>위험 구역</span>
          <strong>{summary.dangerCount}곳</strong>
        </article>
      </section>

      <section className="content-grid">
        <section className="map-panel">
          <div className="section-title">
            <h2>실시간 인파 밀집도 안전지도</h2>
            <div className="legend">
              {Object.entries(SAFETY_LEVELS).map(([key, value]) => (
                <span key={key}>
                  <i style={{ background: value.color }} />
                  {value.label}
                </span>
              ))}
            </div>
          </div>

          <div className="festival-map">
            <div className="map-label bottom">출입구</div>
            <div className="road horizontal" />
            <div className="road vertical" />
            <div className="stage">메인 무대</div>

            {zones.map((zone) => (
              <MapZone
                key={zone.id}
                zone={zone}
                selected={selectedZoneId === zone.id}
                onClick={() => setSelectedZoneId(zone.id)}
              />
            ))}
          </div>
        </section>

        <aside className="side-column">
          <AlertPanel zones={zones} />
          {selectedZone && <SelectedZoneDetail zone={selectedZone} />}
        </aside>
      </section>

      <section className="zone-list-section">
        <div className="section-title">
          <h2>구역별 상태 목록</h2>
          <p>구역을 클릭하면 오른쪽 상세 정보가 변경됩니다.</p>
        </div>

        <div className="zone-list">
          {zones.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              selected={selectedZoneId === zone.id}
              onClick={() => setSelectedZoneId(zone.id)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}