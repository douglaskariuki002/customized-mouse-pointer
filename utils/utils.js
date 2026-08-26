(function (global) {
    const PointerUtils = {
        clamp(value, min, max) {
            return Math.min(Math.max(value, min), max)
        },

        normalizeMeshConfig(config = {}) {
            const rawType = String(config.type || "regular").toLowerCase()
            const type = rawType === "irregular" ? "irregular" : "regular"

            return {
                rows: PointerUtils.clamp(Number(config.rows) || 14, 4, 60),
                columns: PointerUtils.clamp(Number(config.columns) || 22, 4, 80),
                type,
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

        createMeshData(dimensions, config = { rows: 14, columns: 22, type: "regular" }) {
            const columns = Number(config.columns) || 22
            const rows = Number(config.rows) || 14
            const type = PointerUtils.normalizeMeshConfig(config).type
            const points = []
            const segments = []

            for (let row = 0; row <= rows; row++) {
                for (let column = 0; column <= columns; column++) {
                    const baseX = (column / columns) * dimensions.width
                    const baseY = (row / rows) * dimensions.height
                    const irregularity = type === "irregular" ? 18 : 0
                    const waveX = Math.sin((row + 1) * 0.8 + column * 0.9) * irregularity
                    const waveY = Math.cos((column + 1) * 0.9 + row * 0.7) * irregularity
                    const x = PointerUtils.clamp(baseX + waveX, 0, dimensions.width)
                    const y = PointerUtils.clamp(baseY + waveY, 0, dimensions.height)

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
