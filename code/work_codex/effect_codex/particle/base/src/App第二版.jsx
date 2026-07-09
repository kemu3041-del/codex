import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three-stdlib';

// === Shader 保持不变 ===
const glowingParticleShader = {
  vertex: `
    attribute float size;
    varying vec3 vColor;
    uniform float uPixelRatio;
    uniform float uTime;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      float atten = 300.0 / -mvPosition.z;
      gl_PointSize = size * uPixelRatio * atten;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragment: `
    varying vec3 vColor;
    void main() {
      vec2 uv = gl_PointCoord - vec2(0.5);
      float d = length(uv);
      if (d > 0.5) discard;
      float glow = 1.0 - smoothstep(0.1, 0.5, d);
      gl_FragColor = vec4(vColor, glow); // 简单发光
    }
  `
};

// === 核心组件 ===
const InteractiveModelParticles = ({ url }) => {
  const { scene } = useGLTF(url);
  const pointsRef = useRef();
  
  // 动画与交互状态
  const progressRef = useRef(0); // 入场进度
  
  // 创建一个数学平面，用于捕获鼠标在 3D 空间的位置
  // Plane(normal, constant): 法向量 (0,0,1) 表示面朝屏幕前方，位于 Z=0 处
  const interactionPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const mouseVector = useRef(new THREE.Vector3());

  // === 1. 粒子数据生成 (保留了你的自然溢出逻辑) ===
  const { startPositions, targetPositions, colors, sizes } = useMemo(() => {
    let mesh = null;
    scene.traverse((child) => {
      if (child.isMesh && !mesh) mesh = child;
    });
    if (!mesh) return {};

    const sampler = new MeshSurfaceSampler(mesh).build();
    const numParticles = 20000; // 粒子数量
    
    const startPos = new Float32Array(numParticles * 3);
    const targetPos = new Float32Array(numParticles * 3);
    const colorArr = new Float32Array(numParticles * 3);
    const sizeArr = new Float32Array(numParticles);

    const tempPos = new THREE.Vector3();
    const tempColor = new THREE.Color();
    
    // 颜色设置
    const colorStart = new THREE.Color("#4facfe");
    const colorEnd = new THREE.Color("#00f2fe");
    const colorWhite = new THREE.Color("#ffffff");

    mesh.geometry.computeBoundingBox();
    const { min, max } = mesh.geometry.boundingBox;
    const height = max.y - min.y || 1;
    const center = new THREE.Vector3();
    mesh.geometry.boundingBox.getCenter(center);

    for (let i = 0; i < numParticles; i++) {
      // A. 采样并添加自然溢出 (Your Logic)
      sampler.sample(tempPos);
      const r = Math.random();
      let scatterAmount = 0.05;
      let sizeFactor = 1.0;

      // 20% 的粒子做溢出效果
      if (r > 0.80) {
        scatterAmount = 0.5 + Math.random() * 2.0; // 溢出范围
        sizeFactor = 0.5; // 溢出粒子变小
      }

      // 球形随机偏移
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      targetPos[i * 3] = tempPos.x + Math.sin(phi) * Math.cos(theta) * scatterAmount;
      targetPos[i * 3 + 1] = tempPos.y + Math.sin(phi) * Math.sin(theta) * scatterAmount;
      targetPos[i * 3 + 2] = tempPos.z + Math.cos(phi) * scatterAmount;

      // B. 入场起点 (爆炸效果)
      startPos[i * 3] = center.x + (Math.random() - 0.5) * 30;
      startPos[i * 3 + 1] = center.y + (Math.random() - 0.5) * 30;
      startPos[i * 3 + 2] = center.z + (Math.random() - 0.5) * 30;

      // C. 颜色
      const t = (tempPos.y - min.y) / height;
      tempColor.lerpColors(colorStart, colorEnd, t);
      if (r > 0.80) tempColor.lerp(colorWhite, 0.4); // 溢出粒子更亮
      
      colorArr[i * 3] = tempColor.r;
      colorArr[i * 3 + 1] = tempColor.g;
      colorArr[i * 3 + 2] = tempColor.b;

      sizeArr[i] = (Math.random() * 0.08 + 0.02) * sizeFactor; 
    }

    return { 
      startPositions: startPos, 
      targetPositions: targetPos, 
      colors: colorArr, 
      sizes: sizeArr
    };
  }, [scene]);

  // === 2. 动画循环 (核心交互修改) ===
  useFrame((state, delta) => {
    if (!pointsRef.current || !targetPositions) return;

    // --- A. 更新时间 Uniform ---
    pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;

    // --- B. 入场动画进度 ---
    if (progressRef.current < 1) {
      progressRef.current += delta * 0.5;
      progressRef.current = Math.min(progressRef.current, 1);
    }
    const easeProgress = easeOutCubic(progressRef.current);

    // --- C. 获取鼠标在 3D 空间的位置 (虚拟平面法) ---
    // 使用 R3F 内置的 raycaster 和 pointer
    state.raycaster.setFromCamera(state.pointer, state.camera);
    
    // 检测射线是否与 Z=0 的虚拟平面相交
    // 这比检测几万个粒子要快得多，而且超级平滑
    const intersect = new THREE.Vector3();
    state.raycaster.ray.intersectPlane(interactionPlane, intersect);
    
    // 如果相交成功，intersect 就是鼠标在 3D 空间的确切位置
    // 只有当入场动画基本结束，且鼠标在屏幕内时才生效
    const isInteracting = intersect && progressRef.current > 0.8;

    // --- D. 遍历更新粒子位置 ---
    const positions = pointsRef.current.geometry.attributes.position.array;
    const currentP = new THREE.Vector3();
    const targetP_Base = new THREE.Vector3(); // 粒子本该在的位置
    const repelRadius = 0.5; // 排斥半径
    const repelStrength = 1.0; // 排斥力度

    for (let i = 0; i < positions.length; i += 3) {
      // 1. 计算“基准目标位置” (从散乱 -> 聚合)
      targetP_Base.set(
        THREE.MathUtils.lerp(startPositions[i], targetPositions[i], easeProgress),
        THREE.MathUtils.lerp(startPositions[i+1], targetPositions[i+1], easeProgress),
        THREE.MathUtils.lerp(startPositions[i+2], targetPositions[i+2], easeProgress)
      );

      // 2. 读取当前物理位置
      currentP.set(positions[i], positions[i+1], positions[i+2]);

      // 3. 计算排斥力 (叠加在当前位置上)
      if (isInteracting) {
        const dist = currentP.distanceTo(intersect); // 计算粒子到鼠标点的距离
        if (dist < repelRadius) {
          const force = (1.0 - dist / repelRadius) * repelStrength;
          // 计算推开的方向：从鼠标指向粒子
          const dirX = currentP.x - intersect.x;
          const dirY = currentP.y - intersect.y;
          // Z轴推力稍微小一点，保持在平面附近
          const dirZ = (currentP.z - intersect.z) * 0.5; 
          
          // 归一化并应用力
          const len = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ) || 1;
          currentP.x += (dirX / len) * force;
          currentP.y += (dirY / len) * force;
          currentP.z += (dirZ / len) * force;
        }
      }

      // 4. 弹性复位 (Spring Back)
      // 每一帧，粒子都试图回到它的基准位置
      // 0.1 是回弹速度：越小越粘滞，越大越像硬弹簧
      currentP.lerp(targetP_Base, 0.1);

      // 5. 写入 Buffer
      positions[i] = currentP.x;
      positions[i + 1] = currentP.y;
      positions[i + 2] = currentP.z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!targetPositions) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={startPositions.length / 3}
          array={startPositions.slice()} 
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
        blending={THREE.AdditiveBlending}
        uniforms={{
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uTime: { value: 0 }
        }}
      />
    </points>
  );
};

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }} dpr={[1, 2]}>
        <OrbitControls enableDamping />
        <React.Suspense fallback={null}>
          <InteractiveModelParticles url="./logo.glb" />
        </React.Suspense>
      </Canvas>
    </div>
  );
}