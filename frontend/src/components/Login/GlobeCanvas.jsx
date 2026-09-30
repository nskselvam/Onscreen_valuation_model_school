import React, { useEffect, useRef } from 'react'

const DOT_COUNT = 500
const NODE_COUNT = 25
const ROTATION_SPEED = 0.0012 // Constant rotation speed
const EDGE_DIST = 0.8

function randomOnSphere() {
  const u = Math.random()
  const v = Math.random()
  const theta = 2 * Math.PI * u
  const phi = Math.acos(2 * v - 1)
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.cos(phi),
    z: Math.sin(phi) * Math.sin(theta),
  }
}

function rotateY(pt, cos, sin) {
  return {
    x: pt.x * cos - pt.z * sin,
    y: pt.y,
    z: pt.x * sin + pt.z * cos,
  }
}

function project(pt, cx, cy, R) {
  const fov = 3.6
  const scale = fov / (fov + pt.z)
  return {
    x: cx + pt.x * R * scale,
    y: cy - pt.y * R * scale,
    depth: pt.z,
    visible: pt.z > -0.96,
    scale,
  }
}

const LATS = 8
const LONS = 10
const STEPS = 90

function buildLatLines() {
  const lines = []
  for (let li = 0; li < LATS; li++) {
    const phi = (Math.PI / (LATS + 1)) * (li + 1)
    const row = []
    for (let s = 0; s <= STEPS; s++) {
      const theta = (2 * Math.PI * s) / STEPS
      row.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta),
      })
    }
    lines.push(row)
  }
  return lines
}

function buildLonLines() {
  const lines = []
  for (let li = 0; li < LONS; li++) {
    const theta = (Math.PI * li) / LONS
    const row = []
    for (let s = 0; s <= STEPS; s++) {
      const phi = (Math.PI * s) / STEPS
      row.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta),
      })
    }
    lines.push(row)
  }
  return lines
}

export default function GlobeCanvas({ size = 550 }) {
  const canvasRef = useRef(null)
  const isDraggingRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const rotationRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    
    // Use the provided size
    const actualSize = Math.min(size, window.innerWidth * 0.9)
    
    canvas.width = actualSize * dpr
    canvas.height = actualSize * dpr
    canvas.style.width = `${actualSize}px`
    canvas.style.height = `${actualSize}px`
    canvas.style.cursor = 'grab'
    ctx.scale(dpr, dpr)

    const cx = actualSize / 2
    const cy = actualSize / 2
    const R = actualSize * 0.44

    // Static geometry
    const surfaceDots = Array.from({ length: DOT_COUNT }, randomOnSphere)
    const nodes = Array.from({ length: NODE_COUNT }, randomOnSphere)

    const edges = []
    const triangles = []
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        const dz = nodes[i].z - nodes[j].z
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < EDGE_DIST) {
          edges.push([i, j])
          if (triangles.length < 24) {
            for (let k = j + 1; k < NODE_COUNT; k++) {
              const dx2 = nodes[i].x - nodes[k].x
              const dy2 = nodes[i].y - nodes[k].y
              const dz2 = nodes[i].z - nodes[k].z
              const dx3 = nodes[j].x - nodes[k].x
              const dy3 = nodes[j].y - nodes[k].y
              const dz3 = nodes[j].z - nodes[k].z
              if (
                Math.sqrt(dx2 * dx2 + dy2 * dy2 + dz2 * dz2) < EDGE_DIST &&
                Math.sqrt(dx3 * dx3 + dy3 * dy3 + dz3 * dz3) < EDGE_DIST
              ) {
                triangles.push([i, j, k])
              }
            }
          }
        }
      }
    }

    const latLines = buildLatLines()
    const lonLines = buildLonLines()

    // Rotation state - maintains constant rotation speed
    let angle = 0
    let lastTime = performance.now()
    let rafId

    // Mouse event handlers
    const handleMouseDown = (e) => {
      isDraggingRef.current = true
      canvas.style.cursor = 'grabbing'
      const rect = canvas.getBoundingClientRect()
      lastMouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return
      
      const rect = canvas.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top
      
      const deltaX = currentX - lastMouseRef.current.x
      const deltaY = currentY - lastMouseRef.current.y
      
      // Update rotation based on mouse movement
      rotationRef.current.y += deltaX * 0.005
      rotationRef.current.x += deltaY * 0.005
      
      lastMouseRef.current = { x: currentX, y: currentY }
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      canvas.style.cursor = 'grab'
    }

    const handleMouseLeave = () => {
      isDraggingRef.current = false
      canvas.style.cursor = 'grab'
    }

    // Touch event handlers for mobile
    const handleTouchStart = (e) => {
      isDraggingRef.current = true
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      lastMouseRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
    }

    const handleTouchMove = (e) => {
      if (!isDraggingRef.current) return
      e.preventDefault()
      
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      const currentX = touch.clientX - rect.left
      const currentY = touch.clientY - rect.top
      
      const deltaX = currentX - lastMouseRef.current.x
      const deltaY = currentY - lastMouseRef.current.y
      
      rotationRef.current.y += deltaX * 0.005
      rotationRef.current.x += deltaY * 0.005
      
      lastMouseRef.current = { x: currentX, y: currentY }
    }

    const handleTouchEnd = () => {
      isDraggingRef.current = false
    }

    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd)

    function draw(currentTime) {
      // Calculate delta time for consistent rotation speed
      const deltaTime = (currentTime - lastTime) / 16.67 // Normalize to 60fps
      lastTime = currentTime
      
      ctx.clearRect(0, 0, actualSize, actualSize)

      // Auto-rotate only when not dragging
      if (!isDraggingRef.current) {
        angle += ROTATION_SPEED * deltaTime
      }

      // Combine auto-rotation with mouse rotation
      const totalRotationY = angle + rotationRef.current.y
      const cos = Math.cos(totalRotationY)
      const sin = Math.sin(totalRotationY)

      function rot(pt) { return rotateY(pt, cos, sin) }
      function proj(pt) { return project(rot(pt), cx, cy, R) }

      // Outer circle - subtle and clean
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Subtle sphere background glow
      const grd = ctx.createRadialGradient(
        cx - R * 0.15, cy - R * 0.15, R * 0.05,
        cx, cy, R
      )
      grd.addColorStop(0,    'rgba(249, 250, 251, 0.8)')
      grd.addColorStop(0.4,  'rgba(243, 244, 246, 0.4)')
      grd.addColorStop(0.8,  'rgba(239, 242, 246, 0.1)')
      grd.addColorStop(1,    'rgba(235, 240, 245, 0.0)')

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.clip()
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, actualSize, actualSize)
      ctx.restore()

      // All globe content clipped to circle
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R - 0.5, 0, Math.PI * 2)
      ctx.clip()

      // Latitude grid lines - very subtle
      for (const row of latLines) {
        ctx.beginPath()
        let started = false
        for (const pt of row) {
          const p = proj(pt)
          if (!p.visible) { started = false; continue }
          if (!started) { ctx.beginPath(); ctx.moveTo(p.x, p.y); started = true }
          else ctx.lineTo(p.x, p.y)
        }
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Longitude grid lines - very subtle
      for (const row of lonLines) {
        ctx.beginPath()
        let started = false
        for (const pt of row) {
          const p = proj(pt)
          if (!p.visible) { started = false; continue }
          if (!started) { ctx.beginPath(); ctx.moveTo(p.x, p.y); started = true }
          else ctx.lineTo(p.x, p.y)
        }
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Surface dot cloud - clean and minimal
      for (const pt of surfaceDots) {
        const p = proj(pt)
        if (!p.visible) continue
        const t = (p.depth + 1) / 2
        const opacity = 0.2 + 0.4 * t
        const r = 0.8 + 0.6 * t
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(59, 130, 246, ${opacity.toFixed(2)})`
        ctx.fill()
      }

      // Pre-project nodes
      const nodeP = nodes.map(n => proj(n))

      // Skip triangles - they make it too cluttered

      // Network edges - subtle and clean
      for (const [i, j] of edges) {
        const pi = nodeP[i], pj = nodeP[j]
        if (!pi.visible || !pj.visible) continue
        const t = ((pi.depth + pj.depth) / 2 + 1) / 2
        const opacity = 0.15 + 0.25 * t
        ctx.beginPath()
        ctx.moveTo(pi.x, pi.y)
        ctx.lineTo(pj.x, pj.y)
        ctx.strokeStyle = `rgba(59, 130, 246, ${opacity.toFixed(2)})`
        ctx.lineWidth = 1.0
        ctx.stroke()
      }

      // Network nodes - clean and minimal
      for (const p of nodeP) {
        if (!p.visible) continue
        const t = (p.depth + 1) / 2
        const opacity = 0.5 + 0.4 * t
        const r = 2.5 + 1.5 * t
        
        // Outer glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(59, 130, 246, ${(opacity * 0.1).toFixed(2)})`
        ctx.fill()
        
        // Main node
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(59, 130, 246, ${opacity.toFixed(2)})`
        ctx.fill()
      }

      ctx.restore()

      // Constant rotation speed, frame-rate independent
      angle += ROTATION_SPEED * deltaTime
      rafId = requestAnimationFrame(draw)
    }

    draw(performance.now())
    
    // Cleanup function
    return () => {
      cancelAnimationFrame(rafId)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [size])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', margin: '0 auto' }}
      aria-hidden="true"
    />
  )
}
