(function (global) {
    const PointerUtils = {
        clamp(value, min, max) {
            return Math.min(Math.max(value, min), max)
        },

        normalizeMeshConfig(config = {}) {
            return {
                rows: PointerUtils.clamp(Number(config.rows) || 14, 4, 60),
                columns: PointerUtils.clamp(Number(config.columns) || 22, 4, 80),
            }
        },

        getDimensions() {
            const dimensions = {
                width: window.innerWidth,
                height: window.innerHeight,
                margin: {
                    top: 90,
                    right: 90,
                    bottom: 50,
                    left: 50,
                },
            }

            return {
                ...dimensions,
                boundedWidth: dimensions.width - dimensions.margin.left - dimensions.margin.right,
                boundedHeight: dimensions.height - dimensions.margin.top - dimensions.margin.bottom,
            }
        },

        containerDimensions() {
            return PointerUtils.getDimensions()
        },

        createMeshData(dimensions, config = { rows: 14, columns: 22 }) {
            const columns = Number(config.columns) || 22
            const rows = Number(config.rows) || 14
            const points = []
            const segments = []

            for (let row = 0; row <= rows; row++) {
                for (let column = 0; column <= columns; column++) {
                    const x = (column / columns) * dimensions.width
                    const y = (row / rows) * dimensions.height

                    points.push({
                        id: `${column}-${row}`,
                        x,
                        y,
                        px: x,
                        py: y,
                    })
                }
            }

            for (let row = 0; row <= rows; row++) {
                for (let column = 0; column < columns; column++) {
                    segments.push({
                        id: `h-${column}-${row}`,
                        a: `${column}-${row}`,
                        b: `${column + 1}-${row}`,
                    })
                }
            }

            for (let column = 0; column <= columns; column++) {
                for (let row = 0; row < rows; row++) {
                    segments.push({
                        id: `v-${column}-${row}`,
                        a: `${column}-${row}`,
                        b: `${column}-${row + 1}`,
                    })
                }
            }

            return {
                points,
                segments,
                pointMap: new Map(points.map(point => [point.id, point])),
            }
        },
    }

    global.PointerUtils = PointerUtils
})(window)
