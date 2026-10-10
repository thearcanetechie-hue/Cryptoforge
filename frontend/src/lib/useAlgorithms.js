import { useEffect, useState } from 'react';
import { FALLBACK_ALGORITHMS, getAlgorithms } from './api';

// Fetched once per page load and shared by every component that asks.
let pending;

/** Returns { algorithms, online } where online is null while checking. */
export function useAlgorithms() {
  const [state, setState] = useState({ algorithms: FALLBACK_ALGORITHMS, online: null });
  useEffect(() => {
    let alive = true;
    pending ??= getAlgorithms();
    pending.then(s => alive && setState(s));
    return () => { alive = false; };
  }, []);
  return state;
}
