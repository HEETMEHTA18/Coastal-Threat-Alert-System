import React, { useEffect, useRef, useState } from 'react';

export default function HeroScene() {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;
    let width = (canvas.width = canvas.clientWidth);
    let height = (canvas.height = canvas.clientHeight);

    // Setup particles and grid points
    const points = [];
    const rows = 28;
    const cols = 28;
    const spacing = 45;

    // Initialize 3D wave points
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        points.push({
          x: (c - cols / 2) * spacing,
          y: 120, // baseline height
          z: (r - rows / 2) * spacing,
          baseY: 120,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    // Atmospheric floating particles
    const atmosphericParticles = Array.from({ length: 60 }, () => ({
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 400 - 50,
      z: (Math.random() - 0.5) * 800,
      size: Math.random() * 2.5 + 0.5,
      speed: Math.random() * 0.5 + 0.1,
    }));

    // Mangrove plants in 3D space
    const mangroves = [
      { x: -150, z: -100, scale: 1.2, color: '#10b981' },
      { x: 0, z: -200, scale: 1.5, color: '#059669' },
      { x: 180, z: -80, scale: 1.1, color: '#34d399' },
      { x: -250, z: 150, scale: 0.9, color: '#047857' },
      { x: 220, z: 180, scale: 1.0, color: '#06b6d4' },
    ];

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - width / 2;
      const y = e.clientY - rect.top - height / 2;
      mouseRef.current.targetX = x * 0.5;
      mouseRef.current.targetY = y * 0.5;
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);

    // Camera parameters
    const camera = {
      x: 0,
      y: -180,
      z: 500,
      rotX: 0.45,
      rotY: 0,
      rotZ: 0,
      fov: 400,
    };

    let tick = 0;

    const render = () => {
      tick += 0.015;

      // Smooth mouse camera dampening
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      camera.rotY = mouseRef.current.x * 0.0008;
      camera.rotX = 0.45 + mouseRef.current.y * 0.0005;

      // Background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Radial background glow
      const glow = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.6);
      glow.addColorStop(0, 'rgba(6, 182, 212, 0.07)');
      glow.addColorStop(0.5, 'rgba(16, 185, 129, 0.03)');
      glow.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 1;

      // Helper for 3D projections
      const project = (x, y, z) => {
        // Rotate Y (yaw)
        let x1 = x * Math.cos(camera.rotY) - z * Math.sin(camera.rotY);
        let z1 = x * Math.sin(camera.rotY) + z * Math.cos(camera.rotY);

        // Rotate X (pitch)
        let y2 = y * Math.cos(camera.rotX) - z1 * Math.sin(camera.rotX);
        let z2 = y * Math.sin(camera.rotX) + z1 * Math.cos(camera.rotX);

        // Translate relative to camera
        const cx = x1 - camera.x;
        const cy = y2 - camera.y;
        const cz = z2 + camera.z;

        if (cz <= 0) return null;

        // Perspective division
        const scale = camera.fov / cz;
        const px = cx * scale + width / 2;
        const py = cy * scale + height / 2;

        return { x: px, y: py, scale };
      };

      // 1. Calculate wave elevations
      points.forEach((p) => {
        // Double sin wave interference representing tidal wave velocity
        const dist = Math.sqrt(p.x * p.x + p.z * p.z);
        p.y = p.baseY + Math.sin(dist * 0.015 - tick * 2) * 18 + Math.cos(p.x * 0.01 + tick) * 10;
      });

      // 2. Render 3D Wireframe Wave Network
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const proj = project(points[idx].x, points[idx].y, points[idx].z);
          if (!proj) continue;

          if (c === 0) ctx.moveTo(proj.x, proj.y);
          else ctx.lineTo(proj.x, proj.y);
        }
        ctx.stroke();
      }

      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const idx = r * cols + c;
          const proj = project(points[idx].x, points[idx].y, points[idx].z);
          if (!proj) continue;

          if (r === 0) ctx.moveTo(proj.x, proj.y);
          else ctx.lineTo(proj.x, proj.y);
        }
        ctx.stroke();
      }

      // 3. Render Swaying Mangroves
      mangroves.forEach((m) => {
        const rootY = 120 + Math.sin(Math.sqrt(m.x * m.x + m.z * m.z) * 0.015 - tick * 2) * 15;
        const trunkBase = project(m.x, rootY, m.z);
        if (!trunkBase) return;

        const sway = Math.sin(tick + m.x) * 12 * m.scale;
        const trunkTop = project(m.x + sway, rootY - 140 * m.scale, m.z);
        if (!trunkTop) return;

        // Draw Trunk
        ctx.beginPath();
        ctx.moveTo(trunkBase.x, trunkBase.y);
        ctx.bezierCurveTo(
          trunkBase.x, trunkBase.y - 40 * m.scale,
          trunkTop.x - sway * 0.5, trunkTop.y + 40 * m.scale,
          trunkTop.x, trunkTop.y
        );
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 4 * m.scale * trunkBase.scale * 0.002;
        ctx.stroke();

        // Draw Roots spreading into the ground
        [-30, -15, 0, 15, 30].forEach((angleOffset) => {
          const rootEnd = project(m.x + angleOffset * 1.5, rootY + 25 * m.scale, m.z + angleOffset);
          if (!rootEnd) return;
          ctx.beginPath();
          ctx.moveTo(trunkBase.x, trunkBase.y - 10 * m.scale);
          ctx.quadraticCurveTo(
            trunkBase.x + angleOffset * 0.5, trunkBase.y + 10 * m.scale,
            rootEnd.x, rootEnd.y
          );
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
          ctx.lineWidth = 2 * m.scale * trunkBase.scale * 0.002;
          ctx.stroke();
        });

        // Draw Foliage (Leaves)
        ctx.beginPath();
        const leafRadius = 38 * m.scale * trunkTop.scale * 0.003;
        ctx.arc(trunkTop.x, trunkTop.y, leafRadius, 0, Math.PI * 2);
        
        const leafGlow = ctx.createRadialGradient(trunkTop.x, trunkTop.y, 2, trunkTop.x, trunkTop.y, leafRadius);
        leafGlow.addColorStop(0, m.color);
        leafGlow.addColorStop(0.8, 'rgba(16, 185, 129, 0.7)');
        leafGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = leafGlow;
        ctx.fill();

        // Branches
        [-40, 40].forEach((brSway) => {
          const branchEnd = project(m.x + sway + brSway * 0.8, rootY - 110 * m.scale, m.z);
          if (branchEnd) {
            ctx.beginPath();
            ctx.moveTo((trunkBase.x + trunkTop.x) / 2, (trunkBase.y + trunkTop.y) / 2);
            ctx.lineTo(branchEnd.x, branchEnd.y);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(branchEnd.x, branchEnd.y, leafRadius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = m.color;
            ctx.fill();
          }
        });
      });

      // 4. Render Atmospheric floating particles
      atmosphericParticles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -300) p.y = 200; // Reset height

        const proj = project(p.x, p.y, p.z);
        if (!proj) return;

        // Size depth-buffer mapping
        const finalSize = p.size * proj.scale * 0.0035;
        if (finalSize <= 0) return;

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, finalSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${Math.min(0.8, proj.scale * 0.002)})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#06b6d4';
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      // 5. Draw futuristic grid interface overlays (Telemetry dashboard)
      ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.font = '10px monospace';
      ctx.fillText(`CAM_ANGLE_X: ${camera.rotX.toFixed(3)} RAD`, 24, 30);
      ctx.fillText(`CAM_ANGLE_Y: ${camera.rotY.toFixed(3)} RAD`, 24, 45);
      ctx.fillText(`WAVE_VELOCITY: 1.48 M/S`, 24, 60);
      ctx.fillText(`FPS: 60.0`, 24, 75);

      // Coordinate marker ticks
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.beginPath();
      ctx.moveTo(24, 90); ctx.lineTo(120, 90);
      ctx.moveTo(24, 86); ctx.lineTo(24, 94);
      ctx.moveTo(120, 86); ctx.lineTo(120, 94);
      ctx.stroke();
      ctx.fillText('RANGE: 500M', 130, 93);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvas) canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-950 rounded-2xl border border-cyan-500/20 shadow-2xl">
      {/* Canvas Layer */}
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      {/* Cinematic HUD elements overlay */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
        </span>
        <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase bg-cyan-950/40 border border-cyan-500/20 px-2 py-1 rounded">
          SYSTEM_LIVE
        </span>
      </div>

      <div className="absolute bottom-6 left-6 max-w-sm bg-gray-950/80 backdrop-blur-md border border-gray-800 p-4 rounded-xl shadow-lg">
        <p className="text-[11px] text-cyan-400 font-mono tracking-wider mb-1">🌱 MANGROVE GRID ASSESSMENT</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Interactive 3D model displaying simulated mangrove roots anchoring shoreline deposits against high wave-energy tidal currents. Move cursor to rotate.
        </p>
      </div>
    </div>
  );
}
