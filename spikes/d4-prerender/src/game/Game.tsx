import { useReducer } from "react";
import styles from "./Game.module.css";

// Componente de prueba que representa el chunk de Cyber Ops. La marca permite localizar el chunk
// en build/client/assets y comprobar que ninguna otra página lo carga (criterio A5).
export const GAME_CHUNK_MARKER = "CYBER_OPS_GAME_CHUNK_v1";

type Rule = { port: number; allow: boolean };
type State = { rules: Rule[]; blocked: number; log: string[] };
type Action = { type: "toggle"; port: number } | { type: "attack" } | { type: "reset" };

const INITIAL: State = {
  rules: [22, 80, 443, 3306, 5432].map((port) => ({ port, allow: port === 443 || port === 80 })),
  blocked: 0,
  log: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "toggle":
      return {
        ...state,
        rules: state.rules.map((r) => (r.port === action.port ? { ...r, allow: !r.allow } : r)),
      };
    case "attack": {
      const target = state.rules[Math.floor(Math.random() * state.rules.length)];
      if (!target) return state;
      const blocked = !target.allow;
      return {
        ...state,
        blocked: state.blocked + (blocked ? 1 : 0),
        log: [`${GAME_CHUNK_MARKER}: port ${target.port} ${blocked ? "blocked" : "reached"}`, ...state.log].slice(0, 5),
      };
    }
    case "reset":
      return INITIAL;
  }
}

export function Game({ labels }: { labels: { attack: string; reset: string } }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  return (
    <div className={styles.board} data-testid="game">
      <ul className={styles.rules}>
        {state.rules.map((r) => (
          <li key={r.port}>
            <label>
              <input type="checkbox" checked={r.allow} onChange={() => dispatch({ type: "toggle", port: r.port })} />{" "}
              {r.port}
            </label>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => dispatch({ type: "attack" })}>
        {labels.attack}
      </button>{" "}
      <button type="button" onClick={() => dispatch({ type: "reset" })}>
        {labels.reset}
      </button>
      <p aria-live="polite">{state.blocked}</p>
      <ol>
        {state.log.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
    </div>
  );
}
