import useResizeObserver from '@react-hook/resize-observer';
import { useEffect, useState, useRef } from 'react'

function combineChartDimensions(dimensions) {
    const parsedDimensions = {
        ...dimensions,
        marginTop: dimensions.marginTop || 10,
        marginRight: dimensions.marginRight || 10,
        marginBottom: dimensions.marginBottom || 40,
        marginLeft: dimensions.marginLeft || 75,
    };
    return {
        ...parsedDimensions,
        boundedHeight: Math.max(
            parsedDimensions.height
            - parsedDimensions.marginTop
            - parsedDimensions.marginBottom,
            0,
        ),
        boundedWidth: Math.max(
            parsedDimensions.width
            - parsedDimensions.marginLeft
            - parsedDimensions.marginRight,
            0,
        ),
    };
}

export default function useChartDimensions(passedSettings) {
    const ref = useRef();
    const dimensions = combineChartDimensions(passedSettings);

    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        const element = ref.current
        const resizeObserver = useResizeObserver(element,
            entries => {
                if (!Array.isArray(entries)) return
                if (!entries.length) return

                const entry = entries[0]

                if (width != entry.contentRect.width)
                    setWidth(entry.contentRect.width)
                if (height != entry.contentRect.height)
                    setHeight(entry.contentRect.height)
            }
        )
        resizeObserver.observe(element)

        return () => resizeObserver.unobserve(element)
    }, []);

    const newSettings = combineChartDimensions({
        ...dimensions,
        width: dimensions.width || width,
        height: dimensions.height || height,
    });

    return [ref, newSettings];
}