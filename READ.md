# PID Lab – Simulink-style PID playground in the browser

An interactive little control-engineering lab built with React + TypeScript.  
You can drop **Step / Controller / Plant / Sum / Scope** blocks on a canvas, connect them with arrows, and run a simple time-domain simulation of a first-order process with P/PI/PID control.

Perfect as a portfolio piece to show **“software + automation / control”** skills.

---

## Tech stack

- **React + TypeScript** (scaffolded with Vite)
- **Vite** as dev server & build tool
- **Recharts** for plotting step responses
- Plain CSS (Vite default) + utility class names in JSX (ready for Tailwind later if desired)

---

## Features (current state)

### Block diagram editor

- Blocks you can add:
  - `Step` – reference input with amplitude & start time
  - `Controller` – P / PI / PID with tunable Kp, Ki, Kd
  - `Plant` – first-order process with gain **K** and time constant **T**
  - `Sum (Σ)` – placeholder for feedback nodes (not yet wired into simulation)
  - `Scope` – visual sink block (for layout only right now)
- **Drag & drop** blocks around on the canvas.
- **Connection mode**:
  - Hold **`P`** and drag **from one block to another** to draw an arrow.
  - Connections are stored as `fromId → toId` pairs.
- **Delete / clean-up**:
  - Press **`Delete` / `Backspace`** to remove the currently selected block.
  - All connections attached to that block are removed as well.
  - **Shift+click** on a connection line to delete just that arrow.
- **HUD add-menu inside the canvas**:
  - A small `+ Add ▾` dropdown lives inside the diagram area.
  - Click it to spawn new Step / Controller / Plant / Sum / Scope blocks.

### Simulation

- The app builds a **chain** of blocks starting from a `Step` block by following the arrows:
  - It finds a Step with no incoming connections (or the first Step) and then walks `Step → (Controller) → Plant → ...` along outgoing arrows.
  - The simulation uses the **first Step / Controller / Plant** it finds in this connected chain.
- Process model:
  - Simple first-order plant  
    \[
      \frac{dy}{dt} = \frac{-y + K \cdot u}{T}
    \]
- Controller:
  - Modes: **P**, **PI**, **PID**
  - Control law (continuous-time approximation via Euler):
    - P:  `u = Kp * e`
    - PI: `u = Kp * e + Ki * ∫e dt`
    - PID:`u = Kp * e + Ki * ∫e dt + Kd * de/dt`
- Integration:
  - Fixed timestep `dt = 0.02 s`
  - Simulation horizon `tEnd = 10 s`
  - Numerical integration with explicit Euler.
- Signals:
  - `r(t)` – reference (from Step)
  - `y(t)` – plant output
  - `u(t)` – controller output (or `r` if no controller in the chain)
- Visualization:
  - Step response plotted with **Recharts**:
    - `r(t)`, `y(t)`, `u(t)` vs time.
- Performance metrics:
  - **Overshoot** (%)
  - **Rise time** (time to reach ~90 % of final value)
  - **Settling time** (2 % band)
  - **Steady-state error** \( e_ss = r_∞ − y_∞ \)

---

## How to run locally

### 1. Requirements

- **Node.js** ≥ 20 (Vite officially wants 20.19+)
- **npm** (comes with Node)

> Note: The project was created with `npm create vite@latest` using the React + TS template.

### 2. Install dependencies

```bash
npm install
npm run dev
Local:   http://localhost:5173/
Network: use --host to expose
npm run build
