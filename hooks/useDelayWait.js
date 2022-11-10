import * as React from 'react'

// Hook that waits for some amount of time before executing a callback,
//   every change to the dependencies will reset the timer
export default function useDelayWait(callback, delay, dependencies) {
  const timeoutRef = React.useRef()
  React.useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);
    return () => {
      clearTimeout(timeoutRef.current);
    }
  }, [callback, delay, ...dependencies])
}