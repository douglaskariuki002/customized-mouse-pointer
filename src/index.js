window.addEventListener("load", paint)

const {
    normalizeMeshConfig,
    containerDimensions,
    createMeshData,
    clamp,
} = window.PointerUtils || {}

function paint() {
    const dimensions = containerDimensions()
    const svg = createSvg("#wrapper", dimensions)
    const pointerController = createPointerController(svg, dimensions)

    pointerController.bindControls()
}

function createSvg(selector, dimensions) {
    return d3.select(selector)
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
}

function createPointerController(container, dimensions, initialConfig = { rows: 14, columns: 22 }) {
    let intervalId = null
    const state = {
        tT: 20,
        mousePos: [0, 0],
        meshEnabled: true,
        meshConfig: normalizeMeshConfig(initialConfig),
    }

    let mesh = drawMesh(container, dimensions, state.meshConfig)
    const pointer = drawPointer(container)
    const hitArea = attachPointerLayer(container, dimensions)

    function setPointerPosition(pt) {
        state.mousePos = pt

        if (state.meshEnabled) {
            updateMesh(mesh, state.mousePos)
        }

        pointer
            .attr("cx", state.mousePos[0])
            .attr("cy", state.mousePos[1])
            .attr("visibility", "visible")
    }

    function mouseEnter() {
        const pt = d3.pointer(event)
        setPointerPosition(pt)

        if (!intervalId) {
            intervalId = setInterval(
                () => pointer
                    .transition()
                    .duration(state.tT)
                    .ease(t => t)
                    .attr("cx", state.mousePos[0])
                    .attr("cy", state.mousePos[1]),
                state.tT
            )
        }
    }

    function mouseMove() {
        const pt = d3.pointer(event)
        state.mousePos = pt

        if (state.meshEnabled) {
            updateMesh(mesh, state.mousePos)
        }
    }

    function mouseLeave() {
        pointer.attr("visibility", "hidden")
        mesh.group.attr("opacity", 0)

        if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
        }
    }

    function setMeshEnabled(enabled) {
        state.meshEnabled = enabled
        mesh.group.attr("opacity", enabled ? 1 : 0)
        return enabled
    }

    function rebuildMesh(nextConfig) {
        const config = normalizeMeshConfig(nextConfig)
        state.meshConfig = config

        if (mesh) {
            mesh.group.remove()
        }

        mesh = drawMesh(container, dimensions, state.meshConfig)
        mesh.group.attr("opacity", state.meshEnabled ? 1 : 0)

        if (state.mousePos && state.meshEnabled) {
            updateMesh(mesh, state.mousePos)
        }
    }

    hitArea
        .on("mouseenter", mouseEnter)
        .on("mousemove", mouseMove)
        .on("mouseleave", mouseLeave)

    return {
        state,
        mesh,
        pointer,
        hitArea,
        setMeshEnabled,
        rebuildMesh,
        bindControls() {
            const inputDiv = d3.select(".io")
            const slider = inputDiv.select("input[type='range']")
            const timeT = inputDiv.select(".tT")
            const meshToggle = inputDiv.select(".mesh-toggle")
            const rowsInput = inputDiv.select(".grid-rows")
            const columnsInput = inputDiv.select(".grid-columns")

            slider.on("change", function() {
                state.tT = Number(this.value)
                timeT.html(`${state.tT} ms`)
            })

            meshToggle.on("click", function() {
                const enabled = !state.meshEnabled
                setMeshEnabled(enabled)
                meshToggle
                    .text(`Mesh: ${enabled ? "On" : "Off"}`)
                    .attr("aria-pressed", String(enabled))
            })

            rowsInput
                .property("value", state.meshConfig.rows)
                .on("input", function() {
                    rebuildMesh({ rows: this.value, columns: state.meshConfig.columns })
                    rowsInput.property("value", state.meshConfig.rows)
                })

            columnsInput
                .property("value", state.meshConfig.columns)
                .on("input", function() {
                    rebuildMesh({ rows: state.meshConfig.rows, columns: this.value })
                    columnsInput.property("value", state.meshConfig.columns)
                })
        },
    }
}

function drawMesh(container, dimensions, config = { rows: 14, columns: 22 }) {
    const meshGroup = container.append("g")
        .attr("class", "mesh")
        .attr("opacity", 0)

    const { points, segments, pointMap } = createMeshData(dimensions, config)

    const lineNodes = meshGroup.selectAll("line.mesh-line")
        .data(segments)
        .join("line")
        .attr("class", "mesh-line")
        .attr("stroke", "rgba(255, 255, 255, 0.28)")
        .attr("stroke-width", 1)
        .attr("stroke-linecap", "round")

    const pointNodes = meshGroup.selectAll("circle.mesh-point")
        .data(points)
        .join("circle")
        .attr("class", "mesh-point")
        .attr("r", 1.8)
        .attr("fill", "rgba(255, 255, 255, 0.22)")

    return {
        group: meshGroup,
        points,
        pointMap,
        lineNodes,
        pointNodes,
    }
}

function updateMesh(mesh, mousePos) {
    if (!mesh || !mousePos) return

    const radius = 180
    mesh.group.attr("opacity", 1)

    mesh.points.forEach(point => {
        const dx = point.x - mousePos[0]
        const dy = point.y - mousePos[1]
        const distance = Math.hypot(dx, dy)
        const influence = Math.max(0, 1 - distance / radius)
        const offset = (influence * influence) * 28

        if (distance === 0) {
            point.px = point.x
            point.py = point.y
            return
        }

        const angle = Math.atan2(dy, dx)
        point.px = point.x + Math.cos(angle) * offset
        point.py = point.y + Math.sin(angle) * offset
    })

    mesh.lineNodes
        .attr("x1", d => mesh.pointMap.get(d.a).px)
        .attr("y1", d => mesh.pointMap.get(d.a).py)
        .attr("x2", d => mesh.pointMap.get(d.b).px)
        .attr("y2", d => mesh.pointMap.get(d.b).py)

    mesh.pointNodes
        .attr("cx", d => d.px)
        .attr("cy", d => d.py)
}

function attachPointerLayer(container, dimensions) {
    return container.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .attr("visibility", "hidden")
        .attr("pointer-events", "all")
}

function drawPointer(container, type = "circle") {
    return container.append(type)
        .attr("r", 12)
        .attr("fill", "rgba(255, 255, 255, 0.08)")
        .attr("stroke", "rgba(255, 255, 255, 0.7)")
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.8)
        .attr("visibility", "hidden")
}
