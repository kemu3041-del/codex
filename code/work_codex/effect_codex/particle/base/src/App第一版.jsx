import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three-stdlib';

// === 1. Shader 定义 (源自方案 B，增强视觉效果) ===
const glowingParticleShader = {
  vertex: `
    attribute float size;
    varying vec3 vColor;
    uniform float uPixelRatio;
    uniform float uTime;
    uniform float uMouseActive; // 控制呼吸节奏

    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      
      // 距离衰减 + 呼吸脉冲
      float atten = 300.0 / -mvPosition.z;
      
      // 呼吸效果：当鼠标不活跃时，呼吸更明显
      float smoothActive = smoothstep(0.0, 1.0, uMouseActive);
      float pulse = 1.0 + sin(uTime * 1.5 + position.x * 10.0) * 0.1 * smoothActive;
      
      gl_PointSize = size * uPixelRatio * atten * pulse;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragment: `
    varying vec3 vColor;
    uniform float uTime;
    
    void main() {
      // 绘制圆形光晕 (模拟星星/萤火虫)
      vec2 uv = gl_PointCoord - vec2(0.5);
      float d = length(uv);
      
      // 核心亮斑
      float core = 1.0 - smoothstep(0.0, 0.2, d);
      // 外部光晕
      float glow = 1.0 - smoothstep(0.1, 0.5, d);
      glow = pow(glow, 2.0);
      
      // 组合 Alpha
      float alpha = core * 0.8 + glow * 0.4;
      
      if (alpha < 0.01) discard;
      
      // 颜色增强：中心趋向白色
      vec3 finalColor = mix(vColor, vec3(1.0), core * 0.4);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

// === 2. 粒子核心组件 ===
const InteractiveModelParticles = ({ url }) => {
  const { scene } = useGLTF(url);
  const pointsRef = useRef();
  const { camera, gl } = useThree();
  
  // 交互相关 Refs
  const mouse = useRef(new THREE.Vector2(9999, 9999)); // 初始在屏幕外
  const raycaster = useRef(new THREE.Raycaster());
  const repelTarget = useRef(new THREE.Vector3()); // 平滑后的排斥中心
  const mouseActiveTimer = useRef(0); // 用于判断鼠标是否静止

  // 动画状态 Refs
  const progressRef = useRef(0); // 入场动画进度 0 -> 1
  
  // === 数据准备 (结合方案 A 的采样 + 方案 B 的属性) ===
  const { startPositions, targetPositions, colors, sizes } = useMemo(() => {
    let mesh = null;
    scene.traverse((child) => {
      if (child.isMesh && !mesh) mesh = child;
    });
    
    if (!mesh) return {};

    const sampler = new MeshSurfaceSampler(mesh).build();
    const numParticles = 25000; // 保持高数量以支撑稀疏区域
    
    const startPos = new Float32Array(numParticles * 3);
    const targetPos = new Float32Array(numParticles * 3);
    const colorArr = new Float32Array(numParticles * 3);
    const sizeArr = new Float32Array(numParticles);

    const tempPos = new THREE.Vector3();
    const tempColor = new THREE.Color();
    
    // 颜色配置
    const colorStart = new THREE.Color("#4facfe");
    const colorEnd = new THREE.Color("#00f2fe");

    mesh.geometry.computeBoundingBox();
    const { min, max } = mesh.geometry.boundingBox;
    const height = max.y - min.y || 1;
    const center = new THREE.Vector3();
    mesh.geometry.boundingBox.getCenter(center);

    for (let i = 0; i < numParticles; i++) {
      // 1. 基础采样 (在模型表面)
      sampler.sample(tempPos);

      // === 关键修改：添加自然溢出逻辑 ===
      // 定义一个“散布概率”：
      // r < 0.8 : 核心粒子 (紧贴)
      // r > 0.8 : 氛围粒子 (溢出)
      const r = Math.random();
      let scatterAmount = 0;
      let sizeFactor = 1.0;

      if (r > 0.95) {
        // 15% 的粒子作为“溢出层/光晕层”
        // 允许偏移 0.5 到 2.0 个单位 (根据模型大小调整这个数值)
        scatterAmount = 0.5 + Math.random() * 1.5;
        sizeFactor = 0.5; // 飘出去的粒子小一点，显得轻盈
      } else {
        // 85% 的粒子作为“骨架层”
        // 只有极微小的抖动 (0.05)，避免表面过于平滑死板
        scatterAmount = 0.05; 
        sizeFactor = 1.0;
      }

      // 生成随机球形偏移方向
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const offsetX = Math.sin(phi) * Math.cos(theta) * scatterAmount;
      const offsetY = Math.sin(phi) * Math.sin(theta) * scatterAmount;
      const offsetZ = Math.cos(phi) * scatterAmount;

      // 设置最终目标位置 = 表面位置 + 随机偏移
      targetPos[i * 3] = tempPos.x + offsetX;
      targetPos[i * 3 + 1] = tempPos.y + offsetY;
      targetPos[i * 3 + 2] = tempPos.z + offsetZ;
      // ========================================

      // 2. 初始位置 (入场动画起点 - 保持原有的大爆炸效果)
      startPos[i * 3] = center.x + (Math.random() - 0.5) * (max.x - min.x) * 15;
      startPos[i * 3 + 1] = center.y + (Math.random() - 0.5) * (max.y - min.y) * 15;
      startPos[i * 3 + 2] = center.z + (Math.random() - 0.5) * (max.z - min.z) * 15;

      // 3. 颜色
      const t = (tempPos.y - min.y) / height;
      tempColor.lerpColors(colorStart, colorEnd, t);
      // 溢出的粒子稍微淡一点/亮一点
      if (r > 0.85) tempColor.lerp(new THREE.Color('#ffffff'), 0.3);
      
      colorArr[i * 3] = tempColor.r;
      colorArr[i * 3 + 1] = tempColor.g;
      colorArr[i * 3 + 2] = tempColor.b;

      // 4. 大小 (应用上面的 sizeFactor)
      sizeArr[i] = (Math.random() * 0.08 + 0.02) * sizeFactor; 
    }

    return { 
      startPositions: startPos, 
      targetPositions: targetPos, 
      colors: colorArr, 
      sizes: sizeArr 
    };
  }, [scene]);


  // === 鼠标事件监听 (方案 B) ===
  useEffect(() => {
    const handleMouseMove = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      mouseActiveTimer.current = 1.0; // 重置鼠标活跃计时器
    };
    
    gl.domElement.addEventListener('mousemove', handleMouseMove);
    return () => gl.domElement.removeEventListener('mousemove', handleMouseMove);
  }, [gl]);

  // === 核心动画循环 (融合逻辑) ===
  useFrame((state, delta) => {
    if (!pointsRef.current || !targetPositions) return;

    // 1. 更新 Uniforms
    mouseActiveTimer.current = THREE.MathUtils.lerp(mouseActiveTimer.current, 0, 0.05);
    pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
    pointsRef.current.material.uniforms.uMouseActive.value = mouseActiveTimer.current;

    // 2. 处理入场进度 (0 -> 1)
    if (progressRef.current < 1) {
      progressRef.current += delta * 0.5; // 2秒完成聚合
      progressRef.current = Math.min(progressRef.current, 1);
    }
    const easeProgress = easeOutCubic(progressRef.current);

    // 3. 鼠标射线检测 (用于寻找排斥中心)
    // 只有当鼠标活跃时才进行精确射线检测，否则使用上次的排斥点或清空
    let currentRepelPoint = null;
    if (mouseActiveTimer.current > 0.1) { // 鼠标最近有移动
      raycaster.current.setFromCamera(mouse.current, camera);
      raycaster.current.params.Points.threshold = 0.5; // 确保能检测到粒子
      const intersects = raycaster.current.intersectObject(pointsRef.current);
      
      if (intersects.length > 0) {
        repelTarget.current.lerp(intersects[0].point, 0.2); // 平滑排斥点
        currentRepelPoint = repelTarget.current;
      }
    } else {
      // 鼠标不活跃时，缓慢将排斥点归零，避免瞬间消失
      repelTarget.current.lerp(new THREE.Vector3(0,0,0), 0.05); // 或 lerp 到某个不会影响粒子的远点
      // 如果 repelTarget 已经足够远，再设为 null，减少计算
      if (repelTarget.current.length() > 50) currentRepelPoint = null;
      else currentRepelPoint = repelTarget.current;
    }


    // 4. 遍历更新所有粒子位置
    const positions = pointsRef.current.geometry.attributes.position.array;
    
    // 性能优化：避免在循环中创建对象
    const currentP = new THREE.Vector3(); // 粒子当前的位置
    const targetP_Animated = new THREE.Vector3(); // 粒子在入场动画中的目标位置
    
    // 我们需要一个存储粒子当前实际位置的数组，因为排斥力是叠加在当前位置上的
    // 但是 Three.js 的 BufferAttribute 不方便直接读写 Vector3
    // 这里我们直接修改 BufferArray，并在内部进行 Vector3 的计算
    
    const repelStrength = 0.05; // 排斥力度
    const repelRadius = 2.5;    // 排斥半径

    for (let i = 0; i < positions.length; i += 3) {
      // 粒子在入场动画中的“理论”归位点
      targetP_Animated.set(
        THREE.MathUtils.lerp(startPositions[i], targetPositions[i], easeProgress),
        THREE.MathUtils.lerp(startPositions[i+1], targetPositions[i+1], easeProgress),
        THREE.MathUtils.lerp(startPositions[i+2], targetPositions[i+2], easeProgress)
      );

      // 读取粒子当前实际位置 (这是 Three.js BufferAttribute 的直接读取方式)
      currentP.set(positions[i], positions[i+1], positions[i+2]);

      // 计算排斥力
      if (currentRepelPoint) {
        const dist = currentP.distanceTo(currentRepelPoint);
        if (dist < repelRadius) {
          const force = (1.0 - dist / repelRadius); // 距离越近，力越大 (0 -> 1)
          
          // 计算排斥方向并应用力
          currentP.add(
            new THREE.Vector3()
              .subVectors(currentP, currentRepelPoint)
              .normalize()
              .multiplyScalar(force * repelStrength) // 乘以强度
          );
        }
      }

      // 让粒子缓慢回归到它的“理论”归位点
      // 即使被排斥了，它也始终有向目标点回归的趋势
      currentP.lerp(targetP_Animated, 0.15); // 0.15 是回归速度
      
      // 更新 Buffer
      positions[i] = currentP.x;
      positions[i + 1] = currentP.y;
      positions[i + 2] = currentP.z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // 取消了整体的微旋转，现在粒子本身会因鼠标而局部波动
    // 如果需要模型整体轻微旋转，可以在此添加：
    // pointsRef.current.rotation.y += 0.001; 
  });

  if (!targetPositions) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        {/* 初始化时，position 设置为 startPositions */}
        <bufferAttribute
          attach="attributes-position"
          count={startPositions.length / 3}
          array={startPositions.slice()} // 复制一份，因为我们要修改它
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={glowingParticleShader.vertex}
        fragmentShader={glowingParticleShader.fragment}
        transparent
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending} // 关键：发光效果
        uniforms={{
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uTime: { value: 0 },
          uMouseActive: { value: 0 }
        }}
      />
    </points>
  );
};

// 缓动函数
function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

// === 主入口 ===
export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: false }} // Post-processing 常用优化，单纯粒子可以关掉
      >
        <color attach="background" args={['#050505']} />
        
        <OrbitControls 
          enableDamping 
          autoRotate={false}
          maxDistance={40}
          minDistance={5}
        />

        {/* 粒子系统 */}
        <React.Suspense fallback={null}>
          {/* 替换成你自己的模型路径 */}
          <InteractiveModelParticles url="./logo.glb" />
        </React.Suspense>
      </Canvas>
    </div>
  );
}