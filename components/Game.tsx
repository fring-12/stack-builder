'use client';

import { useEffect } from 'react';
import { initGame } from '@/lib/game/ui';

/**
 * Thin React host for the imperative board. The markup below mirrors the
 * original single-file layout (same element ids), and all behaviour is driven
 * by initGame() after mount — a deliberate "lightly wrapped" port. The engine
 * and content it calls live in lib/engine and content/.
 */
export default function Game() {
  useEffect(() => {
    initGame();
  }, []);

  return (
    <div id="screens">
      {/* ============ PROJECT SELECT ============ */}
      <div id="projectScreen">
        <div>
          <div className="logo">🧱 StackBuilder</div>
          <div className="tagline">
            Snap together a system out of LEGO bricks — then survive the waves of traffic that try to
            break it.
          </div>
        </div>
        <div className="projects" id="projectList"></div>
      </div>

      {/* ============ GAME ============ */}
      <div id="gameScreen" className="hidden">
        <div className="topbar">
          <span className="proj" id="projName">
            Project
          </span>
          <span className="goal" id="projGoal"></span>
          <span className="spacer"></span>
          <button className="btn btn-ghost" id="backBtn">
            ← Projects
          </button>
          <button className="btn btn-start" id="startBtn">
            ▶ Start Simulation
          </button>
        </div>
        <div className="workspace">
          <div className="palette">
            <h4>Components</h4>
            <div id="paletteList"></div>
          </div>
          <div className="canvas-wrap" id="canvasWrap">
            <svg id="wires"></svg>
            <div id="canvas"></div>
            <div className="hint-empty" id="emptyHint">
              Drag components from the left onto the board.
              <br />
              Drag from the white <b>◯ nub</b> on one brick to another to connect them.
              <br />
              Build a path: <b>Users → … → Database</b>
            </div>
          </div>
        </div>

        {/* simulation bar */}
        <div id="simBar" className="hidden">
          <div id="simHead" title="drag to move">
            <span id="simWave">Wave 1</span>
            <button className="sim-btn" id="simMin" title="minimize">
              –
            </button>
            <button className="sim-btn" id="simExit" title="exit simulation">
              ✕
            </button>
          </div>
          <div id="simBody">
            <div id="simTitle">Title</div>
            <div id="simDesc">desc</div>
            <div className="meter">
              <div className="meter-fill" id="simMeter"></div>
            </div>
            <div id="simUsers">0 users</div>
            <div id="simVerdict"></div>
            <div id="simHint"></div>
            <div id="simActions"></div>
          </div>
        </div>

        {/* win */}
        <div id="winScreen" className="hidden">
          <div className="trophy">🏆</div>
          <h1>System Shipped!</h1>
          <p id="winText"></p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-ghost" id="winAgain">
              Rebuild
            </button>
            <button className="btn btn-start" id="winProjects">
              Other Projects →
            </button>
          </div>
        </div>

        <div className="toast" id="toast"></div>
      </div>
    </div>
  );
}
