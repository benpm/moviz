import * as React from 'react'
import useResizeObserver from '@react-hook/resize-observer'

// From https://www.npmjs.com/package/@react-hook/resize-observer
export default function useSize(target) {
  const [size, setSize] = React.useState()

  React.useLayoutEffect(() => {
    setSize(target.current.getBoundingClientRect())
  }, [target])

  // Where the magic happens
  useResizeObserver(target, (entry) => setSize(entry.contentRect))
  return size
}